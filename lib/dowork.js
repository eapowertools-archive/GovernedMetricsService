var Promise = require('bluebird')
var config = require('../config/config');
var getdoc = require('./getdocid');
var gethypercube = require('./getmetricshypercube');
var qlikExpressionsParser = require('./qlikExpressionsParser');
var getAppMetadata = require('./getAppMetadata');
var updateMetrics = require('./updatemetrics');
var qrsInteract = require('./qrsInstance');
var deleteMetrics = require('./deletemetrics');
var reloadMetrics = require('./reloadmetrics');
var getMdis = require('./getMdis');
var logger = require('./logger');

var doWork = {
    getDoc: function(body) {
        return new Promise(function(resolve, reject) {
            logger.debug('Calling getDoc', { module: 'doWork' });
            getdoc.getDocId(body)
                .then(function(doc) {
                    logger.debug('getDoc success', { module: 'doWork' });
                    resolve(doc);
                })
                .catch(function(error) {
                    logger.error('getDoc failure::' + error, { module: 'doWork' });
                    reject(new Error(error));
                });
        });
    },
    getDocList: function() {
        return new Promise(function(resolve, reject) {
            return qrsInteract.Get("/app")
                .then(function(result) {
                    var resultArray = [];
                    result.body.forEach(function(app) {
                        resultArray.push({ id: app.id, name: app.name });
                    });
                    return resultArray;
                })
                .then(function(resultArray) {
                    resolve(resultArray);
                })
                .catch(function(error) {
                    reject(error);
                });
        });
    },
    getObjectList: function(appId) {
        return new Promise(function(resolve, reject) {
            return qrsInteract.Get("/app/object/full?filter=(objectType eq 'dimension' or objectType eq 'measure') and app.id eq " + appId)
                .then(function(result) {
                    var resultArray = [];
                    result.body.forEach(function(object) {
                        resultArray.push({ id: object.engineObjectId, uid: object.engineObjectId, metricName: object.name, metricDescription: object.description, metricType: object.objectType, gmsTag: object.tags });
                    });
                    return resultArray;
                })
                .then(function(resultArray) {
                    resolve(resultArray);
                })
                .catch(function(error) {
                    reject(error);
                })
        })
    },
    deleteFromApp: function(appname) {
        return new Promise(function(resolve, reject) {
            logger.info('deleteFromApp::Calling deleteFromApp', { module: 'doWork' });
            var message;
            var x = {};

            return getdoc.getDocId(appname.appname)
                .then(function(doc) {
                    return deleteMetrics.deleteAllMasterItems(doc)
                        .then(function(result) {
                            var res = {
                                result: result.result
                            };
                            //result.engine.connection.ws.terminate();
                            logger.info('deleteFromApp success', { module: 'doWork' });
                            resolve(res);
                        })
                        .catch(function(error) {
                            logger.error('deleteFromApp failure::' + JSON.stringify(error), { module: 'doWork' });
                            reject(error);
                        });
                })
                .catch(function(error) {
                    logger.error('deleteFromApp failure::' + error, { module: 'doWork' });
                    reject(new Error(error));
                });
        });
    },
    addAll: function() {
        logger.info('Calling addAll, which forwards to updateAll', { module: 'doWork' });
        doWork.updateAll();
    },
    updateAll: function() {
        return new Promise(function(resolve, reject) {

            logger.info('Checking for existence of gms tag in the qrs', { module: 'doWork', method: 'updateMetrics' });
            var tagPath = "/tag?filter=name eq 'gms'";
            return qrsInteract.Get(tagPath)
                .then(function(tags) {
                    if (tags.body.length == 0) {
                        reject(new Error("Tag does not exist, shutting down run. Create a tag labeled gms in the QMC.  The tag needs to be lowercase. Read more in the docs http://eapowertools.github.io/GovernedMetricsService/user-guide/qsconfig/#step-4-create-a-gms-tag-to-mark-dimensions-and-measures"));
                    } else {
                        var propExistPath = "/custompropertydefinition";
                        propExistPath += "?filter=name eq '" + config.gms.customPropName + "'";
                        return qrsInteract.Get(propExistPath)
                            .then(function(customProp) {
                                if (customProp.body !== undefined || customProp.body.length != 0) {
                                    logger.info('Found ' + customProp.body[0].name + ' in list of custom properties', { module: 'doWork' });
                                    var x = {};

                                    var y = {};
                                    logger.debug('getMetricsTable', { module: 'doWork' });
                                    return gethypercube.getMetricsTable()
                                        .then(function(matrix) {
                                            return y.matrix = matrix;
                                        })
                                        .then(function(matrix) {
                                            logger.debug('getSubjectAreas', { module: 'doWork' });

                                            var subjectAreaPath = "/custompropertydefinition?filter=name eq '" + config.gms.customPropName + "'";

                                            var measures = qlikExpressionsParser.getTypeFromMatrix(matrix, 'measure');
                                            var dimensions = qlikExpressionsParser.getTypeFromMatrix(matrix, 'dimension');

                                            return qrsInteract.Get(subjectAreaPath)
                                                .then(function(subjectAreas) {
                                                    logger.debug('subjectAreas:' + JSON.stringify(subjectAreas.body[0].choiceValues), { module: 'doWork' });
                                                    console.log('array length: ' + subjectAreas.body[0].choiceValues.length)
                                                        //so now I have subject areas, but I want the apps so I can loop through the apps that have subject areas
                                                        //and at one time update all the metrics for that app based on values applied
                                                        //So I want apps that have the custom prop applied with values identified first, then match subjectarea
                                                        //with values applied and run through.
                                                    var appCount = 0;
                                                    var appCheckPath = "/app/full"
                                                    appCheckPath += "?filter=customProperties.definition.name eq '";
                                                    appCheckPath += config.gms.customPropName + "' and customProperties.value ne null";
                                                    logger.debug('Getting list of apps that have ' + config.gms.customPropName + ' applied', { module: 'doWork', method: 'updateAll' });
                                                    return qrsInteract.Get(appCheckPath)
                                                        .then(function(appRefList) {
                                                            return Promise.each(appRefList.body, function(appRef) {
                                                                var startTime = new Date();

                                                                logger.info('Updating app ' + appRef.name, { method: 'doWork' });
                                                                logger.info('Fetching the fields of ' + appRef.id, { module: 'doWork', method: 'updateAll', app: appRef.name });

                                                                return getAppMetadata(appRef.id).then(function(appMetadata){

                                                                    logger.info('Updating app:' + appRef.name + ' with id:' + appRef.id + 'currently owned by ' +
                                                                        appRef.owner.userDirectory + '\\' + appRef.owner.userId, { module: 'doWork', method: 'updateAll', app: appRef.name });

                                                                    // get the list of measures and dimensions that will be pushed into the application.
                                                                    // a measure or a dimension is pushed into an app if all the fields it needs to be
                                                                    // computed are present in the app
                                                                    var computableMeasures = qlikExpressionsParser.getComputableMeasures(measures, appMetadata);
                                                                    var computableDimensions = qlikExpressionsParser.getComputableDimensions(dimensions, appMetadata);

                                                                    var measuresFilteredMatrix = computableMeasures.map(function(o){ return y.matrix[o.position] });
                                                                    var dimensionsFilteredMatrix = computableDimensions.map(function(o){ return y.matrix[o.position] });
                                                                    var filteredMatrix = measuresFilteredMatrix.concat(dimensionsFilteredMatrix);

                                                                    return updateMetrics.updateMetrics(appRef, filteredMatrix)
                                                                        .then(function(outcome) {

                                                                             logger.info('' + outcome.result + '::' + appRef.name, { module: 'doWork', method: 'updateAll', app: appRef.name });
                                                                            var endTime = new Date();
                                                                            logger.info('SUCCESS: Process took ' + (endTime.getTime() - startTime.getTime()) + " milliseconds", { module: 'doWork', method: 'updateAll', app: appRef.name })
                                                                            return outcome;
                                                                        })
                                                                        .catch(function(error) {
                                                                            logger.error('' + error, { module: 'doWork', method: 'updateAll', app: appRef.name });
                                                                            reject(error);
                                                                        });
                                                                })
                                                                .catch(function(error) {
                                                                    logger.error('' + error, { module: 'doWork', method: 'updateAll', app: appRef.name });
                                                                    reject(error);
                                                                });
                                                            });
                                                        })
                                                        .then(function() {
                                                            logger.info('All apps updated.', { module: 'doWork', method: 'updateAll' });
                                                            var res = {
                                                                result: 'All apps processed.'
                                                            };

                                                            resolve(res);
                                                        })
                                                        .catch(function(error) {
                                                            logger.error(error, { module: 'doWork', method: 'updateAll' });
                                                            reject(error);
                                                        });
                                                })
                                                .catch(function(error) {
                                                    logger.error('getSubjectAreas::' + error, { module: 'doWork', method: 'updateAll' });
                                                    reject(error);
                                                });
                                            })
                                        .catch(function(error) {
                                            logger.error('getMetricsTable::' + error, { module: 'doWork', method: 'updateAll' });
                                            reject(error);
                                        });
                                }
                            })
                            .catch(function(error) {
                                var rejection = {
                                    message: 'No custom property named ' + config.gms.customPropName,
                                    customProperty: config.gms.customPropName
                                };
                                logger.error(JSON.stringify(rejection), { module: 'doWork', method: 'updateAll' });
                                reject(JSON.stringify(rejection));
                            });
                    }
                })
                .catch(function(error) {
                    logger.error(JSON.stringify(error), { module: 'doWork', method: 'updateAll' });
                    reject(error);
                });
        });
    },
    reloadMetricsApp: function() {
        return new Promise(function(resolve, reject) {
            var x = {};
            return getdoc.getAppReference(config.gms.appName)
                .then(function(app) {
                    x.app = app;
                    logger.debug('reloadMetricsApp::reloadMetrics', { module: 'doWork' });
                    return reloadMetrics.reloadMetrics(x.app, config.gms.taskName)
                        .then(function(response) {
                            logger.debug('reloadMetricsApp success::' + response, { module: 'doWork' });
                            var res = {
                                complete: true,
                                result: response
                            };
                            resolve(res);
                        })
                        .catch(function(error) {
                            logger.error('reloadMetricsApp::reloadMetrics::' + error, { module: 'doWork' });
                            reject(new Error(error));
                        });

                })
                .catch(function(error) {
                    logger.error('reloadMetricsApp::getAppReference::' + JSON.stringify(error), { module: 'doWork' });
                });
        });
    },
    getAllMdi: function() {
        return new Promise(function(resolve, reject) {
            // Step 1: Get an array of Qlik Sense apps with the custom property
            // "MetricsLibraryInput"
            var appCheckPath = "/app/full"
            appCheckPath += "?filter=customProperties.definition.name eq '";
            appCheckPath += config.gms.masterLibrarySourcePropName + "' and customProperties.value ne null";
            qrsInteract.Get(appCheckPath)
                .then(function(appRefList) {
                    return appRefList.body
                })
                .then(function(appList) {
                    return appList.map(function(app) {
                        return {
                            "id": app.id,
                            "name": app.name,
                            "subjectArea": getAppMasterLibrarySource(app, config.gms.masterLibrarySourcePropName)
                        };
                    })
                })
                .then(function(appArray) {
                    Promise.map(appArray, function(app) {
                            return getMdis.getMdis(app.id, app.subjectArea[0])
                        })
                        .then(function(result) {
                            var mdiList = [].concat.apply([], result);
                            resolve(mdiList)
                        })
                        .catch(function(error) {
                            logger.error('getAllMdi failure::' + error, { module: 'doWork' });
                            reject(error);
                        });
                })
                .catch(function(error) {
                    logger.error('qrsinteract failure::' + error, { module: 'doWork' });
                    reject(error);
                })
        });
    }
};

module.exports = doWork;

function getAppMasterLibrarySource(appRef, customProp) {
    var result = appRef.customProperties.filter(function(item) {
        return item.definition.name == customProp;
    })

    var values = result.map(function(item) {
        return item.value
    });
    return values;
}
