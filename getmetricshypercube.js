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
	getMetricsTable: function(cookies, callback)
	{
		var cube = hypercube.setCubeDefault();
		var x = {};
		var qConfig = {
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
		};

		qsocks.Connect(qConfig)
		.then(function(global)
		{
			console.log(global);
			return x.global = global;
		})
		.then(function()
		{
			getdoc.getDocId(cookies, 'Metrics Library', function(error,doc)
			{
				if(error)
				{
					callback(error);
				}
				else
				{
					console.log(doc.docId);
					x.global.openDoc(doc.docId, '', '', '', false)
					.then(function(app)
					{
						return x.app=app;
					},
					function(error)
					{ 
						console.log('rejected: ' + error);
					})
					.then(function(app)
					{
						console.log('hello world');
						return x.app = app;
					})
					.then(function(app)
					{
						console.log('creating session object');
						//console.log(cube);
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
						callback(null, x.data);
					});
				}
			});
		});
	}
};

module.exports = getMetricsHyperCube;