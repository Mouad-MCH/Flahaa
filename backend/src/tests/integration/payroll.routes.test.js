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
import Payroll from "../../models/Payroll.js";

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
    Payroll.deleteMany({}),
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

const createWorkerUser = async (farmId, workerId) => {
  const workerUser = await User.create({
    name: "Plain Worker",
    email: uniqueEmail("worker"),
    password: "password123",
    role: "worker",
    farm_id: farmId,
    worker_id: workerId,
  });

  return { workerUser, token: generateToken(workerUser) };
};

const createFarmWorker = async (farmId, overrides = {}) =>
  Worker.create({
    farm_id: farmId,
    name: "John Doe",
    CIN: `CIN${Math.floor(Math.random() * 1000000)}`,
    daily_rate: 100,
    ...overrides,
  });

const calculate = (token, farmId, body) =>
  request(app)
    .post(`/api/payrolls/calculate?farm_id=${farmId}`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);

describe("Payroll routes", () => {
  describe("authorization", () => {
    it("rejects requests with no token", async () => {
      const res = await request(app).get("/api/payrolls?month=8&year=2026");
      expect(res.status).toBe(401);
    });

    it('rejects "supervisor" from listing payrolls', async () => {
      const { farm } = await createAdminWithFarm();
      const { token } = await createSupervisor(farm._id);

      const res = await request(app)
        .get(`/api/payrolls?farm_id=${farm._id}&month=8&year=2026`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('rejects "worker" from listing payrolls', async () => {
      const { farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);
      const { token } = await createWorkerUser(farm._id, worker._id);

      const res = await request(app)
        .get(`/api/payrolls?farm_id=${farm._id}&month=8&year=2026`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('rejects "supervisor" from calculating payroll', async () => {
      const { farm } = await createAdminWithFarm();
      const { token } = await createSupervisor(farm._id);
      const worker = await createFarmWorker(farm._id);

      const res = await calculate(token, farm._id, { worker_id: String(worker._id), month: 8, year: 2026 });

      expect(res.status).toBe(403);
    });

    it('rejects "supervisor" from getting a specific worker payroll', async () => {
      const { token: adminToken, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);
      await calculate(adminToken, farm._id, { worker_id: String(worker._id), month: 8, year: 2026 });

      const { token } = await createSupervisor(farm._id);

      const res = await request(app)
        .get(`/api/payrolls/${worker._id}/8/2026?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('rejects "supervisor" from updating payroll status', async () => {
      const { token: adminToken, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);
      const calcRes = await calculate(adminToken, farm._id, { worker_id: String(worker._id), month: 8, year: 2026 });

      const { token } = await createSupervisor(farm._id);

      const res = await request(app)
        .patch(`/api/payrolls/${calcRes.body.data._id}/status?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "paid" });

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/payrolls/calculate", () => {
    it("matches attendance recorded with ObjectId fields against a string worker_id from the request body", async () => {
      const { token, farm, admin } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id, { daily_rate: 100 });

      // Attendance documents store worker_id/farm_id as real ObjectIds, exactly
      // as they would in production, while the calculate request below sends
      // worker_id as a plain JSON string like a real HTTP client would.
      await Attendance.create([
        { worker_id: worker._id, farm_id: farm._id, date: new Date(2026, 7, 3), status: "present", recorded_by: admin._id },
        { worker_id: worker._id, farm_id: farm._id, date: new Date(2026, 7, 4), status: "present", recorded_by: admin._id },
        { worker_id: worker._id, farm_id: farm._id, date: new Date(2026, 7, 5), status: "absent", recorded_by: admin._id },
      ]);

      const res = await calculate(token, farm._id, { worker_id: String(worker._id), month: 8, year: 2026, bonuses: 0, deductions: 0 });

      expect(res.status).toBe(200);
      expect(res.body.data.working_days).toBe(2);
      expect(res.body.data.net_salary).toBe(200);

      const stored = await Payroll.findOne({ worker_id: worker._id, month: 8, year: 2026 });
      expect(stored.working_days).toBe(2);
    });

    it("returns 404 when the worker belongs to a different farm", async () => {
      const { token, farm } = await createAdminWithFarm();
      const otherAdmin = await createAdminWithFarm();
      const otherWorker = await createFarmWorker(otherAdmin.farm._id);

      const res = await calculate(token, farm._id, { worker_id: String(otherWorker._id), month: 8, year: 2026 });

      expect(res.status).toBe(404);
    });

    it("computes net_salary as base_salary + bonuses - deductions, with advances_total always 0", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id, { daily_rate: 100 });

      const res = await calculate(token, farm._id, { worker_id: String(worker._id), month: 8, year: 2026, bonuses: 50, deductions: 20 });

      expect(res.status).toBe(200);
      expect(res.body.data.advances_total).toBe(0);
      expect(res.body.data.base_salary).toBe(0); // no attendance recorded
      expect(res.body.data.net_salary).toBe(30); // 0 + 50 - 20
    });

    it("floors net_salary at 0 when deductions exceed earnings", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id, { daily_rate: 100 });

      const res = await calculate(token, farm._id, { worker_id: String(worker._id), month: 8, year: 2026, bonuses: 0, deductions: 50 });

      expect(res.status).toBe(200);
      expect(res.body.data.net_salary).toBe(0);
    });

    it("upserts one record per farm_id + worker_id + month + year, recalculating instead of duplicating", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id, { daily_rate: 100 });

      const first = await calculate(token, farm._id, { worker_id: String(worker._id), month: 8, year: 2026 });
      const second = await calculate(token, farm._id, { worker_id: String(worker._id), month: 8, year: 2026, bonuses: 10 });

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(String(first.body.data._id)).toBe(String(second.body.data._id));

      const count = await Payroll.countDocuments({ worker_id: worker._id, month: 8, year: 2026 });
      expect(count).toBe(1);
    });
  });

  describe("GET /api/payrolls", () => {
    it("lists payroll records scoped to the selected farm", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);
      await calculate(token, farm._id, { worker_id: String(worker._id), month: 8, year: 2026 });

      const otherAdmin = await createAdminWithFarm();
      const otherWorker = await createFarmWorker(otherAdmin.farm._id);
      await calculate(otherAdmin.token, otherAdmin.farm._id, { worker_id: String(otherWorker._id), month: 8, year: 2026 });

      const res = await request(app)
        .get(`/api/payrolls?farm_id=${farm._id}&month=8&year=2026`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("GET /api/payrolls/:worker_id/:month/:year", () => {
    it("returns the worker's payroll record for the admin's farm", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);
      await calculate(token, farm._id, { worker_id: String(worker._id), month: 8, year: 2026 });

      const res = await request(app)
        .get(`/api/payrolls/${worker._id}/8/2026?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.month).toBe(8);
      expect(res.body.data.year).toBe(2026);
    });

    it("returns 404 when the payroll record belongs to a different farm than the one selected", async () => {
      const { token: ownerToken, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);
      await calculate(ownerToken, farm._id, { worker_id: String(worker._id), month: 8, year: 2026 });

      const otherAdmin = await createAdminWithFarm();

      const res = await request(app)
        .get(`/api/payrolls/${worker._id}/8/2026?farm_id=${otherAdmin.farm._id}`)
        .set("Authorization", `Bearer ${otherAdmin.token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/payrolls/:id/status", () => {
    it("sets paid_at when marking a payroll as paid", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);
      const calcRes = await calculate(token, farm._id, { worker_id: String(worker._id), month: 8, year: 2026 });

      const res = await request(app)
        .patch(`/api/payrolls/${calcRes.body.data._id}/status?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "paid" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("paid");
      expect(res.body.data.paid_at).not.toBeNull();
    });

    it("clears paid_at when marking a payroll as pending", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);
      const calcRes = await calculate(token, farm._id, { worker_id: String(worker._id), month: 8, year: 2026 });

      await request(app)
        .patch(`/api/payrolls/${calcRes.body.data._id}/status?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "paid" });

      const res = await request(app)
        .patch(`/api/payrolls/${calcRes.body.data._id}/status?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "pending" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("pending");
      expect(res.body.data.paid_at).toBeNull();
    });

    it("returns 404 when the payroll record belongs to a different farm than the one selected", async () => {
      const { token: ownerToken, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);
      const calcRes = await calculate(ownerToken, farm._id, { worker_id: String(worker._id), month: 8, year: 2026 });

      const otherAdmin = await createAdminWithFarm();

      const res = await request(app)
        .patch(`/api/payrolls/${calcRes.body.data._id}/status?farm_id=${otherAdmin.farm._id}`)
        .set("Authorization", `Bearer ${otherAdmin.token}`)
        .send({ status: "paid" });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/payrolls/me", () => {
    it("returns only the authenticated worker's own payroll records", async () => {
      const { token: adminToken, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id, { daily_rate: 100 });
      const otherWorker = await createFarmWorker(farm._id, { daily_rate: 100 });
      const { token } = await createWorkerUser(farm._id, worker._id);

      await calculate(adminToken, farm._id, { worker_id: String(worker._id), month: 8, year: 2026 });
      await calculate(adminToken, farm._id, { worker_id: String(otherWorker._id), month: 8, year: 2026, bonuses: 500 });

      const res = await request(app)
        .get("/api/payrolls/me?month=8&year=2026")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].net_salary).toBe(0);
    });

    it("returns 403 when the account is not linked to a worker record", async () => {
      const { farm } = await createAdminWithFarm();
      const noWorkerUser = await User.create({
        name: "No Worker Link",
        email: uniqueEmail("noworker"),
        password: "password123",
        role: "worker",
        farm_id: farm._id,
      });
      const token = generateToken(noWorkerUser);

      const res = await request(app)
        .get("/api/payrolls/me?month=8&year=2026")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("returns no records when the user's farm_id does not match the worker's real farm (stale link)", async () => {
      const { token: adminToken, farm } = await createAdminWithFarm();
      const otherAdmin = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);

      await calculate(adminToken, farm._id, { worker_id: String(worker._id), month: 8, year: 2026 });

      const staleUser = await User.create({
        name: "Stale Link",
        email: uniqueEmail("stale"),
        password: "password123",
        role: "worker",
        farm_id: otherAdmin.farm._id,
        worker_id: worker._id,
      });
      const token = generateToken(staleUser);

      const res = await request(app)
        .get("/api/payrolls/me?month=8&year=2026")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it("cannot be used to request another worker's data via query parameters", async () => {
      const { token: adminToken, farm } = await createAdminWithFarm();
      const worker = await createFarmWorker(farm._id);
      const otherWorker = await createFarmWorker(farm._id);
      const { token } = await createWorkerUser(farm._id, worker._id);

      await calculate(adminToken, farm._id, { worker_id: String(otherWorker._id), month: 8, year: 2026, bonuses: 999 });

      const res = await request(app)
        .get(`/api/payrolls/me?month=8&year=2026&worker_id=${otherWorker._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });
});
