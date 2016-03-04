//updatemetrics.js
var qsocks = require('qsocks');
var Promise = require('bluebird')
var config = require('../config/config');
var winston = require('winston')

//set up logging
var logger = new (winston.Logger)({
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
	updateMetrics : function(cookies, appId, data, subjectArea)
	{
		return new Promise(function(resolve, reject)
		{
			logger.info('Calling updateMetrics', {module: 'updateMetrics'});
			var x = {};
			updateMetrics.config(cookies, appId)
			.then(function(qConfig)
			{
				logger.info('updateMetrics in application::' + appId, {module: 'updateMetrics'});
				qsocks.Connect(qConfig)
				.then(function(global)
				{
					x.global = global;
					logger.info('updateMetrics::opening ' + appId + ' without data', {module: 'updateMetrics'});
					global.openDoc(appId,'','','',true)
					.then(function(app)
					{
						logger.info('updateMetrics::' + appId + ' opened without data', {module: 'updateMetrics'});
						console.log(app);
						x.app = app;
						var itemsProcessed = 0;
						
						data.forEach(function(item, index, array)
						{
							itemsProcessed++;
							var objId = item[3].qText.toLowerCase() + '_' + item[0].qText;
							logger.debug('updateMetrics::' + objId + ' : ' + index, {module: 'updateMetrics'});
							//console.log(objId + ' : ' + index);
							if(item[3].qText==subjectArea)
							{
								updateMetrics.popMeas(x.app, item)
								.then(function(q)
								{
									//add logging that the item has been udpated.	
								})
								.catch(function(error)
								{
									logger.error('updateMetrics::Failure::' + error, {module: 'updateMetrics'});
									console.log('Error at updatemetrics during popMeas');
									reject(new Error(error));
								});
							}
							if(itemsProcessed===array.length)
							{
								//last one
								var res = {
									result: 'finished applying metrics to ' + appId,	
								};
								x.global.connection.ws.terminate();
								logger.info('updateMetrics::' + appId + ' master library updated', {module: 'updateMetrics'});
								resolve(res);
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
	},
	popMeas: function(app, data)
	{
		return new Promise(function(resolve)
		{

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
			
			logger.info('Calling popMeas for ' + objId, {module: 'updateMetrics'});

			if(data[1].qText.toLowerCase()=='dimension')
			{
	//			console.log('Creating dimension: ' + data[2].qText);
				var dim = {
					qInfo: {
						qId: data[3].qText.toLowerCase() + '_' + data[0].qText,
						qType: data[1].qText.toLowerCase()
					},
					qDim: {
						qGrouping: "N",
						qFieldDefs: [data[6].qText],
						title: data[2].qText,
						qFieldLabels: [data[6].qText]
					},
					qMetaDef: {
						title: data[2].qText,
				        description: data[5].qText,
				        qSize: -1,
				        sourceObject: "",
				        draftObject: "",
				        tags: tags
					}
				};
				//start with app.getWhatever
				app.getDimension(objId)
				.then(function(result)
				{
					if(result==null)
					{
						app.createDimension(dim)
						.then(function()
						{
							
							app.getDimension(objId)
							.then(function(ready)
							{
								ready.publish()
								.then(function()
								{
									logger.info('popMeas::Created Dimension' + data[2].qtext, {module: 'updateMetrics'});
									resolve('Created Dimension: ' + data[2].qtext);
								})
								.catch(function(error)
								{
									logger.error('popMeas::publish::' + error, {module: 'updateMetrics'});
									reject(new Error(error));
								});
							})
							.catch(function(error)
							{
								logger.error('popMeas::getDimension::' + error, {module: 'updateMetrics'});
								reject(new Error(error));
							});
						})
						.catch(function(error)
						{
							logger.error('popMeas::createDimension::' + error, {module: 'updateMetrics'});
							reject(new Error(error));							
						});
					}
					else
					{
						result.setProperties(dim)
						.then(function(ready)
						{
							
							result.publish()
							.then(function()
							{
								logger.info('popMeas::Updated Dimension' + data[2].qtext, {module: 'updateMetrics'});
								resolve('Updated Dimension: ' + data[2].qText);
							})
							.catch(function(error)
							{
								logger.error('popMeas::publish::' + error, {module: 'updateMetrics'});
								reject(new Error(error));
							});
						})
						.catch(function(error)
						{
							logger.error('popMeas::setProperties::' + error, {module: 'updateMetrics'});
							reject(new Error(error));							
						});
					}
				})
				.catch(function(error)
				{
					logger.error('popMeas::getDimension::' + error, {module: 'updateMetrics'});
					reject(new Error(error));
				});
			}
			else
			{
	//			console.log('Creating measure: ' + data[2].qText);			
				var meas = {
					qInfo: {
				        qId: data[3].qText.toLowerCase() + '_' + data[0].qText,
				        qType: data[1].qText.toLowerCase()
				    },
				    qMeasure: {
				        qLabel: data[2].qText,
				        qDef: data[6].qText,
				        qGrouping: "N",
				        qExpressions: [],
				        qActiveExpression: 0
				    },
				    qMetaDef: {
				        title: data[2].qText,
				        description: data[5].qText,
				        qSize: -1,
				        sourceObject: "",
				        draftObject: "",
				        tags: tags
				   	}
				};
				//start with app.getWhatever
				app.getMeasure(objId)
				.then(function(result)
				{
					if(result==null)
					{
						//console.log('handle is null');
						//console.log('create a measure');
						app.createMeasure(meas)
						.then(function(ready)
						{
							
							app.getMeasure(objId)
							.then(function(ready)
							{
								ready.publish()
								.then(function()
								{
									logger.info('popMeas::Created Measure' + data[2].qtext, {module: 'updateMetrics'});
									resolve('Created Measure: ' + data[2].qText);
								})
								.catch(function(error)
								{
									logger.error('popMeas::Publish' + error, {module: 'updateMetrics'});
									reject(new Error(error));
								});
							})
							.catch(function(error)
							{
								logger.error('popMeas::getMeasure' + error, {module: 'updateMetrics'});
								reject(new Error(error));
							});
						})
						.catch(function(error)
						{
							logger.error('popMeas::createMeasure' + error, {module: 'updateMetrics'});
							reject(new Error(error));							
						});
					}
					else
					{
						//console.log('MasterItems exist');
						//console.log('update measure');
						result.setProperties(meas)
						.then(function(ready)
						{
							result.publish()
							.then(function()
							{
								logger.info('popMeas::Updated Measure' + data[2].qtext, {module: 'updateMetrics'});
								resolve('Updated Measure: ' + data[2].qText);
							})
							.catch(function(error)
							{
								logger.error('popMeas::Publish' + error, {module: 'updateMetrics'});
								reject(new Error(error));
							});
						})
						.catch(function(error)
						{
							logger.error('popMeas::setProperties' + error, {module: 'updateMetrics'});
							reject(new Error(error));							
						});
					}
				})
				.catch(function(error)
				{
					logger.error('popMeas::getMeasure' + error, {module: 'updateMetrics'});
					reject(new Error(error));
				});
			}
		});
	}

};

module.exports= updateMetrics;