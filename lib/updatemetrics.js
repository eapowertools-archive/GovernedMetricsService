//updatemetrics.js
var qsocks = require('qsocks');
var Promise = require('bluebird')
var config = require('../config/config');
var winston = require('winston');
var popMeas = require('./popmeasures');
var qrsNotify = require('./qrsNotify');
var qrsCO = require('./qrsChangeOwner');
var fs = require('fs');

//set up logging
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logging.logFile})
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
			logger.info('Calling updateMetrics on application:' + appRef.name + ' with id:' + appId, {module: 'updateMetrics', method: 'updateMetrics'});
			var x = {};
			getAppSubjectAreas(appRef, config.gms.customPropName)
			.then(function(appSubjectAreas)
			{
				x.appSubjectAreas = appSubjectAreas;
				updateMetrics.config(appId)
				.then(function(qConfig)
				{
					qsocks.Connect(qConfig)
					.then(function(global)
					{
						x.global = global;
						logger.info('opening ' + appRef.name + ' without data', {module: 'updateMetrics', method: 'updateMetrics'});
						global.openDoc(appId,'','','',true)
						.then(function(app)
						{
							logger.debug('' + appRef.name + ' opened without data', {module: 'updateMetrics', method: 'updateMetrics'});
							x.app = app;
							x.runDate = buildModDate();
							logger.debug(x.runDate + ' is my run date for this run', {module: 'updateMetrics', method: 'updateMetrics'});
							var dataCount = 0;
							//var reducedData = data.filter(v => v.item[3].qText == subjectArea);
							var reducedData = data.filter(filterMetrics(x.appSubjectAreas));
							return reducedData;
						})
						.then(function(reducedData)
						{
							return popMeas.popMeas(x, appId, reducedData);
						})
						.then(function(arrMetrics)
						{
							x.arrMetrics = arrMetrics;
							logger.info('' + appRef.name + ' with id:' + appId + ' master library updated', {module: 'updateMetrics', method: 'updateMetrics'});
							logger.info('Closing the connection to the app', {module: 'updateMetrics', method: 'updateMetrics'});
							return x.global.connection.close();
							
						})
						.then(function()
						{
							var res = {
								result: 'finished applying metrics to ' + appRef.name + ' with id:' + appId,
								notificationHandle: x.notificationHandle	
							};
							return res;
						})
						.then(function(res)
						{
							resolve(res);
						})
						.catch(function(error)
						{
							logger.error('openDoc::' + error, {module: 'updateMetrics', method: 'updateMetrics'});
							reject(new Error(error));
						});
					})
					.catch(function(error)
					{
						logger.error('qSocks::' + error, {module: 'updateMetrics', method: 'updateMetrics'});
						reject(new Error(error));
					});
				})
				.catch(function(error)
				{
					logger.error('Config::' + error, {module: 'updateMetrics', method: 'updateMetrics'});
					reject(new Error(error));
				});
			})
			.catch(function(error)
			{
				reject(new Error(error));
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
	return new Promise(function (resolve)
	{
		var result = [];
		var itemCount = 0;
		appRef.customProperties.forEach(function(item, index, array)
		{
			itemCount++;
			if(item.definition.name==customProp)
			{
				result.push(item.value);
			}
			
			if(itemCount==array.length)
			{
				resolve(result);
			}
			
			
		});		
	});

}

module.exports= updateMetrics;