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

const createFarmWorker = async (farmId, overrides = {}) =>
  Worker.create({
    farm_id: farmId,
    name: "John Doe",
    CIN: `CIN${Math.floor(Math.random() * 1000000)}`,
    daily_rate: 100,
    ...overrides,
  });

describe("Payroll routes", () => {
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

      const res = await request(app)
        .post(`/api/payrolls/calculate?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ worker_id: String(worker._id), month: 8, year: 2026, bonuses: 0, deductions: 0 });

      expect(res.status).toBe(200);
      expect(res.body.data.working_days).toBe(2);
      expect(res.body.data.net_salary).toBe(200);

      const stored = await Payroll.findOne({ worker_id: worker._id, month: 8, year: 2026 });
      expect(stored.working_days).toBe(2);
    });
  });
});
