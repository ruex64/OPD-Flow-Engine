import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'opd-flow-engine' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If not in production, log to console with a more readable format
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info: any) =>
            `${info.timestamp} [${info.level}]: ${info.message} ${
              Object.keys(info).filter(k => !['timestamp', 'level', 'message', 'service'].includes(k)).length 
                ? JSON.stringify(Object.keys(info).filter(k => !['timestamp', 'level', 'message', 'service'].includes(k)).reduce((obj: any, key) => ({ ...obj, [key]: info[key] }), {}), null, 2) 
                : ''
            }`
        )
      ),
    })
  );
}

export default logger;
