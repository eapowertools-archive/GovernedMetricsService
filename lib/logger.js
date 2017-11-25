const winston = require("winston");
const config = require("../config/config");
// require('winston-daily-rotate-file');
// require('winston-socket.io');

//set up logging
var logger = new(winston.Logger)({
    level: config.logging.logLevel,
    transports: [
        new(winston.transports.Console)({
            colorize: true
        })
        // new(winston.transports.DailyRotateFile)({
        //     filename: config.logging.logFile,
        //     prepend: true
        // }),
    ]
});


module.exports = logger;