var qsocks = require('qsocks');
var Promise = require('bluebird')
var config = require('../config/config');
var getdoc = require('./getdocid');
var gethypercube = require('./getmetricshypercube');
var updateMetrics = require('./updatemetrics');
var qrsInteract = require('./qrsinteractions');
var killSession = require('./killsession');
var login = require('./login');
var deleteMetrics = require('./deletemetrics');
var reloadMetrics = require('./reloadmetrics');
var winston = require('winston');

//set up logging
var logger = new (winston.Logger)({
	level: config.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});

var doWork = {
	getDoc: function(body)
	{
		return new Promise(function(resolve, reject)
		{
			logger.info('Calling getDoc', {module: 'doWork'});
			getdoc.getDocId(body)
			.then(function(doc)
			{
				logger.info('getDoc success', {module: 'doWork'});
				resolve(doc);					
			})
			.catch(function(error)
			{
				logger.error('getDoc failure::' + error, {module: 'doWork'});
				reject(new Error(error));
			});
		});
	},
	deleteAll: function(appname)
	{
		return new Promise(function(resolve, reject)
		{
			logger.info('deleteAll::Calling deleteAll', {module: 'doWork'});
			var message;
			var x = {};
			login.login()
			.then(function(cookies)
			{
				x.cookies = cookies;
				getdoc.getDocId(appname.appname)
				.then(function(doc)
				{
					deleteMetrics.deleteAllMasterItems(x.cookies, doc)
					.then(function(result)
					{
						var res = 
						{
							result: result.result,
							cookies: x.cookies
						};
						//result.engine.connection.ws.terminate();
						logger.info('deleteAll success', {module: 'doWork'});
						resolve(res);
					})
					.catch(function(error)
					{
						logger.error('deleteAll failure::' + JSON.stringify(error), {module: 'doWork'});
						reject(error);
					});
				});
			})
			.catch(function(error)
			{
				logger.error('deleteAll failure::' + error, {module: 'doWork'});
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
			var propExistPath = "https://" + config.hostname + ":" + config.qrsPort + "/qrs/custompropertydefinition";
			propExistPath += "?xrfkey=ABCDEFG123456789&filter=name eq '" + config.customPropName + "'";
			qrsInteract.get(propExistPath)
			.then(function(customProp)
			{
				if(customProp !== undefined || customProp.length != 0)
				{
					logger.info('updateAll::Found ' + customProp[0].name + ' in list of custom properties', {module: 'doWork'});
					var x = {};
					login.login()
					.then(function(cookies)
					{
						x.cookies = cookies;
						var y = {};
						logger.info('updateAll::getMetricsTable', {module: 'doWork'});
						gethypercube.getMetricsTable(cookies)
						.then(function(matrix)
						{
							y.matrix = matrix;
							logger.info('updateAll::getSubjectAreas', {module: 'doWork'});
							updateMetrics.getSubjectAreas(y.matrix, 3)
							.then(function(subjectAreas)
							{
								logger.debug('updateAll::subjectAreas:' + JSON.stringify(subjectAreas), {module: 'doWork'});
								console.log('array length: ' + subjectAreas.length)
								subjectAreas.forEach(function(subjectArea,index, array)
								{
									
									logger.info('updateAll::current subjectarea::' + subjectArea, {module: 'doWork'});
									var val = subjectArea;
									var path = "https://" + config.hostname + ":" + config.qrsPort + "/qrs/app"
									path += "?xrfkey=ABCDEFG123456789&filter=customProperties.definition.name eq '";
									path += config.customPropName + "' and customProperties.value eq '" + val + "'";
									logger.info('updateAll::qrsInteract.get::' + path, {module: 'doWork'});
									qrsInteract.get(path)
									.then(function(result)
									{
										
										if(result===undefined || result.length == 0)
										{
											logger.info('updateAll::no applications with custom property '+ val, {module: 'doWork'});
											/*if(subjectAreasProcessed == array.length)
											{
												logger.info('updateAll::no applications with custom properties from ' + config.customPropName, {module: 'doWork'});
												var res = 
												{
													result: 'No Metrics Applied to apps because no apps using custom property ' + config.customPropName,
													customProperty: config.customPropName,
													cookies: x.cookies
												};
												resolve(res);
											}*/
										}
										else
										{
											logger.info('updateAll::applications with custom property '+ val + '::' + JSON.stringify(result), {module: 'doWork'});
											logger.info('updateAll::result array has ' + result.length + ' entries', {module: 'doWork'});
											var resultItems = 0;
											result.forEach(function(item, index, array)
											{
												resultItems++;
												logger.info('updateAll::updateMetrics on ' + item.name, {module: 'doWork'});
												updateMetrics.updateMetrics(x.cookies, item.id, y.matrix, val)
												.then(function(outcome)
												{
													logger.info('updateAll::' + outcome.result + '::' + item.name, {module: 'doWork'});	
												})
												.then(function()
												{
													if(resultItems===result.length)
													{
														var res = 
														{
															result: 'Metric Application Complete',
															cookies: x.cookies
														};
														resolve(res);
													}
												})
												.catch(function(error)
												{
													logger.error('updateAll::' + error, {module: 'doWork'});
													reject(error);
												});	
											});
										}
									})
									.catch(function(error)
									{
										logger.error('updateAll::qrsInteract::' + error, {module: 'doWork'});
										reject(error);
									});
								});
							})
							.catch(function(error)
							{
								logger.error('updateAll::getSubjectAreas::' + error, {module: 'doWork'});
								reject(error);
							});
						})
						.catch(function(error)
						{
							logger.error('updateAll::getMetricsTable::' + error, {module: 'doWork'});
							reject(error);
						});
					})
					.catch(function(error)
					{
						logger.error('updateAll::login::' + error, {module: 'doWork'});
						reject(error);
					});
				}
			})
			.catch(function(error)
			{
				var rejection = {
					message: 'No custom property named ' + config.customPropName,
					customProperty: config.customPropName
				};
				logger.error('updateAll::' + JSON.stringify(rejection), {module: 'doWork'});
				reject(JSON.stringify(rejection));
			});
		});		
	},
	reloadMetricsApp : function()
	{
		return new Promise(function(resolve, reject)
		{
			var x={};
			login.login()
			.then(function(cookies)
			{
				logger.info('reloadMetricsApp::reloadMetrics', {module: 'doWork'});
				reloadMetrics.reloadMetrics(config.taskName)
				.then(function(response)
				{
					logger.info('reloadMetricsApp success::' + response, {module: 'doWork'});
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
				logger.error('reloadMetricsApp::login::' + error, {module: 'doWork'});
				reject(new Error(error));
			});
		});
	}			
};

module.exports = doWork;