const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

module.exports = function Logger() {
  return createLogger({
      transports: [
          new transports.Console(),
          new transports.File({ filename: './logs/combined.log' }),
      ],
    });
};
