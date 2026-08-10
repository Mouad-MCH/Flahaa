import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import app from "../../app.js";
import { generateToken } from "../../utils/token.js";
import User from "../../models/User.js";
import Farm from "../../models/Farm.js";
import Worker from "../../models/Worker.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../../../public/uploads");

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
  await Promise.all([User.deleteMany({}), Farm.deleteMany({}), Worker.deleteMany({})]);
});


const writtenFiles = [];
afterEach(() => {
  while (writtenFiles.length) {
    const filePath = writtenFiles.pop();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
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
  const farm = await Farm.create({ name: "Green Farm", owner_id: admin._id });
  return { admin, farm, token: generateToken(admin) };
};

const validWorkerPayload = (overrides = {}) => ({
  name: "John Doe",
  CIN: "AB123456",
  daily_rate: 100,
  ...overrides,
});

describe("avatar upload via POST /api/workers", () => {
  it("accepts a JPEG avatar, stores it locally, and returns a relative avatar path", async () => {
    const { token, farm } = await createAdminWithFarm();

    const res = await request(app)
      .post(`/api/workers?farm_id=${farm._id}`)
      .set("Authorization", `Bearer ${token}`)
      .field("name", validWorkerPayload().name)
      .field("CIN", validWorkerPayload().CIN)
      .field("daily_rate", String(validWorkerPayload().daily_rate))
      .attach("avatar", Buffer.from("fake-jpeg-bytes"), "avatar.jpg");

    expect(res.status).toBe(201);
    expect(res.body.data.worker.avatar).toMatch(/^\/uploads\/avatar-\d+\.jpg$/);

    const savedPath = path.join(uploadsDir, path.basename(res.body.data.worker.avatar));
    writtenFiles.push(savedPath);
    expect(fs.existsSync(savedPath)).toBe(true);
  });

  it("accepts PNG and WEBP avatars", async () => {
    const { token, farm } = await createAdminWithFarm();

    for (const [ext, cin] of [["png", "PNG00001"], ["webp", "WEBP0001"]]) {
      const res = await request(app)
        .post(`/api/workers?farm_id=${farm._id}`)
        .set("Authorization", `Bearer ${token}`)
        .field("name", "Jane Doe")
        .field("CIN", cin)
        .field("daily_rate", "100")
        .attach("avatar", Buffer.from("fake-bytes"), `avatar.${ext}`);

      expect(res.status).toBe(201);
      writtenFiles.push(path.join(uploadsDir, path.basename(res.body.data.worker.avatar)));
    }
  });

  it("creates the worker without an avatar when no file is attached", async () => {
    const { token, farm } = await createAdminWithFarm();

    const res = await request(app)
      .post(`/api/workers?farm_id=${farm._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send(validWorkerPayload());

    expect(res.status).toBe(201);
    expect(res.body.data.worker.avatar).toBeFalsy();
  });

  it("rejects a disallowed file type and does not create the worker", async () => {
    const { token, farm } = await createAdminWithFarm();

    const res = await request(app)
      .post(`/api/workers?farm_id=${farm._id}`)
      .set("Authorization", `Bearer ${token}`)
      .field("name", validWorkerPayload().name)
      .field("CIN", validWorkerPayload().CIN)
      .field("daily_rate", String(validWorkerPayload().daily_rate))
      .attach("avatar", Buffer.from("not an image"), "avatar.txt");

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.message).toMatch(/Only JPEG, JPG, PNG, and WEBP/);

    const count = await Worker.countDocuments({ farm_id: farm._id });
    expect(count).toBe(0);
  });

  it("rejects a file over the 5MB size limit", async () => {
    const { token, farm } = await createAdminWithFarm();
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1);

    const res = await request(app)
      .post(`/api/workers?farm_id=${farm._id}`)
      .set("Authorization", `Bearer ${token}`)
      .field("name", validWorkerPayload().name)
      .field("CIN", validWorkerPayload().CIN)
      .field("daily_rate", String(validWorkerPayload().daily_rate))
      .attach("avatar", oversized, "avatar.jpg");

    expect(res.status).toBeGreaterThanOrEqual(400);

    const count = await Worker.countDocuments({ farm_id: farm._id });
    expect(count).toBe(0);
  });
});
