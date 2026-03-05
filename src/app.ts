import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import pino from "pino-http";
import logger from "./utils/logger.util";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

const app: Application = express();

// Security middleware
app.use(helmet());

// Logging middleware
app.use(pino({ logger }));

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }),
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", routes);

// Root route
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the API",
    version: "1.0.0",
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
