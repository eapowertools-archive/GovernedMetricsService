var qsocks = require('qsocks');
var fs = require('fs');
var path = require('path')
var Promise = require('bluebird')
var config = require('./config');


var applyMetrics = 
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
	applyMetrics: function(cookies, appId, data, subjectArea)
	{
		return new Promise(function(resolve, reject)
		{
			console.log('Applying metrics');
			console.log(cookies);
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

			console.log('app to add metrics to: ' + appId);
			var stuff = {};
			stuff.appId = appId;
			stuff.sourceData = data;
			
			qsocks.Connect(qConfig2)
			.then(function(global)
			{

				return stuff.global = global;
			})
			.then(function(global)
			{
				return global.openDoc(qConfig2.appname, '', '', '', true);
				
			})
			.then(function(app)
			{
				return stuff.app = app;
			})
			.then(function(app)
			{
				data.forEach(function(item, index)
				{
					if(item[3].qText==subjectArea)
					{
						applyMetrics.popMeas(item)
						.then(function(q)
						{
							if(q.qInfo.qType=='dimension')
							{
								app.createDimension(q)
								.then(function()
								{
									//do nothing
								});
							}
							else
							{
								app.createMeasure(q)
								.then(function()
								{
									//do nothing
								});								
							}
						});
					}
				});
			})
			.then(function()
			{
				stuff.app.saveObjects()
				.then(function()
				{
					stuff.global.connection.ws.terminate();
					resolve('Apply Metrics complete');					
				});
			})
			.catch(function(error)
			{
				reject(error);
			});
		})
	},
	popMeas: function(data)
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
				resolve(dim);
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
				resolve(meas);
			}
		});
	}
};

module.exports= applyMetrics;