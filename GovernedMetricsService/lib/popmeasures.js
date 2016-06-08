var Promise = require('Bluebird');
var winston = require('winston');
var config = require('../config/config');
var qrsCO = require('./qrsChangeOwner');
var creator = require('./objCreator');

//set up logging
var logger = new (winston.Logger)({
	level: config.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});

var popMeasures =
{
	popMeas: function(app, appId, ownerId, data)
	{
		var arrNewMetrics = [];
		return new Promise(function(resolve)
		{
			var boolPublishedApp = popMeasures.isAppPublished(app);
			if(boolPublishedApp)
			{
				logger.info('popMeas::App ' + appId + ' is published.', {module: 'popMeasures'});
			}
			else
			{
				logger.info('popMeas::App ' + appId + ' is not published.', {module: 'popMeasures'});				
			}
			var dataCount = 0;
			data.forEach(function(data, index, array)
			{
				dataCount++;
				var tags = []
				var tagString = data[4].qText.split(";");
				tagString.forEach(function(tagValue)
				{
					tags.push(tagValue);
				});

				tags.push("MasterItem");
				tags.push(data[3].qText);
				tags.push(data[3].qText.toLowerCase() + '_' + data[0].qText);

				var objId = data[3].qText.toLowerCase() + '_' + data[0].qText;
				logger.debug('popMeas::Calling popMeas for ' + objId, {module: 'popMeasures'});
				
				if(data[1].qText.toLowerCase()=='dimension')
				{
					creator.dimCreator(app, boolPublishedApp, data, tags, objId)
					.then(function(result)
					{
						arrNewMetrics.push(result);
					})
					.catch(function(error)
					{
						reject(error);
					});
				}
				else if(data[1].qText.toLowerCase()=='measure')
				{
					creator.measCreator(app, boolPublishedApp, data, tags, objId)
					.then(function(result)
					{
						arrNewMetrics.push(result);
					})
					.catch(function(error)
					{
						reject(error);
					});
				}
				
				if(dataCount === array.length)
				{
					//Sending back the new objects we've created.
					resolve(arrNewMetrics);
					//When the array finishes
					
										
				}
					
			});
			
		});
	},
	isAppPublished: function(app)
	{
		app.getAppLayout().then(function(appLayout)
		{
			return appLayout.published;
		});
	},
	changeOwner: function(appId, objId, ownerId)
	{
		return new Promise(function(resolve)
		{
			qrsCO.changeOwner(appId, objId, ownerId)
			.then(function()
			{
				resolve(true)
			})
			.catch(function(error)
			{
				reject(error);
			});
		})
	},
	
}

module.exports = popMeasures;