var fs = require('fs');
var request = require('request');
var config = require('../config/config');
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

var deleteSession = {
	logout: function(cookies)
	{
		return new Promise(function(resolve,reject)
		{
			logger.info('logout::running logout', {module: 'killsession'});
			//  Set our request defaults, ignore unauthorized cert warnings as default QS certs are self-signed.
			//  Export the certificates from your Qlik Sense installation and refer to them
			var r = request.defaults({
			  rejectUnauthorized: false,
			  host: config.hostname,
			  isSecure: true,
			  cert: fs.readFileSync(config.certificates.server),
			  key: fs.readFileSync(config.certificates.server_key),
			  ca: fs.readFileSync(config.certificates.root)
			});

			//  Authenticate whatever user you want
			var b = JSON.stringify({
			  "UserDirectory": config.userDirectory,
			  "UserId": config.userId,
			  "Attributes": []
			});

			
			var cookie = cookies[0];
			var splitCookie = cookie.split(';',1);
			var session = splitCookie[0].split('=')[1];
			
			r.del(
			{
				//console.log(config.hostname);
				
				uri: 'https://' + config.hostname + ':4243/qps/session/' + session + '?xrfkey=abcdefghijklmnop',
				headers:
				{
			   		'x-qlik-xrfkey': 'abcdefghijklmnop',
			    	'content-type': 'application/json'
			  	}
			},
			function(error,response)
			{
				if(error)
				{
					logger.error('logout::' + error, {module: 'killsession'});
					reject(error);
				}
				else if(response.statusCode==200)
				{
					logger.info('logout::session: ' + cookies[0] + ' deleted successfully.', {module: 'killsession'});
					resolve('session: ' + cookies[0] + ' deleted successfully.');
				}
				else
				{
					logger.info('logout::Other Status Code returned::' + response.statusCode, {module: 'killsession'});
					resolve(response.statusCode);
				}
			});
		});
	}
};


module.exports=deleteSession;