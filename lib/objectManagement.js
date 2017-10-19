var enigma = require('enigma.js');
var enigmaInstance = require('./enigmaInstance');
var fs = require('fs');
var Promise = require('bluebird');
var createDimension = require('./createDimension');
var createMeasure = require('./createMeasure');
var config = require('../config/config');
var logger = require('./logger');

var manageObjects = {
    manageObjects: function (appRef, appId, allData, subjectAreas) {
        return new Promise(function (resolve, reject) {
            logger.info("Beginning Object Management", {
                module: "objectManagement",
                app: appRef.name
            });
            var session = enigma.create(enigmaInstance(config));
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
                                logger.info("No new dimensions or measures created", {
                                    module: "objectManagement",
                                    app: appRef.name
                                });
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
                            logger.info('Result of object creation: ' +
                                'Not Changed: ' + same + "\r\nCreated: " +
                                created + "\r\nUpdated: " + updated, {
                                    module: "objectManagement",
                                    app: appRef.name
                                });
                            logger.info('Objects have been added to the repo!', {
                                module: "objectManagement",
                                app: appRef.name
                            });
                            logger.info('Please wait while the repo catches up, ownership changes have been applied, and metric publish is determined.', {
                                module: "objectManagement",
                                app: appRef.name
                            });
                            return ('Done!');
                        })
                        .catch(function (error) {
                            logger.error(error, {
                                module: "objectManagement",
                                app: appRef.name
                            });
                            reject(error)
                        });
                })
                .then(function (done) {
                    return session.close()
                        .then(function () {
                            logger.info(done, {
                                module: "objectManagement",
                                app: appRef.name
                            });
                            logger.info("Object Management Complete", {
                                module: "objectManagement",
                                app: appRef.name
                            });
                            resolve("object management complete");
                        })

                })
                .catch(function (error) {
                    return session.close()
                        .then(function () {
                            logger.error(error, {
                                module: "objectManagement",
                                app: appRef.name
                            });
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