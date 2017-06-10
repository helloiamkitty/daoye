const winston = require('winston');

const infoLogger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({
      filename: 'log/info.log',
      level: 'info'
    })
  ]
});

const errorLogger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({
      filename: 'log/error.log',
      level: 'error'
    })
  ]
});

var logger = {};

logger.info = (...args) => {
  infoLogger.info.apply(infoLogger, args);
};

logger.error = (...args) => {
  errorLogger.error.apply(errorLogger, args);
};

// 导出全局
global.logger = logger;

module.exports = logger;
