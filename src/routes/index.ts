import { Express } from 'express';
import { PiNetworkService } from '../services/PiNetworkService';
import { AppError } from '../middleware/errorHandler';

export const setupRoutes = (app: Express, piNetworkService: PiNetworkService) => {
    // Health check
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'healthy' });
    });

    // Pi Network authentication
    app.post('/auth/pi', async (req, res, next) => {
        try {
            const { accessToken } = req.body;
            if (!accessToken) {
                throw new AppError('Access token is required', 400);
            }

            const userData = await piNetworkService.authenticateUser(accessToken);
            res.status(200).json(userData);
        } catch (error) {
            next(error);
        }
    });

    // Verify Pi payment
    app.post('/payments/verify', async (req, res, next) => {
        try {
            const { paymentId } = req.body;
            if (!paymentId) {
                throw new AppError('Payment ID is required', 400);
            }

            const paymentData = await piNetworkService.verifyPayment(paymentId);
            res.status(200).json(paymentData);
        } catch (error) {
            next(error);
        }
    });

    // Get Pi balance
    app.get('/users/:username/balance', async (req, res, next) => {
        try {
            const { username } = req.params;
            const balance = await piNetworkService.getPiBalance(username);
            res.status(200).json({ balance });
        } catch (error) {
            next(error);
        }
    });

    // Catch all unhandled routes
    app.all('*', (req, res, next) => {
        next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
    });
}; 