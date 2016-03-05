var qrsInteract = require('./qrsinteractions');
var Promise = require('bluebird');
var config = require('../config/config');
var winston = require('winston');

//set up logging
var logger = new (winston.Logger)({
	level: config.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});

var getDocId = 
{
	getDocId: function(appName)
	{
		return new Promise(function(resolve, reject)
		{
			logger.info('getDocId::running getdoc.getDocId', {module: 'getdocid'});
			var path = "https://" + config.hostname + ":" + config.qrsPort + "/qrs/app"
			path += "?xrfkey=ABCDEFG123456789&filter=name eq '" + appName + "'";
			logger.info('getDocId::qrsInteract::' + path, {module: 'getdocid'});
			qrsInteract.get(path)
			.then(function(result)
			{
				logger.info('getDocId::qrsInteract::' + appName + ' id:' + result[0].id, {module: 'getdocid'});
				resolve(result[0].id);
			})
			.catch(function(error)
			{
				logger.error('getDocId::qrsInteract::' + error, {module: 'getdocid'});
				reject(new Error(error));
			});
		});
	}
};

module.exports = getDocId;