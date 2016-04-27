var config = require('../config/config');
var request = require('request');
var fs = require('fs');
var Promise = require('bluebird');
var winston = require('winston');

//set up logging
var logger = new (winston.Logger)({
	level: config.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});

var qrsInteract = 
{
	defaults: request.defaults({
		  rejectUnauthorized: false,
		  host: config.hostname,
		  cert: fs.readFileSync(config.certificates.server),
		  key: fs.readFileSync(config.certificates.server_key),
		  ca: fs.readFileSync(config.certificates.root),
		  headers: {
		  	//'hdr-sense-sdkheader': config.userId,
		  	'X-Qlik-User': config.repoAccount,
		  	'X-Qlik-Xrfkey': 'ABCDEFG123456789',
		  	'Content-Type':'application/json',
		  	'Accept-Encoding':'gzip'
		  },
		  gzip: true,
		  json: true
		})
	,
	get: function(path)
	{
		return new Promise(function(resolve, reject)
		{
			logger.info('get::running QRSInteract.get', {module: 'qrsinteraction'});
			logger.debug('get::PATH to run::' + path, {module: 'qrsinteraction'});


			var sCode;
			var r = qrsInteract.defaults;

			r.get(path)
			.on('response', function(response, body)
			{
				sCode = response.statusCode;
			})
			.on('data', function(data)
			{
				if(sCode==200)
				{
					//logger.info('get::Response from QRS::' + data, {module: 'qrsinteraction'});
					resolve(JSON.parse(data));
				}
				else
				{
					logger.error('get::Error at qrsinteractions during get::' + sCode, {module: 'qrsinteraction'});
					reject("Received error code: " + sCode);
				}
			});
		});
	},
	post: function(path,body)
	{
		return new Promise(function(resolve, reject)
		{
			logger.info('post::running QRSInteract.post', {module: 'qrsinteraction'});
			var sCode;
			var r=qrsInteract.defaults;
			r({
				url: path,
				method: 'POST',
				body: JSON.stringify(body)
			})
			.on('response', function(response, body)
			{
				sCode = response.statusCode;
			})
			.on('error', function(err)
			{
				logger.error('post::Error at qrsinteractions during post::' + err, {module: 'qrsinteraction'});
			})
			.on('data', function(data)
			{
				if(sCode==200 || sCode==201)
				{
					logger.info('post::Response from QRS::' + JSON.parse(data), {module: 'qrsinteraction'});
					resolve(JSON.parse(data));
				}
				else
				{
					logger.error('post::Error at qrsinteractions during post::' + sCode+ '::' + data, {module: 'qrsinteraction'});
					reject("Received error code: " + sCode + '::' + data);
				}
			});
		});
	}
};

module.exports = qrsInteract;


