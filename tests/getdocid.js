var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');
var config = require('./testConfig');


var getDocId = 
{
	getDocId: function(appName)
	{
		return new Promise(function(resolve, reject)
		{
			var path = "/app"
			path += "?filter=name eq '" + appName + "'";
			qrsInteract.Get(path)
			.then(function(result)
			{
				resolve(result.body[0].id);
			})
			.catch(function(error)
			{
				reject(new Error(error));
			});
		});
	},
	getAppReference: function(appName)
	{
		return new Promise(function(resolve,reject)
		{
			var path = "/app"
			path += "?filter=name eq '" + appName + "'";
			qrsInteract.Get(path)
			.then(function(result)
			{
				resolve(result.body[0]);
			})
			.catch(function(error)
			{
				reject(new Error(error));
			});
		})
	}
};

module.exports = getDocId;