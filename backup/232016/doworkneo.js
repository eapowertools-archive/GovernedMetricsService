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

	getGlobal: function(callback)
	{
		qsocks.Connect(doWork.qConfig)
		.then(function(global)
		{
			console.log(global);
			console.log(global.connection.ws._socket);
			return callback(null,global);
		});
	},
	getDoc: function(body, callback)
	{
		qsocks.Connect(doWork.qConfig)
		.then(function(global)
		{
			return getdoc.getDocId(global, body, function(error, result)
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
				origin: 'http://' + config.hostname,
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
				gethypercube.getMetricsTable(y.global, function(error,matrix)
				{
					console.log('matrix acquired');
					//console.log(matrix);
					console.log('i make it to the matrix');
					y.matrix = matrix;
					apps.forEach(function(app)
					{
						getdoc.getDocId(y.global, app, function(error,doc)
						{
							console.log ("got the doc id for " + doc.docId);
							applyMetrics.applyMetrics(cookies, doc.docId, y.matrix, function(error, result)
							{
								if(error)
								{
									console.log('ERROR');
								}
								else
								{
									callback(null, result);
								}
							});	
						});
										
					});		
				});			
			})
			.then(function()
			{
				//y.global.connection.ws.terminate();
			})
			.catch(function(error)
			{
				callback(error);
			});
		});
/*			.then(function()
			{
				var apps = body.appNames;
				var customProps = body.customProperties;
				console.log(apps);
				console.log(customProps);
				y.appIds = [];
				if(apps.length >= 0)
				{
					//this is a good use case
					if(apps.length > 0)
					{
						apps.forEach(function(app)
						{
							getdoc.getDocId(app,function(error,docId)
							{
								y.appIds.push(docId);
							})
						})
						callback(null,y.appIds);
					}
					else
					{
						callback(null,"I'm going to populate all items to all apps");
					}
				}
				else if(apps === undefined && customProps.length > 0)
				{
					//This is a good use case

				}
				else
				{
					var message = 
					{
						error: 'Bad Request',
						message: 'This endpoint requires an appNames property with at least an empty array or customProperties property with at least one custom property key:value pair.',
						example:
						{
							appNames: [],
							customProperties: []
						}
					};
					callback(message);
				}
			});
		});	*/	
	}
};
module.exports = doWork;