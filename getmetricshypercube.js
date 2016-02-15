var qsocks = require('qsocks');
var fs = require('fs');
var request = require('request');
var path = require('path')
var Promise = require('bluebird')
var config = require('./config');
var hypercube = require('./setCubeDims');
var getdoc = require('./getdocid');


var getMetricsHyperCube = 
{
	getMetricsTable: function(cookies)
	{
		return new Promise(function(resolve, reject)
		{
			console.log('running getmetricshypercube.getMetricsTable');
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
				}
			};

			qsocks.Connect(qConfig)
			.then(function(global)
			{
				return x.global = global;
			})
			.then(function()
			{
				getdoc.getDocId(cookies, 'Metrics Library')
				.then(function(doc)
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
						x.iFetch = x.hyperc.qInitialDataFetch;
						return x.obj.getHyperCubeData('/qHyperCubeDef', x.iFetch);
					})
					.then(function(data)
					{
						return x.data = data[0].qMatrix;
					})
					.then(function()
					{
						x.global.connection.ws.terminate();
						resolve(x.data);
					});
				});
			})
			.catch(function(error)
			{
				console.log(error);
				reject(error);
			});
		});
	}
};

module.exports = getMetricsHyperCube;