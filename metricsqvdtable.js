var qsocks = require('qsocks');
var fs = require('fs');
var request = require('request');

var config = {
	host: 'sense22.112adams.local'
};

//  Set our request defaults, ignore unauthorized cert warnings as default QS certs are self-signed.
//  Export the certificates from your Qlik Sense installation and refer to them
var r = request.defaults({
  rejectUnauthorized: false,
  host: config.host,
  pfx: fs.readFileSync(__dirname + '\\client.pfx'),
  passphrase: 'secret'
});


//  Authenticate whatever user you want
var b = JSON.stringify({
  "UserDirectory": 'sense22',
  "UserId": 'administrator',
  "Attributes": []
});

var meas = {
	qInfo: {
        qId: "",
        qType: "measure"
      },
    qMeasure: {
        qLabel: "CountOfCities",
        qDef: "count([Capital city])",
        qGrouping: "N",
        qExpressions: [],
        qActiveExpression: 0
      },
    qMetaDef: {
        title:"City Count",
        description:"Count of Capital Cities",
        qSize: -1,
        sourceObject: "",
        draftObject: "",
        tags: []
   		}
};

var table = {
			qInfo: {
				qId: "MetricTable",
				qType: "Table"
			},
			qHyperCubeDef: {
				qDimensions: [
					{
						qLibraryId: "",
						qNullSuppression: false,
						qDef: {
							qGrouping: "N",
							qFieldDefs: [
								"ID"
							],
							qFieldLabels: [
								""
							]
						}
					},
					{
						qLibraryId: "",
						qNullSuppression: false,
						qDef: {
							qGrouping: "N",
							qFieldDefs: [
								"MetricType"
							],
							qFieldLabels: [
								""
							]
						}
					},
					{
						qLibraryId: "",
						qNullSuppression: false,
						qDef: {
							qGrouping: "N",
							qFieldDefs: [
								"MetricName"
							],
							qFieldLabels: [
								""
							]
						}
					},
					{
						qLibraryId: "",
						qNullSuppression: false,
						qDef: {
							qGrouping: "N",
							qFieldDefs: [
								"MetricSubject"
							],
							qFieldLabels: [
								""
							]
						}
					},
					{
						qLibraryId: "",
						qNullSuppression: false,
						qDef: {
							qGrouping: "N",
							qFieldDefs: [
								"MetricTags"
							],
							qFieldLabels: [
								""
							]
						}
					},
					{
						qLibraryId: "",
						qNullSuppression: false,
						qDef: {
							qGrouping: "N",
							qFieldDefs: [
								"MetricDescription"
							],
							qFieldLabels: [
								""
							]
						}
					},
					{
						qLibraryId: "",
						qNullSuppression: false,
						qDef: {
							qGrouping: "N",
							qFieldDefs: [
								"MetricFormula"
							],
							qFieldLabels: [
								""
							]
						}
					}
				],
				qMeasures: [],
				qInitialDataFetch: [
					{
						qTop: 0,
						qHeight: 50,
						qLeft: 0,
						qWidth: 7
					}
				]
			}
		};


//  Get ticket for user - refer to the QPS API documentation for more information on different authentication methods.
r.post(
	{
		uri: 'https://' + config.host + ':4243/qps/ticket?xrfkey=abcdefghijklmnop',
		body: b,
		headers:
		{
	   		'x-qlik-xrfkey': 'abcdefghijklmnop',
	    	'content-type': 'application/json'
	  	}
	},
	function(err, res, body) 
	{
		//  Consume ticket, set cookie response in our upgrade header against the proxy.
  		var ticket = JSON.parse(body)['Ticket'];
  		r.get('https://' + config.host + '/hub/?qlikTicket=' + ticket, function(error, response, body)
  		{
		    var cookies = response.headers['set-cookie'];
		    //  qsocks config, merges into standard https/http object headers.
		    //  Set the session cookie correctly.
		    //  The origin specified needs an entry in the Whitelist for the virtual proxy to allow websocket communication.
		    var config2 = 
		    {
		    	host: config.host,
		      	isSecure: true,
		      	origin: 'http://' + config.host,
		      	rejectUnauthorized: false,
		      	headers: 
		      	{
		        	"Content-Type": "application/json",
		        	"Cookie": cookies[0]
		      	}
    		}

    		// qsocks content cache
    				    var $ = {};

		    //  Connect to qsocks/qix engine
    		qsocks.Connect(config2).then(function(global) 
    		{
		    	//  From the global class create a new app
      			//global.createApp('This is a new app', 'First Script Tab').then(function(success) {
      			console.log(global);
      			global.getDocList().then(function(doclist){
      				doclist.forEach(function(doc){
      					if(doc.qTitle=="Metrics Library QVD Extractor"){
	      					//console.log(doc);
	      					global.openDoc(doc.qDocId,'', '', '', false).then(function(app)
	      					{
	      						console.log("APP " + app.handle);
	      						app.createSessionObject(table)
		      						.then(function(hyperq){
		      							return hyperq.getLayout();
		      					}).then(function(layout){
		      							layout.qHyperCube.qDimensionInfo.forEach(function(dim){
		      								console.log("Column: " + dim.qFallbackTitle);
		      							});
		      							//console.log(layout.qInfo.qId + " " + layout.qInfo.qType);
		      					}).then(function(result){
		      						global.connection.ws.terminate();	
		      					});
	      						
	      					});
	      						//app.createMeasure(meas)
		      					//	.then(function(success){
		      					//		console.log(success);
		      					//	});
			      			
      					}
      					//console.log(doc);
      				});
      			});
        		// App has been created - hopefully :)
        		//console.log(success)
		    });

	    });
  	}
);
