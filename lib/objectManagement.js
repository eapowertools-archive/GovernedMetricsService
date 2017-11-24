var enigma = require('enigma.js');
var enigmaInstance = require('./enigmaInstance');
var fs = require('fs');
var Promise = require('bluebird');
var createDimension = require('./createDimension');
var createMeasure = require('./createMeasure');
var config = require('../config/config');
var logger = require('./logger');
var socketHelpoer = require("./socketHelper");

var manageObjects = {
    manageObjects: function (appRef, appId, allData, subjectAreas) {
        return new Promise(function (resolve, reject) {
            socketHelper.logMessage("debug", "gms", "Object Management requested on app" + appRef.name, __filename);
            var session = enigma.create(enigmaInstance(config, appId));
            var x = {};
            return session.open()
                .then(function (global) {
                    x.global = global;
                    return global.openDoc(appId, '', '', '', true)
                        .then(function (app) {
                            x.app = app;
                            return app.createSessionObject(objectListDef)
                                .then(function (sessionObject) {
                                    return sessionObject.getLayout()
                                })
                                .then(function (objectList) {
                                    let measureList = objectList.qMeasureList.qItems;
                                    let dimensionList = objectList.qDimensionList.qItems;

                                    let reducedData = allData.filter(filterMetrics(subjectAreas));
                                    let measureData = reducedData.filter(function (measure) {
                                        return measure[1].qText.toLowerCase() == "measure";
                                    })
                                    let dimensionData = reducedData.filter(function (dimension) {
                                        return dimension[1].qText.toLowerCase() == "dimension";
                                    })
                                    return {
                                        "measureList": measureList,
                                        "measureData": measureData,
                                        "dimensionList": dimensionList,
                                        "dimensionData": dimensionData,
                                        "reducedData": reducedData
                                    }
                                })
                                .then(function (arrayObject) {
                                    return Promise.map(arrayObject.reducedData, function (data) {
                                        let tags = createTags(data);
                                        if (data[1].qText.toLowerCase() == 'dimension') {
                                            let dimItem = arrayObject.dimensionList.filter(function (item) {
                                                return item.qInfo.qId === data[9].qText;
                                            })
                                            if (dimItem.length > 0) {
                                                return createDimension.updateDimension(appRef, x.app, data, tags)
                                            }
                                            return createDimension.createDimension(appRef, x.app, data, tags);
                                        }
                                        if (data[1].qText.toLowerCase() == 'measure') {
                                            let measureItem = arrayObject.measureList.filter(function (item) {
                                                return item.qInfo.qId === data[9].qText;
                                            })
                                            if (measureItem.length > 0) {
                                                return createMeasure.updateMeasure(appRef, x.app, data, tags)
                                            }
                                            return createMeasure.createMeasure(appRef, x.app, data, tags);
                                        }
                                    })
                                })
                        })
                        .then(function (resultArray) {
                            var createObjects = resultMetrics(resultArray);
                            var same = 0;
                            var created = 0;
                            var updated = 0;

                            if (createObjects.length == 0) {

                                socketHelper.logMessage("debug", "gms", "No new dimensions or measures created in app " + appRef.name, __filename);
                                return;
                            }
                            createObjects.forEach(function (item) {
                                switch (item) {
                                    case "SAME":
                                        same += 1;
                                    case "CREATED":
                                        created += 1;
                                    case "UPDATED":
                                        updated += 1;
                                }
                            });
                            socketHelper.logMessage("info", "gms", 'Result of object creation on app ' + appRef.name + ': ' +
                                'Not Changed: ' + same + "\r\nCreated: " +
                                created + "\r\nUpdated: " + updated, __filename);
                            socketHelper.logMessage("info", "gms", 'Please wait while the repo catches up, ownership changes have been applied, and metric publish is determined.', __filename);
                            return ('Done!');
                        })
                        .catch(function (error) {
                            return session.close()
                                .then(function () {
                                    socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                                    reject(error)
                                })
                        });
                })
                .then(function (done) {
                    return session.close()
                        .then(function () {
                            socketHelper.logMessage("debug", "gms", "Object Management complete on app " + appRef.name, __filename);
                            resolve("Object Management complete on app " + appRef.name);
                        })

                })
                .catch(function (error) {
                    return session.close()
                        .then(function () {
                            socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                            reject(error);
                        })

                });
        });

    }
};

module.exports = manageObjects;

function createTags(data) {
    var tags = [];

    tags.push("MasterItem");

    if (config.tagRestrict) {
        return tags;
    }

    if (data[4].qText !== undefined) {
        if (data[4].qText.length > 1) {
            var tagString = data[4].qText.split(";");
            tagString.forEach(function (tagValue) {
                tags.push(tagValue);
            });
        }
    }

    tags.push(data[3].qText);
    //tags.push(data[3].qText.toLowerCase() + '_' + data[0].qText);
    return tags;
}

var promiseWhile = Promise.method(function (condition, action) {
    if (!condition()) return;
    return action().then(promiseWhile.bind(null, condition, action));
});

function filterMetrics(subjectAreas) {
    return function (obj) {
        return subjectAreas.filter(function (subjectArea) {
            return subjectAreas.indexOf(obj[3].qText) > -1;
        }).length === subjectAreas.length;
    }
}

function resultMetrics(createObjects) {
    return createObjects.filter(function (object) {
        return object == "CREATED";
    });
}

const objectListDef = {
    "qInfo": {
        "qType": "ObjectList"
    },
    "qDimensionListDef": {
        "qType": "dimension",
        "qData": {
            "title": "/title",
            "tags": "/tags",
        }
    },
    "qMeasureListDef": {
        "qType": "measure",
        "qData": {
            "title": "/title",
            "tags": "/tags"
        }
    }
};