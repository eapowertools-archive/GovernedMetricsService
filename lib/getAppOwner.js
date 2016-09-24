var qrsInteract = require('./qrsInstance');
var bluebird = require('bluebird');
var winston = require('winston');

//set up logging
winston.add(require('winston-daily-rotate-file'));
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logging.logFile})
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
                logger.debug("The Owner of appId: " + appId + " with name " + result[0].name + " is " + result[0].owner, {module:"getAppOwner"});
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