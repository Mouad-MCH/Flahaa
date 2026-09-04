import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please add a valid email"
        ]
    },
    phone: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minLength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ["admin", "supervisor", "worker"],
        default: "worker"
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },

    farm_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farm',
        default: null,
        requered: [function () { return this.role !== 'admin' }, 'Farm ID is required for non-admin users']
    },

    worker_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
        default: null
    },

}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

export default User;