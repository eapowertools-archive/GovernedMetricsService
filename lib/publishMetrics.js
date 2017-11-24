var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');
var logger = require('./logger');
var socketHelper = require("./socketHelper");

var publishMetrics = {
    publishMetrics: function (appInfo) {
        return new Promise(function (resolve, reject) {
            socketHelper.logMessage("debug", "gms", "Object Publish requested on app" + appInfo.name, __filename);
            var path = "/app/object";
            path += "?filter=tags.name eq 'gms' and (objectType eq 'dimension' or objectType eq 'measure') and published eq false and (app.published eq true and app.id eq " + appInfo.id + ")";
            socketHelper.logMessage("debug", "gms", "Searching published apps for dimensions and measures with the tag 'gms' in app " + appInfo.name, __filename);

            qrsInteract.Get(path)
                .then(function (appObjects) {
                    if (appObjects.body.length !== 0) {
                        return appObjects.body.map(function (appObject) {
                            return appObject.id;
                        });
                    } else {
                        socketHelper.logMessage("debug", "gms", "Metrics have been added to an unpublished app, no publish required on app " + appInfo.name, __filename);
                        resolve("Metrics have been added to an unpublished app, no publish required on app " + appInfo.name);
                    }
                })
                .then(function (arrObjects) {
                    if (arrObjects == undefined) {
                        return;
                    }
                    return Promise.all(arrObjects.map(function (appObjectId) {
                            var putPath = "/app/object/" + appObjectId + "/publish";
                            socketHelper.logMessage("debug", "gms", "Publishing appObject " + appObjectId + " in app " + appInfo.name, __filename);
                            var body = "";
                            return qrsInteract.Put(putPath, body)
                                .then(function (sCode) {
                                    if (sCode.statusCode == 200) {
                                        socketHelper.logMessage("debug", "gms", "Published appObject " + appObjectId + " in app " + appInfo.name, __filename);
                                        return 1;
                                    } else {
                                        socketHelper.logMessage("debug", "gms", "Failed to publish appObject " + appObjectId + " in app " + appInfo.name, __filename);
                                        return 0;
                                    }
                                })
                                .catch(function (error) {
                                    socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                                    reject(error);
                                });
                        }))
                        .then(function (resultArray) {
                            var successCount = 0;
                            resultArray.forEach(function (item) {
                                successCount += item;
                            });
                            socketHelper.logMessage("debug", "gms", "Published " + successCount + " of " + resultArray.length + "App Objects in app " + appInfo.name, __filename);
                            resolve("Published " + successCount + " of " + resultArray.length + "App Objects in app " + appInfo.name);
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
    }
};

module.exports = publishMetrics;

function listDef() {
    var listDef = {
        qInfo: {
            qType: "listDef"
        },
        qMeasureListDef: {
            qType: "measure",
            qData: {
                title: "/title",
                tags: "/tags"
            }
        },
        qDimensionListDef: {
            qType: "dimension",
            qData: {
                title: "/title",
                tags: "/tags"
            }
        }
    };
    return listDef;
}

function filterMasterItems(items) {
    //console.log(items.qMeta.tags);
    if (items.qMeta.gms === true && items.qMeta.published === false) {
        //console.log('Found One!');
        return true;
    } else {
        //console.log('Not a MasterItem');
        return false;
    }
};