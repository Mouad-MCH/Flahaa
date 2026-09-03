import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

import app from "../../app.js";
import { generateToken } from "../../utils/token.js";
import User from "../../models/User.js";
import Farm from "../../models/Farm.js";

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
  await Promise.all([User.deleteMany({}), Farm.deleteMany({})]);
});

let emailCounter = 0;

const uniqueEmail = (prefix) => `${prefix}${(emailCounter += 1)}@test.com`;

const createAdmin = async () => {
  const admin = await User.create({
    name: "Admin Owner",
    email: uniqueEmail("admin"),
    password: "password123",
    role: "admin",
  });

  return { admin, token: generateToken(admin) };
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

const validFarmPayload = (overrides = {}) => ({
  name: "Green Valley Farm",
  address: "12 Rue Atlas, Marrakech",
  phone: "0600000000",
  ...overrides,
});

describe("Farm routes", () => {
  describe("authentication and authorization", () => {
    it("rejects requests with no token", async () => {
      const res = await request(app).get("/api/farms/my-farms");
      expect(res.status).toBe(401);
    });

    it("rejects requests with an invalid token", async () => {
      const res = await request(app)
        .get("/api/farms/my-farms")
        .set("Authorization", "Bearer not-a-real-token");

      expect(res.status).toBe(401);
    });

    it('rejects users with the "supervisor" role', async () => {
      const { admin } = await createAdmin();
      const farm = await Farm.create({ name: "Green Farm", owner_id: admin._id });
      const { token } = await createSupervisor(farm._id);

      const res = await request(app)
        .get("/api/farms/my-farms")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/farms", () => {
    it("creates a farm owned by the authenticated admin", async () => {
      const { admin, token } = await createAdmin();

      const res = await request(app)
        .post("/api/farms")
        .set("Authorization", `Bearer ${token}`)
        .send(validFarmPayload());

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        name: "Green Valley Farm",
        address: "12 Rue Atlas, Marrakech",
      });
      expect(res.body.data.owner_id).toBe(String(admin._id));

      const stored = await Farm.findById(res.body.data._id);
      expect(stored).not.toBeNull();
    });

    it("creates a farm without optional address/phone", async () => {
      const { token } = await createAdmin();

      const res = await request(app)
        .post("/api/farms")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Minimal Farm" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Minimal Farm");
    });

    it("returns 400 when name is missing", async () => {
      const { token } = await createAdmin();

      const res = await request(app)
        .post("/api/farms")
        .set("Authorization", `Bearer ${token}`)
        .send({ address: "No name here" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("validation failed");
      expect(Array.isArray(res.body.details)).toBe(true);
    });

    it("returns 400 when name is too short", async () => {
      const { token } = await createAdmin();

      const res = await request(app)
        .post("/api/farms")
        .set("Authorization", `Bearer ${token}`)
        .send(validFarmPayload({ name: "A" }));

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("validation failed");
    });
  });

  describe("GET /api/farms/my-farms", () => {
    it("lists only farms owned by the authenticated admin", async () => {
      const { admin, token } = await createAdmin();
      const { admin: otherAdmin } = await createAdmin();

      await Farm.create({ name: "My Farm", owner_id: admin._id });
      await Farm.create({ name: "Other Farm", owner_id: otherAdmin._id });

      const res = await request(app)
        .get("/api/farms/my-farms")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("My Farm");
    });

    it("returns an empty array when the admin owns no farms", async () => {
      const { token } = await createAdmin();

      const res = await request(app)
        .get("/api/farms/my-farms")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
