var enigma = require('enigma.js');
var enigmaInstance = require('./enigmaInstance');
var Promise = require('bluebird');
var config = require('../config/config');
var fs = require('fs');
var logger = require('./logger');
var socketHelper = require("./socketHelper");

var deleteMetrics = {
    deleteAllMasterItems: function (appId) {
        return new Promise(function (resolve, reject) {
                socketHelper.logMessage("debug", "gms", "Deleting all MasterItem dimensions and measures from app: " + appId, __filename);
                var stuff = {};
                stuff.appId = appId;
                var session = enigma.create(enigmaInstance(config, appId));
                session.open()
                    .then(function (global) {
                        stuff.global = global;
                        return global;
                    })
                    .then(function (global) {
                        return global.openDoc(appId, '', '', '', true);
                    })
                    .then(function (app) {
                        stuff.app = app;
                        return app.getAppLayout();
                    })
                    .then(function (appLayout) {
                        stuff.appRef = {
                            "name": appLayout.qTitle
                        };
                        return stuff.measureList = stuff.app.createSessionObject(deleteMetrics.measureListDef());
                    })
                    .then(function (obj) {

                        return obj.getLayout();
                    })
                    .then(function (layout) {

                        var items = layout.qMeasureList.qItems;
                        var mList = items.filter(filterMasterItems);

                        return Promise.map(mList, function (listItem) {
                            return stuff.app.destroyMeasure(listItem.qInfo.qId)
                                .then(function (success) {
                                    var measureInfo = listItem.qMeta.title + ':' + listItem.qInfo.qId;
                                    socketHelper.logMessage("debug", "gms", "Deleted " + measureInfo + " from app: " + appId, __filename);
                                    return listItem;
                                });
                        });
                    })
                    .then(function (measureArray) {
                        socketHelper.logMessage("debug", "gms", "Destroyed " + measureArray.length + " measures from " + stuff.appRef.name + " from app: " + appId, __filename);
                        socketHelper.logMessage("debug", "gms", "Waiting for notification service to inform that the repository is clean", __filename);
                        return;
                    })
                    .then(function () {
                        return stuff.dimensionList = stuff.app.createSessionObject(deleteMetrics.dimensionListDef());
                    })
                    .then(function (obj) {
                        return obj.getLayout();
                    })
                    .then(function (layout) {
                        var items = layout.qDimensionList.qItems;
                        var dList = items.filter(filterMasterItems);

                        return Promise.map(dList, function (listItem) {
                            return stuff.app.destroyDimension(listItem.qInfo.qId)
                                .then(function (success) {
                                    var dimInfo = listItem.qMeta.title + ':' + listItem.qInfo.qId;
                                    socketHelper.logMessage("debug", "gms", "Deleted " + dimInfo + " from app: " + appId, __filename);
                                    return listItem;
                                });
                        });
                    })
                    .then(function (dimensionArray) {
                        socketHelper.logMessage("debug", "gms", "Destroyed " + dimensionArray.length + " dimensions from " + stuff.appRef.name + " from app: " + appId, __filename);
                        socketHelper.logMessage("debug", "gms", "Waiting for notification service to inform that the repository is clean", __filename);
                        return;
                    })
                    .then(function () {
                        socketHelper.logMessage("debug", "gms", "Master Library items removed from app: " + appId, __filename);
                        var res = {
                            result: 'delete complete!'
                        };
                        return session.close()
                            .then(function () {
                                socketHelper.logMessage("debug", "gms", "Engine connection terminated", __filename);
                                resolve(res);
                            });
                    })
                    .catch(function (error) {
                        return session.close()
                            .then(function () {
                                socketHelper.logMessage("error", "gms", "Error with Enigma.js: " + JSON.stringify(error), __filename);
                                reject(new Error(error));
                            })

                    });
            })
            .catch(function (error) {
                socketHelper.logMessage("error", "gms", "Error with Config: " + JSON.stringify(error), __filename);
                reject(new Error(error));
            });
    },
    measureListDef: function () {
        var measureList = {
            qInfo: {
                qType: "MeasureList"
            },
            qMeasureListDef: {
                qType: "measure",
                qData: {
                    title: "/title",
                    tags: "/tags"
                }
            }
        };
        return measureList;
    },
    dimensionListDef: function () {
        var dimensionList = {
            qInfo: {
                qType: "DimensionList"
            },
            qDimensionListDef: {
                qType: "dimension",
                qData: {
                    title: "/title",
                    tags: "/tags"
                }
            }
        };
        return dimensionList;
    }
}

function filterMasterItems(items) {
    //console.log(items.qMeta.tags);
    if (items.qMeta.tags.indexOf("MasterItem") != -1) {
        //console.log('Found One!');
        return true;
    } else {
        //console.log('Not a MasterItem');
        return false;
    }
};

module.exports = deleteMetrics;


var promiseWhile = Promise.method(function (condition, action) {
    if (!condition()) return;
    return action().then(promiseWhile.bind(null, condition, action));
});