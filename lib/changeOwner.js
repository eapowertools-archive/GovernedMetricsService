var qrsInteract = require('./qrsInstance');
var bluebird = require('bluebird');
var getOwnedAppObjects = require('./getOwnedAppObjects');
var getAppOwner = require('./getAppOwner');
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

var changeOwner =
{
    changeAppObjectOwner : function(userDirectory, userId, appId)
    {
        return new Promise(function(resolve, reject)
        {
            logger.info("Starting App Object Ownership Change.", {module:"changeOwner"});
            var x = {};
            getOwnedAppObjects.getOwnedAppObjects(userDirectory, userId, appId)
            .then(function(body)
            {
                logger.debug(JSON.stringify(body), {module:"changeOwner"});
                var postPath = "/selection";
                return qrsInteract.Post(postPath, body, 'json');
            })
            .then(function(selection)
            {
                x.selectionId = selection.id;
                return getAppOwner.getAppOwner(appId);
            })
            .then(function(owner)
            {
                var body = 
                {
                    "latestModifiedDate": buildModDate(),
                    "type": "App.Object",
                    "properties": [{
                        "name": "owner",
                        "value": owner.id,
                        "valueIsDifferent": false,
                        "valueIsModified": true
                    }]
                };
                
                var putPath = "/selection/" + x.selectionId + "/app/object/synthetic";

                return qrsInteract.Put(putPath, body)
                .then(function(sCode)
                {
                    return sCode;
                });

            })
            .then(function(sCode)
            {
                if(sCode == 204)
                {
                    logger.info("Processed Change Ownership Request", {module: "changeOwner"});
                    var deletePath = "/selection/" + x.selectionId;
                    qrsInteract.Delete(deletePath)
                    .then(function(result) {
                        logger.info("Change Ownership Complete", {module: "changeOwner"});
                        resolve("Change Ownership Complete");
                    })
                    .catch(function(error) {
                        reject(error);
                    });        
                }
            })
            .catch(function(error)
            {
                reject(error);
            });
        });
    }
};

module.exports = changeOwner;


function buildModDate() {
    var d = new Date();
    return d.toISOString();
}

