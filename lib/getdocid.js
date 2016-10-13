var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');
var config = require('../config/config');
var winston = require('winston');
require('winston-daily-rotate-file');

//set up logging
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.DailyRotateFile)({ filename: config.logging.logFile, prepend:true})
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
			qrsInteract.Get(path)
			.then(function(result)
			{
				logger.debug('getDocId::qrsInteract::' + appName + ' id:' + result.body[0].id, {module: 'getdocid'});
				resolve(result.body[0].id);
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
			qrsInteract.Get(path)
			.then(function(result)
			{
				logger.debug('getDocId::qrsInteract::' + appName + ' id:' + result.body[0].id, {module: 'getdocid'});
				resolve(result.body[0]);
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