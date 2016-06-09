var Promise = require('Bluebird');
var winston = require('winston');
var config = require('../config/config');
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
	popMeas: function(app, appId, data)
	{
		return new Promise(function(resolve, reject)
		{
			var arrNewMetrics = [];
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
				//logger.debug(dataCount + ' of ' + array.length + ' metrics', {module: 'popMeasures'});
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
				logger.debug('popMeas::Calling popMeas for ' + objId + ' on application: ' + app.name, {module: 'popMeasures'});
				
				if(data[1].qText.toLowerCase()=='dimension')
				{
					creator.dimCreator(app, boolPublishedApp, data, tags, objId)
					.then(function(result)
					{
						logger.debug('adding ' + result, {module: 'popMeasures'});
						arrNewMetrics.push(result);
					})
					.catch(function(error)
					{
						logger.error('Failure::' + error, {module: 'popMeasures'});
						reject(error);
					});
				}
				else if(data[1].qText.toLowerCase()=='measure')
				{
					creator.measCreator(app, boolPublishedApp, data, tags, objId)
					.then(function(result)
					{
						logger.debug('adding ' + result, {module: 'popMeasures'});
						arrNewMetrics.push(result);
					})
					.catch(function(error)
					{
						logger.error('Failure::' + error, {module: 'popMeasures'});
						reject(error);
					});
				}
				
				if(dataCount === array.length)
				{
					//Sending back the new objects we've created.
					app.saveObjects()
					.then(function()
					{
						logger.info('Completed creator process.  Proceeding to changing ownership section', {module: 'popMeasures'});
						//logger.debug(JSON.stringify(arrNewMetrics), {module: 'popMeasure'});
						resolve(arrNewMetrics);
						//When the array finishes						
					})
					.catch(function(error)
					{
						logger.error(error, {module: 'popMeasures'});
						reject(error);
					});
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
	}
}

module.exports = popMeasures;