var qsocks = require('qsocks');
var qsocksInstance = require('./qsocksInstance');
var config = require('../config/config');
var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');
var winston = require('winston');
require('winston-daily-rotate-file');

//set up logging
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.DailyRotateFile)({ filename: config.logging.logFile, prepend:true})
    ]
});

var publishMetrics = 
{
    publishMetrics : function(appId)
    {
        return new Promise(function(resolve, reject)
        {
            logger.info("Begin publish process", {module:"publishMetrics"});
            var app2Connect = qsocksInstance(appId);
            var x = {};
            qsocks.Connect(app2Connect)
            .then(function(global)
            {
                x.global = global;
                return global;
            })
            .then(function(global)
            {
                return global.openDoc(appId, '', '', '', true);
            })
            .then(function(app)
            {
                x.app = app;
                return app.getAppLayout();
            })
            .then(function(layout)
            {
                if(layout.published)
                {
                    logger.info("The app: " + appId + " is published", {module:"publishMetrics"});
                    return x.layout = layout;
                }
                else
                {
                    logger.info("The app: " + appId + " is not published", {module:"publishMetrics"});
                    resolve("App is not Published");
                }
            })
            .then(function(layout)
            {
                logger.debug("Creating session object of measures and dimensons", {module:"publishMetrics"});
                return x.app.createSessionObject(listDef());
            })
            .then(function(obj)
            {
                x.list = obj;
                return obj.getLayout();
            })
            .then(function(layout)
            {
                    
                var mList = layout.qMeasureList.qItems.filter(filterMasterItems);
                var dList = layout.qDimensionList.qItems.filter(filterMasterItems);

                var list = mList.concat(dList);
                //console.log(list);
                return Promise.map(list, function(listItem)
                {
                    if(listItem.qInfo.qType.toLowerCase()=="dimension")
                    {
                        return x.app.getDimension(listItem.qInfo.qId)
                        .then(function(dim)
                        {
                            return dim.publish()
                            .then(function()
                            {
                                logger.debug("Success::Published dimension: " + listItem.qInfo.qId, {module:"publishMetrics"});
                                return "Success";
                            })
                            .catch(function(error)
                            {
                                logger.debug("Failure::Dimension not Published: " + listItem.qInfo.qId, {module:"publishMetrics"});
                                return "Failure: " + error;
                            });
                        })
                        .catch(function(error)
                        {
                            logger.debug("Failure::Dimension not Published: " + listItem.qInfo.qId, {module:"publishMetrics"});
                            return "Failure";
                        });
                    }
                    else if(listItem.qInfo.qType.toLowerCase()=="measure")
                    {
                        return x.app.getMeasure(listItem.qInfo.qId)
                        .then(function(meas)
                        {
                            return meas.publish()
                            .then(function()
                            {
                                //x.app.saveObjects()
                                //.then(function()
                                //{
                                    logger.debug("Success::Published Measure: " + listItem.qInfo.qId, {module:"publishMetrics"});
                                    return "Success";
                                //});
                            })
                            .catch(function(error)
                            {
                                logger.debug("Failure::Measure not Published: " + listItem.qInfo.qId, {module:"publishMetrics"});
                                return "Failure: " + error;
                            });
                        })
                        .catch(function(error)
                        {
                            logger.debug("Failure::Measure not Published: " + listItem.qInfo.qId, {module:"publishMetrics"});
                            return "Failure";
                        });
                    }
                }, {concurrency: 50});
            })
            .then(function(publishResults)
            {
                var success = 0;
                var failure = 0
                publishResults.forEach(function(answer)
                {
                    if(answer=="Success")
                    {
                        success += 1;
                    }
                    else
                    {
                        failure += 1;
                    }
                });
                var message = success + " of " + publishResults.length + " master items published."; 
                logger.info(message, {module:"publishMetrics"});
                return message;
            })
            .then(function(message)
            {
                logger.info("Saving Objects", {module:"publishMetrics"});
                x.app.saveObjects();
                x.global.connection.close();
                resolve(message);
            })
            .catch(function(error)
            {
                x.global.connection.close();
                logger.error(error, {module:"publishMetrics"});
                reject(error);
            });
        });
    }
};

module.exports = publishMetrics;

function listDef()
{
    var listDef =
    {
        qInfo:
        {
            qType: "listDef"
        },
        qMeasureListDef: 
        {
            qType: "measure",
            qData: {
                title: "/title",
                tags: "/tags"
            }
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
    return listDef;
}

function filterMasterItems(items)
{
	//console.log(items.qMeta.tags);
	if(items.qMeta.gms===true && items.qMeta.published===false)
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
