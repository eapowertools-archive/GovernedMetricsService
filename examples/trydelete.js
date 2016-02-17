//tryDelete

var login = require('./login');
var killSession = require('./killsession');
var qsocks = require('qsocks');
var fs = require('fs');
var request = require('request');
var promise = require('bluebird');
var path = require('path')
var Promise = require('bluebird')
var config = require('./config');
var deleteMetrics = require('./deletemetrics');

login.login(function(error, result)
{
	if(error)
	{
		console.log(error);
	}
	else
	{
		var cookies = result;
		deleteMetrics.deleteAllMasterItemMeasures(cookies,'59beea22-f7a0-4cf5-ab51-6f2345ed08e1',function(error,response)
		{
			if(error)
			{
				console.log(error)
				terminate(cookies, function(error,val)
				{
					if(error)
					{
						console.log(error);
					}
					else
					{
						console.log(val);
					}
				});
			}
			else
			{
				terminate(cookies, function(error,val)
				{
					if(error)
					{
						console.log(error);
					}
					else
					{
						console.log(val);
					}
				});
			}
		});
	}
});

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