
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import logger from './utils/logger';
import { errorMiddleware } from './middleware/error.middleware';
import ApiError from './utils/apiError';
import httpStatus from 'http-status';

// Import routes
import authRoutes from './modules/auth/auth.route';
import userRoutes from './modules/users/user.route';
import employeeRoutes from './modules/employees/employee.route';
import buildingRoutes from './modules/buildings/building.route';
import floorRoutes from './modules/floors/floor.route';
import roomRoutes from './modules/rooms/room.route';
import assignmentRoutes from './modules/assignments/assignment.route';
import maintenanceRoutes from './modules/maintenance/maintenance.route';
import reservationRoutes from './modules/reservations/reservation.route';
import hostingRoutes from './modules/hostings/hosting.route';
import uploadRoutes from './modules/uploads/upload.route';
import settingsRoutes from './modules/settings/settings.route';
import activityLogRoutes from './modules/activitylog/activitylog.route';
import { initializeCronJobs } from './jobs';


const app: Express = express();

// Middlewares
app.use(helmet());

// Robust CORS configuration for local development.
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or file://)
        if (!origin) return callback(null, true);
        
        // Allow local development ports and both localhost and 127.0.0.1
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173'
        ];
        
        if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
             return callback(null, true);
        }
        
        // In production, strict check would go here. For this setup, we're permissive for dev.
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use('/uploads', express.static('uploads'));


// API Routes
app.get('/', (req: Request, res: Response) => {
  res.send('Tal Avenue Backend is running!');
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/buildings', buildingRoutes);
app.use('/api/v1/floors', floorRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/hostings', hostingRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/activity-log', activityLogRoutes);


// Handle 404 Not Found
app.use((req: Request, res: Response, next: NextFunction) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not Found'));
});

// Global Error Handler
app.use(errorMiddleware);

// Bind to 0.0.0.0 to ensure the server accepts connections from all interfaces.
const server = app.listen(Number(config.port), '0.0.0.0', () => {
  logger.info(`Server is running on http://0.0.0.0:${config.port}`);
  logger.info(`Local address: http://127.0.0.1:${config.port}/api/v1`);
  logger.info(`Ensure your frontend API_BASE_URL points to http://127.0.0.1:${config.port}/api/v1`);
  initializeCronJobs();
});

server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use. Please free the port or configure a different one in .env`);
    } else {
        logger.error(`Server failed to start: ${error.message}`);
    }
});

// Graceful Shutdown
(process as any).on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        (process as any).exit(0);
    });
});
