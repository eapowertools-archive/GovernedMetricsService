//updatemetrics.js
var qsocks = require('qsocks');
var Promise = require('bluebird')
var config = require('./config');

var updateMetrics = 
{
	getSubjectAreas: function(data, index)
	{
		return new Promise(function(resolve, reject)
		{
			console.log("Starting subjectarea processing");
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
				console.log('calling back subjectareas');
				resolve(subjectAreas);
			}
			else
			{
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
			console.log('running updatemetrics');
			var x = {};
			updateMetrics.config(cookies, appId)
			.then(function(qConfig)
			{
				console.log(qConfig);
				console.log('appid: ' + appId);
				qsocks.Connect(qConfig)
				.then(function(global)
				{
					x.global = global;
					console.log('updatemetrics global');
					global.openDoc(appId,'','','',true)
					.then(function(app)
					{
						console.log('app');
						console.log(app);
						x.app = app;
						data.forEach(function(item, index)
						{
							var objId = item[3].qText.toLowerCase() + '_' + item[0].qText;
							console.log(objId);
							if(item[3].qText==subjectArea)
							{
								updateMetrics.popMeas(x.app, item)
								.then(function(q)
								{
									if(index==data.length-1)
									{
										//last one
										var res = {
											result: 'finished applying metrics to ' + appId,	
										};
										x.global.connection.ws.terminate();
										console.log(res.result);
										resolve(res);
									}
									
								})
								.catch(function(error)
								{
									console.log('Error at updatemetrics during popMeas');
									reject(new Error(error));
								});
							}
						});
					})
					.catch(function(error)
					{
						console.log('Error at updatemetrics during openDoc');
						console.log(error);
						reject(new Error(error));
					});
				})
				.catch(function(error)
				{
					console.log('Error at updatemetrics during qsocks connect');
					reject(new Error(error));
				});
			})
			.catch(function(error)
			{
				console.log('Error at updatemetrics during updatemetrics.config');
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
									resolve('Created Dimension: ' + data[2].qtext);
								})
								.catch(function(error)
								{
									reject(new Error(error));
								});
							})
							.catch(function(error)
							{
								reject(new Error(error));
							});
						})
						.catch(function(error)
						{
							console.log('failed to create dimension');
							console.log(error);
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
								resolve('Updated Dimension: ' + data[2].qText);
							})
							.catch(function(error)
							{
								reject(new Error(error));
							});
						})
						.catch(function(error)
						{
							console.log('failed to update dimension');
							console.log(error);
							reject(new Error(error));							
						});
					}
				})
				.catch(function(error)
				{
					console.log('Error at popMeas during getDimension');
					console.log(error);
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
									resolve('Created Measure: ' + data[2].qText);
								})
								.catch(function(error)
								{
									reject(new Error(error));
								});
							})
							.catch(function(error)
							{
								reject(new Error(error));
							});
						})
						.catch(function(error)
						{
							console.log('failed to create measure');
							console.log(error);
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
								resolve('Updated Measure: ' + data[2].qText);
							})
							.catch(function(error)
							{
								reject(new Error(error));
							});
						})
						.catch(function(error)
						{
							console.log('failed to update measure');
							console.log(error);
							reject(new Error(error));							
						});
					}
				})
				.catch(function(error)
				{
					console.log('Error at popMeas during getMeasure');
					console.log(error);
					reject(new Error(error));
				});
			}
		});
	}

};

module.exports= updateMetrics;