var qsocks = require('qsocks');
var Promise = require('bluebird')
var config = require('../config/config');
var hypercube = require('./setCubeDims');
var getdoc = require('./getdocid');
var winston = require('winston');
var fs = require('fs');

//set up logging
winston.add(require('winston-daily-rotate-file'));
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logging.logFile})
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
				host: config.engine.hostname,
				port: config.engine.enginePort,
				origin: 'https://' + config.engine.hostname,
				isSecure: true,
				rejectUnauthorized: false,
				headers: {
					'Content-Type' : 'application/json',
					'x-qlik-xrfkey' : 'abcdefghijklmnop',
					'X-Qlik-User': config.engine.repoAccount
				},
				key: fs.readFileSync(config.certificates.client_key),
				cert: fs.readFileSync(config.certificates.client),
				appname: null
			};
			var x = {};
			//get the docid for the metrics library first
			getdoc.getDocId(config.gms.appName)
			.then(function(doc)
			{
				logger.debug('getMetricsTable::Metrics Library AppId: ' + doc, {module: 'getmetricshypercube'});
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
						logger.debug('getMetricsTable::Creating session object', {module: 'getmetricshypercube'});
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
					.then(function()
					{
						return x.obj.getLayout();
					})
					.then(function(layout)
					{
						return x.layout = layout;
					})
					.then(function()
					{
						var arrValues = [];
						//here we want to build the fetch array
						x.qSize = x.layout.qHyperCube.qSize;
						for(var i=0;i<=x.qSize.qcy;i+=50)
						{
							var fetch = [{qLeft:0,qTop:i,qWidth:x.qSize.qcx,qHeight:50}];
            				arrValues.push(fetch);
						}
						return arrValues;
					})
					.then(function(fetchVals)
					{
						return Promise.all(fetchVals.map(function(fetch)
						{
							return x.obj.getHyperCubeData('/qHyperCubeDef',fetch);
						}));
					})
					.then(function(dataVals)
					{
						var finalArr =[];
						for(var i=0;i<dataVals.length;i++)
						{
							if(dataVals[i][0].qMatrix.length != 0)
							{
								dataVals[i][0].qMatrix.forEach(function(item)
								{
									finalArr.push(item);
								});
							}
						}
						logger.debug(finalArr, {module: 'getmetricshypercube'});
						
						return x.data = finalArr;
					})
					.then(function()
					{
						logger.info('Closing connection to Metrics Hypercube', {module: 'getmetricshypercube'});
						x.global.connection.close();
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