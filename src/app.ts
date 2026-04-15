import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pino from "pino-http";
import logger from "./utils/logger.util";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import addressRoutes from "./routes/address.routes";

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cookieParser());

// Logging middleware
app.use(pino({ logger }));

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
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

app.use('/api/addresses', addressRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
