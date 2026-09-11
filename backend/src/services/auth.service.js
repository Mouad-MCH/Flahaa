import Farm from "../models/Farm.js";
import RegistrationToken from "../models/RegistrationToken.js";
import User from "../models/User.js";
import Worker from "../models/Worker.js";
import { comparPasword, hashPassword } from "../utils/password.js";
import { generateToken } from "../utils/token.js";
import crypto from "crypto";
import mongoose from "mongoose";

export const registerService = async (data) => {
  const { name, email, phone, password, role, farm_name, token } = data;

  if (role === "admin") {
    const userExists = await User.findOne({ email });
    if (userExists) {
      const error = new Error("Email is already registered");
      error.statusCode = 409;
      throw error;
    }

    if (!farm_name) {
      const error = new Error("farm_name is required to register as admin");
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      farm_id: null,
    });

    const farm = await Farm.create({
      name: farm_name,
      owner_id: user._id,
    });

    return { user, farm };
  }

  if (token) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const registrationToken = await RegistrationToken.findOne({
        tokenHash,
      }).session(session);

      if (!registrationToken) {
        const error = new Error("Invalid registration token");

        error.statusCode = 401;
        throw error;
      }

      if (registrationToken.expiresAt <= new Date()) {
        const error = new Error("Registration token has expired");
        error.statusCode = 401;
        throw error;
      }

      const existingUser = await User.findOne({
        email: registrationToken.email,
      }).session(session);

      if (existingUser) {
        const error = new Error("Email is already registered");
        error.statusCode = 409;
        throw error;
      }

      const consumedToken = await RegistrationToken.findOneAndUpdate(
        {
          _id: registrationToken._id,
          expiresAt: { $gt: new Date() },
          $expr: {
            $lt: ["$usedCount", "$maxUses"],
          },
        },
        {
          $inc: {
            usedCount: 1,
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!consumedToken) {
        const error = new Error(
          "Registration token has already been used or expired",
        );
        error.statusCode = 409;
        throw error;
      }

      const hashedPassword = await hashPassword(password);

      if (consumedToken.role === "supervisor") {
        const [user] = await User.create(
          [
            {
              name: consumedToken.name,
              email: consumedToken.email,
              phone: consumedToken.phone,
              password: hashedPassword,
              role: "supervisor",
              farm_id: consumedToken.farm_id,
              worker_id: null,
            },
          ],
          { session },
        );

        const farm = await Farm.findById(consumedToken.farm_id).session(
          session,
        );

        if (!farm) {
          const error = new Error(
            "Farm associated with this invitation was not found",
          );
          error.statusCode = 404;
          throw error;
        }

        await session.commitTransaction();

        return {
          user,
          farm,
        };
      }

      if (consumedToken.role === "worker") {
        const worker = await Worker.findOne({
          _id: consumedToken.worker_id,
          farm_id: consumedToken.farm_id,
          status: 'active'
        }).session(session);

        if (!worker) {
          const error = new Error(
            "Worker associated with this registration token was not found",
          );
          error.statusCode = 404;
          throw error;
        }

        const workerAlreadyLinked = await User.findOne({
          worker_id: worker._id,
        }).session(session);

        if (workerAlreadyLinked) {
          const error = new Error("This worker already has an account");
          error.statusCode = 409;
          throw error;
        }

        const [user] = await User.create(
          [
            {
              name: worker.name,
              email: consumedToken.email,
              phone: worker.phone,
              password: hashedPassword,
              role: "worker",
              farm_id: consumedToken.farm_id,
              worker_id: worker._id,
            },
          ],
          { session },
        );

        const farm = await Farm.findById(consumedToken.farm_id).session(
          session,
        );

        if (!farm) {
          const error = new Error(
            "Farm associated with this invitation was not found",
          );
          error.statusCode = 404;
          throw error;
        }

        await session.commitTransaction();

        return {
          user,
          worker,
          farm,
        };
      }

      const error = new Error("Invalid registration role");
      error.statusCode = 400;
      throw error;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  const error = new Error("Invalid registration request");
  error.statusCode = 400;
  throw error;
};

export const loginService = async (data) => {
  const { email, password } = data;

  const userExists = await User.findOne({ email }).select("+password");
  if (!userExists) {
    const error = new Error("User not Fount");
    error.statusCode = 401;
    throw error;
  }

  const matchPassword = await comparPasword(password, userExists.password);

  if (!matchPassword) {
    const error = new Error("Invalid password or email ");
    error.statusCode = 401;
    throw error;
  }

  const farm = await Farm.findById(userExists.farm_id).select("name");

  const accessToken = generateToken(userExists);

  return { user: userExists, accessToken, farm };
};
