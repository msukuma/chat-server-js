const {
  addColors,
  createLogger,
  format,
  transports, } = require('winston');
const { printf } = format;

const myCustomLevels = {
  levels: {
    error: 0,
    warn: 1,
    timeout: 2,
    connection: 3,
    session: 4,
    message: 5,
    info: 6,
    verbose: 7,
    debug: 8,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    timeout: 'orange',
    connection: 'green',
    session: 'green',
    message: 'green',
    info: 'green',
    verbose: 'cyan',
    debug: 'blue',
  },
};

module.exports = function Logger() {
  addColors(myCustomLevels);

  const logger =  createLogger({
    format: printf(info => {
        let log = {
          timestamp: new Date().toISOString(),
          level: info.level,
          label: 'TCP-Server',
          message: info.message,
        };

        return JSON.stringify(log);
      }
    ),
    levels: myCustomLevels.levels,
    transports: [
        new transports.Console(),
        new transports.File({ filename: './logs/combined.log' }),
    ],
  });

  return logger;
};
