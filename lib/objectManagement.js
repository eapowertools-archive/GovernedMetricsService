var qsocks = require('qsocks');
var qsocksInstance = require('./qsocksInstance');
var fs = require('fs');
var Promise = require('bluebird');
var createDimension = require('./createDimension');
var createMeasure = require('./createMeasure');
var config = require('../config/config');
var logger = require('./logger');

var manageObjects = {
    manageObjects: function(appRef, appId, allData, subjectAreas) {
        return new Promise(function(resolve, reject) {
            logger.info("Beginning Object Management", { module: "objectManagement", app: appRef.name });
            var app2Connect = qsocksInstance(appId);
            var x = {};
            qsocks.Connect(app2Connect)
                .then(function(global) {
                    x.global = global;
                    return global.openDoc(appId, '', '', '', true)
                        .then(function(app) {
                            x.app = app;
                            //var reducedData = data;
                            var reducedData = allData.filter(filterMetrics(subjectAreas));
                            return reducedData;
                        })
                        .then(function(reducedData) {
                            return Promise.map(reducedData, function(data) {
                                var tags = createTags(data);
                                //console.log(objId);
                                if (data[1].qText.toLowerCase() == 'dimension') {
                                    return createDimension.createDimension(appRef, x.app, data, tags);
                                }
                                if (data[1].qText.toLowerCase() == 'measure') {
                                    return createMeasure.createMeasure(appRef, x.app, data, tags);
                                }
                            });
                        })
                        .then(function(resultArray) {
                            var createObjects = resultMetrics(resultArray);
                            var same = 0;
                            var created = 0;
                            var updated = 0;

                            if (createObjects.length == 0) {
                                logger.info("No new dimensions or measures created", { module: "objectManagement", app: appRef.name });
                                return;
                            }
                            createObjects.forEach(function(item) {
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
                                created + "\r\nUpdated: " + updated, { module: "objectManagement", app: appRef.name });
                            logger.info('Objects have been added to the repo!', { module: "objectManagement", app: appRef.name });
                            logger.info('Now please wait until the repo catches up and we can change ownership.', { module: "objectManagement", app: appRef.name });
                            return ('Done!');
                        })
                        .catch(function(error) {
                            logger.error(error, { module: "objectManagement", app: appRef.name });
                            reject(error)
                        });
                })
                .then(function(done) {
                    logger.info(done, { module: "objectManagement", app: appRef.name });
                    logger.info("Object Management Complete", { module: "objectManagement", app: appRef.name });
                    x.global.connection.close();
                    resolve("object management complete");
                })
                .catch(function(error) {
                    logger.error(error, { module: "objectManagement", app: appRef.name });
                    reject(error);
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

    if (data[4].qText.length > 1) {
        var tagString = data[4].qText.split(";");
        tagString.forEach(function(tagValue) {
            tags.push(tagValue);
        });
    }

    tags.push(data[3].qText);
    //tags.push(data[3].qText.toLowerCase() + '_' + data[0].qText);
    return tags;
}

var promiseWhile = Promise.method(function(condition, action) {
    if (!condition()) return;
    return action().then(promiseWhile.bind(null, condition, action));
});

function filterMetrics(subjectAreas) {
    return function(obj) {
        return subjectAreas.filter(function(subjectArea) {
            return subjectAreas.indexOf(obj[3].qText) > -1;
        }).length === subjectAreas.length;
    }
}

function resultMetrics(createObjects) {
    return createObjects.filter(function(object) {
        return object == "CREATED";
    });
}