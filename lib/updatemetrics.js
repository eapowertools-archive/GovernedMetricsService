//updatemetrics.js
var qsocks = require('qsocks');
var Promise = require('bluebird')
var config = require('../config/config');
var winston = require('winston');
var objectMgmt = require('./objectManagement');
var changeOwner = require('./changeOwner');
var publishMetrics = require('./publishMetrics');
var fs = require('fs');
require('winston-daily-rotate-file');

//set up logging
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.DailyRotateFile)({ filename: config.logging.logFile, prepend:true})
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
				logger.debug('Returning getSubjectAreas', {module: 'updateMetrics'});
				resolve(subjectAreas);
			}
			else
			{
				logger.error('getSubjectAreas::No subject areas stored in metrics library', {module: 'updateMetrics'});
				reject('Error: No subject areas returned from hypercube');
			}			
		});
	},
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
	updateMetrics : function(appRef, data)
	{
		return new Promise(function(resolve, reject)
		{
			var appId = appRef.id;
			var ownerId = appRef.owner.id;
			logger.info('Calling updateMetrics on application:' + appRef.name + ' with id:' + appId, {module: 'updateMetrics', method: 'updateMetrics',app: appRef.name});
			var x = {};
		 
			return getAppSubjectAreas(appRef, config.gms.customPropName)
			.then(function(appSubjectAreas)
			{
				logger.info(appSubjectAreas, {module: 'updateMetrics', method: 'updateMetrics',app: appRef.name});
				x.appSubjectAreas = appSubjectAreas;
				return objectMgmt.manageObjects(appRef, appId, data, appSubjectAreas)
				.then(function(message)
				{
					logger.info(message, {module: 'updateMetrics',app: appRef.name});
					return changeOwner.changeAppObjectOwner(appRef, config.qrs.repoAccountUserDirectory, config.qrs.repoAccountUserId, appId)
					.then(function(message)
					{
						logger.info(message, {module: 'updateMetrics',app: appRef.name});
						return publishMetrics.publishMetrics(appRef, appId)
						.then(function(message)
						{
							logger.info(message, {module: 'updateMetrics',app: appRef.name});
							var outcome = 
							{
								result: message
							};
							resolve(outcome);
						})
						.catch(function(error)
						{
							logger.debug(error, {module: 'updateMetrics',app: appRef.name});
						});
					})
					.catch(function(error)
					{
						logger.debug(error, {module: 'updateMetrics',app: appRef.name});
					});
				})
				.catch(function(error)
				{
					logger.debug(error, {module: 'updateMetrics',app: appRef.name});
				});
			})
			.catch(function(error)
			{
				logger.debug(error, {module: 'updateMetrics',app: appRef.name});
				reject(error);
			});
		});
	}
};

function buildModDate()
{   
    var d = new Date();
    return d.toISOString();
}

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

function getAppSubjectAreas(appRef, customProp)
{
	return new Promise(function(resolve)
	{
		var result = appRef.customProperties.filter(function(item)
		{
			return item.definition.name == customProp;
		})

		var values = result.map(function(item)
		{
			return item.value
		});

		resolve(values);

	});
	// return new Promise(function (resolve)
	// {
	// 	var result = [];
	// 	var itemCount = 0;
	// 	return Promise.all(appRef.customProperties.map(function(item)
	// 	{
	// 		if(item.definition.name==customProp)
	// 		{
	// 			return item.value;
	// 		}
	// 	}))
	// 	.then(function(arrValues)
	// 	{
	// 		resolve(arrValues);
	// 	});
	// });

}

module.exports= updateMetrics;