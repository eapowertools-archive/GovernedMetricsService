//server.js

//BASE Setup
//=========================================================================


//require statements
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var winston = require('winston');
var config = require('./config/config');

//set up logging
var logger = new (winston.Logger)({
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});

logger.info('Firing up the masterlib ReST API',{module:'server'});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

logger.info('Setting port',{module:'server'});

var port = config.port || 8590;

logger.info('Setting route',{module:'server'});

var popmasterlib = require('./routes/popmasterlib');


//Register routes
//all routes will be prefixed with api
app.use('/masterlib',popmasterlib);

//Start the server
app.listen(port);

logger.info('masterlib started',{module:'server'});



