import mongoose from 'mongoose';

const FarmSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Farm name is required'],
        trim: true
    },
    address: {
        type: String,
        trim: true,
    },
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Owner_id is required'],
    }
}, { timestamps: true });

FarmSchema.index({ owner_id: 1 });

const Farm = mongoose.model("Farm", FarmSchema);

export default Farm;