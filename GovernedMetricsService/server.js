//server.js

//BASE Setup
//=========================================================================


//require statements
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var winston = require('winston');
var config = require('./config/config');
var Promise = require('bluebird');
var doWork = require('./lib/dowork');

//set up logging
  var logger = new (winston.Logger)({
    level: config.logLevel,
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: config.logFile})
      ]
  });


var sequence = Promise.resolve();
var x={};
sequence = sequence.then(function()
{
  
  logger.info('Firing up the Governed Metrics Service ReST API',{module:'server'});

  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
  app.use('/masterlib/public', express.static(config.publicPath));


  logger.info('Setting port',{module:'server'});

  var port = config.port || 8590;

  logger.info('Setting route',{module:'server'});

  var popmasterlib = require('./routes/routes');


  //Register routes
  //all routes will be prefixed with api
  app.use('/masterlib',popmasterlib);

  //Start the server
  var server = app.listen(port);
  
  logger.info('Governed Metrics Service started',{module:'server'});
  return server;
})
.then(function(server)
{
	x.server = server;
  var timeInterval = config.changeInterval * 1000;
  var intervalTimer = setInterval(function()
  {
    doWork.bulkchangeOwner()
    .then(function(message)
    {
      logger.info(message, {module: 'server'});
    });
  }
  ,timeInterval);
  //var result = doWork.bulkchangeOwner();
  //console.log(result);
  
});
