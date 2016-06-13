var Promise = require('bluebird')
var config = require('../config/config');
var winston = require('winston');
var qrsInteract = require('./qrsinteractions');
var qrsNotify = require('./qrsNotify');


//set up logging
var logger = new (winston.Logger)({
	level: config.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});

var qrsChangeOwner = 
{
    readNotification: function(arrObjects)
    {
        return new Promise(function(resolve, reject)
        {
            logger.debug('running readNotification', {module:'qrsChangeOwner',method:'readNotification'})
            var sequence = Promise.resolve();
            var x = {};
            sequence = sequence
            .then(function()
            {
                logger.debug('getting appobject IDs from the notification agent', {module:'qrsChangeOwner',method:'readNotification'});
                return arrObjects.map(function(obj)
                {
                    return obj.objectID;
                });
            })
            .then(function(objectIds)
            {
                logger.debug('changed objectIds: ' + JSON.stringify(objectIds),{module:'qrsChangeOwner',method:'readNotification'})
                x.objectIds = objectIds;
                return createBody(objectIds);
            })
            .then(function(body)
            {
                logger.debug('Create selection on app objects')
                var postPath = "https://" + config.hostname + ":" + config.qrsPort + "/qrs/selection";
                postPath +=  "?xrfkey=ABCDEFG123456789";
                logger.debug('qrsInteract.post on path:' + postPath, {module:'qrsChangeOwner',method:'readNotification'});
                return qrsInteract.post(postPath, body, 'json');                
            })
            .then(function(selection)
            {
                //get the full information of the objects and reduce to the app.
                var path = "https://" + config.hostname + ":" + config.qrsPort + "/qrs/selection";
                path += "/" + selection.id + "/app/object/full";
                path += "?xrfkey=ABCDEFG123456789";
                path += "&orderby=app.id";
                logger.debug('qrsInteract.get on path:'+ path, {module:'qrsChangeOwner',method:'readNotification'});
                return qrsInteract.get(path); 
            })
            .then(function(objInfo)
            {
                logger.debug('Result of getting selection of appobjects: ' + JSON.stringify(objInfo), {module:'qrsChangeOwner',method:'readNotification'});
                //These are the objectIds to change ownership on sorted by app
                //logger.debug('these items are currently owned by ', item.owner.userDirectory ,'\\', config.repoAccountUserDirectory, {module:'qrsChangeOwner',method:'readNotification'});
                return segregateAppObjects(objInfo);
            })
            .then(function(arrObjectsByApp)
            {
                logger.debug('Show me the formatted array of objects:', JSON.stringify(arrObjectsByApp),{module:'qrsChangeOwner',method:'readNotification'});
                var objectRuns = 0;
                arrObjectsByApp.forEach(function(item,index,array)
                {
                    objectRuns++;
                    x.ownerId = item.ownerId;
                    x.objects = item.appObjects;
                    qrsChangeOwner.changeOwner(x.objects, x.ownerId)
                    .then(function()
                    {
                        if(objectRuns==array.length)
                        {
                            return;   
                        }                        
                    });
                });
            })
            .then(function()
            {
                resolve('Change Ownership based on notification complete.');
            })
            .catch(function(error)
            {
                logger.error(error, {module:'qrsChangeOwner',method:'readNotification'});
                reject(error);
            });            
        });     
    },
    changeOwner: function(arrObjects, ownerId)
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

function segregateAppObjects(appObjects)
{
   return new Promise(function(resolve,reject)
   {
        var newObject = [];
        var appCount = 0;
        
            //AppIds
        var sequence = Promise.resolve();
        var appList = appObjects.map(function(obj)
        {
            return obj.app.id;    
        });
        
        var uniqueApps = appList.filter(function(item, pos)
        {
            return appList.indexOf(item)==pos; 
        });
        
        logger.debug('UniqueApps result:' + JSON.stringify(uniqueApps), {module: 'qrsChangeOwner', method: 'segregateAppObjects'});    
        
        uniqueApps.forEach(function(item, index, array)
        {
            var x = {};
            appCount++;
            logger.debug(appCount, ' of ', array.length,  {module: 'qrsChangeOwner', method: 'segregateAppObjects'});
            sequence = sequence
            .then(function()
            {
                return getOwnerId(item);
            })
            .then(function(owner)
            {
                logger.debug('Owner is: ' + owner, {module: 'qrsChangeOwner', method: 'segregateAppObjects'} );
                return x.ownerId = owner;
            })
            .then(function()
            {
                return objectsPerApp = appObjects.filter(function(obj)
                {
                    return obj.app.id==item;
                });
            })
            .then(function(objectsPerApp)
            {
                var arrObjects = objectsPerApp.map(function(obj)
                {
                    return obj.id;  
                });
                
                logger.debug('appObjects for app: ' + item + ': ' + JSON.stringify(arrObjects), {module: 'qrsChangeOwner', method: 'segregateAppObjects'});
                
                var changeObject =                 
                {
                    "appId": item,
                    "appObjects": arrObjects,
                    "ownerId": x.ownerId
                };
                
                newObject.push(changeObject);
                if(appCount===array.length)
                {
                    logger.debug('array for changing:' + JSON.stringify(newObject), {module: 'qrsChangeOwner', method: 'segregateAppObjects'});
                    resolve(newObject);
                }         
            });
        });       
   });
 
}

function getOwnerId(appId)
{
    return new Promise(function(resolve)
    {
        var path = "https://" + config.hostname + ":" + config.qrsPort + "/qrs/app/full";
        path +=  "?xrfkey=ABCDEFG123456789";
        path += "&filter=id eq " + appId;
        qrsInteract.get(path)
        .then(function(result)
        {
            logger.debug('Owner is: ', result[0].owner.id, {module: 'qrsChangeOwner', method: 'segregateAppObjects'});
            resolve(result[0].owner.id);
        });        
    });
     //get the app information

}




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