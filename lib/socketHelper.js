// var socket = require('socket.io-client')("http://192.168.65.1:8591", {
//     secure: false,
//     reconnect: true
// });

var socket;
var logger = require("./logger")

var socketHelper = {
    createConnection: function (url) {
        socket = require('socket.io-client')(url, {
            secure: true,
            reconnect: true
        });
    },
    sendMessage: function (app, msg) {
        socket.emit(app, msg);
    },
    logMessage: function (level, app, msg, logModule) {
        if (level == "info" || level == "error") {
            socketHelper.sendMessage(app, msg);
        }
        logger.log(level, msg, logModule);
    }
}

module.exports = socketHelper;