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
require('winston-daily-rotate-file');

//set up logging
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.DailyRotateFile)({ filename: config.logging.logFile, prepend:true})
    ]
});

var x={};
  
logger.info('Firing up the Governed Metrics Service ReST API',{module:'server'});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use('/masterlib/public', express.static(config.gms.publicPath));


logger.info('Setting port',{module:'server'});

var port = config.gms.port || 8590;

logger.info('Setting route',{module:'server'});

var popmasterlib = require('./routes/routes');


//Register routes
//all routes will be prefixed with api
app.use('/masterlib',popmasterlib);

//Start the server
app.listen(port);
  
logger.info('Governed Metrics Service started',{module:'server'});
