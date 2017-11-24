var Promise = require('bluebird')
var config = require('../config/config');
var qrsInteract = require('./qrsInstance');
var fs = require('fs');
var logger = require('./logger');
var socketHelper = require("./socketHelper");

var qrsNotify = {
    createNotification: function (path, body) {
        return new Promise(function (resolve, reject) {
            qrsInteract.Post(path, body, 'json')
                .then(function (result) {
                    socketHelper.logMessage("debug", "gms", 'Handle for notification service entry:' + result.body.value, __filename);
                    resolve(result.body.value);
                })
                .catch(function (error) {
                    socketHelper.logMessage("debug", "gms", 'Error: ' + JSON.stringify(error), __filename);
                    reject(error);
                });
        });
    },
    deleteNotification: function (handle) {
        return new Promise(function (resolve, reject) {
            var path = "/notification?handle=" + handle;
            socketHelper.logMessage("debug", "gms", 'deleting notification service entry: ' + handle, __filename);
            qrsInteract.Delete(path)
                .then(function (result) {
                    socketHelper.logMessage("debug", "gms", 'Response code for deletion: ' + result, __filename);
                    resolve(result);
                })
                .catch(function (error) {
                    socketHelper.logMessage("error", "gms", 'Error: ' + JSON.stringify(error), __filename);
                    reject(error);
                });
        });
    },
    qrsAlive: function (path, pingCount) {
        pingCount = pingCount || 0;
        var boolFailed = false;

        return new Promise(function (resolve, reject) {
                if (pingCount > 12) {

                    reject("Failed connection to repository too many times");
                }
                socketHelper.logMessage("debug", "gms", "Checking to see if Qlik Repository Service is running", __filename);

                qrsInteract.Get(path)
                    .then(function (result) {
                        socketHelper.logMessage("debug", "gms", "Ping Successful", __filename);
                        resolve(true)
                    })
                    .catch(function (error) {
                        socketHelper.logMessage("error", "gms", 'Error: ' + JSON.stringify(error), __filename);
                        resolve(false);
                    })
            })
            .then(function (foo) {
                if (foo) {
                    return foo;
                } else {
                    return sleep(10000)
                        .then(function () {
                            return qrsNotify.qrsAlive(path, pingCount + 1)
                        });
                }

            })
    }
};

module.exports = qrsNotify;

// https://zeit.co/blog/async-and-await
function sleep(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}