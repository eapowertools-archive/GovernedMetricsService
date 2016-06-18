var qsocks = require('qsocks');
var Promise = require('bluebird');
var config = require('../config/config');
var winston = require('winston');
var fs = require('fs');

//set up logging
var logger = new (winston.Logger)({
	level: config.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});

var deleteMetrics = 
{
	config : function(appId)
	{
		return new Promise(function(resolve)
		{
			var qConfig2 =
			{
				host: config.hostname,
				port: config.enginePort,
				origin: 'https://' + config.hostname,
				isSecure: true,
				rejectUnauthorized: false,
				headers: {
					'Content-Type' : 'application/json',
					'x-qlik-xrfkey' : 'abcdefghijklmnop',
					'X-Qlik-User': config.repoAccount
				},
				key: fs.readFileSync(config.certificates.client_key),
				cert: fs.readFileSync(config.certificates.client),
				appname: appId
			};
			resolve(qConfig2);
		});
	},
	deleteAllMasterItems : function(appId)
	{
		return new Promise(function(resolve, reject)
		{
			logger.info('deleteAllMasterItems::Deleting all MasterItem dimensions and measures from app: ' + appId, {module: 'deletemetrics'});
			var stuff = {};
			stuff.appId = appId;
			deleteMetrics.config(appId)
			.then(function(config)
			{
				qsocks.Connect(config)
				.then(function(global)
				{
					stuff.global = global;
					return global;
				})
				.then(function(global)
				{
					return global.openDoc(appId, '', '', '', true);
				})
				.then(function(app)
				{
					return stuff.app = app;
				})
				.then(function(app)
				{
					return stuff.measureList = stuff.app.createSessionObject(deleteMetrics.measureListDef());
				})
				.then(function(obj)
				{
					return obj.getLayout();
				})
				.then(function(layout)
				{
					var items = layout.qMeasureList.qItems;
					var mList = items.filter(filterMasterItems);
					
					mList.forEach(function(measure)
					{
						var measureInfo = measure.qMeta.title + ':' + measure.qInfo.qId;
						stuff.app.destroyMeasure(measure.qInfo.qId)
						.then(function(success)
						{
							logger.info('deleteAllMasterItems::destroyMeasure::' + measureInfo + ' succeeded', {module: 'deletemetrics'});
						});
					}); 
				})
				.then(function()
				{
					return stuff.dimensionList = stuff.app.createSessionObject(deleteMetrics.dimensionListDef());
				})
				.then(function(obj)
				{
					return obj.getLayout();
				})
				.then(function(layout)
				{
					var items = layout.qDimensionList.qItems;
					var dList = items.filter(filterMasterItems);
					
					dList.forEach(function(dimension)
					{
						var dimInfo = dimension.qMeta.title + ':' + dimension.qInfo.qId;
						stuff.app.destroyDimension(dimension.qInfo.qId)
						.then(function(success)
						{
							logger.info('deleteAllMasterItems::destroyDimension::' + dimInfo + ' succeeded', {module: 'deletemetrics'});
						});
					});	
				})
				.then(function()
				{
					logger.info('deleteAllMasterItems::saveObjects::Master Items removed.', {module: 'deletemetrics'});
					var res = {
						result: 'delete complete!'
					};
					stuff.global.connection.ws.terminate();
					logger.info('deleteAllMasterItems::Engine connection terminated', {module: 'deletemetrics'});
					resolve(res);
				})
				.catch(function(error)
				{
					logger.error('deleteAllMasterItems::qSocks error::' + error, {module: 'deletemetrics'});
					reject(new Error(error));
				});
			})
			.catch(function(error)
			{
				logger.error('deleteAllMasterItems::Config error::' + error, {module: 'deletemetrics'});
				reject(new Error(error));
			});
		});
	},
	deleteAllMasterItemMeasures : function(appId, callback)
	{
		var qConfig2 = {
			host: config.hostname,
			port: config.enginePort,
			origin: 'https://' + config.hostname,
			isSecure: true,
			rejectUnauthorized: false,
			headers: {
				'Content-Type' : 'application/json',
				'x-qlik-xrfkey' : 'abcdefghijklmnop',
				'X-Qlik-User': config.repoAccount
			},
			key: fs.readFileSync(config.certificates.client_key),
			cert: fs.readFileSync(config.certificates.client),
			appname: appId
		};

		console.log('Deleting all measures from app: ' + appId);
		var stuff = {};
		stuff.appId = appId;
		
		qsocks.Connect(qConfig2)
		.then(function(global)
		{
			console.log('all good at global');
			return global;
		})
		.then(function(global)
		{
			return global.openDoc(qConfig2.appname, '', '', '', true);
		})
		.then(function(app)
		{
			console.log('app opened');
			return stuff.app = app;
		})
		.then(function(app)
		{
			return app.createSessionObject(deleteMetrics.measureListDef());
		})
		.then(function(obj)
		{
			return obj.getLayout();
		})
		.then(function(layout)
		{
			var items = layout.qMeasureList.qItems;
			var mList = items.filter(filterMasterItems);

			mList.forEach(function(measure)
			{
				//console.log(measure.qMeta.title + ':' + measure.qInfo.qId);
				stuff.app.destroyMeasure(measure.qInfo.qId)
				.then(function(success)
				{
					console.log(success);
				})
				.then(function()
				{
					callback(null, 'made it through alive');
				})
				.catch(function(error)
				{
					callback(error);
				});
			}); 
		});
	},
	deleteAllDimensions : function(appId, callback)
	{
		var qConfig2 = {
			host: config.hostname,
			port: config.enginePort,
			origin: 'https://' + config.hostname,
			isSecure: true,
			rejectUnauthorized: false,
			headers: {
				'Content-Type' : 'application/json',
				'x-qlik-xrfkey' : 'abcdefghijklmnop',
				'X-Qlik-User': config.repoAccount
			},
			key: fs.readFileSync(config.certificates.client_key),
			cert: fs.readFileSync(config.certificates.client),
			appname: appId
		};

		console.log('Deleting all dimensions from app: ' + appId);
		var stuff = {};
		stuff.appId = appId;
		
		qsocks.Connect(qConfig2)
		.then(function(global)
		{
			console.log('all good at global');
			return global;
		})
		.then(function(global)
		{
			return global.openDoc(qConfig2.appname, '', '', '', true);
		})
		.then(function(app)
		{
			console.log('app opened');
			return stuff.app = app;
		})
		.then(function(app)
		{
			return app.createSessionObject(deleteMetrics.dimensionListDef());
		})
		.then(function(obj)
		{
			return obj.getLayout();
		})
		.then(function(layout)
		{
			var items = layout.qDimensionList.qItems;
			var dList = items.filter(filterMasterItems);

			dList.forEach(function(dimension)
			{
				//console.log(dimension.qMeta.title + ':' + dimension.qInfo.qId);
				stuff.app.destroyDimension(dimension.qInfo.qId)
				.then(function(success)
				{
					console.log(success);
				})
				.then(function()
				{
					callback(null, 'made it through alive');
				})
				.catch(function(error)
				{
					callback(error);
				});
			}); 
		});
	},
	deleteMeasure : function(appId, qId, callback)
	{

	},
	deleteDimension : function(appId, qId, callback)
	{

	},
	measureListDef : function()
	{
		var measureList = 
		{
			qInfo: 
			{
				qType: "MeasureList"
			},
			qMeasureListDef: 
			{
				qType: "measure",
				qData: {
					title: "/title",
					tags: "/tags"
				}
			}
		};
		return measureList;
	},
	dimensionListDef : function()
	{
		var dimensionList = 
		{
			qInfo:
			{
				qType: "DimensionList"
			},
			qDimensionListDef:
			{
				qType: "dimension",
				qData: {
					title: "/title",
					tags: "/tags"
				}
			}
		};
		return dimensionList;
	}
}

function filterMasterItems(items)
{
	//console.log(items.qMeta.tags);
	if(items.qMeta.tags.indexOf("MasterItem")!=-1)
	{
		//console.log('Found One!');
		return true;
	}
	else
	{
		//console.log('Not a MasterItem');
		return false;
	} 
};




module.exports = deleteMetrics;