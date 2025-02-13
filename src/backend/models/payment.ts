import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: String,
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending',
    },
    txid: {
        type: String,
        sparse: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    createdAt: {
        type: Date,
        required: true,
    },
    completedAt: {
        type: Date,
    },
});

paymentSchema.index({ createdAt: -1 });

export const PaymentModel = mongoose.model('Payment', paymentSchema); 