var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');
var config = require('../config/config');
var winston = require('winston');

var qsocks = require('qsocks');
var fs = require('fs');
var path = require('path');

require('winston-daily-rotate-file');

//set up logging
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.DailyRotateFile)({ filename: config.logging.logFile, prepend:true})
    ]
});

var getMdis =

	// TODO: getMdis should return all master data items from a specific Qlik
	// Sense app. I have provided the code that reads my specific certificate,
	// but I am not 100% sure how this would work in the gms app.
	getMdis: function(qsApp)
	{
		return new Promise(function(resolve, reject)
		{
			var config =
			{
        host: 'localhost',
        port: 4747, // Standard Engine port
        isSecure: true,
        headers: {
            'X-Qlik-User': 'UserDirectory=Internal;UserId=sa_repository' // Passing a user to QIX to authenticate as
        },
        key: fs.readFileSync(path.join(__dirname, 'client_key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'client.pem')),
        rejectUnauthorized: false, // Don't reject self-signed certs
        appname: qsApp
      };
			qsocks.Connect(config)
			.then(function(global)
			{
				return global.openDoc(qsApp)
			})
			.then(function(app)
			{
				return app.createSessionObject({
	        "qInfo": {
	          "qType": "DimensionList"
	        },
	        "qDimensionListDef": {
	          "qType": "dimension",
	          "qData": {
	            "title": "/title",
	            "tags": "/tags",
	            "info": "/qDimInfos"
	          }
	        },
	        "qMeasureListDef": {
	          "qType": "measure",
	          "qData": {
	            "title": "/title",
	            "tags": "/tags",
	            "info": "/q",
	            "measure": "/qMeasure"
	          }
	        }
	      })
			})
			.then(function(list)
			{
				return list.getLayout()
			})
			.then(function(layout)
			{
				var dimensions = layout.qDimensionList.qItems;
        var measures = layout.qMeasureList.qItems;

        var dimensionsReduced = dimensions.reduce(function(dims, d){
          dims.push({
            "ID": d.qInfo.qId,
            "MetricSubject": metricSubject,
            "MetricType": d.qInfo.qType,
            "MetricName": d.qMeta.title,
            "MetricDescription": d.qMeta.description,
            "MetricFormula": d.qData.info[0].qName,
            "MetricOwner": "MDI Api",
            "MetricTags": d.qMeta.tags.join(';')
          })
          return dims
        },[])
        var measuresReduced = measures.reduce(function(measures, m){
          measures.push({
            "ID": m.qInfo.qId,
            "MetricSubject": metricSubject,
            "MetricType": m.qInfo.qType,
            "MetricName": m.qMeta.title,
            "MetricDescription": m.qMeta.description,
            "MetricFormula": m.qData.measure.qDef,
            "MetricOwner": "MDI Api",
            "MetricTags": m.qMeta.tags.join(';')
          })
          return measures
        }, [])
        var masterDataItems = dimensionsReduced.concat(measuresReduced)
        return masterDataItems
			})
			.then(function(mdis)
			{
				resolve(mdis);
			})
			.catch(function(error)
			{
				reject(new Error("Could not find any Qlik Sense apps with the custom property " + customPropertyName));
			})
		});
	}


};

module.exports = getMdis;
