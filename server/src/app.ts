import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import winston from 'winston';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRouter from "./routes/auth.routes";
import fileRouter from "./routes/file.routes";
import errorHandler from "./middleware/errorHandler";

// Load environment variables
dotenv.config();

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/files", fileRouter);

// Baseline health check API
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'up',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongooseConnectionState()
  });
});

// Helper function to check mongoose connection state
function mongooseConnectionState(): string {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const stateCode = require('mongoose').connection.readyState;
  return states[stateCode] || 'unknown';
}

// Global Error Handler (must be defined last)
app.use(errorHandler as any);

// Start Server
app.listen(PORT, () => {
  logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;
