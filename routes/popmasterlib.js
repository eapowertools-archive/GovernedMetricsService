var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var parseUrlencoded = bodyParser.urlencoded({extended: false});

var hypercube = require('../setCubeDims');
var worker = require('../dowork');
var getdoc = require('../getdocid');
var gethypercube = require('../getmetricshypercube');

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
		worker.getDoc("Metrics Library", function(error,result)
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

	//all accepts two properties in a json object
	/*
	{
		appNames : [], is an array of the name of apps on the server.  If supplied empty, all apps will be included except the Metrics Library App.
		customProperties : 
		{
			name : "string", name of customproperty to evaluate
			values : [] is an array of custom property values to apply metrics to apps matching one or more of these values.
		}
	}
	*/
	.post(function(request, response)
	{
		worker.addAll(function(error,result)
		{
			if(error)
			{
				response.status(400).json(error)
			}
			else
			{
				response.status(200).json(result);
			}
		});			
		
	});

router.route('/delete/all')
	.post(parseUrlencoded, function(request,response){
		worker.deleteAll(request.body,function(error, result)
		{
			if(error)
			{
				response.status(400).json(error);
			}
			else
			{
				response.status(200).json(result)
			}
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
