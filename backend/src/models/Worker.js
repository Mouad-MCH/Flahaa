import mongoose from 'mongoose';

const WorkerSchema = new mongoose.Schema({
    farm_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Farm",
        required: [true, 'associate a farm required']
    },
    name: {
        type: String,
        required: [true, "name is required"],
        trim: true,
    },

    CIN: {
        type: String,
        required: [true, 'CIN is required'],
        trim: true,
    },

    phone: {
        type: String,
        trim: true,
    },

    address: {
        type: String,
        trim: true,
    },

    avatar: {
        type: String,
        default: '',
    },

    contract_type: {
        type: String,
        enum: ['daily', 'weekly'],
        default: 'daily'
    },

    daily_rate: {
        type: Number,
        required: [true, 'adding a daily or weekly rate is required'],
        min: 0,
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: 'active'
    },

    supervisor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    join_date: {
        type: Date,
        default: Date.now
    }
    

}, { timestamps: true });

WorkerSchema.index({ farm_id: 1, CIN: 1 }, { unique: true });

const Worker = mongoose.model('Worker', WorkerSchema);

export default Worker