var qsocks = require('qsocks');
var fs = require('fs');
var request = require('request');
var path = require('path')
var Promise = require('bluebird')
var config = require('./config');
var hypercube = require('./setCubeDims');


var getDocId = 
{
	getDocId: function(cookies, appName)
	{
		return new Promise(function(resolve, reject)
		{
			console.log('running getdoc.getDocID');
			//console.log(cookies);
			var qConfig2 = {
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
			console.log(qConfig2);
			console.log("Getting the Doc named: " + appName);
			var $ ={};

			qsocks.Connect(qConfig2)
			.then(function(global)
			{
				return global;
			})
			.then(function(global)
			{
				console.log('time to get the doclist');
				console.log(global);
				return global.getDocList();
			})
			.then(function(doclist)
			{
				console.log('got the doclist');
				doclist.forEach(function(doc)
				{
					if(doc.qTitle===appName)
					{
						console.log(doc.qTitle + ":" + doc.qDocName);
						console.log(doc.qDocId);
						$.docId = doc.qDocId;
						resolve(doc.qDocId);
					}
				});
				
			})
			.then(function()
			{
				//$.global.connection.ws.terminate();
			})
			.catch(function(error)
			{
				console.log('Error at getdocid.js');
				console.log(error);
				reject(new Error(error));
			});
		});
	}
};

module.exports = getDocId;