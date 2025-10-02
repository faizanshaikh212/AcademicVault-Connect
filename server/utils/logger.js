/**
 * Logger utility that respects NODE_ENV
 * Only logs in development environment by default
 */

const logger = {
  info: (...args) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(...args);
    }
  },
  error: (...args) => {
    // Errors should be logged in all environments
    console.error(...args);
  },
  debug: (...args) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(...args);
    }
  },
  warn: (...args) => {
    console.warn(...args);
  },
};

export default logger;
