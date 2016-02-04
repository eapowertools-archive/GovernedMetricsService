var qsocks = require('qsocks');
var fs = require('fs');
var request = require('request');
var promise = require('bluebird');
var path = require('path')
var Promise = require('bluebird')
var config = require('./config');
var hypercube = require('./setCubeDims');
var getdoc = require('./getdocid');


var getMetricsHyperCube = 
{
	qConfig: {
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
	},
	getMetricsTable: function(callback)
	{
		var cube = hypercube.setCubeDefault();
		var x = {};
		qsocks.Connect(getMetricsHyperCube.qConfig)
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
			getdoc.getDocId('Metrics Library',function(error,doc)
			{
				return x.global.openDoc(doc, '', '', '', false)
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
					//console.log('hyper');
					//console.log(x.hyperc);
					//console.log(x.iFetch);
					return x.obj.getHyperCubeData('/qHyperCubeDef', x.iFetch);
				})
				.then(function(data)
				{

					return x.data = data[0].qMatrix;
				})
				.then(function()
				{
					x.global.connection.ws.terminate();
				})
				.then(function()
				{
					callback(null, x.data);
				});
			});
		});	
	}
};

module.exports = getMetricsHyperCube;