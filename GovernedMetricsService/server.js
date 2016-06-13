//server.js

//BASE Setup
//=========================================================================


//require statements
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var winston = require('winston');
var config = require('./config/config');
var qrsNotify = require('./lib/qrsNotify');
var Promise = require('bluebird');

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

  logger.info('Setting port',{module:'server'});

  var port = config.port || 8590;

  logger.info('Setting route',{module:'server'});

  var popmasterlib = require('./routes/routes');


  //Register routes
  //all routes will be prefixed with api
  app.use('/masterlib',popmasterlib);

  //Start the server
  var server = app.listen(port);
  
  logger.info('masterlib started',{module:'server'});
  return server;
})
.then(function(server)
{
	x.server = server;
    qrsNotify.setNotification()
    .then(function(result)
    {
      logger.info('notification agent setup with handle:' + result, {module:'server'});
      x.notificationHandle = result;
    })
    .catch(function(error)
    {
      logger.error(error);
      logger.error('Notification agent setup failed', {module:'server'});
      logger.info('Shutting down server.', {module:'server'})
      server.close();
    });
});

process.on('SIGINT', function()
{
  logger.info('Terminating Governed Metrics Service API', {module:'server'});
  logger.info('Removing notification agent:' + x.notificationHandle, {module:'server'});
  qrsNotify.delNotification(x.notificationHandle)
  .then(function()
  {
 		x.server.close();
  });
});


