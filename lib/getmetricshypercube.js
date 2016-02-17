var qsocks = require('qsocks');
var request = require('request');
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
				appname: null
			};
			var x = {};
			//get the docid for the metrics library first
			getdoc.getDocId(cookies, 'Metrics Library')
			.then(function(doc)
			{
				console.log('Metrics Library AppId: ' + doc);
				qConfig.appname = doc;
				x.doc = doc;
				qsocks.Connect(qConfig)
				.then(function(global)
				{
					return x.global = global;
				})
				.then(function(global)
				{
					console.log('global');
					console.log(x.global);
					x.global.openDoc(doc, '', '', '', false)
					.then(function(app)
					{
						console.log('docOpened');
						return x.app=app;
					})
					.then(function(app)
					{
						console.log('hello world');
					})
					.then(function()
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
						//x.global.connection.ws.terminate();
						resolve(x.data);
					})
					.catch(function(error)
						{
							console.log('Error at getmetricshypercube during data retrieval');
							console.log(error);
						});
				})
				.catch(function(error)
				{
					console.log('Error at getmetricshypercube during qsocks connection.');
					console.log(error);
					reject(new Error(error));
				});		
			})
			.catch(function(error)
			{
				console.log('Error at getmetricshypercube during getDocId');
				console.log(error);
				reject(new Error(error));
			});
		});
	}
};

module.exports = getMetricsHyperCube;