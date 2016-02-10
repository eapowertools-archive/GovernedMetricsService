var config = require('./config');
var request = require('request');
var fs = require('fs');


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
	get: function(path, callback)
	{
		var sCode;
		var r = qrsInteract.defaults;

		r.get(path)
		.on('response', function(response, body)
		{
			sCode = response.statusCode;
		})
		.on('data', function(data)
		{
			console.log(sCode);
			callback(null, JSON.parse(data));
		});
	},
	post: function(path, bodyMessage, callback)
	{
		var sCode;
		var r = qrsInteract.defaults;
		r.post(path, { body: bodyMessage})
		.on('response',function(response, body)
		{
			sCode = response.statusCode;
			callback(null,'You are a star');
		});
	}
};

module.exports = qrsInteract;


