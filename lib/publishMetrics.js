var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');
var logger = require('./logger');

var publishMetrics = {
    publishMetrics: function(appInfo) {
        return new Promise(function(resolve, reject) {
            logger.info("Begin publish process", { module: "publishMetrics", app: appInfo.name });
            var path = "/app/object";
            path += "?filter=tags.name eq 'gms' and (objectType eq 'dimension' or objectType eq 'measure') and published eq false and (app.published eq true and app.id eq " + appInfo.id + ")";
            logger.info("Searching published apps for dimensions and measures with the tag 'gms'", { module: "publishMetrics", app: appInfo.name });
            qrsInteract.Get(path)
                .then(function(appObjects) {
                    if (appObjects.body.length !== 0) {
                        return appObjects.body.map(function(appObject) {
                            return appObject.id;
                        });
                    } else {
                        logger.info("GMS does not need to publish metrics because " + appInfo.name + " is not a published app.  Metrics will appear in unpublished apps.", { module: "publishMetrics", app: appInfo.name });
                        resolve("GMS does not need to publish metrics because " + appInfo.name + " is not a published app.  Metrics will appear in unpublished apps.");
                    }
                })
                .then(function(arrObjects) {
                    if (arrObjects == undefined) {
                        return;
                    }
                    return Promise.all(arrObjects.map(function(appObjectId) {
                            var putPath = "/app/object/" + appObjectId + "/publish";
                            logger.info("Publishing appObject " + appObjectId, { module: "publishMetrics", app: appInfo.name });
                            var body = "";
                            return qrsInteract.Put(putPath, body)
                                .then(function(sCode) {
                                    if (sCode.statusCode == 200) {
                                        console.log("Published " + appObjectId);
                                        logger.info("Published appObject: " + appObjectId, { module: "publishMetrics", app: appInfo.name });
                                        return 1;
                                    } else {
                                        console.log(sCode.statusCode);
                                        logger.info("Failed to publish appObject: " + appObjectId, { module: "publishMetrics", app: appInfo.name });
                                        return 0;
                                    }
                                })
                                .catch(function(error) {
                                    console.log(error);
                                    reject(error);
                                });
                        }))
                        .then(function(resultArray) {
                            var successCount = 0;
                            resultArray.forEach(function(item) {
                                successCount += item;
                            });
                            logger.info("Published " + successCount + " of " + resultArray.length + "App Objects", { module: "publishMetrics", app: appInfo.name });
                            resolve("Published " + successCount + " of " + resultArray.length + "App Objects");
                        })
                        .catch(function(error) {
                            reject(error);
                        });
                })
                .catch(function(error) {
                    logger.error("Error in publishMetrics: " + JSON.stringify(error), { module: "publishMetrics", app: appInfo.name });
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