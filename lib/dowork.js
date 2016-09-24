var Promise = require('bluebird')
var config = require('../config/config');
var getdoc = require('./getdocid');
var gethypercube = require('./getmetricshypercube');
var updateMetrics = require('./updatemetrics');
var qrsInteract = require('./qrsInstance');
var deleteMetrics = require('./deletemetrics');
var reloadMetrics = require('./reloadmetrics');
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

var doWork = {
	getDoc: function(body)
	{
		return new Promise(function(resolve, reject)
		{
			logger.debug('Calling getDoc', {module: 'doWork'});
			getdoc.getDocId(body)
			.then(function(doc)
			{
				logger.debug('getDoc success', {module: 'doWork'});
				resolve(doc);					
			})
			.catch(function(error)
			{
				logger.error('getDoc failure::' + error, {module: 'doWork'});
				reject(new Error(error));
			});
		});
	},
	deleteFromApp: function(appname)
	{
		return new Promise(function(resolve, reject)
		{
			logger.info('deleteFromApp::Calling deleteFromApp', {module: 'doWork'});
			var message;
			var x = {};
			
			getdoc.getDocId(appname.appname)
			.then(function(doc)
			{
				deleteMetrics.deleteAllMasterItems(doc)
				.then(function(result)
				{
					var res = 
					{
						result: result.result
					};
					//result.engine.connection.ws.terminate();
					logger.info('deleteFromApp success', {module: 'doWork'});
					resolve(res);
				})
				.catch(function(error)
				{
					logger.error('deleteFromApp failure::' + JSON.stringify(error), {module: 'doWork'});
					reject(error);
				});
			})
			.catch(function(error)
			{
				logger.error('deleteFromApp failure::' + error, {module: 'doWork'});
				reject(new Error(error));
			});
		});
	},
	addAll: function()
	{
		logger.info('Calling addAll, which forwards to updateAll', {module: 'doWork'});
		doWork.updateAll();
	},
	updateAll: function()
	{
		return new Promise(function(resolve, reject)
		{
			var propExistPath = "/custompropertydefinition";
			propExistPath += "?filter=name eq '" + config.gms.customPropName + "'";
			return qrsInteract.Get(propExistPath)
			.then(function(customProp)
			{
				if(customProp !== undefined || customProp.length != 0)
				{
					logger.info('Found ' + customProp[0].name + ' in list of custom properties', {module: 'doWork'});
					var x = {};
					
					var y = {};
					logger.debug('getMetricsTable', {module: 'doWork'});
					return gethypercube.getMetricsTable()
					.then(function(matrix)
					{
						y.matrix = matrix;
						logger.debug(y.matrix, {module: 'doWork'});
						logger.debug('getSubjectAreas', {module: 'doWork'});
						return updateMetrics.getSubjectAreas(y.matrix, 3)
						.then(function(subjectAreas)
						{
							logger.debug('subjectAreas:' + JSON.stringify(subjectAreas), {module: 'doWork'});
							console.log('array length: ' + subjectAreas.length)
							//so now I have subject areas, but I want the apps so I can loop through the apps that have subject areas 
							//and at one time update all the metrics for that app based on values applied
							//So I want apps that have the custom prop applied with values identified first, then match subjectarea
							//with values applied and run through.
							var appCount = 0;
							var appCheckPath = "/app/full"
							appCheckPath += "?filter=customProperties.definition.name eq '";
							appCheckPath += config.gms.customPropName + "' and customProperties.value ne null";
							logger.debug('Getting list of apps that have ' + config.gms.customPropName + ' applied', {module: 'doWork', method: 'updateAll'});
							return qrsInteract.Get(appCheckPath)
							.then(function(appRefList)
							{
								return Promise.all(appRefList.map(function(appRef)
								{
									logger.info('Updating app:' + appRef.name + ' with id:' + appRef.id + 'currently owned by ' + 
									appRef.owner.userDirectory + '\\' + appRef.owner.userId, {module: 'doWork', method: 'updateAll'});
									return updateMetrics.updateMetrics(appRef, y.matrix)
									.then(function(outcome)
									{
										logger.info('' + outcome.result + '::' + appRef.name, {module: 'doWork', method: 'updateAll'});	
									})
									.catch(function(error)
									{
										logger.error('' + error, {module: 'doWork', method: 'updateAll'});
										reject(error);
									});
								}));
							})
							.then(function()
							{
								logger.info('All apps updated.', {module: 'doWork', method: 'updateAll'});
								var res = {
									result: 'All apps processed.'
								};
								resolve(res);
							})
							.catch(function(error)
							{
								logger.error(error, {module: 'doWork', method: 'updateAll'});
								reject(error);
							});
						})
						.catch(function(error)
						{
							logger.error('getSubjectAreas::' + error, {module: 'doWork', method: 'updateAll'});
							reject(error);
						});
					})
					.catch(function(error)
					{
						logger.error('getMetricsTable::' + error, {module: 'doWork', method: 'updateAll'});
						reject(error);
					});
				}
			})
			.catch(function(error)
			{
				var rejection = {
					message: 'No custom property named ' + config.gms.customPropName,
					customProperty: config.gms.customPropName
				};
				logger.error(JSON.stringify(rejection), {module: 'doWork', method: 'updateAll'});
				reject(JSON.stringify(rejection));
			});
		});		
	},
	reloadMetricsApp : function()
	{
		return new Promise(function(resolve, reject)
		{
			var x={};
			getdoc.getAppReference(config.gms.appName)
			.then(function(app)
			{
				x.app = app;
				logger.debug('reloadMetricsApp::reloadMetrics', {module: 'doWork'});
				reloadMetrics.reloadMetrics(x.app, config.gms.taskName)
				.then(function(response)
				{
					logger.debug('reloadMetricsApp success::' + response, {module: 'doWork'});
					var res = {
						complete: true,
						result: response
					};
					resolve(res);				
				})
				.catch(function(error)
				{
					logger.error('reloadMetricsApp::reloadMetrics::' + error, {module: 'doWork'});
					reject(new Error(error));
				});	
	
			})
			.catch(function(error)
			{
				logger.error('reloadMetricsApp::getAppReference::' + JSON.stringify(error), {module: 'doWork'});
			});
		});
	}
};

module.exports = doWork;