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


var changeOwner = 
{
    getRepoIDs: function(appId, subjectArea)
    {
        var resultArray= [];
        return new Promise(function(resolve)
        {
            var path = "https://" + config.hostname + ":" + config.qrsPort + "/qrs/app/object";
            path +=  "?xrfkey=ABCDEFG123456789&filter=engineObjectId sw '" + subjectArea + "' and app.id eq " + appId;
            logger.debug('getRepoIDs path::' + path, {module: 'qrsChangeOwner'});
            qrsInteract.get(path)
            .then(function(result)
            {
                result.forEach(function(item)
                {
                   resultArray.push(item.id); 
                });
                resolve(resultArray);
            })
            .catch(function(error)
            {
               reject(error); 
            });            
        });
    },
    createBody: function(arrObjects)
    {
      var resultArray = [];
      var objCount = 0;
      arrObjects.forEach(item, index, array)
      {
          objCount++;
          var object = {
            "type":"App.Object",
            "objectID": item.id  
          };
          resultArray.push(object);
          if(objCount === array.length)
          {
              return {
                  "items": resultArray
              }
          }
      }
      
    },
    changeOwner: function(appid, arrObjects, ownerId)
    {
        return new Promise(function(resolve)
        {
            var body = changeOwner.createBody(arrObjects);
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