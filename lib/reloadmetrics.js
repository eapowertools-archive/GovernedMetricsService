var qsocks = require('qsocks');
var Promise = require('bluebird');
var doWork = require('./dowork');
var config = require('./config');

var reloadMetrics = {

	config : function(cookies, appId)
	{
		return new Promise(function(resolve)
		{
			var qConfig2 =
			{
				host: config.hostname,
				origin: 'https://' + config.hostname,
				isSecure: true,
				rejectUnauthorized: false,
				headers: {
					'Content-Type' : 'application/json',
					'x-qlik-xrfkey' : 'abcdefghijklmnop',
					'Cookie': cookies[0]
				},
				appname: appId
			};
			resolve(qConfig2);
		});
	},
	reloadMetrics: function(cookies,appId)
	{
		return new Promise(function(resolve, reject)
		{
			console.log('running reload on app: ' + appId);
			var x= {};
			reloadMetrics.config(cookies, appId)
			.then(function(config)
			{
				qsocks.Connect(config)
				.then(function(global)
				{
					//console.log(global);
					return x.global=global;
				})
				.then(function(global)
				{
					return global.openDoc(appId,'','','',false);
				})
				.then(function(app)
				{
					console.log('app opened');
					x.app = app;
					app.doReload()
					.then(function(reloadStart)
					{
						console.log('reload start: ' + reloadStart);
						progressCheck(x.global, function(error, result)
						{
							console.log('made it past progress check');
							if(error)
							{
								reject(new Error(error));
							}
							else
							{
								x.app.doSave()
								.then(function(success)
								{
									resolve(result);
								})
								.catch(function(error)
								{
									reject(new Error(error));
								});							
							}
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
					console.log(error)
					reject(new Error(error));
				});
			})
			.catch(function(error)
			{
				reject(new Error(error));
			});
		});
	}
};

function progressCheck(reload, callback)
{
	//console.log(reload);
	reload.getProgress(0)
	.then(function(reloadProgress)
	{
		console.log(reloadProgress);
		if(reloadProgress.qFinished==true)
		{
			callback(null, 'Reload Complete');
		}
		else
		{
			console.log('reload not done yet');
			progressCheck(reload,callback);
		}
	});
}


module.exports = reloadMetrics;