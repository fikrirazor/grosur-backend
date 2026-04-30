import pino from "pino";
import config from "../config/env";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    config.nodeEnv === "development" || process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

export default logger;
