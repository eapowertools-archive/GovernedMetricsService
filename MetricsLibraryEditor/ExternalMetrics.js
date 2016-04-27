//var https = require('https');
var http = require('http');
var express=require('express');
var xlsx=require('xlsx');
var url= require('url');

var ADODB = require('node-adodb'), connection = ADODB.open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source=C:\\Program Files\\Qlik\\Sense\\ServiceDispatcher\\Node\\Metrics-Library-Editor\\metricsdata\\Metrics.accdb;');
ADODB.debug = true;


var app = express();
var targetId;
var RESTURI;

var data = null;

app.configure(function () {
    app.use(express.bodyParser());
	app.use(express.cookieParser('Test'));
	app.use(express.session());
    app.use(app.router);

});

app.get("/", function (req, res) {


		connection
  		.query('SELECT * FROM MetricLibrary')
  		.on('done', function (result)
  		{
  			//data = JSON.stringify(result, null, '  ');
  			data = result.records;
    		console.log('Result:' + JSON.stringify(result, null, '  '));
        res.sendfile('C:\\Program Files\\Qlik\\Sense\\ServiceDispatcher\\Node\\Metrics-Library-Editor\\Index.htm');
  		})
  		.on('fail', function (result)
  		{
    		console.log("fail");
        console.log(result);
        res.send('<h1>Unable to query database</h1><br /><p>' + JSON.stringify(result) + '</p>');
  		});

	
});



app.get('/read', function (req, res) {
      
	  console.log("Load Metrics Library");

	  console.log("Sending" + JSON.stringify(data));
		 
	  res.send(data);
 });



 app.post('/cell', function (req, res) {
 	
 	console.log(req.body);
 	//console.log(String.fromCharCode(65 + parseInt(req.body.col)) + String(parseInt(req.body.row)+1) + " changed to: " + req.body.value);
 	console.log("ID=" + parseInt(req.body.row));
 	console.log("fieldnum=" + parseInt(req.body.col))

 	var field = "";
 	switch(parseInt(req.body.col))
 	{
 		case 1: field = "MetricSubject"; break;
 		case 2: field = "MetricType"; break;
 		case 3: field = "MetricName"; break;
 		case 4: field = "MetricFormula"; break;
 		case 5: field = "MetricDescription"; break;
 		case 6: field = "MetricOwner"; break;
 		case 7: field = "MetricTags"; break;
 	}

 	if(field == "") 
 	{
 		console.log("field not found.");
 		return;
 	}
 		

 	connection
  .execute("update metriclibrary set " + field + "=\"" + req.body.value + "\" where ID=" + req.body.row)
  .on('done', function (data){
    //console.log('Result:'.green.bold, JSON.stringify(data, null, '  ').bold);
    console.log("cell updated.");
  })
  .on('fail', function (data){
    console.log("cell update failed.");
	  });
 });




app.post('/addrow', function (req, res) {
 	
 	//console.log(req.body);
 	//console.log(String.fromCharCode(65 + parseInt(req.body.col)) + String(parseInt(req.body.row)+1) + " changed to: " + req.body.value);
 	//console.log("ID=" + parseInt(req.body.row));
 	//console.log("fieldnum=" + parseInt(req.body.col))

 		

 	connection
  .execute("insert into metriclibrary (MetricSubject, MetricType, MetricName, MetricFormula, MetricDescription, MetricOwner, MetricTags) values ('ChangeMe', 'ChangeMe', 'ChangeMe', 'ChangeMe','ChangeMe', 'ChangeMe', 'ChangeMe')")
  .on('done', function (data){
    //console.log('Result:'.green.bold, JSON.stringify(data, null, '  ').bold);
    console.log("cell updated.");
  })
  .on('fail', function (data){
    console.log("cell update failed.");
	  });
 });

app.post('/deleterow', function (req, res) {
    
    //console.log(req.body);
    //console.log(String.fromCharCode(65 + parseInt(req.body.col)) + String(parseInt(req.body.row)+1) + " changed to: " + req.body.value);
    //console.log("ID=" + parseInt(req.body.row));
    //console.log("fieldnum=" + parseInt(req.body.col))

        

    connection
  .execute("delete from metriclibrary where ID = " + req.body.row)
  .on('done', function (data){
    //console.log('Result:'.green.bold, JSON.stringify(data, null, '  ').bold);
    console.log("delete row.");
  })
  .on('fail', function (data){
    console.log("delete row failed.");
      });
 });


 /*app.get('/save', function (req, res) {

 	xlsx.writeFile(workbook, MetricDatabase);

 });*/

 


app.get("/resource/font", function (req, res) {
    res.sendfile('qlikview-sans.svg');
});

app.get("/resource/icon", function (req, res) {
    res.sendfile("users.png");
});

app.get("/resource/qv", function (req, res) {
    res.sendfile("QlikLogo-RGB.png");
});

app.get("/resource/background", function (req, res) {
    res.sendfile("ConnectingCircles-01.png");
});


//Start listener
http.createServer(app).listen(8185);

//https.createServer(httpsoptions, app).listen(8185);