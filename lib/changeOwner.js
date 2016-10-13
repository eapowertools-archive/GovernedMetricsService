var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');
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
    changeAppObjectOwner : function(appRef, userDirectory, userId, appId)
    {
        return new Promise(function(resolve, reject)
        {
            logger.info("Starting App Object Ownership Change.", {module:"changeOwner",app: appRef.name});
            var x = {};
            
            getOwnedAppObjects.getOwnedAppObjects(appRef, userDirectory, userId, appId)
            .then(function(body)
            {
                //logger.debug(JSON.stringify(body), {module:"changeOwner"});
                var postPath = "/selection";
                return qrsInteract.Post(postPath, body, 'json');
            })
            .then(function(selection)
            {
                x.selectionId = selection.body.id;
                var tagPath = "/tag?filter=name eq 'gms'";
                return qrsInteract.Get(tagPath);
            }).then(function(tags)
            {
                if(tags.length == 0)
                {
                    reject("Tag does not exist");
                } 
                
                x.tagId = tags.body[0].id;
                return getAppOwner.getAppOwner(appRef, appId);
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
                    },
                    {
                        "name": "refList_Tag",
                        "value": {
                            "added": [x.tagId],
                            "removed": []
                        },
                        "valueIsDifferent": false,
                        "valueIsModified": true
                    }]
                };
                
                var putPath = "/selection/" + x.selectionId + "/app/object/synthetic";

                return qrsInteract.Put(putPath, body)
                .then(function(sCode)
                {
                    return sCode.statusCode;
                });

            })
            .then(function(sCode)
            {
                logger.info("The response code from the ownership put: " + sCode, {module: "changeOwner",app: appRef.name});
                if(sCode == 204)
                {
                    logger.info("Processed Change Ownership Request", {module: "changeOwner",app: appRef.name});
                    var deletePath = "/selection/" + x.selectionId;
                    qrsInteract.Delete(deletePath)
                    .then(function(result) {
                        logger.info("Change Ownership Complete", {module: "changeOwner",app: appRef.name});
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

