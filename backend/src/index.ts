
import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
// import cors from 'cors'; // Replaced with manual middleware
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
import roomRoutes from './modules/rooms/room.route';
import assignmentRoutes from './modules/assignments/assignment.route';
import maintenanceRoutes from './modules/maintenance/maintenance.route';
import reservationRoutes from './modules/reservations/reservation.route';
import hostingRoutes from './modules/hostings/hosting.route';
import activityLogRoutes from './modules/activity-log/activity-log.route';
import systemSettingsRoutes from './modules/system-settings/system-settings.route';
import uploadRoutes from './modules/uploads/upload.route';
// import { initializeCronJobs } from './jobs';


const app: Express = express();

// Custom CORS Middleware to handle browser security policies
app.use((req: Request, res: Response, next: NextFunction) => {
    // Dynamically allow the origin of the request.
    // In a production environment, this should be a whitelist.
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle pre-flight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});


// Other Middlewares
app.use(helmet());
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
app.use('/api/v1/floors', buildingRoutes); // Floors are nested under buildings but this allows direct access if needed
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/hostings', hostingRoutes);
app.use('/api/v1/activity-log', activityLogRoutes);
app.use('/api/v1/system-settings', systemSettingsRoutes);
app.use('/api/v1/uploads', uploadRoutes);


// Handle 404 Not Found
app.use((req: Request, res: Response, next: NextFunction) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not Found'));
});

// Global Error Handler
app.use(errorMiddleware);

const server = app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
  // initializeCronJobs();
});

// Graceful Shutdown
// FIX: Cast `process` to `any` to access Node.js-specific properties 'on' and 'exit'
// that are not available in the default TypeScript 'Process' type.
(process as any).on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        (process as any).exit(0);
    });
});
