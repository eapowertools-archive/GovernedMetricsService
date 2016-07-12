var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');
var config = require('../config/config');
var winston = require('winston');

//set up logging
var logger = new (winston.Logger)({
	level: config.default.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.default.logFile})
    ]
});

var getDocId = 
{
	getDocId: function(appName)
	{
		return new Promise(function(resolve, reject)
		{
			logger.info('getDocId::running getdoc.getDocId', {module: 'getdocid'});
			var path = "/app"
			path += "?filter=name eq '" + appName + "'";
			logger.debug('getDocId::qrsInteract::' + path, {module: 'getdocid'});
			qrsInteract.get(path)
			.then(function(result)
			{
				logger.debug('getDocId::qrsInteract::' + appName + ' id:' + result[0].id, {module: 'getdocid'});
				resolve(result[0].id);
			})
			.catch(function(error)
			{
				logger.error('getDocId::qrsInteract::' + error, {module: 'getdocid'});
				reject(new Error(error));
			});
		});
	},
	getAppReference: function(appName)
	{
		return new Promise(function(resolve,reject)
		{
			logger.info('getDocId::running getAppReference', {module: 'getdocid'});
			var path = "/app"
			path += "?filter=name eq '" + appName + "'";
			logger.debug('getDocId::qrsInteract::' + path, {module: 'getdocid'});
			qrsInteract.get(path)
			.then(function(result)
			{
				logger.debug('getDocId::qrsInteract::' + appName + ' id:' + result[0].id, {module: 'getdocid'});
				resolve(result[0]);
			})
			.catch(function(error)
			{
				logger.error('getDocId::qrsInteract::' + error, {module: 'getdocid'});
				reject(new Error(error));
			});
		})
	}
};

module.exports = getDocId;