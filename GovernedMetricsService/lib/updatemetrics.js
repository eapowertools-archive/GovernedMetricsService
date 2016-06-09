//updatemetrics.js
var qsocks = require('qsocks');
var Promise = require('bluebird')
var config = require('../config/config');
var winston = require('winston');
var popMeas = require('./popmeasures');
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
	updateMetrics : function(appId, ownerId, data, subjectArea)
	{
		return new Promise(function(resolve, reject)
		{
			logger.info('updateMetrics::Calling updateMetrics on application ' + appId, {module: 'updateMetrics'});
			var x = {};
			updateMetrics.config(appId)
			.then(function(qConfig)
			{
				qsocks.Connect(qConfig)
				.then(function(global)
				{
					x.global = global;
					logger.info('updateMetrics::opening ' + appId + ' without data', {module: 'updateMetrics'});
					global.openDoc(appId,'','','',true)
					.then(function(app)
					{
						logger.debug(app, {module: 'blaaaaahh'});
						logger.debug('updateMetrics::' + appId + ' opened without data', {module: 'updateMetrics'});
						x.app = app;
						console.log('data length: ' + data.length);
						var dataCount = 0;
						//var reducedData = data.filter(v => v.item[3].qText == subjectArea);
						var reducedData = data.filter(filterMetrics(subjectArea));
						popMeas.popMeas(x.app, appId, reducedData)
						.then(function(arrMetrics)
						{
							//Once we have done all the creating, 
							//then we can change all of the owning.
							qrsCO.getRepoIDs(appId, subjectArea, arrMetrics)
							.then(function(response)
							{
								logger.debug('list of engineObjectIDs::' + JSON.stringify(response),{module: 'updateMetrics'});
								qrsCO.changeOwner(appId, response, ownerId)
								.then(function()
								{
									logger.info('Change Ownership work complete',{module: 'updateMetrics'});
								})
								.then(function()
								{
									var res = {
										result: 'finished applying metrics to ' + appId	
									};
									//x.global.connection.ws.terminate();
									logger.info('updateMetrics::' + appId + ' master library updated', {module: 'updateMetrics'});
									logger.info('Closing the connection to the app', {module: 'updateMetrics'});
									x.global.connection.close();
									resolve(res);
								})
								.catch(function(error)
								{
									logger.error('updateMetrics::Failure::' + error, {module: 'updateMetrics'});
									reject(new Error(error));
								});
							})
							.catch(function(error)
							{
								logger.error('updateMetrics::Failure::' + error, {module: 'updateMetrics'});
								reject(new Error(error));
							});		
						})
						.catch(function(error)
						{
							logger.error('updateMetrics::Failure::' + error, {module: 'updateMetrics'});
							console.log('Error at updatemetrics during popMeas');
							reject(new Error(error));
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

function filterMetrics(subjectArea)
{
	return function(obj)
	{
		return obj[3].qText == subjectArea;
	}	
}

module.exports= updateMetrics;