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
			logger.debug('get::running QRSInteract.get', {module: 'qrsinteraction'});
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
	post: function(path,body,sendType)
	{
		return new Promise(function(resolve, reject)
		{
			logger.debug('post::running QRSInteract.post', {module: 'qrsinteraction'});
			var sCode;
			var r=qrsInteract.defaults;
			var finalBody = body != undefined ? (sendType.toLowerCase() == 'json' ? body : JSON.stringify(body)) : undefined;
			logger.debug('Bodytype: ' + typeof finalBody, {module: 'qrsinteractions'});
			r({
				url: path,
				method: 'POST',
				body: finalBody
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
					logger.debug('data is of type: ' + typeof data, {module: 'qrsinteractions'});
					logger.debug('post::Response from QRS::' + sCode + '::' + JSON.stringify(data), {module: 'qrsinteraction'});
					resolve(JSON.parse(data));
				}
				else
				{
					logger.error('post::Error at qrsinteractions during post::' + sCode+ '::' + data, {module: 'qrsinteraction'});
					reject("Received error code: " + sCode + '::' + data);
				}
			});
		});
	},
	put: function(path,body)
	{
		return new Promise(function(resolve, reject)
		{
			logger.info('put::running QRSInteract.put', {module: 'qrsinteraction'});
			var sCode;
			var r=qrsInteract.defaults;
			logger.debug('put::json.stringify body: ' + JSON.stringify(body), {module: 'qrsinteraction'});
			r({
				url:path,
				method: 'PUT',
				body: body
			})
			.on('response', function(response, body)
			{
				sCode = response.statusCode;
				if(sCode==204)
				{
					logger.debug('put::Put successful ' + sCode, {module: 'qrsinteraction'});
					resolve(sCode);
				}
				else
				{
					logger.error('put::returned status code ' + sCode, {module: 'qrsinteraction'});
					reject(sCode)
				}
			})
			.on('error', function(err)
			{
				logger.error('put::Error at qrsinteractions during put::' + err, {module: 'qrsinteraction'});
			});
		})
	},
	delete: function(path)
	{
		return new Promise(function(resolve, reject)
		{
			logger.debug('delete::running QRSInteract.delete', {module: 'qrsinteraction'});
			logger.debug('delete::PATH to run::' + path, {module: 'qrsinteraction'});

			var sCode;
			var r = qrsInteract.defaults;

			r({
				url: path,
				method: 'DELETE'
			})
			.on('response', function(response)
			{
				sCode = response.statusCode;
				logger.debug('delete::Response from QRS::' + sCode, {module: 'qrsinteraction'});
					
				if(sCode==204)
				{
					resolve(sCode);
				}
				else
				{
					logger.error('delete::Error at qrsinteractions during delete::' + sCode, {module: 'qrsinteraction'});
					reject("Received error code: " + sCode);
				}
			})
			.on('error', function(error)
			{
				logger.error(error , {module: 'qrsinteraction'});
			});
		});
	}
};

module.exports = qrsInteract;


