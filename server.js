//server.js

//BASE Setup
//=========================================================================


//require statements
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var config = require('./config/config');
var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');
var https = require('https');
var socketio = require('socket.io');
var logger = require('./lib/logger');
var notifyFactory = require('./lib/notifyFactory');

var x = {};

logger.info('Firing up the Governed Metrics Service REST API', {
    module: 'server'
});


notifyFactory.checkQRSConnection()
    .then(function (result) {
        if (result === "SUCCESS") {
            return launchServer();
        } else {
            logger.error(JSON.stringify(result), {
                module: "server"
            });
            process.exit();
        }
    })
    .catch(function (error) {
        logger.error("Shutting down GMS.  Can't Start Up");
        logger.error(JSON.stringify(error), {
            module: "server"
        });
        process.exit();
    });


function launchServer() {
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    app.use('/masterlib/public', express.static(config.gms.publicPath));
    app.use('/masterlib/node_modules', express.static(config.gms.nodeModPath));
    app.use('/masterlib/docs', express.static(config.gms.docsPath));


    logger.info('Setting port', {
        module: 'server'
    });

    var port = config.gms.port || 8590;

    logger.info('Setting route', {
        module: 'server'
    });

    var popmasterlib = require('./routes/routes');


    //Register routes
    //all routes will be prefixed with api
    app.use('/masterlib', popmasterlib);

    //Start the server
    var httpsOptions = {}

    if (config.gms.hasOwnProperty("certificates")) {
        if (config.gms.certificates.server !== undefined) {
            //pem files in use
            httpsOptions.cert = fs.readFileSync(config.gms.certificates.server);
            httpsOptions.key = fs.readFileSync(config.gms.certificates.server_key);
        }

        if (config.gms.certificates.pfx !== undefined) {
            httpsOptions.pfx = fs.readFileSync(config.gms.certificates.pfx);
            httpsOptions.passphrase = config.gms.certificates.passphrase;
        }
    } else {
        httpsOptions.cert = fs.readFileSync(config.certificates.server),
            httpsOptions.key = fs.readFileSync(config.certificates.server_key)
    }

    var server = https.createServer(httpsOptions, app);
    server.listen(config.gms.port, function () {
        logger.info('Governed Metrics Service version ' + config.gms.version + ' started', {
            module: 'server'
        });
    });

    var io = new socketio(server);

    io.on('connection', function (socket) {
        socket.on("gms", function (msg) {
            console.log("gms" + "::" + msg);
            io.emit("gms", msg);
        });
    });
}