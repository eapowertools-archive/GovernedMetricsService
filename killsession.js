var fs = require('fs');
var request = require('request');
var config = require('./config');


var deleteSession = {
	logout: function(cookies, callback)
	{
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

		console.log(config.hostname);
		var cookie = cookies[0];
		var splitCookie = cookie.split(';',1);
		var session = splitCookie[0].split('=')[1];
		console.log(session);
		
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
				callback(error)
			}
			else if(response.statusCode==200)
			{
				callback(null,'session: ' + cookies[0] + ' deleted successfully.');
			}
			else
			{
				callback(null,response.statusCode);
			}
		});
	}
};


module.exports=deleteSession;