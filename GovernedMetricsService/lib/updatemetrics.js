//updatemetrics.js
var qsocks = require('qsocks');
var Promise = require('bluebird')
var config = require('../config/config');
var winston = require('winston');
var popMeas = require('./popmeasures');

//set up logging
var logger = new (winston.Logger)({
	level: config.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});

var updateMetrics = 
{
	getSubjectAreas: function(data, index)
	{
		return new Promise(function(resolve, reject)
		{
			logger.info('Calling getSubjectAreas', {module: 'updateMetrics'});
			//this method gets the unique MetricSubject values
			//from the hypercube
			var flags = [];
			var subjectAreas = [];
			var l = data.length;
			var i;

			for(i=0;i<l;i++)
			{
				var item = data[i];
				if(flags[item[index].qText]) continue;
				flags[item[index].qText] = true;
				subjectAreas.push(item[index].qText);
			}

			if(subjectAreas.length > 0)
			{
				logger.info('Returning getSubjectAreas', {module: 'updateMetrics'});
				resolve(subjectAreas);
			}
			else
			{
				logger.error('getSubjectAreas::No subject areas stored in metrics library', {module: 'updateMetrics'});
				reject('Error: No subject areas returned from hypercube');
			}			
		});
	},
	config : function(cookies, appId)
	{
		return new Promise(function(resolve)
		{
			var qConfig2 =
			{
				host: config.hostname,
				origin: 'https://' + config.hostname,
				isSecure: true,
				rejectUnauthorized: false,
				headers: {
					'Content-Type' : 'application/json',
					'x-qlik-xrfkey' : 'abcdefghijklmnop',
					'Cookie': cookies[0]
				},
				appname: appId
			};
			resolve(qConfig2);
		});
	},
	updateMetrics : function(cookies, appId, ownerId, data, subjectArea)
	{
		return new Promise(function(resolve, reject)
		{
			logger.info('updateMetrics::Calling updateMetrics on application ' + appId, {module: 'updateMetrics'});
			var x = {};
			updateMetrics.config(cookies, appId)
			.then(function(qConfig)
			{
				logger.info('updateMetrics::in application::' + appId, {module: 'updateMetrics'});
				qsocks.Connect(qConfig)
				.then(function(global)
				{
					x.global = global;
					logger.info('updateMetrics::opening ' + appId + ' without data', {module: 'updateMetrics'});
					global.openDoc(appId,'','','',true)
					.then(function(app)
					{
						logger.info('updateMetrics::' + appId + ' opened without data', {module: 'updateMetrics'});
						x.app = app;
						console.log('data length: ' + data.length);
						var dataCount = 0;
						data.forEach(function(item, index, array)
						{
							dataCount++
							var objId = item[3].qText.toLowerCase() + '_' + item[0].qText;
							logger.debug('updateMetrics::' + objId + ' : ' + index, {module: 'updateMetrics'});
							//console.log(objId + ' : ' + index);
							if(item[3].qText==subjectArea)
							{
								popMeas.popMeas(x.app, ownerId, item)
								.then(function(q)
								{
									logger.info('updateMetrics::' + q, {module: 'updateMetrics'});
									logger.debug('updateMetrics::' + objId + ' complete', {module: 'updateMetrics'});
									//add logging that the item has been udpated.	
								})
								.then(function()
								{
									if(dataCount === data.length)
									{
										
										var res = {
											result: 'finished applying metrics to ' + appId,	
										};
										//x.global.connection.ws.terminate();
										logger.info('updateMetrics::' + appId + ' master library updated', {module: 'updateMetrics'});
										resolve(res);
									}
								})
								.catch(function(error)
								{
									logger.error('updateMetrics::Failure::' + error, {module: 'updateMetrics'});
									console.log('Error at updatemetrics during popMeas');
									reject(new Error(error));
								});
							}
						});
					})
					.catch(function(error)
					{
						logger.error('updateMetrics::openDoc::' + error, {module: 'updateMetrics'});
						reject(new Error(error));
					});
				})
				.catch(function(error)
				{
					logger.error('updateMetrics::qSocks::' + error, {module: 'updateMetrics'});
					reject(new Error(error));
				});
			})
			.catch(function(error)
			{
				logger.error('updateMetrics::Config::' + error, {module: 'updateMetrics'});
				reject(new Error(error));
			});
		});
	}
};

module.exports= updateMetrics;