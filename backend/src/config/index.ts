import dotenv from 'dotenv';
import path from 'path';

// FIX: Cast `process` to `any` to access the Node.js-specific 'cwd' method,
// which is not available in the default TypeScript 'Process' type.
dotenv.config({ path: path.join((process as any).cwd(), '.env') });

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 8000,
    database_url: process.env.DATABASE_URL as string,
    jwt_secret: process.env.JWT_SECRET as string,
    jwt_expires_in: process.env.JWT_EXPIRES_IN as string,
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET as string,
    jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN as string,
    cors_origin: process.env.CORS_ORIGIN || '*'
};

export default config;