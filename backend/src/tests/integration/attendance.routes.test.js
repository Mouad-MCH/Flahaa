import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

import app from "../../app.js";
import { generateToken } from "../../utils/token.js";
import User from "../../models/User.js";
import Farm from "../../models/Farm.js";
import Worker from "../../models/Worker.js";
import Attendance from "../../models/Attendance.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Farm.deleteMany({}),
    Worker.deleteMany({}),
    Attendance.deleteMany({}),
  ]);
});

let emailCounter = 0;

const uniqueEmail = (prefix) => `${prefix}${(emailCounter += 1)}@test.com`;

const createAdminWithFarm = async () => {
  const admin = await User.create({
    name: "Admin Owner",
    email: uniqueEmail("admin"),
    password: "password123",
    role: "admin",
  });

  const farm = await Farm.create({
    name: "Green Farm",
    owner_id: admin._id,
  });

  return { admin, farm, token: generateToken(admin) };
};

const createSupervisor = async (farmId) => {
  const supervisor = await User.create({
    name: "Sup Ervisor",
    email: uniqueEmail("supervisor"),
    password: "password123",
    role: "supervisor",
    farm_id: farmId,
  });

  return { supervisor, token: generateToken(supervisor) };
};

const createWorkerUser = async (farmId) => {
  const worker = await User.create({
    name: "Plain Worker",
    email: uniqueEmail("worker"),
    password: "password123",
    role: "worker",
    farm_id: farmId,
  });

  return { worker, token: generateToken(worker) };
};

const createFarmWorker = async (farmId, overrides = {}) =>
  Worker.create({
    farm_id: farmId,
    name: "John Doe",
    CIN: `CIN${Math.floor(Math.random() * 1000000)}`,
    daily_rate: 100,
    ...overrides,
  });

describe("Attendance routes", () => {
  describe("authentication and authorization", () => {
    it("rejects requests with no token", async () => {
      const res = await request(app).get("/api/attendance?date=2026-08-18");
      expect(res.status).toBe(401);
    });

    it("rejects requests with an invalid token", async () => {
      const res = await request(app)
        .get("/api/attendance?date=2026-08-18")
        .set("Authorization", "Bearer not-a-real-token");
      expect(res.status).toBe(401);
    });

    it('rejects users with the "worker" role', async () => {
      const { farm } = await createAdminWithFarm();
      const { token } = await createWorkerUser(farm._id);

      const res = await request(app)
        .get(`/api/attendance?farm_id=${farm._id}&date=2026-08-18`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/attendance", () => {
    it("requires farm_id query param for admins", async () => {
      const { token } = await createAdminWithFarm();
      const res = await request(app)
        .post("/api/attendance")
        .set("Authorization", `Bearer ${token}`)
        .send({ worker_id: "not-relevant", date: "2026-08-18" });

      expect(res.status).toBe(400);
    });

    it("returns 400 validation errors for missing required fields", async () => {
      const { token, farm } = await createAdminWithFarm();
      const res = await request(app)
        .post(`/api/attendance?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("validation failed");
      expect(Array.isArray(res.body.details)).toBe(true);
    });

    it("returns 404 when the worker does not belong to the scoped farm", async () => {
      const { token, farm } = await createAdminWithFarm();
      const otherAdmin = await createAdminWithFarm();
      const otherWorker = await createFarmWorker(otherAdmin.farm._id);

      const res = await request(app)
        .post(`/api/attendance?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ worker_id: String(otherWorker._id), date: "2026-08-18" });

      expect(res.status).toBe(404);
    });

    it("creates an attendance record for an admin-owned farm", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);

      const res = await request(app)
        .post(`/api/attendance?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ worker_id: String(worker._id), date: "2026-08-18", status: "present" });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        worker_id: String(worker._id),
        farm_id: String(farm._id),
        status: "present",
      });
    });

    it("creates an attendance record for a supervisor scoped to their own farm", async () => {
      const { farm } = await createAdminWithFarm();
      const { token } = await createSupervisor(farm._id);
      const worker = await createFarmWorker(farm._id);

      const res = await request(app)
        .post("/api/attendance")
        .set("Authorization", `Bearer ${token}`)
        .send({ worker_id: String(worker._id), date: "2026-08-18" });

      expect(res.status).toBe(201);
      expect(res.body.data.farm_id).toBe(String(farm._id));
    });

    it("rejects a duplicate attendance record for the same worker and date", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);

      await request(app)
        .post(`/api/attendance?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ worker_id: String(worker._id), date: "2026-08-18" });

      const res = await request(app)
        .post(`/api/attendance?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ worker_id: String(worker._id), date: "2026-08-18" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already recorded/);
    });

    it("allows the same worker to have attendance on two different dates", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);

      await request(app)
        .post(`/api/attendance?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ worker_id: String(worker._id), date: "2026-08-18" });

      const res = await request(app)
        .post(`/api/attendance?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ worker_id: String(worker._id), date: "2026-08-19" });

      expect(res.status).toBe(201);
    });
  });

  describe("POST /api/attendance/bulk", () => {
    it("upserts attendance for multiple workers and reports unknown ones as errors", async () => {
      const { token, farm } = await createAdminWithFarm();
      const workerA = await createFarmWorker(farm._id, { name: "Alice" });
      const workerB = await createFarmWorker(farm._id, { name: "Bob" });
      const fakeWorkerId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/attendance/bulk?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-08-18",
          records: [
            { worker_id: String(workerA._id), status: "present" },
            { worker_id: String(workerB._id), status: "absent" },
            { worker_id: String(fakeWorkerId) },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.recorded).toBe(2);
      expect(res.body.data.failed).toBe(1);
      expect(res.body.data.errors).toEqual([
        { worker_id: String(fakeWorkerId), message: "Worker not found on this farm" },
      ]);
    });

    it("returns 400 when records is empty", async () => {
      const { token, farm } = await createAdminWithFarm();

      const res = await request(app)
        .post(`/api/attendance/bulk?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ date: "2026-08-18", records: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("validation failed");
    });

    it("re-recording the same worker/date upserts instead of duplicating", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);

      await request(app)
        .post(`/api/attendance/bulk?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ date: "2026-08-18", records: [{ worker_id: String(worker._id), status: "present" }] });

      const res = await request(app)
        .post(`/api/attendance/bulk?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ date: "2026-08-18", records: [{ worker_id: String(worker._id), status: "excused" }] });

      expect(res.status).toBe(201);
      expect(res.body.data.recorded).toBe(1);

      const count = await Attendance.countDocuments({ worker_id: worker._id });
      expect(count).toBe(1);

      const record = await Attendance.findOne({ worker_id: worker._id });
      expect(record.status).toBe("excused");
    });
  });

  describe("GET /api/attendance", () => {
    it("returns recorded attendance and active workers with no record yet", async () => {
      const { token, farm } = await createAdminWithFarm();
      const recordedWorker = await createFarmWorker(farm._id, { name: "Recorded" });
      const unrecordedWorker = await createFarmWorker(farm._id, { name: "Unrecorded" });

      await request(app)
        .post(`/api/attendance?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ worker_id: String(recordedWorker._id), date: "2026-08-18" });

      const res = await request(app)
        .get(`/api/attendance?farm_id=${farm._id}&date=2026-08-18`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total_recorded).toBe(1);
      expect(res.body.data.total_unrecorded).toBe(1);
      expect(res.body.data.unrecorded_works[0]._id).toBe(String(unrecordedWorker._id));
    });

    it("returns 400 when the date query param is missing", async () => {
      const { token, farm } = await createAdminWithFarm();
      const res = await request(app)
        .get(`/api/attendance?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it("does not include inactive workers among unrecorded workers", async () => {
      const { token, farm } = await createAdminWithFarm();
      await createFarmWorker(farm._id, { name: "Inactive", status: "inactive" });

      const res = await request(app)
        .get(`/api/attendance?farm_id=${farm._id}&date=2026-08-18`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total_unrecorded).toBe(0);
    });
  });

  describe("GET /api/attendance/summary", () => {
    it("returns a monthly summary bucketed for the trailing months", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);

      await request(app)
        .post(`/api/attendance?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ worker_id: String(worker._id), date: new Date().toISOString(), status: "present" });

      const res = await request(app)
        .get(`/api/attendance/summary?farm_id=${farm._id}&months=3`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      const currentBucket = res.body.data[res.body.data.length - 1];
      expect(currentBucket.present).toBe(1);
      expect(currentBucket.total).toBe(1);
    });

    it("returns 400 when months exceeds the max of 12", async () => {
      const { token, farm } = await createAdminWithFarm();
      const res = await request(app)
        .get(`/api/attendance/summary?farm_id=${farm._id}&months=13`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/attendance/:id", () => {
    it("returns a worker's attendance history with a status summary", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);

      await request(app)
        .post(`/api/attendance?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ worker_id: String(worker._id), date: "2026-08-18", status: "present" });
      await request(app)
        .post(`/api/attendance?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ worker_id: String(worker._id), date: "2026-08-19", status: "absent" });

      const res = await request(app)
        .get(`/api/attendance/${worker._id}?farm_id=${farm._id}&month=8&year=2026`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.worker_id).toBe(String(worker._id));
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.summary).toMatchObject({ present: 1, absent: 1, excused: 0 });
    });

    it("returns 400 when month/year query params are missing", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);

      const res = await request(app)
        .get(`/api/attendance/${worker._id}?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it("returns an empty history for a month with no records", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);

      const res = await request(app)
        .get(`/api/attendance/${worker._id}?farm_id=${farm._id}&month=1&year=2020`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(0);
      expect(res.body.data.records).toEqual([]);
    });
  });
});
