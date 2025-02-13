import { Router } from 'express';
import { PiNetwork } from '@pinetwork-js/sdk';
import { auth } from '../middleware/auth';
import { PaymentModel } from '../models/payment';

const router = Router();
const piNetwork = new PiNetwork({
    apiKey: process.env.PI_API_KEY!,
    walletPrivateKey: process.env.PI_WALLET_PRIVATE_KEY!,
});

router.post('/approve', auth, async (req, res) => {
    try {
        const { paymentId, userId } = req.body;
        
        // Verify payment details with Pi Network
        const payment = await piNetwork.getPayment(paymentId);
        
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Store payment information
        await PaymentModel.create({
            paymentId,
            userId,
            amount: payment.amount,
            status: 'pending',
            metadata: payment.metadata,
            createdAt: new Date(),
        });

        // Approve payment
        await piNetwork.approvePayment(paymentId);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Payment approval failed:', error);
        res.status(500).json({ error: 'Payment approval failed' });
    }
});

router.post('/complete', auth, async (req, res) => {
    try {
        const { paymentId, txid, userId } = req.body;
        
        // Complete payment with Pi Network
        await piNetwork.completePayment(paymentId, txid);
        
        // Update payment status
        await PaymentModel.findOneAndUpdate(
            { paymentId },
            { 
                status: 'completed',
                txid,
                completedAt: new Date(),
            }
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Payment completion failed:', error);
        res.status(500).json({ error: 'Payment completion failed' });
    }
});

router.get('/history', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const payments = await PaymentModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.json(payments);
    } catch (error) {
        console.error('Failed to fetch payment history:', error);
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
});

export default router; 