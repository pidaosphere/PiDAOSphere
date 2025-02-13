import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { Express } from 'express';
import { logger } from '../utils/logger';

export const setupSecurity = (app: Express) => {
    // Basic security headers
    app.use(helmet());

    // CORS configuration
    const corsOptions = {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 86400, // 24 hours
    };
    app.use(cors(corsOptions));

    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
            res.status(429).json({
                error: 'Too many requests, please try again later.',
            });
        },
    });
    app.use('/api/', limiter);

    // API Key validation for certain routes
    const apiKeyMiddleware = (req: any, res: any, next: any) => {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey || apiKey !== process.env.API_KEY) {
            logger.warn(`Invalid API key attempt from IP: ${req.ip}`);
            return res.status(401).json({ error: 'Invalid API key' });
        }
        next();
    };

    // JWT validation middleware
    const validateJWT = (req: any, res: any, next: any) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        try {
            // Verify JWT token
            // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
            // req.user = decoded;
            next();
        } catch (error) {
            logger.warn(`Invalid JWT attempt from IP: ${req.ip}`);
            return res.status(401).json({ error: 'Invalid token' });
        }
    };

    // Request sanitization
    const sanitizeRequest = (req: any, res: any, next: any) => {
        // Remove any potential XSS content
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].replace(/<[^>]*>/g, '');
            }
        });
        next();
    };

    // Apply middleware to specific routes
    app.use('/api/protected/*', validateJWT);
    app.use('/api/admin/*', apiKeyMiddleware);
    app.use(sanitizeRequest);

    // Error handling middleware
    app.use((err: any, req: any, res: any, next: any) => {
        logger.error('Unhandled error:', err);
        res.status(500).json({
            error: process.env.NODE_ENV === 'production' 
                ? 'Internal server error' 
                : err.message
        });
    });
}; 