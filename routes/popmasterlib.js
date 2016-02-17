var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var parseUrlencoded = bodyParser.urlencoded({extended: false});
var hypercube = require('../lib/setCubeDims');
var worker = require('../lib/dowork');
var getdoc = require('../lib/getdocid');
var gethypercube = require('../lib/getmetricshypercube');
var killsession = require('../lib/killsession');

router.use(function(req,res,next){
	console.log('Something is happening.');
	next();
});

router.route('/')
	.get(function(request,response){
		var cube = hypercube.setCubeDefault();
		worker.doWork(cube,function(error,result){
			if(error)
			{
				response.status(400).json("Bad Request");
			}
			else
			{
				//for my reference so I can see how to send responses.
				//response.status(200).json(result.connection.ws.url);

				response.status(200).json(result);
			}
		});
	})
	.post(parseUrlencoded, function(request,response){
		var result = worker.doWork(hypercube.setCubeDims(request.body));
		response.status(200).json(result);
	});

function isEmpty(obj){
	for(var prop in obj){
		if(obj.hasOwnProperty(prop))
		{
			return false;
		}
	}
	return true;
};

router.route('/login')
	.get(function(request,response)
	{
		worker.login(function(error, result)
		{
			if(error)
			{
				response.status(400).json(error);
			}
			else
			{
				response.sendStatus(200);
			}
		});
	})
//for testing getDocId method
router.route('/getdocid')
	.get(function(request,response)
	{
		worker.getDoc("Metrics Library", null)
		.then(function(result)
		{
			response.status(200).json(result);

		})
		.catch(function(error)
		{
			response.status(400).json(error);
		});
	});

//for testing getMetricsTable method
router.route('/getmetricstable')
	.get(function(request,response)
	{
		gethypercube.getMetricsTable(function(error,result)
		{
			if(error)
			{
				response.status(400).json(error);
			}
			else
			{
				response.status(200).json(result);
			}
		});
	});

router.route('/add/all')
	.post(function(request, response)
	{
		worker.addAll()
		.then(function(result)
		{
			killsession.logout(result.cookies)
			.then(function(message)
			{
				response.status(200).json(result.result + '\n' + message);
			});
		})
		.catch(function(error)
		{
			response.status(400).json(error);
		});			
		
	});

router.route('/update/all')
	.post(function(request, response)
	{
		worker.updateAll()
		.then(function(result)
		{
			killsession.logout(result.cookies)
			.then(function(message)
			{
				response.status(200).json(result.result + '\n' + message);
			});
		})
		.catch(function(error)
		{
			response.status(400).json(error);
		});			
		
	});

router.route('/delete/all')
	.post(parseUrlencoded, function(request,response){
		worker.deleteAll(request.body)
		.then(function(result)
		{
			killsession.logout(result.cookies)
			.then(function(message)
			{
				response.status(200).json(result.result + '\n' + message);
			});
		});
	});


router.route('/dims')
	.post(function(request, response)
	{
		response.status(200).json(request.body);
	});

router.route('/measures')
	.post(function(request, response)
	{
		response.status(200).json(request.body);
	});

module.exports = router;
