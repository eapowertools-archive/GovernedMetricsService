//server.js

//BASE Setup
//=========================================================================


//require statements
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8590;

var popmasterlib = require('./routes/popmasterlib');


//Register routes
//all routes will be prefixed with api
app.use('/masterlib',popmasterlib);

//Start the server
app.listen(port);
console.log('Magic is happening on port ' + port);