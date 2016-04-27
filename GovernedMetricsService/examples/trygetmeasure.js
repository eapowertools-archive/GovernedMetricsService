//tryGetMeasure.js
var qsocks = require('qsocks');
var login = require('./login');
var killSession = require('./killsession');
var updateMetrics = require('./updatemetrics');
var config = require('./config');

login.login()
.then(function(cookies)
{
	var x = {};
	x.cookies = cookies;
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
		}
	};
	qsocks.Connect(qConfig2)
	.then(function(global)
	{
		x.global = global;
		global.openDoc('59beea22-f7a0-4cf5-ab51-6f2345ed08e1','','','',true)
		.then(function(app)
		{
			app.getMeasure('vBLdQ')
			.then(function(meas)
			{
				console.log(meas);
				console.log('handle: ' + meas.handle);
			})
			.then(function()
			{
				x.global.connection.ws.terminate();
				killSession.logout(x.cookies)
				.then(function(result)
				{
					console.log(result);
				})
				.catch(function(error)
				{
					console.log(error);
				});
			});
		});
	});
});