var Promise = require('bluebird')
var config = require('../config/config');
var winston = require('winston');
var qrsInteract = require('./qrsInstance');
var qrsNotify = require('./qrsNotify');


//set up logging
var logger = new (winston.Logger)({
	level: config.default.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.default.logFile})
    ]
});

var qrsChangeOwner = {
    changeAgent: function() {
        //In this method, we are polling the repository for dimensions and measures owned by the sa_repository on apps the sa_repository account does not own.
        //We are doing this because we want to make sure master library items are visible on unpublished apps for developers creating apps.
        return new Promise(function(resolve, reject) {
            logger.debug('running the changeAgent for the Governed Metrics Service', {module:'qrsChangeOwner',method:'changeAgent'});
            var path = "/app/object";
            path += "?filter=owner.userId eq '" + config.qrs.repoAccountUserId + "' and owner.userDirectory eq '";
            path += config.qrs.repoAccountUserDirectory + "' and (objectType eq 'dimension' or objectType eq 'measure')";
            return qrsInteract.get(path)
            .then(function(appObjects) {
                //logger.debug('AppObjects returned:', JSON.stringify(appObjects) , {module:'qrsChangeOwner',method:'changeAgent'});
                return qrsChangeOwner.processAppObjects(appObjects);
            })
            .then(function(message) {
                //logger.debug(message, {module:'qrsChangeOwner',method:'changeAgent'});
                return message;
            })
            .catch(function(error) {
                reject(error);
            });
        });
    },
    processAppObjects: function(arrObjects) {
        return new Promise(function(resolve, reject) {
            //logger.debug('running processAppObjects', {module:'qrsChangeOwner',method:'processAppObjects'})
            var sequence = Promise.resolve();
            var x = {};
            sequence = sequence
                .then(function() {
                    //logger.debug('getting appobject IDs from the notification agent', {module:'qrsChangeOwner',method:'processAppObjects'});
                    return arrObjects.map(function(obj) {
                        return obj.id;
                    });
                })
                .then(function(objectIds) {
                    //logger.debug('changed objectIds: ' + JSON.stringify(objectIds),{module:'qrsChangeOwner',method:'processAppObjects'})
                    x.objectIds = objectIds;
                    return createBody(objectIds);
                })
                .then(function(body) {
                    //logger.debug('Create selection on app objects')
                    var postPath = "/selection";
                    //logger.debug('qrsInteract.post on path:' + postPath, {module:'qrsChangeOwner',method:'processAppObjects'});
                    return qrsInteract.post(postPath, body, 'json');
                })
                .then(function(selection) {
                    //get the full information of the objects and reduce to the app.
                    var path = "/selection";
                    path += "/" + selection.id + "/app/object/full";
                    path += "?orderby=app.id";
                    //logger.debug('qrsInteract.get on path:'+ path, {module:'qrsChangeOwner',method:'processAppObjects'});
                    return qrsInteract.get(path);
                })
                .then(function(objInfo) {
                    //logger.debug('Result of getting selection of appobjects: ' + JSON.stringify(objInfo), {module:'qrsChangeOwner',method:'processAppObjects'});
                    //These are the objectIds to change ownership on sorted by app
                    ////logger.debug('these items are currently owned by ', item.owner.userDirectory ,'\\', config.default.repoAccountUserDirectory, {module:'qrsChangeOwner',method:'processAppObjects'});
                    return segregateAppObjects(objInfo);
                })
                .then(function(arrObjectsByApp) {
                    ////logger.debug('Show me the formatted array of objects:', JSON.stringify(arrObjectsByApp),{module:'qrsChangeOwner',method:'processAppObjects'});
                    var objectRuns = 0;
                    var sequence2 = Promise.resolve();
                    arrObjectsByApp.forEach(function(item, index, array) 
                    {
                        objectRuns++;
                        //logger.debug('object run:' + objectRuns, {module:'qrsChangeOwner',method:'processAppObjects'});
                        //logger.debug('AppID:' + item.appId, {module:'qrsChangeOwner',method:'processAppObjects'});
                        sequence2 = sequence2
                        .then(function()
                        {
                            x.ownerId = item.ownerId;
                            x.objects = item.appObjects;
                            return qrsChangeOwner.changeOwner(x.objects, x.ownerId);
                        })
                        .then(function() 
                        {
                            if (objectRuns == array.length) {
                                 return 'Change Ownership based on notification complete.';
                            }
                        });
                    });
                })
                .catch(function(error) {
                    logger.error(error, {module:'qrsChangeOwner',method:'processAppObjects'});
                    reject(error);
                });
        });
    },
    changeOwner: function(arrObjects, ownerId) {
        return new Promise(function(resolve, reject) {
            var x = {};
            logger.debug('Entering changeOwner', {module:'qrsChangeOwner'});
            logger.debug('arrObjects to be processed: ' + JSON.stringify(arrObjects), {module: 'qrsChangeOwner'});
            createBody(arrObjects)
                .then(function(body) {
                    logger.debug('Body of objects for selection:' + JSON.stringify(body),{module:'qrsChangeOwner'});          

                    var postPath = "/selection";
                    logger.debug("qrsChangeOwner::postPath::" + postPath, {module: 'qrsChangeOwner'});
                    qrsInteract.post(postPath, body, 'json')
                        .then(function(result) {
                            logger.debug('qrsChangeOwner:: Selection on app.object created.  ' + JSON.stringify(result), {module: 'qrsChangeOwner'});
                            x.id = result.id;
                            var body = {
                                "latestModifiedDate": buildModDate(),
                                "type": "App.Object",
                                "properties": [{
                                    "name": "owner",
                                    "value": ownerId,
                                    "valueIsDifferent": false,
                                    "valueIsModified": true
                                }]
                            };
                            //logger.debug('qrsChangeOwner::Body for changing owner on app.object. ' +  JSON.stringify(body), {module: 'qrsChangeOwner'});
                            var putPath = "/selection/" + result.id + "/app/object/synthetic";
                                //logger.debug('qrsChangeOwner::PutPath::' + putPath, {module: 'qrsChangeOwner'});
                            qrsInteract.put(putPath, body)
                                .then(function(sCode) {
                                    //added the value
                                    logger.info(sCode + ' received during Put operation for changing ownership',{module: 'qrsChangeOwner'});
                                    logger.info('delete this selection:' + x.id, {module: 'qrsChangeOwner'});
                                    //logger.debug('qrsChangeOwner::Changed ownership to user ' + ownerId, {module: 'qrsChangeOwner'});
                                    var deletePath = "/selection/" + x.id;
                                    //logger.debug(x.id, {module: 'qrsChangeOwner'});
                                    qrsInteract.delete(deletePath)
                                        .then(function(result) {
                                            //logger.debug('qrsChangeOwner::Deleting selection for ownership change.' + result, {module: 'qrsChangeOwner'});
                                            return result;
                                        })
                                        .catch(function(error) {
                                            logger.error('qrsChangeOwner::delete selection::' + JSON.stringify(error) , {module: 'qrsChangeOwner'});
                                            reject(new Error(error));
                                        });
                                })
                                .catch(function(error) {
                                    logger.error('qrsChangeOwner::change ownership::' + JSON.stringify(error) , {module: 'qrsChangeOwner'})
                                    reject(new Error(error));
                                });
                        })
                        .catch(function(error) {
                            logger.error('qrsChangeOwner::create selection::' + JSON.stringify(error) , {module: 'qrsChangeOwner'})
                            reject(new Error(error));
                        });

                })
                .catch(function(error) {
                    logger.error('createBody Error::' + error, {module: 'qrsChangeOwner'});
                    reject(error);
                });
        });
    }
};

function segregateAppObjects(appObjects) {
    return new Promise(function(resolve, reject) {
        var newObject = [];
        var appCount = 0;
        //AppIds
        var appList = appObjects.map(function(obj) {
            return obj.app.id;
        });

        var uniqueApps = appList.filter(function(item, pos) {
            return appList.indexOf(item) == pos;
        });

        //logger.debug('UniqueApps result:' + JSON.stringify(uniqueApps), {module: 'qrsChangeOwner', method: 'segregateAppObjects'});    
        var sequence = Promise.resolve();
        uniqueApps.forEach(function(item, index, array) 
        {
            var x = {};
            sequence =sequence
            .then(function()
            {
                appCount++;
            //logger.debug(appCount, ' of ', array.length,  {module: 'qrsChangeOwner', method: 'segregateAppObjects'});
                var path = "/app/full";
                path += "?filter=id eq " + item;
                return qrsInteract.get(path)
                .then(function(result)
                {
                    x.owner = result[0].owner;
                    if(x.owner.userId != config.default.repoAccountUserId)
                    {
                        var objectsPerApp = appObjects.filter(function(obj) {
                            return obj.app.id == item;
                        });
                        
                        var arrObjects = objectsPerApp.map(function(obj) {
                            return obj.id;
                        });

                            //logger.debug('appObjects for app: ' + item + ': ' + JSON.stringify(arrObjects), {module: 'qrsChangeOwner', method: 'segregateAppObjects'});

                        var changeObject = {
                            "appId": item,
                        "appObjects": arrObjects,
                        "ownerId": x.owner.id
                        };
                        return changeObject;
                    }
                })
                .catch(function(error)
                {
                    reject(error);
                });
            })
            .then(function(changeObject)
            {
                if(changeObject != null || changeObject != undefined)
                {
                    newObject.push(changeObject);
                }
            })
            .then(function()
            {
                if (appCount === array.length) {
                    //logger.debug('array for changing:' + JSON.stringify(newObject), {module: 'qrsChangeOwner', method: 'segregateAppObjects'});
                    resolve(newObject);
                }
            })
            .catch(function(error)
            {
                reject(error);
            });
        });
    });

}

function getOwnerId(appId) {
    return new Promise(function(resolve,reject) {
        var path = "/app/full";
        path += "?filter=id eq " + appId;
        qrsInteract.get(path)
            .then(function(result) {
                //logger.debug('Owner is: ', result[0].owner.id, {module: 'qrsChangeOwner', method: 'segregateAppObjects'});
                resolve(result[0].owner.id);
            })
            .catch(function(error)
            {
                reject(error)
            });
    });
    //get the app information

}




function createBody(arrObjects) {
    return new Promise(function(resolve) {
        var resultArray = [];
        var objCount = 0;
        arrObjects.forEach(function(item, index, array) {
            objCount++;
            ////logger.debug(objCount + ' of ' + array.length + ' metrics', {module: 'qrsChangeOwner'});

            var object = {
                "type": "App.Object",
                "objectID": item
            };
            resultArray.push(object);
            if (objCount === array.length) {
                //logger.debug('createBody Array Results::' + JSON.stringify(resultArray), {module: 'qrsChangeOwner'});
                var result = {
                    "items": resultArray
                };
                //logger.debug('final output of createBody::' + JSON.stringify(result), {module:'qrsChangeOwner'});
                resolve(result);
            }
        });
    })
}

function buildModDate() {
    var d = new Date();
    return d.toISOString();
}

module.exports = qrsChangeOwner;