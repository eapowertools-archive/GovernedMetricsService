var config = require('./config');
var request = require('request');
var fs = require('fs');
var Promise = require('bluebird');


var qrsInteract = 
{
	defaults: request.defaults({
		  rejectUnauthorized: false,
		  host: config.hostname,
		  cert: fs.readFileSync(config.certificates.server),
		  key: fs.readFileSync(config.certificates.server_key),
		  ca: fs.readFileSync(config.certificates.root),
		  passphrase: 'secret',
		  headers: {
		  	'hdr-sense-sdkheader': config.userId,
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
			console.log('running QRSInteract.get');
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
					resolve(JSON.parse(data));
				}
				else
				{
					reject("Received error code: " + sCode);
				}
			});
		});
	}
};

module.exports = qrsInteract;


