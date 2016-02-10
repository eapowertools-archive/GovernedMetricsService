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
var applyMetrics = require('./applymetrics');
var qrsInteract = require('./qrsinteractions.js');

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
			};

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
						//console.log(matrix);
						console.log('i make it to the matrix');
						y.matrix = matrix;
						//get subject area list
						console.log('getting subject areas');
						applyMetrics.getSubjectAreas(y.matrix, 3, function(error, subjectAreas)
						{
							if(error)
							{
								console.log(error);
							}
							else
							{
								subjectAreas.forEach(function(subjectArea)
								{
									console.log(subjectArea);
									var val = subjectArea;
									var path = "https://sense22.112adams.local/sdkheader/qrs/app?xrfkey=ABCDEFG123456789&filter=customProperties.definition.name eq '";
									path += config.customPropName + "' and customProperties.value eq '" + val + "'";
									console.log("QRS Path: " + path);
									qrsInteract.get(path, function(error, result)
									{
										if(error)
										{
											console.log(error);
										}
										else if(result.length < 1)
										{
											//do nothing
										}
										else
										{

											result.forEach(function(item)
											{
												console.log('do apply metrics on subjectarea ' + val);
												applyMetrics.applyMetrics(cookies, item.id, y.matrix, val, function(error, result)
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
											});
										}
									
									});
								});
							}
						});
					}
				});
			})
			.then(function()
			{
				console.log('yippee kai yay');				
			});
		});
	}			
};
module.exports = doWork;