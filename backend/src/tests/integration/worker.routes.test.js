import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

import app from "../../app.js";
import { generateToken } from "../../utils/token.js";
import User from "../../models/User.js";
import Farm from "../../models/Farm.js";
import Worker from "../../models/Worker.js";

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
    name: "Plain Woker",
    email: uniqueEmail("worker"),
    password: "password123",
    role: "worker",
    farm_id: farmId,
  });

  return { worker, token: generateToken(worker) };
};

const validWorkerPayload = (overrides = {}) => ({
  name: "John Doe",
  CIN: "AB123456",
  daily_rate: 100,
  ...overrides,
});

describe("Woker routes", () => {
  describe("authentication and authorization", () => {
    it("rejects requests with no token", async () => {
      const res = await request(app).get("/api/workers");
      expect(res.status).toBe(401);
    });

    it("rejects requests with an invalid token", async () => {
      const res = await request(app)
        .get("/api/workers")
        .set("Authorization", "Bearer not-a-real-token");

      expect(res.status).toBe(401);
    });

    it('rejects users with the "worker" role', async () => {
      const { admin, farm } = await createAdminWithFarm();
      const { token } = await createWorkerUser(farm._id);

      const res = await request(app)
        .get(`/api/workers?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/workers", () => {
    it("requires farm_id query param for admins", async () => {
      const { token } = await createAdminWithFarm();
      const res = await request(app)
        .post("/api/workers")
        .set("Authorization", `Bearer ${token}`)
        .send(validWorkerPayload());

      expect(res.status).toBe(400);
    });

    it("rejects an admin using a farm_id they do not own", async () => {
      const { token } = await createAdminWithFarm();
      const otherFarmOwner = await createAdminWithFarm();
      const res = await request(app)
        .post(`/api/workers?farm_id=${otherFarmOwner.farm_id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(validWorkerPayload());
      expect(res.status).toBe(400);
    });

    it("creates a woker for an admin-owned farm", async () => {
      const { token, farm } = await createAdminWithFarm();
      const res = await request(app)
        .post(`/api/workers?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(validWorkerPayload());

      expect(res.status).toBe(201);
      expect(res.body.data.worker).toMatchObject({
        name: "John Doe",
        CIN: "AB123456",
        daily_rate: 100,
        status: "active",
        contract_type: "daily",
      });
      expect(res.body.data.worker.farm_id).toBe(String(farm._id));
    });

    it("creates a worker for a supervisor using their own farm_id, ignoring the query farm_id", async () => {
      const { farm } = await createAdminWithFarm();
      const otherAdmin = await createAdminWithFarm();
      const { token } = await createSupervisor(farm._id);

      const res = await request(app)
        .post(`/api/workers?farm_id=${otherAdmin.farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(validWorkerPayload());

      expect(res.status).toBe(201);
      expect(res.body.data.worker.farm_id).toBe(String(farm._id));
    });

    it("honors supervisor_id when the requester is an admin", async () => {
      const { token, farm } = await createAdminWithFarm();
      const { supervisor } = await createSupervisor(farm._id);

      const res = await request(app)
        .post(`/api/workers?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(validWorkerPayload({ supervisor_id: String(supervisor._id) }));

      expect(res.status).toBe(201);
      expect(res.body.data.worker.supervisor_id).toBe(String(supervisor._id));
    });

    it("forces supervisor_id to null when the requester is a supervisor", async () => {
      const { farm } = await createAdminWithFarm();
      const { supervisor, token } = await createSupervisor(farm._id);

      const res = await request(app)
        .post(`/api/workers?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(validWorkerPayload({ supervisor_id: String(supervisor._id) }));

      expect(res.status).toBe(201);
      expect(res.body.data.worker.supervisor_id).toBeNull();
    });

    it("returns 400 validation errors for missing required fields", async () => {
      const { token, farm } = await createAdminWithFarm();
      const res = await request(app)
        .post(`/api/workers?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "AB" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("validation failed");
      expect(Array.isArray(res.body.details)).toBe(true);
    });

    it("rejects a duplicate CIN on the same farm", async () => {
      const { token, farm } = await createAdminWithFarm();
      await Worker.create({ farm_id: farm._id, ...validWorkerPayload() });

      const res = await request(app)
        .post(`/api/workers?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(validWorkerPayload());

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists on this farm/);
    });

    it("allows the same CIN on two different farms", async () => {
      const { token: tokenA, farm: farmA } = await createAdminWithFarm();
      const { admin: adminB, farm: farmB } = await createAdminWithFarm();
      const tokenB = generateToken(adminB);

      await request(app)
        .post(`/api/workers?farm_id=${farmA._id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send(validWorkerPayload());

      const res = await request(app)
        .post(`/api/workers?farm_id=${farmB._id}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send(validWorkerPayload());

      expect(res.status).toBe(201);
    });
  });

  describe("GET /api/workers", () => {
    it("lists only workers belonging to the scoped farm", async () => {
      const { token, farm } = await createAdminWithFarm();
      const otherAdmin = await createAdminWithFarm();

      await Worker.create({
        farm_id: farm._id,
        ...validWorkerPayload({ CIN: "CIN0001" }),
      });
      await Worker.create({
        farm_id: otherAdmin.farm._id,
        ...validWorkerPayload({ CIN: "CIN0002" }),
      });

      const res = await request(app)
        .get(`/api/workers?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.workers).toHaveLength(1);
      expect(res.body.data.pagination.total).toBe(1);
    });

    it("filters by status", async () => {
      const { token, farm } = await createAdminWithFarm();
      await Worker.create({
        farm_id: farm._id,
        ...validWorkerPayload({ CIN: "CIN0001", status: "inactive" }),
      });
      await Worker.create({
        farm_id: farm._id,
        ...validWorkerPayload({ CIN: "CIN0002", status: "active" }),
      });

      const res = await request(app)
        .get(`/api/workers?farm_id=${farm._id}&status=inactive`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.workers).toHaveLength(1);
      expect(res.body.data.workers[0].status).toBe("inactive");
    });

    it("searches by name, case-insensitively", async () => {
      const { token, farm } = await createAdminWithFarm();
      await Worker.create({
        farm_id: farm._id,
        ...validWorkerPayload({ name: "Alice Smith", CIN: "CIN0001" }),
      });
      await Worker.create({
        farm_id: farm._id,
        ...validWorkerPayload({ name: "Bob Jones", CIN: "CIN0002" }),
      });

      const res = await request(app)
        .get(`/api/workers?farm_id=${farm._id}&search=alice`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.workers).toHaveLength(1);
      expect(res.body.data.workers[0].name).toBe("Alice Smith");
    });

    it("paginates results", async () => {
      const { token, farm } = await createAdminWithFarm();
      for (let i = 0; i < 3; i += 1) {
        await Worker.create({
          farm_id: farm._id,
          ...validWorkerPayload({ CIN: `CIN000${i}` }),
        });
      }

      const res = await request(app)
        .get(`/api/workers?farm_id=${farm._id}&page=1&limit=2`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.workers).toHaveLength(2);
      expect(res.body.data.pagination).toMatchObject({
        total: 3,
        page: 1,
        limit: 2,
        pages: 2,
      });
    });

    it("returns 400 for an invalid query (missing farm_id for admin)", async () => {
      const { token } = await createAdminWithFarm();
      const res = await request(app)
        .get("/api/workers")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/workers/:id", () => {
    it("returns a worker by id", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await Worker.create({
        farm_id: farm._id,
        ...validWorkerPayload(),
      });

      const res = await request(app)
        .get(`/api/workers/${worker._id}?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.worker._id).toBe(String(worker._id));
    });

    it("returns 404 for a worker belonging to a different farm", async () => {
      const { token, farm } = await createAdminWithFarm();
      const otherAdmin = await createAdminWithFarm();
      const worker = await Worker.create({
        farm_id: otherAdmin.farm._id,
        ...validWorkerPayload(),
      });

      const res = await request(app)
        .get(`/api/workers/${worker._id}?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("returns 404 for a non-existent worker id", async () => {
      const { token, farm } = await createAdminWithFarm();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/workers/${fakeId}?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("returns 400 for a malformed worker id", async () => {
      const { token, farm } = await createAdminWithFarm();

      const res = await request(app)
        .get(`/api/workers/not-a-valid-id?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/workers/:id", () => {
    it("updates a worker and returns it unwrapped under data", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await Worker.create({
        farm_id: farm._id,
        ...validWorkerPayload(),
      });

      const res = await request(app)
        .put(`/api/workers/${worker._id}?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name", daily_rate: 150 });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Name");
      expect(res.body.data.daily_rate).toBe(150);
    });

    it("allows changing CIN to a value unique on the farm", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await Worker.create({
        farm_id: farm._id,
        ...validWorkerPayload(),
      });

      const res = await request(app)
        .put(`/api/workers/${worker._id}?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ CIN: "NEWCIN01" });

      expect(res.status).toBe(200);
      expect(res.body.data.CIN).toBe("NEWCIN01");
    });

    it("rejects changing CIN to one already used on the same farm", async () => {
      const { token, farm } = await createAdminWithFarm();
      await Worker.create({
        farm_id: farm._id,
        ...validWorkerPayload({ CIN: "TAKEN001" }),
      });
      const worker = await Worker.create({
        farm_id: farm._id,
        ...validWorkerPayload({ CIN: "CIN0002" }),
      });

      const res = await request(app)
        .put(`/api/workers/${worker._id}?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ CIN: "TAKEN001" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists on this farm/);
    });

    it("returns 404 when updating a worker on a different farm", async () => {
      const { token, farm } = await createAdminWithFarm();
      const otherAdmin = await createAdminWithFarm();
      const worker = await Worker.create({
        farm_id: otherAdmin.farm._id,
        ...validWorkerPayload(),
      });

      const res = await request(app)
        .put(`/api/workers/${worker._id}?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Nope" });

      expect(res.status).toBe(404);
    });

    it("ignores supervisor_id changes from a supervisor", async () => {
      const { farm } = await createAdminWithFarm();
      const { supervisor, token } = await createSupervisor(farm._id);
      const worker = await Worker.create({
        farm_id: farm._id,
        ...validWorkerPayload(),
      });

      const res = await request(app)
        .put(`/api/workers/${worker._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ supervisor_id: String(supervisor._id) });

      expect(res.status).toBe(200);
      expect(res.body.data.supervisor_id).toBeNull();
    });
  });

  describe("DELETE /api/workers/:id", () => {
    it("deletes a worker", async () => {
      const { token, farm } = await createAdminWithFarm();
      const worker = await Worker.create({
        farm_id: farm._id,
        ...validWorkerPayload(),
      });

      const res = await request(app)
        .delete(`/api/workers/${worker._id}?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Worker deleted successfully");

      const stillExists = await Worker.findById(worker._id);
      expect(stillExists).toBeNull();
    });

    it("returns 404 when deleting a worker on a different farm", async () => {
      const { token, farm } = await createAdminWithFarm();
      const otherAdmin = await createAdminWithFarm();
      const worker = await Worker.create({
        farm_id: otherAdmin.farm._id,
        ...validWorkerPayload(),
      });

      const res = await request(app)
        .delete(`/api/workers/${worker._id}?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
