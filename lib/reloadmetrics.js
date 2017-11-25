var Promise = require('bluebird');
var qrsInteract = require('./qrsInstance');
var logger = require('./logger');
var socketHelper = require("./socketHelper");

var reloadMetrics = {

    reloadMetrics: function (app, taskName) {
        var currContentHash;
        return new Promise(function (resolve, reject) {
            socketHelper.logMessage("info", "gms", 'Starting task ' + taskName, __filename);

            var path = "/task/start/synchronous";
            path += "?name=" + taskName;
            return qrsInteract.Post(path, '', 'json')
                .then(function (result) {
                    var taskId = result.body.value;
                    if (typeof result.body == 'object') {
                        socketHelper.logMessage("info", "gms", 'Started task ' + taskName, __filename);

                        return progressCheck(taskId, function (error, result) {
                            //now that we are done, let's evaluate the result
                            if (error) {
                                socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                                reject(error);
                            } else {
                                socketHelper.logMessage("info", "gms", 'Task ' + taskName + " complete", __filename);

                                var path2 = "/executionresult";
                                path2 += "?filter=executionid eq " + taskId;
                                return qrsInteract.Get(path2)
                                    .then(function (reloadInfo) {
                                        socketHelper.logMessage("debug", "gms", 'Task Completed in ' + reloadInfo.body[0].duration + 'milliseconds with message ' + reloadInfo.body[0].details[reloadInfo.body[0].details.length - 1].message, __filename);

                                        resolve('Task Completed in ' + reloadInfo.body[0].duration + ' milliseconds with message ' + reloadInfo.body[0].details[reloadInfo.body[0].details.length - 1].message);
                                    })
                                    .catch(function (error) {
                                        socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                                        reject(error);
                                    });
                            }
                        });
                    } else {
                        socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                        reject(result);
                    }
                })
                .catch(function (error) {
                    socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                    reject(error);
                });
        });
    }
};

function progressCheck(id, callback) {
    //console.log(reload);
    var path = "/executionsession";
    path += "?filter=id eq " + id;

    return qrsInteract.Get(path)
        .then(function (reloadProgress) {
            if (reloadProgress.body === undefined || reloadProgress.body.length == 0) {
                return callback(null, 'Reload Complete');
            } else {
                var reloadStep = reloadProgress.body[0].executionResult.details.length;
                socketHelper.logMessage("debug", "gms", reloadProgress.body[0].executionResult.details[reloadStep - 1].message, __filename);

                return progressCheck(id, callback);
            }
        })
        .catch(function (error) {
            socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
            return callback(error);
        });
}



module.exports = reloadMetrics;