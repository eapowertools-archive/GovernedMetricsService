var qsocks = require('qsocks');
var fs = require('fs');
var request = require('request');
var promise = require('bluebird');
var path = require('path')
var Promise = require('bluebird')
var config = require('./config');


var applyMetrics = 
{	
	getSubjectAreas: function(data, index, callback)
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
//			console.log(item);
			if(flags[item[index].qText]) continue;
			flags[item[index].qText] = true;
			subjectAreas.push(item[index].qText);
		}

		if(subjectAreas.length > 0)
		{
			console.log('calling back subjectareas');
			callback(null,subjectAreas);
		}
		else
		{
			callback('Error: No subject areas returned from hypercube');
		}
	},
	applyMetrics: function(cookies, appId, data, subjectArea, callback)
	{
		var qConfig2 = {
			host: config.hostname,
			origin: 'https://' + config.hostname,
			isSecure: true,
			rejectUnauthorized: false,
			headers: {
				'Content-Type' : 'application/json',
				'x-qlik-xrfkey' : 'abcdefghijklmnop',
				'Cookie': cookies[0]
			},
			//cert: fs.readFileSync(config.certificates.server),
			//key: fs.readFileSync(config.certificates.server_key),
			//ca: fs.readFileSync(config.certificates.root),
			appname: appId
		};

		console.log('Hello World');
		console.log('app to add metrics to: ' + appId);
		var stuff = {};
		stuff.appId = appId;
		stuff.sourceData = data;
		
		qsocks.Connect(qConfig2)
		.then(function(global)
		{
			console.log('all good at global');
			return global;
		})
		.then(function(global)
		{
			return global.openDoc(qConfig2.appname, '', '', '', true);
			
		})
		.then(function(app)
		{
			data.forEach(function(item, index)
			{
				if(item[3].qText==subjectArea)
				{
					applyMetrics.popMeas(item, function(error, result)
					{
						if(error)
						{
							callback(error);
						}
						else
						{
							if(item[2].qText=='dimension')
							{
								app.createDimension(result)
								.then(function()
								{
									//do nothing
								});
							}
							else
							{
								app.createMeasure(result)
								.then(function()
								{
									//do nothing
								});								
							}
						}
					});					
				}
			});
			return app.saveObjects();
		})
		.then(function()
		{
			callback(null,'measure created');
		})
		.catch(function(error)
		{
			callback(error);
		});
	},
	popMeas: function(data, callback)
	{
		var tags = []
		var tagString = data[4].qText.split(";");
		tagString.forEach(function(tagValue)
		{
			tags.push(tagValue);
		});

		tags.push("MasterItem");
		tags.push(data[3].qText);

//		console.log("creating " + data[2].qText);
		if(data[1].qText.toLowerCase()=='dimension')
		{
			console.log('Creating dimension: ' + data[2].qText);
			var dim = {
				qInfo: {
					qId:"",
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
			callback(null,dim);
		}
		else
		{
			console.log('Creating measure: ' + data[2].qText);			
			var meas = {
				qInfo: {
			        qId: "",
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
			callback(null,meas);
		}
	}
};

module.exports= applyMetrics;

/*
						qInfo: {
					        qId: '',
					        qType: 'measure'
					      },
					    qMeasure: {
					        qLabel: 'foo',
					        qDef: '=sum(foo)' //,
					        //qGrouping: "N",
					        //qExpressions: [],
					        //qActiveExpression: 0
					      },
					    qMetaDef: {
					        title: 'foo',
					        description: 'some foo',
					        qSize: -1,
					        sourceObject: '',
					        draftObject: '',
					        tags: ['foo']
					   		}
*/