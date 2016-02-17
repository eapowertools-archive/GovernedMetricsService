//login.js
var Promise = require('bluebird');
var fs = require('fs');
var request = require('request');
var config = require('./config');

var login = 
{
	login: function()
	{
		return new Promise(function(resolve,reject)
		{
			console.log('running login');
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
		  		console.log('ticket');
		  		console.log(ticket);
		  		r.get('https://' + config.hostname + '/hub/?qlikTicket=' + ticket, function(error, response, body)
		  		{
				    var cookies = response.headers['set-cookie'];
				    console.log("cookies");
				    console.log(cookies);
				    if(error)
				    {
				    	console.log('Error at login during cookie get');
				    	reject(error);
				    }
				    else
				    {
				    	resolve(cookies);
				    }
				});
		  	});			
		});
	}
};

module.exports = login;