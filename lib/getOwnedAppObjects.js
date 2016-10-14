var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');
var winston = require('winston');
var config = require('../config/config');
require('winston-daily-rotate-file');

//set up logging
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.DailyRotateFile)({ filename: config.logging.logFile, prepend: true})
    ]
});

var getOwnedAppObjects = {
    getOwnedAppObjects: function(appRef, userDirectory, userId, appId)
    {
        return new Promise(function(resolve, reject)
        {
            var path = "/app/object";
            path += "?filter=owner.userId eq '" + userId + "' and owner.userDirectory eq '";
            path += userDirectory + "' and (objectType eq 'dimension' or objectType eq 'measure')";
            appId !== undefined ? path += " and app.id eq " + appId : "";
            return qrsInteract.Get(path)
            .then(function(appObjects) {
                //logger.debug('AppObjects returned:', JSON.stringify(appObjects) , {module:'getOwnedAppObjects'});
                return Promise.all(appObjects.body.map(function(appObject)
                {
                    return appObject.id;
                }));
            })
            .then(function(result)
            {
                return createBody(result)
            })
            .then(function(body)
            {
                resolve(body);
            })
            .catch(function(error) {
                reject(error);
            });
        });
    
    }
};

module.exports = getOwnedAppObjects;


function createBody(arrObjects) {
    return new Promise(function(resolve, reject) 
    {
        var resultArray = [];
        var objCount = 0;

        return Promise.all(arrObjects.map(function(item)
        {
            var object = {
                "type": "App.Object",
                "objectID": item
            };
            return object; 
        }))
        .then(function(resultArray)
        {
            var result = {
                "items": resultArray
            }; 
            resolve(result);
        })
        .catch(function(error)
        {
            reject(error);
        });
    });
}