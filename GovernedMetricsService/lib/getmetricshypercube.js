var qsocks = require('qsocks');
var request = require('request');
var Promise = require('bluebird')
var config = require('../config/config');
var hypercube = require('./setCubeDims');
var getdoc = require('./getdocid');
var winston = require('winston');
var fs = require('fs');

//set up logging
var logger = new (winston.Logger)({
	level: config.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});


var getMetricsHyperCube = 
{
	getMetricsTable: function()
	{
		return new Promise(function(resolve, reject)
		{
			logger.info('running getmetricshypercube.getMetricsTable', {module: 'getmetricshypercube'});
			var cube = hypercube.setCubeDefault();
			
			var qConfig = {
				host: config.hostname,
				port: config.enginePort,
				origin: 'https://' + config.hostname,
				isSecure: true,
				rejectUnauthorized: false,
				headers: {
					'Content-Type' : 'application/json',
					'x-qlik-xrfkey' : 'abcdefghijklmnop',
					'X-Qlik-User': config.repoAccount
				},
				key: fs.readFileSync(config.certificates.client_key),
				cert: fs.readFileSync(config.certificates.client),
				appname: null
			};
			var x = {};
			//get the docid for the metrics library first
			getdoc.getDocId(config.appName)
			.then(function(doc)
			{
				logger.info('getMetricsTable::Metrics Library AppId: ' + doc, {module: 'getmetricshypercube'});
				qConfig.appname = doc;
				x.doc = doc;
				qsocks.Connect(qConfig)
				.then(function(global)
				{
					return x.global = global;
				})
				.then(function(global)
				{
					logger.info('getMetricsTable::Opening the doc with data', {module: 'getmetricshypercube'});
					x.global.openDoc(doc, '', '', '', false)
					.then(function(app)
					{
						return x.app=app;
					})
					.then(function()
					{
						logger.info('getMetricsTable::Creating session object', {module: 'getmetricshypercube'});
						return x.app.createSessionObject(cube);
					})
					.then(function(obj)
					{
						return x.obj = obj;
					})
					.then(function(obj)
					{
						return x.obj.getProperties();
					})
					.then(function(props)
					{
						return x.props = props;
					})
					.then(function(props)
					{
						logger.info('getMetricsTable::getting hypercube definition and initial fetch', {module: 'getmetricshypercube'});
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
							logger.error('getMetricsTable::Error at getmetricshypercube during data retrieval::' + JSON.stringify(error), {module: 'getmetricshypercube'});
							reject(JSON.stringify(error));
						});
				})
				.catch(function(error)
				{
					logger.error('getMetricsTable::qSocks::' + JSON.stringify(error), {module: 'getmetricshypercube'});
					reject(error);
				});		
			})
			.catch(function(error)
			{
				logger.error('getMetricsTable::getDocId::' + JSON.stringify(error), {module: 'getmetricshypercube'});
				reject(error);
			});
		});
	}
};

module.exports = getMetricsHyperCube;