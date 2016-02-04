var qsocks = require('qsocks');
var fs = require('fs');
var request = require('request');
var promise = require('bluebird');
var path = require('path')
var Promise = require('bluebird')
var config = require('./config');
var hypercube = require('./setCubeDims');
var getdoc = require('./getdocid');
var gethypercube = require('./getmetricshypercube');
var applyMetrics = require('./applymetricsneo');
var request = require('request');
//var certificates = require('./utils/certificates');


var doWork = {
	getDoc: function(body, callback)
	{
		doWork.login(function(error, cookies)
		{
			var qConfig = {
				host: config.hostname,
				origin: 'https://' + config.hostname,
				isSecure: true,
				rejectUnauthorized: false,
				headers: {
					'Content-Type' : 'application/json',
					'x-qlik-xrfkey' : 'abcdefghijklmnop',
					'Cookie': cookies[0]
				}
				//cert: fs.readFileSync(config.certificates.server),
				//key: fs.readFileSync(config.certificates.server_key),
				//ca: fs.readFileSync(config.certificates.root)
			};
			getdoc.getDocId(cookies, body, function(error, result)
			{
				if(error)
				{
					callback(error);
				}
				else
				{
					callback(null,result);					
				}
			});
		});
	},
	login: function(callback)
	{
		console.log('hello world');
		//  Set our request defaults, ignore unauthorized cert warnings as default QS certs are self-signed.
		//  Export the certificates from your Qlik Sense installation and refer to them
		var r = request.defaults({
		  rejectUnauthorized: false,
		  host: config.hostname,
		  cert: fs.readFileSync(config.certificates.server),
		  key: fs.readFileSync(config.certificates.server_key),
		  ca: fs.readFileSync(config.certificates.root),
		  //pfx: fs.readFileSync(__dirname + '\\client.pfx'),
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
			    	callback(error);
			    }
			    else
			    {
			    	callback(null,cookies);
			    }
			});
	  	});
	},
	addAll: function(body,callback)
	{
		//login to Qlik Sense using ticketing
		doWork.login(function(error, cookies)
		{
			var qConfig = {
				host: config.hostname,
				origin: 'https://' + config.hostname,
				isSecure: true,
				rejectUnauthorized: false,
				headers: {
					'Content-Type' : 'application/json',
					'x-qlik-xrfkey' : 'abcdefghijklmnop',
					'Cookie': cookies[0]
				}
				//cert: fs.readFileSync(config.certificates.server),
				//key: fs.readFileSync(config.certificates.server_key),
				//ca: fs.readFileSync(config.certificates.root)
			};

			var apps = body.appNames;
			var y = {};
			qsocks.Connect(qConfig)
			.then(function(global)
			{
				return y.global = global;
			})
			.then(function()
			{
				console.log('opening metrics library file');
				gethypercube.getMetricsTable(cookies, function(error,matrix)
				{
					if(error)
					{
						console.log('What the eff is going on here?');
						console.log('error: ' + error);
						callback(error);
					}
					else
					{
						console.log('matrix acquired');
						console.log(matrix);
						console.log('i make it to the matrix');
						y.matrix = matrix;
						for (var i = 0;i<apps.length;i++)
						{
							console.log('app to be gotten: ' + apps[i]);
							getdoc.getDocId(cookies, apps[i], function(error,doc)
							{
								console.log('yippee!');
								if(error)
								{
									console.log(error);
								}
								else
								{
									console.log('do apply metrics');
									applyMetrics.applyMetrics(cookies, doc.docId, y.matrix, function(error, result)
									{
										if(error)
										{
											console.log(error);
										}
										else
										{
											console.log('results from applying metrics');
											console.log(result);
											callback(null,result);										
										}
									});
								}
							})
							.then(function()
							{
								console.log('yippee kai yay');				
							});
						}
						//callback(null,'Its working');
					}			
				});			
			});
		});
	}
};
module.exports = doWork;