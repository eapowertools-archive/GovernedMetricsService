var qsocks = require('qsocks');
var fs = require('fs');
var request = require('request');
var promise = require('bluebird');
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
				//qMeasures: [],
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



var layout;
var cube;

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
		    //qsocks.Connection.close(config2);
    		qsocks.Connect(config2)
    			.then(function(global) 
  				{
  					console.log(global);
  					return $.global = global;
  				}).catch(function(error){console.log(error);})
  				.then(function(global)
  				{
  					return $.global.getDocList();
  				})
  				.then(function(doclist)
  				{
  					return $.doclist = doclist;
  				})
  				.then(function()
  				{
  					var docId;
  					$.doclist.forEach(function(doc)
  					{
  						
  						console.log(doc.qTitle);
  						if(doc.qTitle=="Metrics Library QVD Extractor")
  						{
  							console.log("found!");
  							docId = doc.qDocId;
  						}
  					})
  					//why does my chain stop here?
  					console.log("selected app: " + docId);
  					return $.docId=docId;
  				})
  				.then(function()
  				{
  					console.log("Loading: " + $.docId);
  					return $.global.openDoc($.docId,'', '', '', false);
  				})
  				.then(function(app)
  				{
  					console.log(app.handle);
  					return $.app = app;
  				})
  				.then(function()
  				{
  					return $.app.createSessionObject(table);
  				})
  				.then(function(obj)
  				{
  					return $.obj = obj;
  				})
  				.then(function(obj)
  				{
  					console.log('object');
  					console.log($.obj);
  					return $.obj.getProperties();
  				})
  				.then(function(props){
  					console.log('props');
  					console.log(props);
  					return $.props = props;
  				})
  				.then(function(props){
  					console.log('HyperCubeDef?');
  					$.hyperc = $.props.qHyperCubeDef;
  					$.iFetch = $.hyperc.qInitialDataFetch
  					console.log($.hyperc)
  					console.log($.iFetch);
  					return $.obj.getHyperCubeData('/qHyperCubeDef',$.iFetch);
  				})
  				.then(function(data) 
  				{
  					console.log('data');
  					//console.log(data);
  					console.log(data[0].qMatrix[0]);
  					return $.obj.getLayout();
  				})
  				.then(function(layout){
  					//console.log('layout');
  					//console.log(layout);
  					return $.hyperc = layout.qHyperCube;
  				})
  				.then(function(hyperc)
  				{
  					//console.log($.hyperc);
  					return $.pages = hyperc.qDataPages;
  				})
  				.then(function(pages)
  				{
  					//console.log('pages');
  					//console.log($.pages);
  					return $.qmatrix = pages.qMatrix;
  				})
  				.then(function(matrix)
  				{
  					//console.log('qmatrix');
  					return 'hello world';
  				})
  				.catch(function(error) {
				  	console.log(error);
				})
				.then(function()
				{
					//qsocks.Connection.close(config2);
					$.global.connection.ws.terminate()	
				})
				.catch(function(error) {
				  	console.log(error);
				});
						
	    });
  	}
);
