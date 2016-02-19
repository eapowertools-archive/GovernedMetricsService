//tryReloadMetrics

var reloadMetrics = require('./reloadmetrics');
var login = require('./login');


login.login()
.then(function(cookies)
{
	reloadMetrics.reloadMetrics(cookies, 'bf4ef0ac-4680-49eb-a9c4-7d888a0c822f')
	.then(function(result)
	{
		console.log(result);
	});
});