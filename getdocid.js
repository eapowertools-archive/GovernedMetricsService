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
	getDocId: function(cookies, appName, callback)
	{
		var qConfig2 = {
			host: config.hostname,
			origin: 'https://' + config.hostname,
			isSecure: true,
			rejectUnauthorized: false,
			headers: {
				'Content-Type' : 'application/json',
				'x-qlik-xrfkey' : 'abcdefghijklmnop',
				'Cookie': cookies[0]
			},
			//cert: fs.readFileSync(config.certificates.server),
			//key: fs.readFileSync(config.certificates.server_key),
			//ca: fs.readFileSync(config.certificates.root),
		};

		console.log("Getting the Doc named: " + appName);
		var $ ={};
		qsocks.Connect(qConfig2)
		.then(function(global)
		{
			return global.getDocList();
		})
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
			console.log('docId: ' + $.docId);
			callback(null, $);
		})
		.catch(function(error)
		{
			callback('error');
		});
	}

};

module.exports = getDocId;