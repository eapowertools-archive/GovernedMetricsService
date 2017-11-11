var Promise = require('bluebird');
var qrsInteract = require('./qrsInstance');
var appDataSegment = require('./getAppDataSegment');
var logger = require('./logger');

var reloadMetrics = {

    reloadMetrics: function (app, taskName) {
        var currContentHash;
        return new Promise(function (resolve, reject) {

            // return appDataSegment.getAppDataSegment(app)
            // .then(function(result)
            // {
            // 	currentContentHash = result.contentHash;
            logger.info('reloadMetrics::Starting Task::' + taskName, {
                module: 'reloadmetrics'
            });
            var path = "/task/start/synchronous";
            path += "?name=" + taskName;
            logger.debug('reloadMetrics::PATH::' + path, {
                module: 'reloadmetrics'
            });
            return qrsInteract.Post(path, '', 'json')
                .then(function (result) {
                    var taskId = result.body.value;
                    if (typeof result.body == 'object') {
                        logger.info('reloadMetrics::Task Started::' + taskName, {
                            module: 'reloadmetrics'
                        });
                        return progressCheck(taskId, function (error, result) {
                            //now that we are done, let's evaluate the result
                            if (error) {
                                logger.error('reloadMetrics::progressCheck::' + error, {
                                    module: 'reloadmetrics'
                                });
                                reject(error);
                            } else {
                                logger.info('reloadMetrics::Task Complete::' + taskName, {
                                    module: 'reloadmetrics'
                                });
                                var path2 = "/executionresult";
                                path2 += "?filter=executionid eq " + taskId;
                                logger.debug('reloadMetrics::PATH::' + path2, {
                                    module: 'reloadmetrics'
                                });
                                return qrsInteract.Get(path2)
                                    .then(function (reloadInfo) {

                                        logger.info('reloadMetrics::Task Completed in ' + reloadInfo.body[0].duration + 'milliseconds', {
                                            module: 'reloadmetrics'
                                        });
                                        logger.info('reloadMetrics::Final Task Message: ' + reloadInfo.body[0].details[reloadInfo.body[0].details.length - 1].message, {
                                            module: 'reloadmetrics'
                                        })

                                        resolve('Task Completed in ' + reloadInfo.body[0].duration + ' milliseconds with message ' + reloadInfo.body[0].details[reloadInfo.body[0].details.length - 1].message);
                                    })
                                    .catch(function (error) {
                                        logger.error('reloadMetrics::Task Failure::' + error, {
                                            module: 'reloadmetrics'
                                        });
                                        reject(error);
                                    });
                            }
                        });
                    } else {
                        logger.error('reloadMetrics::' + JSON.stringify(result.body), {
                            module: 'reloadmetrics'
                        });
                        reject(result);
                    }
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    }
};

function progressCheck(id, callback) {
    //console.log(reload);
    var path = "/executionsession";
    path += "?filter=id eq " + id;
    logger.debug('progressCheck::PATH::' + path, {
        module: 'reloadmetrics'
    });
    return qrsInteract.Get(path)
        .then(function (reloadProgress) {
            if (reloadProgress.body === undefined || reloadProgress.body.length == 0) {
                logger.info('reloadMetrics::progressCheck::Task Complete', {
                    module: 'reloadmetrics'
                });
                return callback(null, 'Reload Complete');
            } else {
                var reloadStep = reloadProgress.body[0].executionResult.details.length;
                logger.debug('reloadMetrics::progressCheck::' + reloadProgress.body[0].executionResult.details[reloadStep - 1].message, {
                    module: 'reloadmetrics'
                });
                return progressCheck(id, callback);
            }
        })
        .catch(function (error) {
            logger.error('reloadMetrics::progressCheck::' + error, {
                module: 'reloadmetrics'
            });
            return callback(error);
        });
}



module.exports = reloadMetrics;