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
	getDoc: function(body, cookies)
	{
		return new Promise(function(resolve, reject)
		{
			if(!cookies)
			{
				console.log('I need a cookie');
				login.login()
				.then(function(cookies)
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
					getdoc.getDocId(cookies, body)
					.then(function(doc)
					{
						terminate(cookies)
						.then(function(message)
						{
							console.log(message);
							resolve(doc);
						});
					})
					.catch(function(error)
					{
						terminate(cookies)
						.then(function(message)
						{
							console.log(message);
							reject(error);
						});
					});
				});			
			}
			else
			{
				console.log('I have a cookie already');
				getdoc.getDocId(cookies, body)
				.then(function(doc)
				{
					resolve(doc);					
				})
				.catch(function(error)
				{
					reject(error);
				});
			}
		});
	},
	deleteAll: function(appname)
	{
		return new Promise(function(resolve, reject)
		{
			var message;
			var x = {};
			login.login()
			.then(function(cookies)
			{
				x.cookies = cookies;
				getdoc.getDocId(x.cookies, appname.appName)
				.then(function(doc)
				{
					deleteMetrics.deleteAllMasterItems(x.cookies, doc.docId)
					.then(function(result)
					{
						var res = 
						{
							result: result,
							cookies: x.cookies
						};
						resolve(res);
					});
				});
			})
			.catch(function(error)
			{
				reject(error);
			});
		});
	},
	addAll: function()
	{
		var x = {};
		return new Promise(function(resolve, reject)
		{
			login.login()
			.then(function(cookies)
			{
				x.cookies = cookies;
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
					gethypercube.getMetricsTable(x.cookies)
					.then(function(matrix)
					{
						console.log('matrix acquired');
						//console.log(matrix);
						console.log('i make it to the matrix');
						y.matrix = matrix;
						//get subject area list
						console.log('getting subject areas');
						applyMetrics.getSubjectAreas(y.matrix, 3)
						.then(function(subjectAreas)
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
								qrsInteract.get(path)
								.then(function(result)
								{
									if(result.length < 1)
									{
										//do nothing
									}
									else
									{
										result.forEach(function(item)
										{
											console.log('do apply metrics on subjectarea ' + val);
											applyMetrics.applyMetrics(x.cookies, item.id, y.matrix, val)
											.then(function(result)
											{
												console.log('results from applying metrics');
												console.log(result);
												//return result;
												//callback(null,result);										
		
											});
										});
									}
								});
							});
						});
					});
				});
			})
			.catch(function(error)
			{
				reject(error);
			});
		});
	}			
};

function terminate(cookies)
{
	return new Promise(function(resolve, reject)
	{
		killSession.logout(cookies)
		.then(function(message)
		{
			resolve(message);
		})
		.catch(function(error)
		{
			reject(error)
		});		
	});
};

module.exports = doWork;