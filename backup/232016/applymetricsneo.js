var qsocks = require('qsocks');
var fs = require('fs');
var request = require('request');
var promise = require('bluebird');
var path = require('path')
var Promise = require('bluebird')
var config = require('./config');


var applyMetrics = 
{	
	applyMetrics: function(cookies, appId, data, callback)
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
				if(index==1)
				{
					var myItem;
					applyMetrics.popMeas(item, function(error, result)
					{
						if(error)
						{
							callback(error);
						}
						else
						{
							app.createMeasure(result)
							.then(function()
							{
								return app.doSave();
							});
						}
					});
				}
			});
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
		        description: data[2].qText,
		        qSize: -1,
		        sourceObject: "",
		        draftObject: "",
		        tags: [data[5].qText]
		   		}
		};
		callback(null,meas);
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