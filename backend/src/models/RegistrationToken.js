import mongoose from 'mongoose';


export const RegistrationTokenSchema = new mongoose.Schema({
    farm_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farm',
        required: true,
    },

    role: {
        type: String,
        enum: ["supervisor", "worker"],
        required: true,
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },

    name: {
        type: String,
        trim: true,
        default: null,
    },

    phone: {
        type: String,
        trim: true,
        default: null,
    },

    worker_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        default: null,
    },

    expiresAt: {
        type: Date,
        required: true,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    maxUses: {
        type: Number,
        default: 1,
        min: 1,
    },

    usedCount: {
        type: Number,
        default: 0,
        min: 0,
    },

    tokenHash: {
        type: String,
        required: true,
        unique: true,
        index: true,
    }
},
  { timestamps: true }
)

const RegistrationToken = mongoose.model('RegistrationToken', RegistrationTokenSchema);


export default RegistrationToken;