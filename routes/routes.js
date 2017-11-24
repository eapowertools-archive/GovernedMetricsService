var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var parseUrlencoded = bodyParser.urlencoded({
    extended: false
});
var hypercube = require('../lib/setCubeDims');
var worker = require('../lib/dowork');
var getdoc = require('../lib/getdocid');
var gethypercube = require('../lib/getmetricshypercube');
var notifiedByRepo = require('../lib/notifiedByRepo');
var config = require('../config/config');
var winston = require("winston");
var logger = require('../lib/logger');
var socketHelper = require("../lib/socketHelper");


router.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

router.route('/')
    .get(function (request, response) {
        response.status(200).json("This is the default route for the Governed Metrics Service.  Nothing happens here.");
    });

router.route('/testpage')
    .get(function (request, response) {
        var options = {
            root: config.gms.appPath
        };
        response.sendFile('index.htm', options, function (err) {
            if (err) {
                console.log(err);
                response.status(err.status).end();
            }
        });
    });

//for testing getDocId method
router.route('/getdocid')
    .get(function (request, response) {
        //        socketHelper.sendMessage("gms", "Retrieving doc id for " + config.gms.appName);
        worker.getDoc(config.gms.appName)
            .then(function (result) {
                socketHelper.sendMessage("gms", "Retrieving doc id for " + config.gms.appName + ": " + JSON.stringify(result));
                response.status(200).json(result);
            })
            .catch(function (error) {
                socketHelper.sendMessage("gms", "Request failed: " + JSON.stringify(error));
                response.status(400).json(error);
            });
    })
    .post(function (request, response) {
        //        socketHelper.sendMessage("gms", "Retrieving doc id for " + request.body.appName);
        worker.getDoc(request.body.appName)
            .then(function (result) {
                socketHelper.sendMessage("gms", "Retrieving doc id for " + request.body.appName + ": " + JSON.stringify(result));
                response.status(200).json(result);
            })
            .catch(function (error) {
                socketHelper.sendMessage("gms", "Request failed: " + JSON.stringify(error));
                response.status(400).json(error);
            });
    });

router.route("/getgmaapps")
    .get(function (request, response) {
        worker.getGMAApps()
            .then(function (result) {
                response.status(200).json(result);
            })
            .catch(function (error) {
                socketHelper.sendMessage("gms", "Request failed: " + JSON.stringify(error));
                response.status(400).json(error);
            })
    })

router.route('/add/all')
    .post(function (request, response) {
        logger.info('POST add/all', {
            module: 'routes'
        });
        worker.addAll()
            .then(function (result) {
                logger.info('POST add/all success::' + result.result, {
                    module: 'routes'
                });
                response.status(200).json(result.result);
            })
            .catch(function (error) {
                socketHelper.sendMessage("gms", "Request failed: " + JSON.stringify(error));
                response.status(400).json(error);
            });

    });

router.route("/update")
    .post(parseUrlencoded, function (request, response) {
        let logInfo = setLogFile();
        logger.add(winston.transports.File, logInfo);
        socketHelper.logMessage("info", "gms", "Update method called", __filename);
        if (request.body.hasOwnProperty("appId") && request.body.hasOwnProperty("appName")) {
            socketHelper.logMessage("error", "gms", "Supply either the appId or the appName for the app to be updated by GMS", __filename);
            logger.remove(logInfo.name);
            response.status(400).json("Supply either the appId or the appName for the app to be updated by GMS");
        }

        if (request.body.hasOwnProperty("appId") || request.body.hasOwnProperty("appName")) {
            socketHelper.logMessage("info", "gms", "Updating " + (request.body.hasOwnProperty("appId") ? request.body.appId : request.body.appName), __filename);

            worker.update(request.body)
                .then(function (result) {
                    socketHelper.logMessage("info", "gms", "Update complete with result " + result.result, __filename);
                    logger.remove(logInfo.name);
                    response.status(200).json(result.result + '\n');
                })
                .catch(function (error) {
                    socketHelper.logMessage("error", "gms", "Update failed with error " + JSON.stringify(error), __filename);
                    logger.remove(logInfo.name);
                    var foo = {
                        result: 'POST update failure::' + JSON.stringify(error)
                    };
                    response.status(400).json(foo.result);
                });
        } else {
            socketHelper.logMessage("error", "gms", "appId or appName missing from request body.", __filename);
            logger.remove(logInfo.name);
            response.status(400).json("appId or appName missing from request body.")
        }

    });

router.route('/update/all')
    .post(function (request, response) {
        let logInfo = setLogFile();
        logger.add(winston.transports.File, logInfo);
        socketHelper.logMessage("info", "gms", "Update All method called.  All applications with subscriptions will be updated.", __filename);
        worker.updateAll()
            .then(function (result) {
                socketHelper.logMessage("info", "gms", "Update All complete with result " + result.result, __filename);
                logger.remove(logInfo.name);
                response.status(200).json(result.result + '\n');
            })
            .catch(function (error) {
                socketHelper.logMessage("error", "gms", "Update All failed with error " + JSON.stringify(error), __filename);
                logger.remove(logInfo.name);

                var foo = {
                    result: 'POST update/all failure::' + error
                };

                response.status(200).json(foo.result);
            });

    });

router.route('/delete/fromapp')
    .post(parseUrlencoded, function (request, response) {
        let logInfo = setLogFile();
        logger.add(winston.transports.File, logInfo);
        if (request.body.hasOwnProperty("appname")) {
            socketHelper.logMessage("info", "gms", "Deleting governed master library items from " + request.body.appname + ".", __filename);
            worker.deleteFromApp(request.body)
                .then(function (result) {
                    socketHelper.logMessage("info", "gms", "Delete complete with result " + result.result, __filename);
                    logger.remove(logInfo.name);
                    response.status(200).json(result.result + '\n');
                });
        } else {
            socketHelper.logMessage("error", "gms", "appname missing from request body for delete operation.", __filename);
            logger.remove(logInfo.name);
            response.status(400).json("appname missing from request body for delete operation.")
        }
    });

router.route('/reload')
    .post(function (request, response) {
        let logInfo = setLogFile();
        logger.add(winston.transports.File, logInfo);
        socketHelper.logMessage("info", "gms", "Reloading the selected Governed Metrics Application.", __filename);
        worker.reloadMetricsApp()
            .then(function (result) {
                socketHelper.logMessage("info", "gms", "Reload complete with result " + result.result, __filename);
                logger.remove(logInfo.name);
                response.status(200).json(result.result);
            })
            .catch(function (error) {
                socketHelper.logMessage("error", "gms", "Error reloading Governed Metrics App " + JSON.stringify(error), __filename);
                logger.remove(logInfo.name);
                response.status(400).json(error);
            });
    });

router.route('/changeOwner')
    .post(parseUrlencoded, function (request, response) {
        socketHelper.logMessage("debug", "gms", "A change ownership request has been made on governed metrics", __filename)
        worker.changeOwner(request.body)
            .then(function (result) {
                response.status(200).json(result);
            })
            .catch(function (error) {
                response.status(400).json(error);
            });
    });

router.route("/version")
    .get(function (request, response) {
        response.status(200).send(config.gms.version);
    });

//  Provide Master Data Items from specfic Qlik Sense applications, as an input
//  to the metrics library. Hitting this endpoint should return all master data
// 	items from the relevant Apps (either identified by name or tag in the
//  mangement console).
router.route("/getAllMDI")
    .get(function (request, response) {
        worker.getAllMdi()
            .then(function (result) {
                response.set({
                    'Content-Type': 'application/json'
                })
                logger.info('GET getAllMdi success::' + JSON.stringify(result), {
                    module: 'routes'
                });
                response.status(200).json(result);
            })
            .catch(function (error) {
                logger.error('GET getAllMdi failure::' + error, {
                    module: 'routes'
                });
                response.status(400).json(error);
            })
    });

router.route("/notifyme")
    .post(parseUrlencoded, function (request, response) {
        notifiedByRepo.updateRepo(request.body)
            .then(function (result) {
                socketHelper.logMessage("debug", "gms", "The Qlik Sense repository has been updated by GMS.", __filename)
                response.status(200).json(result);
            })
            .catch(function (error) {
                socketHelper.logMessage("error", "gms", "The Qlik Sense repository has not been updated by GMS.  Here is the error: " + JSON.stringify(error), __filename)
                response.status(400).json(error);
            });
    });

router.route("/deletenotifyme")
    .post(parseUrlencoded, function (request, response) {
        socketHelper.logMessage("info", "gms", "Completed delete operation in the repository.  Master Library items have been removed.", __filename)
        response.status(200).json("Metrics deleted from repository");
    });

router.route("/getapplist")
    .get(function (request, response) {
        worker.getDocList()
            .then(function (result) {
                response.status(200).json(result);
            })
            .catch(function (error) {
                logger.error("Failed to get app list: " + JSON.stringify(error), {
                    module: 'routes'
                });
                response.status(400).json(error);
            });
    });

router.route("/getappobjects/:id")
    .get(function (request, response) {
        worker.getObjectList(request.params.id)
            .then(function (result) {
                response.status(200).json(result);
            })
            .catch(function (error) {
                logger.error("Failed to get objects from app: " + request.params.id, {
                    module: "routes"
                });
                response.status(400).json(error);
            })
    })

module.exports = router;

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
};

function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            return false;
        }
    }
    return true;
};

function setLogFile() {
    let logId = generateUUID();
    let d = new Date();
    let dateToUse = d.getMonth() + "_" + d.getDay() + "_" + d.getFullYear() + "_" + d.getUTCHours() + "_" + d.getUTCMinutes();
    let filePath = path.join(config.logging.logPath, config.logging.logName + "_" + dateToUse + "_" + logId + ".log");

    return {
        name: logId,
        filename: filePath,
        level: config.logging.logLevel
    }
}