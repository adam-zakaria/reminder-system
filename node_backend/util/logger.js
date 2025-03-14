const winston = require('winston');
const moment = require('moment-timezone');

// Reusable logger function
const createLogger = (filename) => {
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp({
        format: () => moment().tz('America/New_York').format('YYYY-MM-DD HH:mm:ss z'),
      }),
      winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename }),
    ],
  });
};

module.exports = createLogger;
