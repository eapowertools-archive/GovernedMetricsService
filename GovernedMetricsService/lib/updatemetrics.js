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
				host: config.hostname,
				port: config.enginePort,
				origin: 'https://' + config.hostname,
				isSecure: true,
				rejectUnauthorized: false,
				headers: {
					'Content-Type' : 'application/json',
					'x-qlik-xrfkey' : 'abcdefghijklmnop',
					'X-Qlik-User': config.repoAccount
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
			getAppSubjectAreas(appRef, config.customPropName)
			.then(function(appSubjectAreas)
			{
				x.appSubjectAreas = appSubjectAreas;
				qrsNotify.setNotification(appRef)
				.then(function(result)
				{
					x.notificationHandle = result;
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
								var dataCount = 0;
								//var reducedData = data.filter(v => v.item[3].qText == subjectArea);
								var reducedData = data.filter(filterMetrics(x.appSubjectAreas));
								popMeas.popMeas(x, appId, reducedData)
								.then(function(arrMetrics)
								{
									
									//Once we have done all the creating, close the app
									x.global.connection.close();
									logger.info('' + appRef.name + ' with id:' + appId + ' master library updated', {module: 'updateMetrics', method: 'updateMetrics'});
									logger.info('Closing the connection to the app', {module: 'updateMetrics', method: 'updateMetrics'});
											
									//Now work on changing ownership.  //Check the time and look for changes 
									qrsCO.getRepoIDs(appRef, x.runDate, arrMetrics)
									.then(function(response)
									{
										logger.debug('list of engineObjectIDs::' + JSON.stringify(response),{module: 'updateMetrics', method: 'updateMetrics'});
										if(response.length >0)
										{
											qrsCO.changeOwner(appId, response, ownerId)
											.then(function()
											{
												logger.info('Change Ownership work complete',{module: 'updateMetrics', method: 'updateMetrics'});
											})
											.then(function()
											{
												var res = {
													result: 'finished applying metrics to ' + appRef.name + ' with id:' + appId	
												};
												resolve(res);
											})
											.catch(function(error)
											{
												logger.error('Failure::' + error, {module: 'updateMetrics', method: 'updateMetrics'});
												reject(new Error(error));
											});
										}
										else
										{
											var res = {
												result: 'No Repo IDs to change ownership on for ' + appRef.name + ' with id:' + appId	
											};
											resolve(res);
										}
									})
									.catch(function(error)
									{
										logger.error('Failure::' + error, {module: 'updateMetrics', method: 'updateMetrics'});
										reject(new Error(error));
									});		
								})
								.catch(function(error)
								{
									logger.error('Failure::' + error, {module: 'updateMetrics', method: 'updateMetrics'});
									console.log('Error at updatemetrics during popMeas');
									reject(new Error(error));
								});
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
					logger.error('setNotification::' + error, {module: 'updateMetrics', method: 'updateMetrics'});
					reject(new Error(error));
				});
			})
			.catch(function(error)
			{
				logger.error('appSubjectAreas::' + error, {module: 'updateMetrics', method: 'updateMetrics'});
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