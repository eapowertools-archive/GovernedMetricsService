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
    manageObjects : function(appId, allData, subjectAreas)
    {
        return new Promise(function(resolve, reject)
        {
            logger.info("Beginning Object Management", {module: "objectManagement"});
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
                            return createDimension.createDimension(x.app, data, tags);
                        }
                        if(data[1].qText.toLowerCase()=='measure')
                        {
                            return createMeasure.createMeasure(x.app, data, tags);
                        }                
                    });
                })
                .then(function(resultArray)
                {
                    var createObjects = resultMetrics(resultArray);
                    logger.info('Result of object creation: ' + createObjects.length, {module:"objectManagement"});
                    var metVals = createObjects.length;
                    var repoVals = 0;
                    promiseWhile(function() {
                        // Condition for stopping
                        return repoVals < metVals;
                    }, function() {
                        // Action to run, should return a promise
                        return itemCount.count(appId)
                                .then(function(result)
                                {
                                    repoVals = result
                                    logger.info("Checking repository for the addition of objects: " + repoVals, {module:"objectManagement"});
                                    return repoVals;
                                })
                                .catch(function(error)
                                {
                                    logger.error(error, {module:"objectManagement", method: "During While Loop"});
                                });
                    })
                    .timeout(30000)
                    .then(function() {
                        // Notice we can chain it because it's a Promise, 
                        // this will run after completion of the promiseWhile Promise!
                        
                    })
                    .catch(Promise.TimeoutError, function(error)
                    {
                        logger.error(error, {module: "objectManagement"});
                        reject(error);
                    });
                })
                .catch(function(error)
                {
                    logger.error(error, {module: "objectManagement"});
                    reject(error)
                });
            })
            .then(function()
            {
                logger.info("Object Management Complete", {module: "objectManagement"});
                x.global.connection.close();
                resolve("object management complete");
            })
            .catch(function(error)
            {
               logger.error(error, {module: "objectManagement"});
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