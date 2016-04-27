//login.js
var Promise = require('bluebird');
var fs = require('fs');
var request = require('request');
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

var login = 
{
	login: function()
	{
		return new Promise(function(resolve,reject)
		{
			logger.info('login::running login', {module: 'login'});
			//  Set our request defaults, ignore unauthorized cert warnings as default QS certs are self-signed.
			//  Export the certificates from your Qlik Sense installation and refer to them
			var r = request.defaults({
			  rejectUnauthorized: false,
			  host: config.hostname,
			  cert: fs.readFileSync(config.certificates.server),
			  key: fs.readFileSync(config.certificates.server_key),
			  ca: fs.readFileSync(config.certificates.root),
			  passphrase: 'secret'
			});

			//  Authenticate whatever user you want
			var b = JSON.stringify({
			  "UserDirectory": config.userDirectory,
			  "UserId": config.userId,
			  "Attributes": []
			});

			r.post(
			{
				uri: 'https://' + config.hostname + ':4243/qps/ticket?xrfkey=abcdefghijklmnop',
				body: b,
				headers:
				{
			   		'x-qlik-xrfkey': 'abcdefghijklmnop',
			    	'content-type': 'application/json'
			  	}
			},
			function(err, res, body) 
			{
				//  Consume ticket, set cookie response in our upgrade header against the proxy.
		  		var ticket = JSON.parse(body)['Ticket'];
		  		
		  		logger.info('login::received ticket from QPS::' + ticket, {module: 'login'});

		  		r.get('https://' + config.hostname + '/hub/?qlikTicket=' + ticket, function(error, response, body)
		  		{
				    var cookies = response.headers['set-cookie'];
				    logger.info('login::cookie::' + cookies, {module: 'login'});
				    if(error)
				    {
				    	logger.error('login::' + error, {module: 'login'});
				    	reject(error);
				    }
				    else
				    {
				    	logger.info('login::complete', {module: 'login'});
				    	resolve(cookies);
				    }
				});
		  	});			
		});
	}
};

module.exports = login;