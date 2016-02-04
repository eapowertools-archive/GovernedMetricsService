var qsocks = require('qsocks');
var fs = require('fs');
var request = require('request');
var promise = require('bluebird');
var path = require('path')
var Promise = require('bluebird')
var config = require('./config');
var hypercube = require('./setCubeDims');

//var certificates = require('./utils/certificates');

var qConfig = {
		host: config.hostname,
		isSecure: true,
		prefix: config.virtualProxy,
		rejectUnauthorized: false,
		headers: {
			'hdr-sense-sdkheader' : config.userId,
			'Content-Type' : 'application/json',
			'x-qlik-xrfkey' : 'abcdefghijklmnop'
		},
		cert: fs.readFileSync(config.certificates.server),
		key: fs.readFileSync(config.certificates.server_key),
		ca: fs.readFileSync(config.certificates.root)
	}; 

var connection = function(callback)
{
	var $ = {};
	qsocks.Connect(doWork.qConfig)
	.then(function(global)
	{
		return $.global=global;
	})
	.then(function()
	{
		callback(null,$.global);
	})
	.catch(function(error)
	{
		callback(error);
	});
};

var getDocId = function(appName, callback)
{
	console.log(appName);
	var $ ={};
	qsocks.Connect(doWork.qConfig)
	.then(function(global)
	{
		return $.global = global;
	})
	.then(function(global)
	{
		global.getDocList()
		.then(function(doclist)
		{
			//console.log(doclist.length);
			doclist.forEach(function(doc)
			{
				if(doc.qTitle===appName)
				{
					console.log(doc.qTitle + ":" + doc.qDocName);
					console.log(doc.qDocId);
					$.docId = doc.qDocId;
					//console.log('docid:' + docId);
					//break;
				}
			});
			return $.docId;
		})
		.then(function()
		{
			$.global.connection.ws.terminate();
		})
		.then(function()
		{
			callback(null, $.docId);
		})
		.catch(function(error)
		{
			callback(error);
		});
	});
};

var getMetricsTable = function(callback)
{
	var cube = hypercube.setCubeDefault();
	var x = {};
	qsocks.Connect(doWork.qConfig)
	.then(function(global)
	{
		
		return x.global = global;
	})
	.catch(function(error)
	{
		console.log(error);
	})
	.then(function()
	{
		//console.log('hello world');
		//doWork.getDocId('Metrics Library',function(error,doc)
			//{
			//	console.log("the doc is:" + doc);
		return x.global.openDoc('1fc8b830-6692-4807-b267-a9cd5598585a', '', '', '', false);	
			//});
	})
	.then(function(app)
	{
		console.log('hello world');
		return x.app = app;
	})
	.then(function(app)
	{
		console.log('creating session object');
		console.log(cube);
		return x.app.createSessionObject(cube);
	})
	.then(function(obj)
	{
		console.log('got an object');
		return x.obj = obj;
	})
	.then(function(obj)
	{
		console.log('getting properties');
		return x.obj.getProperties();
	})
	.then(function(props)
	{
		return x.props = props;
	})
	.then(function(props)
	{
		console.log('got some props');
		x.hyperc = x.props.qHyperCubeDef;
		//console.log(x.hyperc);
		x.iFetch = x.hyperc.qInitialDataFetch;
		console.log('hyper');
		console.log(x.hyperc);
		console.log(x.iFetch);
		return x.obj.getHyperCubeData('/qHyperCubeDef', x.iFetch);
	})
	.then(function(data)
	{
		return x.data = data;
	})
	.then(function()
	{
		
	})
	.then(function()
	{
		x.global.connection.ws.terminate();
	})
	.then(function()
	{
		callback(null, x.data);
	})
	.catch(function(error)
	{
		callback(error);		
	});			
};

var doWork = {};
doWork.connection = connection;
doWork.qConfig = qConfig;
doWork.getDocId = getDocId;
doWork.getMetricsTable = getMetricsTable;

module.exports = doWork;