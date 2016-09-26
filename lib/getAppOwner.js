var qrsInteract = require('./qrsInstance');
var bluebird = require('bluebird');
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
    getAppOwner : function(appId)
    {
        return new Promise(function(resolve,reject)
        {
            var path = "/app/full";
            path += "?filter=id eq " + appId;
            return qrsInteract.Get(path)
            .then(function(result)
            {
                logger.debug("The Owner of appId: " + appId + " with name " + result[0].name + " is " + JSON.stringify(result[0].owner), {module:"getAppOwner"});
                resolve(result[0].owner);
            })
            .catch(function(error)
            {
                reject(error);
            });
        })
    }
};


module.exports = getAppOwner;