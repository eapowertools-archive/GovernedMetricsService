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
			logger.info('Calling deleteAll', {module: 'doWork'});
			var message;
			var x = {};
			login.login()
			.then(function(cookies)
			{
				x.cookies = cookies;
				getdoc.getDocId(x.cookies, appname.appname)
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
						logger.error('deleteAll failure::' + error, {module: 'doWork'});
						reject(new Error(error));
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
			logger.info('Calling updateAll', {module: 'doWork'});
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
						subjectAreas.forEach(function(subjectArea)
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
								if(result.length < 1)
								{
									//do nothing
								}
								else
								{
									var itemsProcessed = 0;
									logger.info('updateAll::applying metrics for subjectArea::' + val, {module: 'doWork'});
									result.forEach(function(item, index, array)
									{
										itemsProcessed++
										logger.info('updateAll::updateMetrics', {module: 'doWork'});
										updateMetrics.updateMetrics(x.cookies, item.id, y.matrix, val)
										.then(function(outcome)
										{
											//do nothing
										})
										.catch(function(error)
										{
											logger.error('updateAll::' + error, {module: 'doWork'});
											reject(new Error(error));
										});
										if(itemsProcessed == array.length)
										{
											logger.info('updateAll::Completed updating metrics', {module: 'doWork'});
											var res = 
											{
												result: 'Metric Application Complete',
												cookies: x.cookies
											};
											resolve(res);
										}		
									});
								}
							})
							.catch(function(error)
							{
								logger.error('updateAll::qrsInteract::' + error, {module: 'doWork'});
								reject(new Error(error));
							});
						});
					})
					.catch(function(error)
					{
						logger.error('updateAll::getSubjectAreas::' + error, {module: 'doWork'});
						reject(new Error(error));
					});
				})
				.catch(function(error)
				{
					logger.error('getMetricsTable::' + error, {module: 'doWork'});
					reject(new Error(error));
				});
			})
			.catch(function(error)
			{
				logger.error('updateAll::login::' + error, {module: 'doWork'});
				reject(new Error(error));
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
				x.cookies = cookies;
				var path = "https://" + config.hostname + ":" + config.qrsPort + "/qrs/app"
				path += "?xrfkey=ABCDEFG123456789&filter=name eq '" + config.appName + "'";
				logger.info('updateAll::qrsInteract.get::' + path, {module: 'doWork'});
				qrsInteract.get(path)
				.then(function(result)
				{
					logger.info('updateAll::reloadMetrics', {module: 'doWork'});
					reloadMetrics.reloadMetrics(cookies, result[0].id)
					.then(function(response)
					{
						logger.info('updateAll success::' + response, {module: 'doWork'});
						var res = {
							complete: true,
							result: response,
							cookies: x.cookies
						};
						resolve(res);				
					})
					.catch(function(error)
					{
						logger.error('updateAll::reloadMetrics::' + error, {module: 'doWork'});
						reject(new Error(error));
					});
				})
				.catch(function(error)
				{
					logger.error('updateAll::qrsInteract::' + error, {module: 'doWork'});
					reject(new Error(error));
				});
			})
			.catch(function(error)
			{
				logger.error('updateAll::login::' + error, {module: 'doWork'});
				reject(new Error(error));
			});
		});
	}			
};

module.exports = doWork;