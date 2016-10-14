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

var getAppOwner = 
{
    getAppOwner : function(appRef,appId)
    {
        return new Promise(function(resolve,reject)
        {
            var path = "/app/full";
            path += "?filter=id eq " + appId;
            return qrsInteract.Get(path)
            .then(function(result)
            {
                logger.debug("The Owner of appId: " + appId + " with name " + result.body[0].name + " is " + JSON.stringify(result.body[0].owner), {module:"getAppOwner",app: appRef.name});
                resolve(result.body[0].owner);
            })
            .catch(function(error)
            {
                reject(error);
            });
        })
    }
};


module.exports = getAppOwner;