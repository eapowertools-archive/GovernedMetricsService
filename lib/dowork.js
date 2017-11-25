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
var socketHelper = require("./socketHelper");
var _ = require("lodash");

var doWork = {
    getDoc: function (body) {
        return new Promise(function (resolve, reject) {
            socketHelper.logMessage("debug", "gms", "Calling getDoc", __filename);
            getdoc.getDocId(body)
                .then(function (doc) {
                    socketHelper.logMessage("debug", "gms", "getDoc success", __filename);
                    resolve(doc);
                })
                .catch(function (error) {
                    socketHelper.logMessage("error", "gms", "getDoc failed: " + JSON.stringify(error), __filename);
                    reject(new Error(error));
                });
        });
    },
    getDocList: function () {
        return new Promise(function (resolve, reject) {
            return qrsInteract.Get("/app")
                .then(function (result) {
                    var resultArray = [];
                    result.body.forEach(function (app) {
                        resultArray.push({
                            id: app.id,
                            name: app.name
                        });
                    });
                    return resultArray;
                })
                .then(function (resultArray) {
                    resolve(resultArray);
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    },
    getGMAApps: function () {
        return new Promise(function (resolve, reject) {
            return qrsInteract.Get("/app?filter=tags.name eq 'gma'")
                .then(function (result) {
                    var resultArray = [];
                    result.body.forEach(function (app) {
                        resultArray.push({
                            id: app.id,
                            name: app.name,
                            default: function () {
                                if (app.customProperties.length > 0) {
                                    app.customProperties.forEach(function (cp) {
                                        if (cp.definition.name == "GMA_AppDefault") {
                                            return cp.value
                                        }
                                    })
                                }
                                return "false";
                            }
                        });
                    });
                    return resultArray;
                })
                .then(function (resultArray) {
                    resultArray = _.sortBy(resultArray, [function (o) {
                        return o.default
                    }]).reverse()
                    resolve(resultArray);
                })
                .catch(function (error) {
                    reject(error);
                });
        })
    },
    getObjectList: function (appId) {
        return new Promise(function (resolve, reject) {
            return qrsInteract.Get("/app/object/full?filter=(objectType eq 'dimension' or objectType eq 'measure') and app.id eq " + appId)
                .then(function (result) {
                    var resultArray = [];
                    result.body.forEach(function (object) {
                        resultArray.push({
                            id: object.engineObjectId,
                            uid: object.engineObjectId,
                            metricName: object.name,
                            metricDescription: object.description,
                            metricType: object.objectType,
                            gmsTag: object.tags
                        });
                    });
                    return resultArray;
                })
                .then(function (resultArray) {
                    resolve(resultArray);
                })
                .catch(function (error) {
                    reject(error);
                })
        })
    },
    deleteFromApp: function (appname) {
        return new Promise(function (resolve, reject) {
            socketHelper.logMessage("debug", "gms", "Calling deleteFromApp", __filename);
            var message;
            var x = {};

            return getdoc.getDocId(appname.appname)
                .then(function (doc) {
                    return deleteMetrics.deleteAllMasterItems(doc)
                        .then(function (result) {
                            var res = {
                                result: result.result
                            };
                            socketHelper.logMessage("debug", "gms", "deleteFromApp success", __filename);
                            resolve(res);
                        })
                        .catch(function (error) {
                            socketHelper.logMessage("error", "gms", "deleteFromApp failed: " + JSON.stringify(error), __filename);
                            reject(error);
                        });
                })
                .catch(function (error) {
                    socketHelper.logMessage("error", "gms", "deleteFromApp failed: " + JSON.stringify(error), __filename);
                    reject(new Error(error));
                });
        });
    },
    addAll: function () {
        socketHelper.logMessage("debug", "gms", "addAll called, forwarding to updateAll method", __filename);
        doWork.updateAll();
    },
    updateAll: function () {
        return new Promise(function (resolve, reject) {
            socketHelper.logMessage("debug", "gms", "Checking for existence of gms tag in the qrs", __filename);
            var tagPath = "/tag?filter=name eq 'gms'";
            return qrsInteract.Get(tagPath)
                .then(function (tags) {
                    if (tags.body.length == 0) {
                        socketHelper.logMessage("debug", "gms", "Tag does not exist, shutting down run. Create a tag labeled gms in the QMC.  The tag needs to be lowercase. Read more in the docs http://eapowertools.github.io/GovernedMetricsService/user-guide/qsconfig/#step-4-create-a-gms-tag-to-mark-dimensions-and-measures", __filename);
                        reject(new Error("Tag does not exist, shutting down run. Create a tag labeled gms in the QMC.  The tag needs to be lowercase. Read more in the docs http://eapowertools.github.io/GovernedMetricsService/user-guide/qsconfig/#step-4-create-a-gms-tag-to-mark-dimensions-and-measures"));
                    } else {
                        var propExistPath = "/custompropertydefinition";
                        propExistPath += "?filter=name eq '" + config.gms.customPropName + "'";
                        return qrsInteract.Get(propExistPath)
                            .then(function (customProp) {
                                if (customProp.body !== undefined || customProp.body.length != 0) {
                                    socketHelper.logMessage("debug", "gms", "Found " + customProp.body[0].name + " in list of custom properties", __filename);
                                    var x = {};
                                    var y = {};
                                    return gethypercube.getMetricsTable()
                                        .then(function (matrix) {
                                            return y.matrix = matrix;
                                        })
                                        .then(function (matrix) {

                                            var subjectAreaPath = "/custompropertydefinition?filter=name eq '" + config.gms.customPropName + "'";

                                            var measures = qlikExpressionsParser.getTypeFromMatrix(matrix, 'measure');
                                            var dimensions = qlikExpressionsParser.getTypeFromMatrix(matrix, 'dimension');

                                            return qrsInteract.Get(subjectAreaPath)
                                                .then(function (subjectAreas) {
                                                    socketHelper.logMessage("debug", "gms", "Retrieved choice values: " + JSON.stringify(subjectAreas.body[0].choiceValues), __filename);

                                                    //so now I have subject areas, but I want the apps so I can loop through the apps that have subject areas
                                                    //and at one time update all the metrics for that app based on values applied
                                                    //So I want apps that have the custom prop applied with values identified first, then match subjectarea
                                                    //with values applied and run through.
                                                    var appCount = 0;
                                                    var appCheckPath = "/app/full"
                                                    appCheckPath += "?filter=customProperties.definition.name eq '";
                                                    appCheckPath += config.gms.customPropName + "' and customProperties.value ne null";
                                                    socketHelper.logMessage("debug", "gms", 'Getting list of apps that have ' + config.gms.customPropName + ' applied', __filename);

                                                    return qrsInteract.Get(appCheckPath)
                                                        .then(function (appRefList) {
                                                            return Promise.each(appRefList.body, function (appRef) {
                                                                var startTime = new Date();
                                                                socketHelper.logMessage("debug", "gms", "Updating app " + appRef.name, __filename);
                                                                socketHelper.logMessage("debug", "gms", "Fetching fields from " + appRef.name, __filename);

                                                                // we fetch the fields and variables of the app if the switch is set to true
                                                                return ((config.gms.fieldCheck) ? getAppMetadata(appRef.id) : Promise.resolve())
                                                                    .then(function (appMetadata) {
                                                                        socketHelper.logMessage("debug", "gms", 'Updating app:' + appRef.name + ' with id:' + appRef.id + 'currently owned by ' + appRef.owner.userDirectory + '\\' + appRef.owner.userId, __filename);
                                                                        // the matrix pushed to the app depends on the fieldCheck switch
                                                                        var updateMatrix = (config.gms.fieldCheck) ?
                                                                            qlikExpressionsParser.getFilteredMatrix(measures, dimensions, appMetadata, y.matrix) :
                                                                            y.matrix;

                                                                        return updateMetrics.updateMetrics(appRef, updateMatrix)
                                                                            .then(function (outcome) {

                                                                                socketHelper.logMessage("debug", "gms", outcome.result + '::' + appRef.name, __filename);

                                                                                var endTime = new Date();

                                                                                socketHelper.logMessage("debug", "gms", 'SUCCESS: Process took ' + (endTime.getTime() - startTime.getTime()) + " milliseconds", __filename);
                                                                                return outcome;
                                                                            })
                                                                            .catch(function (error) {
                                                                                socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                                                                                reject(error);
                                                                            });
                                                                    })
                                                                    .catch(function (error) {
                                                                        socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);

                                                                        reject(error);
                                                                    });
                                                            });
                                                        })
                                                        .then(function () {
                                                            socketHelper.logMessage("debug", "gms", "All apps updated", __filename);

                                                            var res = {
                                                                result: 'All apps processed.'
                                                            };

                                                            resolve(res);
                                                        })
                                                        .catch(function (error) {
                                                            socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);

                                                            reject(error);
                                                        });
                                                })
                                                .catch(function (error) {
                                                    socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);

                                                    reject(error);
                                                });
                                        })
                                        .catch(function (error) {
                                            socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);

                                            reject(error);
                                        });
                                }
                            })
                            .catch(function (error) {
                                var rejection = {
                                    message: 'No custom property named ' + config.gms.customPropName,
                                    customProperty: config.gms.customPropName
                                };

                                socketHelper.logMessage("error", "gms", JSON.stringify(rejection), __filename);

                                reject(JSON.stringify(rejection));
                            });
                    }
                })
                .catch(function (error) {
                    socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);

                    reject(error);
                });
        });
    },
    update: function (body) {
        return new Promise(function (resolve, reject) {

            socketHelper.logMessage("debug", "gms", 'Checking for existence of gms tag in the qrs', __filename);

            var tagPath = "/tag?filter=name eq 'gms'";
            return qrsInteract.Get(tagPath)
                .then(function (tags) {
                    if (tags.body.length == 0) {
                        reject(new Error("Tag does not exist, shutting down run. Create a tag labeled gms in the QMC.  The tag needs to be lowercase. Read more in the docs http://eapowertools.github.io/GovernedMetricsService/user-guide/qsconfig/#step-4-create-a-gms-tag-to-mark-dimensions-and-measures"));
                    } else {
                        var propExistPath = "/custompropertydefinition";
                        propExistPath += "?filter=name eq '" + config.gms.customPropName + "'";
                        return qrsInteract.Get(propExistPath)
                            .then(function (customProp) {
                                if (customProp.body == undefined || customProp.body.length == 0) {
                                    reject(new Error("Custom property " + config.gms.customPropName + " does not exist, shutting down run.  Create a custom property labeled " + config.gms.customPropName + " in the QMC.  Read more in the docs http://eapowertools.github.io/GovernedMetricsService/user-guide/qmc/#add-and-configure-the-managedmasteritems-custom-property"));
                                } else {
                                    socketHelper.logMessage("debug", "gms", 'Found ' + customProp.body[0].name + ' in list of custom properties', __filename);

                                    var x = {};
                                    var y = {};


                                    return gethypercube.getMetricsTable()
                                        .then(function (matrix) {
                                            return y.matrix = matrix;
                                        })
                                        .then(function (matrix) {

                                            var measures = qlikExpressionsParser.getTypeFromMatrix(matrix, 'measure');
                                            var dimensions = qlikExpressionsParser.getTypeFromMatrix(matrix, 'dimension');

                                            var appCount = 0;
                                            var appCheckPath;

                                            if (body.hasOwnProperty("appId")) {
                                                appCheckPath = "/app/full?filter=id eq " + body.appId;
                                                socketHelper.logMessage("debug", "gms", "Retrieving app info for " + body.appId, __filename);

                                            } else if (body.hasOwnProperty("appName")) {
                                                appCheckPath = "/app/full?filter=name eq '" + body.appName + "'";
                                                socketHelper.logMessage("debug", "gms", "Retrieving app info for " + body.appName, __filename);
                                            } else {
                                                appCheckPath = "/app/full"
                                                appCheckPath += "?filter=customProperties.definition.name eq '";
                                                appCheckPath += config.gms.customPropName + "' and customProperties.value ne null";
                                                socketHelper.logMessage("debug", "gms", 'Getting list of apps that have ' + config.gms.customPropName + ' applied', __filename);
                                            }

                                            return qrsInteract.Get(appCheckPath)
                                                .then(function (appRefList) {
                                                    return Promise.each(appRefList.body, function (appRef) {
                                                        var startTime = new Date();

                                                        socketHelper.logMessage("debug", "gms", 'Updating app ' + appRef.name, __filename);
                                                        socketHelper.logMessage("debug", "gms", 'Fetching the fields of ' + appRef.name, __filename);

                                                        // we fetch the fields and variables of the app if the switch is set to true
                                                        return ((config.gms.fieldCheck) ? getAppMetadata(appRef.id) : Promise.resolve())
                                                            .then(function (appMetadata) {

                                                                socketHelper.logMessage("debug", "gms", 'Updating app:' + appRef.name + ' with id:' + appRef.id + 'currently owned by ' + appRef.owner.userDirectory + '\\' + appRef.owner.userId, __filename);

                                                                // the matrix pushed to the app depends on the fieldCheck switch
                                                                var updateMatrix = (config.gms.fieldCheck) ?
                                                                    qlikExpressionsParser.getFilteredMatrix(measures, dimensions, appMetadata, y.matrix) :
                                                                    y.matrix;

                                                                return updateMetrics.updateMetrics(appRef, updateMatrix)
                                                                    .then(function (outcome) {

                                                                        socketHelper.logMessage("debug", "gms", outcome.result + '::' + appRef.name, __filename);
                                                                        var endTime = new Date();
                                                                        socketHelper.logMessage("debug", "gms", 'SUCCESS: Process took ' + (endTime.getTime() - startTime.getTime()) + " milliseconds", __filename);

                                                                        return outcome;
                                                                    })
                                                                    .catch(function (error) {
                                                                        socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                                                                        reject(error);
                                                                    });
                                                            })
                                                            .catch(function (error) {
                                                                socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                                                                reject(error);
                                                            });
                                                    });
                                                })
                                                .then(function () {
                                                    socketHelper.logMessage("debug", "gms", "All apps updated.", __filename);

                                                    var res = {
                                                        result: 'All apps processed.'
                                                    };

                                                    resolve(res);
                                                })
                                                .catch(function (error) {
                                                    socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                                                    reject(error);
                                                });
                                        })
                                        .catch(function (error) {
                                            socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                                            reject(error);
                                        });
                                }
                            })
                            .catch(function (error) {
                                socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                                reject(error);
                            })
                    }
                })
                .catch(function (error) {
                    socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                    reject(error);
                });
        });
    },
    reloadMetricsApp: function () {
        return new Promise(function (resolve, reject) {
            var x = {};
            return getdoc.getAppReference(config.gms.appName)
                .then(function (app) {
                    x.app = app;
                    return reloadMetrics.reloadMetrics(x.app, config.gms.taskName)
                        .then(function (response) {
                            socketHelper.logMessage("debug", "gms", JSON.stringify(response), __filename);
                            var res = {
                                complete: true,
                                result: response
                            };
                            resolve(res);
                        })
                        .catch(function (error) {
                            socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                            reject(new Error(error));
                        });

                })
                .catch(function (error) {
                    socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                    reject(error);
                });
        });
    },
    getAllMdi: function () {
        return new Promise(function (resolve, reject) {
            // Step 1: Get an array of Qlik Sense apps with the custom property
            // "MetricsLibraryInput"
            var appCheckPath = "/app/full"
            appCheckPath += "?filter=customProperties.definition.name eq '";
            appCheckPath += config.gms.masterLibrarySourcePropName + "' and customProperties.value ne null";
            qrsInteract.Get(appCheckPath)
                .then(function (appRefList) {
                    return appRefList.body
                })
                .then(function (appList) {
                    return appList.map(function (app) {
                        return {
                            "id": app.id,
                            "name": app.name,
                            "subjectArea": getAppMasterLibrarySource(app, config.gms.masterLibrarySourcePropName)
                        };
                    })
                })
                .then(function (appArray) {
                    Promise.map(appArray, function (app) {
                            return getMdis.getMdis(app.id, app.subjectArea[0])
                        })
                        .then(function (result) {
                            var mdiList = [].concat.apply([], result);
                            resolve(mdiList)
                        })
                        .catch(function (error) {
                            socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                            reject(error);
                        });
                })
                .catch(function (error) {
                    socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                    reject(error);
                })
        });
    }
};

module.exports = doWork;

function getAppMasterLibrarySource(appRef, customProp) {
    var result = appRef.customProperties.filter(function (item) {
        return item.definition.name == customProp;
    })

    var values = result.map(function (item) {
        return item.value
    });
    return values;
}