//server.js

//BASE Setup
//=========================================================================


//require statements
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var config = require('./config/config');
var Promise = require('bluebird');
var doWork = require('./lib/dowork');
var qrsNotify = require('./lib/qrsNotify');
var fs = require('fs');
var path = require('path');
var https = require('https');
var socketio = require('socket.io');
var logger = require('./lib/logger');


var x = {};

logger.info('Firing up the Governed Metrics Service ReST API', { module: 'server' });
var handleFile = path.join(__dirname, "config/handleFile.txt");

logger.info("Deleting current notification service handle for GMS based changes", { module: 'server' });
if (fs.existsSync(handleFile)) {
    var handle = fs.readFileSync(handleFile).toString().split('\n');
    console.log(handle[0])
    qrsNotify.deleteNotification(handle[0])
        .then(function(result) {
            if (result == 204) {
                logger.info("notification handle removed", { module: 'server' });
            }
            return createNotification();
        })
        .catch(function(error) {
            logger.error("Failed to delete notification handle.  Unable to start GMS.  Recommend Stopping and Starting all Qlik services.")
            return process.exit();
        });
} else {
    createNotification();
}

function createNotification() {
    logger.info("Creating new notification handler for GMS based changes to the repository.", { module: 'server' });
    qrsNotify.createNotification()
        .then(function(result) {
            logger.info("Notification Handle created with value " + result + ".  Starting GMS Server.", { module: 'server' });
            logger.info("Creating Handle file to store handler value in case service dispatcher is restarted.")
            fs.writeFileSync(handleFile, result);
            return launchServer();
        })
        .catch(function(error) {
            logger.error("Failed to create notification handle with error: " + error, { module: 'server' });
            logger.error("GMS will not be started because it requires a notification handle to process new metrics.");
            return process.exit();
        });
}


function launchServer() {
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use('/masterlib/public', express.static(config.gms.publicPath));
    app.use('/masterlib/node_modules', express.static(config.gms.nodeModPath));


    logger.info('Setting port', { module: 'server' });

    var port = config.gms.port || 8590;

    logger.info('Setting route', { module: 'server' });

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
    server.listen(config.gms.port, function() {
        logger.info('Governed Metrics Service version ' + config.gms.version + ' started', { module: 'server' });
    });

    var io = new socketio(server);

    io.on('connection', function(socket) {
        socket.on("gms", function(msg) {
            console.log("gms" + "::" + msg);
            io.emit("gms", msg);
        });
    });
}