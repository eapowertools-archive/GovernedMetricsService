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

function inRepo(appId, subjectArea, arrMetrics, attempts, callback)
{
    if(attempts <= config.repoAttempts)
    {
        attempts++;
        logger.debug('getRepoIDs attempt ' + attempts, {module: 'qrsChangeOwner'});
        var path = "https://" + config.hostname + ":" + config.qrsPort + "/qrs/app/object";
        path +=  "?xrfkey=ABCDEFG123456789&filter=engineObjectId sw '" + subjectArea + "' and app.id eq " + appId;
        logger.debug('getRepoIDs path::' + path, {module: 'qrsChangeOwner'});
        
        qrsInteract.get(path)
        .then(function(result)
        {
            if(result.length==arrMetrics.length)
            {
                logger.debug('getrepoIDs returned a result on attempt ' + attempts, {module: 'qrsChangeOwner'});
                callback(null,result);                
            }
            else
            {
                var count = config.repoAttempts - attempts;
                logger.debug('getRepoIDs returned no values.  Trying again ' , count  , ' times.', {module: 'qrsChangeOwner'});
                inRepo(appId, subjectArea, arrMetrics, attempts, callback);        
            }
        })
        .catch(function(error)
        {
            logger.error(error,{module: 'qrsChangeOwner'});
            callback(error);
        });
    }
    else
    {
        logger.error('Did not find the new metric in ' + attempts + ' attempts',{module: 'qrsChangeOwner'});
        callback('Did not find the new metric in ' + attempts + ' attempts');
    }
}

var qrsChangeOwner = 
{
    getRepoIDs: function(appId, subjectArea, arrMetrics)
    {
        return new Promise(function(resolve, reject)
        {
            var resultArray= [];
            logger.info('getting app.object ids for subjectarea:' + subjectArea + ' for appId:' + appId, {module: 'qrsChangeOwner'});
            var idCount = 0;
            inRepo(appId, subjectArea, arrMetrics, 0, function(error, result)
            {
                if(error)
                {
                    reject(new Error(error));
                }
                else
                {
                    logger.debug('qrs returned ' + result.length + ' items compared to ' + arrMetrics.length + ' items created or updated.', {module:'qrsChangeOwner'});
                    result.forEach(function(item, index, array)
                    {
                        idCount++;
                        resultArray.push(item.id);
                        if(idCount === array.length)
                        {
                            logger.debug('repoIDS!!!' + JSON.stringify(resultArray),{module: 'qrsChangeOwner'});
                            resolve(resultArray);                
                        }
                    });                    
                }
            });
        });
    },
    changeOwner: function(appid, arrObjects, ownerId)
    {
        return new Promise(function(resolve, reject)
        {
            var x = {};
            logger.debug('Entering changeOwner', {module:'qrsChangeOwner'});
            logger.debug('arrObjects to be processed: ' + JSON.stringify(arrObjects), {module: 'qrsChangeOwner'});
            createBody(arrObjects)
            .then(function(body)
            {
                logger.debug('Body of objects for selection:' + JSON.stringify(body),{module:'qrsChangeOwner'});          
                
                var postPath = "https://" + config.hostname + ":" + config.qrsPort + "/qrs/selection";
                postPath +=  "?xrfkey=ABCDEFG123456789";
                logger.debug("qrsChangeOwner::postPath::" + postPath, {module: 'qrsChangeOwner'});
                qrsInteract.post(postPath, body, 'json')
                .then(function(result)
                {
                    logger.debug('qrsChangeOwner:: Selection on app.object created.  ' + JSON.stringify(result), {module: 'qrsChangeOwner'});
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
                    .then(function(sCode)
                    {
                        //added the value
                       logger.info(sCode + ' received during Put operation for changing ownership',{module: 'qrsChangeOwner'});
                       logger.info('delete this selection:' + x.id, {module: 'qrsChangeOwner'});
                       logger.debug('qrsChangeOwner::Changed ownership to user ' + ownerId, {module: 'qrsChangeOwner'});
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
            .catch(function(error)
            {
                logger.error('createBody Error::' + error, {module: 'qrsChangeOwner'});
                reject(error);
            });
        });
    }
};

function createBody(arrObjects)
{
    return new Promise(function(resolve)
    {
        var resultArray = [];
        var objCount = 0;
        arrObjects.forEach(function(item, index, array)
        {
            objCount++;
            //logger.debug(objCount + ' of ' + array.length + ' metrics', {module: 'qrsChangeOwner'});
            
            var object = {
            "type":"App.Object",
            "objectID": item  
            };
            resultArray.push(object);
            if(objCount === array.length)
            {
                logger.debug('createBody Array Results::' + JSON.stringify(resultArray), {module: 'qrsChangeOwner'});
                var result = {
                    "items": resultArray
                };
                logger.debug('final output of createBody::' + JSON.stringify(result), {module:'qrsChangeOwner'});
                resolve(result);
            }
        });        
    })
}

function buildModDate()
{   
    var d = new Date();
    return d.toISOString();
}

module.exports= qrsChangeOwner;