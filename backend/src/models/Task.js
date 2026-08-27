import mongoose from 'mongoose';


const AssignmentSchema = new mongoose.Schema({
    worker_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'in_progress', 'done'],
        default: 'pending'
    },

    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },

    note: {
        type: String,
        trim: true,
        maxlength: 500
    },

    completed_at: {
        type: Date,
        default: null
    }
}, { _id: true })


const TaskSchema = new mongoose.Schema({
    farm_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farm',
        required: true
    },

    assigned_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: 200
    },

    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },

    date: {
        type: Date,
        required: [true, 'Task date is required']
    },

    status: {
        type: String,
        enum: ['pending', 'in_progress', 'done'],
        default: 'pending'
    },

    assignments: {
        type: [AssignmentSchema],
        validate: {
            validator: (arr) => arr.length > 0,
            message: 'At least one assignment is required'
        }
    }

},
 { timestamps: true}
)


TaskSchema.index({ farm_id: 1, date: -1 });
TaskSchema.index({ 'assignments.worker_id': 1, date: -1 });

TaskSchema.methods.assignmentFor = function assignmentFor(worker_id) {
    const target = String(worker_id);
    return this.assignments.find((a) => String(a.worker_id?._id ?? a.worker_id) === target);
}

TaskSchema.methods.recomputeStatus = function recumputeStatus() {
    const statuses = this.assignments.map(a => a.status);

    statuses.every(s => s === 'done') 
    ? this.status = 'done'
    : statuses.some(s => s === 'in_progress')
    ? this.status = 'in_progress'
    : this.status = 'pending';

   return this.status;
}

TaskSchema.pre('save', function() {
    if(this.isModified('assignments')) {
        this.recomputeStatus();
    }
});

const Task = mongoose.model('Task', TaskSchema);
export default Task;