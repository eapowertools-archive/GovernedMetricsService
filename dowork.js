var qsocks = require('qsocks');
var fs = require('fs');
var request = require('request');
var path = require('path')
var Promise = require('bluebird')
var config = require('./config');
var hypercube = require('./setCubeDims');
var getdoc = require('./getdocid');
var gethypercube = require('./getmetricshypercube');
var applyMetrics = require('./applymetrics');
var qrsInteract = require('./qrsinteractions');
var killSession = require('./killsession');
var login = require('./login');
var deleteMetrics = require('./deletemetrics');

var doWork = {
	getDoc: function(body, cookies, callback)
	{
		if(!cookies)
		{
			console.log('I need a cookie');
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
		}
		else
		{
			console.log('I have a cookie already');
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
		}
	},
	deleteAll: function(appname, callback)
	{
		var message;
		var x = {};
		login.login(function(error, cookies)
		{
			x.cookies = cookies;
			doWork.getDoc(appname.appName, x.cookies, function(error, doc)
			{
				console.log('error:' + doc.docId);
				deleteMetrics.deleteAllMasterItems(x.cookies, doc.docId, function(error,response)
				{
					if(error)
					{
						console.log(error)
					}
					else
					{
						console.log('complete');
						console.log('terminating session');
						terminate(x.cookies, function(error,response)
						{
							if(error)
							{
								console.log(error);
							}
							else
							{
								console.log(response);
								callback(null, response);
							}
						});
					}

				});
			});
		});
	},
	addAll: function(callback)
	{
		//login to Qlik Sense using ticketing
		login.login(function(error, cookies)
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
									var path = "https://" + config.hostname + "/" + config.virtualProxy + "/qrs/app"
									path += "?xrfkey=ABCDEFG123456789&filter=customProperties.definition.name eq '";
									path += config.customPropName + "' and customProperties.value eq '" + val + "'";
									console.log("QRS Path: " + path);
									//add cookies here and use the same session
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
														console.log('I hit an error with applying metrics')
														console.log(error);
														//return error;
													}
													else
													{
														console.log('results from applying metrics');
														console.log(result);
														//return result;
														//callback(null,result);										
													}
												});
											});
											console.log('finished looping through results');
										}
									
									});
								});
								console.log('do I make it to killsession?');
								killSession.logout(cookies[0],function(error, result)
								{
									if(error)
									{
										callback(error);
									}
									else
									{
										callback(result);
									}
								});		
							}
						});
					}
				});
			});
		});
	}			
};

function terminate(cookies, callback)
{
	killSession.logout(cookies,function(error,answer)
	{
		if(error)
		{
			callback(error);
		}
		else
		{
			callback(null, answer);
		}
	});
};

module.exports = doWork;