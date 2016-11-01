var qsocks = require('qsocks');
var qsocksInstance = require('./qsocksInstance');
var fs = require('fs');
var Promise = require('bluebird');
var itemCount = require('./checkRepo');
var createDimension = require('./createDimension');
var createMeasure = require('./createMeasure');
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

var manageObjects =
{
    manageObjects : function(appRef, appId, allData, subjectAreas)
    {
        return new Promise(function(resolve, reject)
        {
            var timeout = config.gms.objectManagementTimeout;
            logger.info("Beginning Object Management", {module: "objectManagement",app: appRef.name});
            var app2Connect = qsocksInstance(appId);
            var x = {};
            qsocks.Connect(app2Connect)
            .then(function(global)
            {
                x.global = global;
                return global.openDoc(appId,'','','',true)
                .then(function(app)
                {
                    x.app = app;
                    //var reducedData = data;
                    var reducedData = allData.filter(filterMetrics(subjectAreas));
                    return reducedData;
                })
                .then(function(reducedData)
                {
                    return Promise.map(reducedData, function(data)
                    {
                        var tags = createTags(data);
                        //console.log(objId);
                        if(data[1].qText.toLowerCase()=='dimension')
                        {
                            return createDimension.createDimension(appRef, x.app, data, tags);
                        }
                        if(data[1].qText.toLowerCase()=='measure')
                        {
                            return createMeasure.createMeasure(appRef, x.app, data, tags);
                        }                
                    });
                })
                .then(function(resultArray)
                {
                    var createObjects = resultMetrics(resultArray);
                    if(createObjects.length == 0)
                    {
                        logger.info("No new dimensions or measures created", {module: "objectManagement",app: appRef.name});
                        return;
                    }
                    logger.info('Result of object creation: ' + createObjects.length, {module:"objectManagement",app: appRef.name});
                    var metVals = createObjects.length;
                    var repoVals = 0;
                    return promiseWhile(function() {
                        // Condition for stopping
                        return repoVals < metVals;
                    }, function() {
                        // Action to run, should return a promise
                        return itemCount.count(appRef, appId)
                                .then(function(result)
                                {
                                    repoVals = result
                                    logger.info("Checking repository for the addition of objects: " + repoVals, {module:"objectManagement",app: appRef.name});
                                    return repoVals;
                                })
                                .catch(function(error)
                                {
                                    logger.error(error, {module:"objectManagement", method: "During While Loop",app: appRef.name});
                                });
                    })
                    .timeout(timeout)
                    .then(function() {
                        logger.info('Objects have been added to the repo!', {module:"objectManagement",app: appRef.name});
                        logger.info('yay!');
                        return('Done!');

                        //let's tag in the repo what we just created
                        

                    })
                    .catch(Promise.TimeoutError, function(error)
                    {
                        logger.info("I timed out.  ", {module: "objectManagement",app: appRef.name});
                        logger.error(error, {module: "objectManagement", app: appRef.name});
                        reject(error);
                    });
                })
                .catch(function(error)
                {
                    logger.error(error, {module: "objectManagement",app: appRef.name});
                    reject(error)
                });
            })
            .then(function(done)
            {
                logger.info(done,  {module: "objectManagement",app: appRef.name});
                logger.info("Object Management Complete", {module: "objectManagement",app: appRef.name});
                x.global.connection.close();
                resolve("object management complete");
            })
            .catch(function(error)
            {
               logger.error(error, {module: "objectManagement",app: appRef.name});
               reject(error);
            });
        });
        
    }
}; 

module.exports = manageObjects;

function createTags(data)
{
    var tags = [];
    var tagString = data[4].qText.split(";");
    tagString.forEach(function(tagValue)
    {
        tags.push(tagValue);
    });

    tags.push("MasterItem");
    tags.push(data[3].qText);
    tags.push(data[3].qText.toLowerCase() + '_' + data[0].qText);
    return tags;
}

var promiseWhile = Promise.method(function(condition, action) 
{
    if (!condition()) return;
    return action().then(promiseWhile.bind(null, condition, action));
});

function filterMetrics(subjectAreas)
{
	return function(obj)
	{
		return subjectAreas.filter(function(subjectArea)
		{
			return subjectAreas.indexOf(obj[3].qText) > -1;
		}).length === subjectAreas.length;
	}	
}

function resultMetrics(createObjects)
{
    return createObjects.filter(function(object)
    {
        return object=="CREATED";
    });
}