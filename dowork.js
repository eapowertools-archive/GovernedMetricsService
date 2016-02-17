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
var updateMetrics = require('./updatemetrics');
var qrsInteract = require('./qrsinteractions');
var killSession = require('./killsession');
var login = require('./login');
var deleteMetrics = require('./deletemetrics');

var doWork = {
	getDoc: function(body, cookies)
	{
		return new Promise(function(resolve, reject)
		{
			var x={};
			if(!cookies)
			{
				console.log('I need a cookie');
				login.login()
				.then(function(cookies)
				{
					return x.cookies = cookies;
				})
				.then(function()
				{
					getdoc.getDocId(x.cookies, body)
					.then(function(doc)
					{
						killSession.logout(x.cookies)
						.then(function(message)
						{
							resolve(doc);
							console.log(message);
						})
						.catch(function(error)
						{
							reject(new Error(error));
						});
					})
					.catch(function(error)
					{
						reject(new Error(error));
					});
				})
				.catch(function(error)
				{
					reject(new Error(error));
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
					reject(new Error(error));
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
					deleteMetrics.deleteAllMasterItems(x.cookies, doc)
					.then(function(result)
					{
						var res = 
						{
							result: result.result,
							cookies: x.cookies
						};
						//result.engine.connection.ws.terminate();
						resolve(res);
					});
				});
			})
			.catch(function(error)
			{
				reject(new Error(error));
			});
		});
	},
	addAll: function()
	{
		return new Promise(function(resolve, reject)
		{
			var x = {};
			login.login()
			.then(function(cookies)
			{
				x.cookies = cookies;
				var y = {};
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
									result.forEach(function(item, index)
									{
										console.log('do apply metrics on subjectarea ' + val);
										applyMetrics.applyMetrics(x.cookies, item.id, y.matrix, val)
										.then(function(outcome)
										{
											console.log('results from applying metrics');
											console.log(outcome);
											//return result;
											//callback(null,result);
											if(index == result.length -1)
											{
												var res = 
												{
													result: 'Metric Application Complete',
													cookies: x.cookies
												};
												resolve(res);
											}		
										})
										.catch(function(error)
										{
											console.log(error);
										});
										//console.log('index:' + index + ", length:" + result.length);
									});
								}
							})
							.catch(function(error)
							{
								console.log(error);
								reject(new Error(error));
							});
						});
					})
					.catch(function(error)
					{
						console.log(error);
						reject(new Error(error));
					});
				})
				.catch(function(error)
				{
					console.log(error);
					reject(new Error(error));
				});
			})
			.catch(function(error)
			{
				reject(error);
			});
		});
	},
	updateAll: function()
	{
		return new Promise(function(resolve, reject)
		{
			var x = {};
			login.login()
			.then(function(cookies)
			{
				x.cookies = cookies;
				var y = {};
				console.log('opening metrics library file');
				gethypercube.getMetricsTable(cookies)
				.then(function(matrix)
				{
					console.log('matrix acquired');
					//console.log(matrix);
					console.log('i make it to the matrix');
					y.matrix = matrix;
					//get subject area list
					console.log('getting subject areas');
					updateMetrics.getSubjectAreas(y.matrix, 3)
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
									result.forEach(function(item, index)
									{
										console.log('do apply metrics on subjectarea ' + val);
										//console.log(item.id);
										updateMetrics.updateMetrics(x.cookies, item.id, y.matrix, val)
										.then(function(outcome)
										{
											console.log('results from applying metrics');
											console.log(outcome);
											//return result;
											//callback(null,result);
											if(index == result.length -1)
											{
												var res = 
												{
													result: 'Metric Application Complete',
													cookies: x.cookies
												};
												resolve(res);
											}		
										})
										.catch(function(error)
										{
											console.log(error);
											reject(new Error(error));
										});
										//console.log('index:' + index + ", length:" + result.length);
									});
								}
							})
							.catch(function(error)
							{
								console.log(error);
								reject(new Error(error));
							});
						});
					})
					.catch(function(error)
					{
						console.log(error);
						reject(new Error(error));
					});
				})
				.catch(function(error)
				{
					console.log(error);
					reject(new Error(error));
				});
			})
			.catch(function(error)
			{
				reject(error);
			});
		});		
	}			
};


/*
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
}; */

module.exports = doWork;