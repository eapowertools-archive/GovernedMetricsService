var winston = require("winston");
var config = require("../config/config");
require('winston-daily-rotate-file');
require('./winston-socket.io/lib/winston-socketio');

//set up logging
var logger = new(winston.Logger)({
    level: config.logging.logLevel,
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.DailyRotateFile)({ filename: config.logging.logFile, prepend: true }),
        new(winston.transports.SocketIO)({ host: "https://" + config.gms.hostname, port: config.gms.port, secure: true, reconnect: true, log_topic: "gms" })
    ]
});

module.exports = logger;