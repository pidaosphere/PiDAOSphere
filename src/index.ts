import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { PiNetworkService } from './services/PiNetworkService';
import { PiDaosFun } from './contracts/PiDaosFun';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { setupLogger } from './utils/logger';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
const piNetworkService = new PiNetworkService();

// Setup routes
setupRoutes(app, piNetworkService);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`PiDAOSphere server running on port ${PORT}`);
}); 