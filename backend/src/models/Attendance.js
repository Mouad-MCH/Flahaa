import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
    worker_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: [true, 'worker_id is required'],
    },

    farm_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farm',
        required: [true, 'farm_id is required' ]
    },

    date: {
        type: Date,
        required: [true, 'date is required']
    },

    status: {
        type: String,
        enum: ['present', 'absent', 'excused'],
        default: 'present'
    },

    check_in: {
        type: Date,
    },

    check_out: {
      type: Date,
    },

    recorded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'specify who recorded the attendance is required']
    }
},
  {timestamps: true}
);

AttendanceSchema.index({ farm_id: 1, worker_id: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', AttendanceSchema);

export default Attendance;