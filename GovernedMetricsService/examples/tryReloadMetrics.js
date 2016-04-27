//tryReloadMetrics

var reloadMetrics = require('../lib/reloadmetrics');


	reloadMetrics.reloadMetrics('HelloWorld')
	.then(function(result)
	{
		console.log(result);
	})
	.catch(function(error)
		{
			console.log(error);
		});
