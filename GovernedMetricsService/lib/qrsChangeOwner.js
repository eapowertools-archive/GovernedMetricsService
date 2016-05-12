var Promise = require('bluebird')
var config = require('../config/config');
var winston = require('winston');
var qrsInteract = require('./qrsinteractions');


//set up logging
var logger = new (winston.Logger)({
	level: config.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});

var result ='';
var changeOwner = 
{
    changeOwner: function(appid, objectId, ownerId)
    {
        return new Promise(function(resolve)
        {
            var x = {};
            var postPath = "https://" + config.hostname + ":" + config.qrsPort + "/qrs/selection/app/object";
            postPath +=  "?xrfkey=ABCDEFG123456789&filter=engineObjectId eq '" + objectId + "' and app.id eq " + appid;
            logger.debug("qrsChangeOwner::postPath::" + postPath, {module: 'qrsChangeOwner'});
            qrsInteract.post(postPath)
            .then(function(result)
            {
                logger.debug('qrsChangeOwner:: Selection on app.object ' + objectId + ' created.  ' + JSON.stringify(result), {module: 'qrsChangeOwner'});
                x.id = result.id;
                var body =
                {
                    "latestModifiedDate": buildModDate(),
                    "type": "App.Object",
                    "properties": [
                    {
                        "name":"owner",
                        "value": ownerId,
                        "valueIsDifferent": false,
                        "valueIsModified": true
                    }]
                };
                logger.debug('qrsChangeOwner::Body for changing owner on app.object. ' +  JSON.stringify(body), {module: 'qrsChangeOwner'});
                var putPath = "https://" + config.hostname + ":" + config.qrsPort + "/qrs/selection/" + result.id + "/app/object/synthetic";
                putPath +=  "?xrfkey=ABCDEFG123456789"
                logger.debug('qrsChangeOwner::PutPath::' + putPath, {module: 'qrsChangeOwner'});
                qrsInteract.put(putPath, body)
                .then(function()
                {
                    //added the value
                    logger.debug('qrsChangeOwner::Changed ownership of ' + objectId + ' to user ' + ownerId, {module: 'qrsChangeOwner'});
                    var deletePath =  "https://" + config.hostname + ":" + config.qrsPort + "/qrs/selection/" + x.id;
                    deletePath += "/?xrfkey=ABCDEFG123456789";
                    logger.debug(x.id, {module: 'qrsChangeOwner'});
                    qrsInteract.delete(deletePath)
                    .then(function(result)
                    {
                        logger.debug('qrsChangeOwner::Deleting selection for ownership change.' + result, {module: 'qrsChangeOwner'});
                        resolve();
                    })
                    .catch(function(error)
                    {
                       logger.error('qrsChangeOwner::delete selection::' + JSON.stringify(error) , {module: 'qrsChangeOwner'});
                       reject(new Error(error)); 
                    });
                })
                .catch(function(error)
                {
                   logger.error('qrsChangeOwner::change ownership::' + JSON.stringify(error) , {module: 'qrsChangeOwner'})
                   reject(new Error(error)); 
                });
            })
            .catch(function(error)
            {
               logger.error('qrsChangeOwner::create selection::' + JSON.stringify(error) , {module: 'qrsChangeOwner'})
               reject(new Error(error)); 
            });
        })
    }
};

function buildModDate()
{   
    var d = new Date();
    return d.toISOString();
}

module.exports= changeOwner;