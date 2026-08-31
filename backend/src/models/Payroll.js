import mongoose from 'mongoose';


const PayrollSchema = new mongoose.Schema({
    farm_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farm',
        required: true,
    },

    worker_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: true
    },

    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
    },

    year: {
        type: Number,
        required: true,
    },

    working_days: {
        type: Number,
        default: 0,
    },

    daily_rate: {
        type: Number,
        required: true,
        min: 0,
    },

    base_salary: {
        type: Number,
        default: 0,
    },

    bonuses: {
        type: Number,
        default: 0,
    },

    deductions: {
        type: Number,
        default: 0,
    },

    advances_total: {
        type: Number,
        default: 0
    },

    net_salary: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },

    paid_at: {
        type: Date,
        default: null
    },

    calculated_at: {
        type: Date,
        default: Date.now,
    },

    notes: {
        type: String,
        trim: true
    }
},
 { timestamps: true }
);

PayrollSchema.index({ worker_id: 1, month: 1, year: 1 }, { unique: true });
PayrollSchema.index({ farm_id: 1, year: 1, month: 1 });

const Payroll = mongoose.model('Payroll', PayrollSchema);

export default Payroll

