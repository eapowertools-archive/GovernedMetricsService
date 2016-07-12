var Promise = require('Bluebird');
var winston = require('winston');
var config = require('../config/config');
var creator = require('./objCreator');

//set up logging
var logger = new (winston.Logger)({
	level: config.default.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.default.logFile})
    ]
});

var popMeasures =
{
	popMeas: function(x, appId, data)
	{
		return new Promise(function(resolve, reject)
		{
			var app = x.app;
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
			var sequence = Promise.resolve();
			data.forEach(function(data, index, array)
			{
				
				sequence = sequence.then(function()
				{
					dataCount++;
					console.log(dataCount);
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
					return tags;
				})
				.then(function(tags)
				{
					var objId = data[3].qText.toLowerCase() + '_' + data[0].qText;
					logger.debug('popMeas::Calling popMeas for ' + objId + ' on application: ' + app.name, {module: 'popMeasures'});
					logger.debug(data[1].qText.toLowerCase(), {module: 'popMeasures'});
					
					if(data[1].qText.toLowerCase()=='dimension')
					{
						 return creator.dimCreator(app, boolPublishedApp, data, tags, objId)
						.then(function(result)
						{
							if(result.changed)
							{
								logger.debug('adding ' + result.objId, {module: 'popMeasures'});
								arrNewMetrics.push(result.objId);
							}
						})
						.catch(function(error)
						{
							logger.error('Failure::' + error, {module: 'popMeasures'});
							reject(error);
						});
					}
					else if(data[1].qText.toLowerCase()=='measure')
					{
						return creator.measCreator(app, boolPublishedApp, data, tags, objId)
						.then(function(result)
						{
							if(result.changed)
							{
								logger.debug('adding ' + result.objId, {module: 'popMeasures'});
								arrNewMetrics.push(result.objId);							
							}
						})
						.catch(function(error)
						{
							logger.error('Failure::' + error, {module: 'popMeasures'});
							reject(error);
						});
					}
				})
				.then(function()
				{
					if(dataCount === array.length)
					{
						//Sending back the new objects we've created.
						return app.saveObjects()
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
				})
				.catch(function(error)
				{
					logger.error(error, {module: 'popMeasures'});
					reject(error)
				});
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