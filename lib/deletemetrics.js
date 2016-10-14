var qsocks = require('qsocks');
var Promise = require('bluebird');
var config = require('../config/config');
var itemCount = require('./checkRepo');
var winston = require('winston');
var fs = require('fs');
require('winston-daily-rotate-file');

//set up logging
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.DailyRotateFile)({ filename: config.logging.logFile, prepend: true})
    ]
});

var deleteMetrics = 
{
	config : function(appId)
	{
		return new Promise(function(resolve)
		{
			var qConfig2 =
			{
				host: config.engine.hostname,
				port: config.engine.enginePort,
				origin: 'https://' + config.engine.hostname,
				isSecure: true,
				rejectUnauthorized: false,
				headers: {
					'Content-Type' : 'application/json',
					'x-qlik-xrfkey' : 'abcdefghijklmnop',
					'X-Qlik-User': config.engine.repoAccount
				},
				key: fs.readFileSync(config.certificates.client_key),
				cert: fs.readFileSync(config.certificates.client),
				appname: appId
			};
			resolve(qConfig2);
		});
	},
	deleteAllMasterItems : function(appId)
	{
		return new Promise(function(resolve, reject)
		{
			var timeout = config.gms.objectManagementTimeout;
			logger.info('deleteAllMasterItems::Deleting all MasterItem dimensions and measures from app: ' + appId, {module: 'deletemetrics'});
			var stuff = {};
			stuff.appId = appId;
			deleteMetrics.config(appId)
			.then(function(config)
			{
				qsocks.Connect(config)
				.then(function(global)
				{
					stuff.global = global;
					return global;
				})
				.then(function(global)
				{
					return global.openDoc(appId, '', '', '', true);
				})
				.then(function(app)
				{
					stuff.app = app;
					return app.getAppLayout();
				})
				.then(function(appLayout)
				{
					stuff.appRef = {
						"name": appLayout.qTitle
					};
					return stuff.measureList = stuff.app.createSessionObject(deleteMetrics.measureListDef());
				})
				.then(function(obj)
				{
					
					return obj.getLayout();
				})
				.then(function(layout)
				{
					
					var items = layout.qMeasureList.qItems;
					var mList = items.filter(filterMasterItems);
					
					return Promise.map(mList, function(listItem)
					{
						return stuff.app.destroyMeasure(listItem.qInfo.qId)
						.then(function(success)
						{
							var measureInfo = listItem.qMeta.title + ':' + listItem.qInfo.qId;
							logger.info('deleteAllMasterItems::destroyMeasure::' + measureInfo + ' succeeded', {module: 'deletemetrics'});
							return listItem;
						});
					});
				})
				.then(function(measureArray)
				{
					
					logger.info("Destroyed " + measureArray.length + " measures from " + stuff.appRef.name, {module: 'deletemetrics', app: stuff.appRef.name});
					var metVals = 0;
                    var repoVals = measureArray.length;
                    return promiseWhile(function() {
                        // Condition for stopping
                        return repoVals > metVals;
                    }, function() {
                        // Action to run, should return a promise
                        return itemCount.deleteCount(stuff.appRef, appId, 'measure')
                                .then(function(result)
                                {
                                    repoVals = result
                                    logger.info("Checking repository for the addition of objects: " + repoVals, {module:"deleteMetrics",app: stuff.appRef.name});
                                    return repoVals;
                                })
                                .catch(function(error)
                                {
                                    logger.error(error, {module:"deleteMetrics", method: "During While Loop",app: stuff.appRef.name});
                                });
                    })
                    .timeout(timeout)
                    .then(function() {
                        logger.info('Objects have been deleted from the repo!', {module:"deleteMetrics",app: stuff.appRef.name});
                        logger.info('yay!');
                        return('Done!');
                    })
                    .catch(Promise.TimeoutError, function(error)
                    {
                        logger.info("I timed out.  ", {module: "deleteMetrics",app: stuff.appRef.name});
                        logger.error(error, {module: "deleteMetrics", app: stuff.appRef.name});
                        reject(error);
                    });
				})
				.then(function()
				{
					return stuff.dimensionList = stuff.app.createSessionObject(deleteMetrics.dimensionListDef());
				})
				.then(function(obj)
				{
					return obj.getLayout();
				})
				.then(function(layout)
				{
					var items = layout.qDimensionList.qItems;
					var dList = items.filter(filterMasterItems);
					
					return Promise.map(dList, function(listItem)
					{
						return stuff.app.destroyDimension(listItem.qInfo.qId)
						.then(function(success)
						{
							var dimInfo = listItem.qMeta.title + ':' + listItem.qInfo.qId;
							logger.info('deleteAllMasterItems::destroyDimension::' + dimInfo + ' succeeded', {module: 'deletemetrics'});
							return listItem;
						});
					});
				})
				.then(function(dimensionArray)
				{
					logger.info("Destroyed " + dimensionArray.length + " measures from " + stuff.appRef.name, {module: 'deletemetrics', app: stuff.appRef.name});
					var metVals = 0;
                    var repoVals = dimensionArray.length;
                    return promiseWhile(function() {
                        // Condition for stopping
                        return repoVals > metVals;
                    }, function() {
                        // Action to run, should return a promise
                        return itemCount.deleteCount(stuff.appRef, appId, 'dimension')
                                .then(function(result)
                                {
                                    repoVals = result
                                    logger.info("Checking repository for the addition of objects: " + repoVals, {module:"deleteMetrics",app: stuff.appRef.name});
                                    return repoVals;
                                })
                                .catch(function(error)
                                {
                                    logger.error(error, {module:"deleteMetrics", method: "During While Loop",app: stuff.appRef.name});
                                });
                    })
                    .timeout(timeout)
                    .then(function() {
                        logger.info('Objects have been deleted from the repo!', {module:"deleteMetrics",app: stuff.appRef.name});
                        logger.info('yay!');
                        return('Done!');
                    })
                    .catch(Promise.TimeoutError, function(error)
                    {
                        logger.info("I timed out.  ", {module: "deleteMetrics",app: stuff.appRef.name});
                        logger.error(error, {module: "deleteMetrics", app: stuff.appRef.name});
                        reject(error);
                    });
				})
				.then(function()
				{
					logger.info('deleteAllMasterItems::saveObjects::Master Items removed.', {module: 'deletemetrics'});
					var res = {
						result: 'delete complete!'
					};
					stuff.global.connection.ws.terminate();
					logger.info('deleteAllMasterItems::Engine connection terminated', {module: 'deletemetrics'});
					resolve(res);
				})
				.catch(function(error)
				{
					logger.error('deleteAllMasterItems::qSocks error::' + error, {module: 'deletemetrics'});
					reject(new Error(error));
				});
			})
			.catch(function(error)
			{
				logger.error('deleteAllMasterItems::Config error::' + error, {module: 'deletemetrics'});
				reject(new Error(error));
			});
		});
	},
	deleteAllMasterItemMeasures : function(appId)
	{
		console.log('Deleting all measures from app: ' + appId);
		var stuff = {};
		stuff.appId = appId;
		deleteMetrics.config(appId)
		.then(function(config)
		{
			qsocks.Connect(config)
			.then(function(global)
			{
				console.log('all good at global');
				return global;
			})
			.then(function(global)
			{
				return global.openDoc(qConfig2.appname, '', '', '', true);
			})
			.then(function(app)
			{
				console.log('app opened');
				return stuff.app = app;
			})
			.then(function(app)
			{
				return app.createSessionObject(deleteMetrics.measureListDef());
			})
			.then(function(obj)
			{
				return obj.getLayout();
			})
			.then(function(layout)
			{
				var items = layout.qMeasureList.qItems;
				var mList = items.filter(filterMasterItems);

				return Promise.all(mList.map(function(listItem)
				{
					return stuff.app.destroyMeasure(listItem.qInfo.qId)
					.then(function(success)
					{
						var measureInfo = listItem.qMeta.title + ':' + listItem.qInfo.qId;
						logger.info('deleteAllMasterItems::destroyMeasure::' + measureInfo + ' succeeded', {module: 'deletemetrics'});
					});
				})); 
			})
			.catch(function(error)
			{
				logger.error('deleteAllMasterItems::qSocks error::' + error, {module: 'deletemetrics'});
				reject(new Error(error));
			});
		})
		.catch(function(error)
		{
			logger.error('deleteAllMasterItems::Config error::' + error, {module: 'deletemetrics'});
			reject(new Error(error));
		});
	},
	deleteAllDimensions : function(appId)
	{
		console.log('Deleting all dimensions from app: ' + appId);
		var stuff = {};
		stuff.appId = appId;
		deleteMetrics.config(appId)
		.then(function(config)
		{
			qsocks.Connect(config)
			.then(function(global)
			{
				console.log('all good at global');
				return global;
			})
			.then(function(global)
			{
				return global.openDoc(qConfig2.appname, '', '', '', true);
			})
			.then(function(app)
			{
				console.log('app opened');
				return stuff.app = app;
			})
			.then(function(app)
			{
				return app.createSessionObject(deleteMetrics.dimensionListDef());
			})
			.then(function(obj)
			{
				return obj.getLayout();
			})
			.then(function(layout)
			{
				var items = layout.qDimensionList.qItems;
				var dList = items.filter(filterMasterItems);

				return Promise.all(dList.map(function(listItem)
				{
					return stuff.app.destroyDimension(listItem.qInfo.qId)
					.then(function(success)
					{
						var dimInfo = listItem.qMeta.title + ':' + listItem.qInfo.qId;
						logger.info('deleteAllMasterItems::destroyDimension::' + dimInfo + ' succeeded', {module: 'deletemetrics'});
					});
				})); 
			})
			.catch(function(error)
				{
					logger.error('deleteAllMasterItems::qSocks error::' + error, {module: 'deletemetrics'});
					reject(new Error(error));
				});
			})
		.catch(function(error)
		{
			logger.error('deleteAllMasterItems::Config error::' + error, {module: 'deletemetrics'});
			reject(new Error(error));
		});
	},
	deleteMeasure : function(appId, qId, callback)
	{

	},
	deleteDimension : function(appId, qId, callback)
	{

	},
	measureListDef : function()
	{
		var measureList = 
		{
			qInfo: 
			{
				qType: "MeasureList"
			},
			qMeasureListDef: 
			{
				qType: "measure",
				qData: {
					title: "/title",
					tags: "/tags"
				}
			}
		};
		return measureList;
	},
	dimensionListDef : function()
	{
		var dimensionList = 
		{
			qInfo:
			{
				qType: "DimensionList"
			},
			qDimensionListDef:
			{
				qType: "dimension",
				qData: {
					title: "/title",
					tags: "/tags"
				}
			}
		};
		return dimensionList;
	}
}

function filterMasterItems(items)
{
	//console.log(items.qMeta.tags);
	if(items.qMeta.tags.indexOf("MasterItem")!=-1)
	{
		//console.log('Found One!');
		return true;
	}
	else
	{
		//console.log('Not a MasterItem');
		return false;
	} 
};




module.exports = deleteMetrics;


var promiseWhile = Promise.method(function(condition, action) 
{
    if (!condition()) return;
    return action().then(promiseWhile.bind(null, condition, action));
});