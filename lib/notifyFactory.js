var logger = require('./logger');
var config = require('../config/config');
var qrsNotify = require('./qrsNotify');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');


var notifyFactory = {

    checkQRSConnection: function () {
        return new Promise(function (resolve, reject) {
            var path = "/app";
            qrsNotify.qrsAlive(path)
                .then(function (result) {
                    return getUpdateHandle()
                        .then(function (result) {
                            return getDeleteHandle()
                                .then(function (result) {
                                    resolve("SUCCESS");
                                })
                                .catch(function (error) {
                                    reject(error);
                                });
                        })
                        .catch(function (error) {
                            reject(error);
                        });
                })
                .catch(function (error) {
                    logger.debug("here")
                    logger.debug(error.stack);
                    reject(error);
                })

        });
    }

};


module.exports = notifyFactory;

function getUpdateHandle() {
    return new Promise(function (resolve, reject) {
        var updateHandleFile = path.normalize(path.join(__dirname, "/../config/updateHandleFile.txt"));

        logger.info("Deleting current notification service handle for GMS based changes", {
            module: 'server'
        });
        if (fs.existsSync(updateHandleFile)) {
            var handle = fs.readFileSync(updateHandleFile).toString().split('\n');
            qrsNotify.deleteNotification(handle[0])
                .then(function (result) {
                    if (result == 204) {
                        logger.info("Update notification handle removed", {
                            module: 'server'
                        });
                    }
                    return createUpdateNotification(updateHandleFile)
                        .then(function (result) {
                            resolve(result);
                        })
                        .catch(function (error) {
                            reject(error);
                        });
                })
                .catch(function (error) {
                    logger.error("Failed to delete notification handle.  Unable to start GMS.  Recommend Stopping and Starting all Qlik services.")
                    reject(error);
                });
        } else {
            return createUpdateNotification(updateHandleFile)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (error) {
                    reject(error);
                });
        }
    });
}

function getDeleteHandle() {
    return new Promise(function (resolve, reject) {
        var deleteHandleFile = path.normalize(path.join(__dirname, "/../config/deleteHandleFile.txt"));
        if (fs.existsSync(deleteHandleFile)) {
            var handle = fs.readFileSync(deleteHandleFile).toString().split('\n');
            qrsNotify.deleteNotification(handle[0])
                .then(function (result) {
                    if (result == 204) {
                        logger.info("Delete notification handle removed", {
                            module: 'server'
                        });
                    }
                    return createDeleteNotification(deleteHandleFile)
                        .then(function (result) {
                            resolve(result);
                        })
                        .catch(function (error) {
                            reject(error)
                        });
                })
                .catch(function (error) {
                    logger.error("Failed to delete notification handle.  Unable to start GMS.  Recommend Stopping and Starting all Qlik services.")
                    reject(error);
                });
        } else {
            return createDeleteNotification(deleteHandleFile)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (error) {
                    reject(error);
                });
        }
    });
}

function createUpdateNotification(handleFile) {
    return new Promise(function (resolve, reject) {
        logger.info("Creating new notification handler for GMS based changes to the repository.", {
            module: 'server'
        });
        var path = "/notification?name=appobject&changetype=Add";
        path += "&filter=owner.userId eq '" + config.qrs.repoAccountUserId + "' and owner.userDirectory eq '" + config.qrs.repoAccountUserDirectory + "'";
        var body = "https://" + config.gms.hostname + ":" + config.gms.port + "/masterlib/notifyme";
        qrsNotify.createNotification(path, body)
            .then(function (result) {
                logger.info("Notification Handle created with value " + result + ".  Starting GMS Server.", {
                    module: 'server'
                });
                logger.info("Creating Handle file to store handler value in case service dispatcher is restarted.")
                fs.writeFileSync(handleFile, result);
                resolve(true);
            })
            .catch(function (error) {
                logger.error("Failed to create notification handle with error: " + error, {
                    module: 'server'
                });
                logger.error("GMS will not be started because it requires a notification handle to process new metrics.");
                reject(error);
            });
    });
}

function createDeleteNotification(handleFile) {
    return new Promise(function (resolve, reject) {
        logger.info("Creating new notification handler for GMS based deletions to the repository.", {
            module: 'server'
        });
        var path = "/notification?name=appobject&changetype=Delete";
        path += "&filter=objectType eq 'dimension' or objectType eq 'measure'";
        var body = "https://" + config.gms.hostname + ":" + config.gms.port + "/masterlib/deletenotifyme";
        qrsNotify.createNotification(path, body)
            .then(function (result) {
                logger.info("Notification Handle created with value " + result + ".  Starting GMS Server.", {
                    module: 'server'
                });
                logger.info("Creating Handle file to store handler value in case service dispatcher is restarted.")
                fs.writeFileSync(handleFile, result);
                resolve(true);
            })
            .catch(function (error) {
                logger.error("Failed to create notification handle with error: " + error, {
                    module: 'server'
                });
                logger.error("GMS will not be started because it requires a notification handle to process new metrics.");
                reject(error);
            });
    });
}