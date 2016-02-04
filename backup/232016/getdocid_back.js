var qsocks = require('qsocks');
var fs = require('fs');
var request = require('request');
var promise = require('bluebird');
var path = require('path')
var Promise = require('bluebird')
var config = require('./config');
var hypercube = require('./setCubeDims');


var getDocId = 
{
	qConfig: {
		host: config.hostname,
		isSecure: true,
		prefix: config.virtualProxy,
		rejectUnauthorized: false,
		headers: {
			'hdr-sense-sdkheader' : config.userId,
			'Content-Type' : 'application/json',
			'x-qlik-xrfkey' : 'abcdefghijklmnop'
		},
		cert: fs.readFileSync(config.certificates.server),
		key: fs.readFileSync(config.certificates.server_key),
		ca: fs.readFileSync(config.certificates.root)
	},
	getDocId: function(appName, callback)
	{
		console.log("Getting the Doc named: " + appName);
		var $ ={};
		qsocks.Connect(getDocId.qConfig)
		.then(function(global)
		{
			return $.global = global;
		},
		function()
		{
			return console.log("failed");
		})
		.then(function()
		{
			$.global.getDocList()
			.then(function(doclist)
			{
				//console.log(doclist.length);
				doclist.forEach(function(doc)
				{
					if(doc.qTitle===appName)
					{
						console.log(doc.qTitle + ":" + doc.qDocName);
						console.log(doc.qDocId);
						$.docId = doc.qDocId;
						//console.log('docid:' + docId);
						//break;
					}
				});
				return $.docId;
			})
			.then(function()
			{
				$.global.connection.ws.terminate();
			})
			.then(function()
			{
				console.log('docId: ' + $.docId);
				callback(null, $.docId);
			})
			.catch(function(error)
			{
				callback(error);
			});
		});
	}

};

module.exports = getDocId;