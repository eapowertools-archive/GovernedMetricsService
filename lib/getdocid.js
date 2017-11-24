var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');
var logger = require('./logger');
var socketHelper = require("./socketHelper");

var getDocId = {
    getDocId: function (appName) {
        return new Promise(function (resolve, reject) {
            var path = "/app"
            path += "?filter=name eq '" + appName + "'";
            qrsInteract.Get(path)
                .then(function (result) {
                    socketHelper.logMessage("debug", "gms", appName + ' id:' + result.body[0].id, __filename);
                    resolve(result.body[0].id);
                })
                .catch(function (error) {
                    socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                    reject(new Error(error));
                });
        });
    },
    getAppReference: function (appName) {
        return new Promise(function (resolve, reject) {
            var path = "/app"
            path += "?filter=name eq '" + appName + "'";
            qrsInteract.Get(path)
                .then(function (result) {
                    socketHelper.logMessage("debug", "gms", appName + ' id:' + result.body[0].id, __filename);
                    resolve(result.body[0]);
                })
                .catch(function (error) {
                    socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                    reject(new Error(error));
                });
        })
    }
};

module.exports = getDocId;