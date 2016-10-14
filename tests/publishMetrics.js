var qsocks = require('qsocks');
var qsocksInstance = require('./qsocksInstance');
var config = require('./testConfig');
var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');


var publishMetrics = 
{
    publishMetrics : function(appId)
    {
        return new Promise(function(resolve, reject)
        {
            console.log("Begin publish process");
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
                    console.log("app is published");
                    return x.layout = layout;
                }
                else
                {
                    console.log('App is not published.');
                    resolve("App is not Published");
                }
            })
            .then(function(layout)
            {
                return x.app.createSessionObject(listDef());
            })
            .then(function(obj)
            {
                x.list = obj;
                return obj.getLayout();
            })
            .then(function(layout)
            {
                    
                console.log(layout.qMeasureList.qItems.length);
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
                                return "Success";
                            })
                            .catch(function(error)
                            {
                                return "Failure: " + error;
                            });
                        })
                        .catch(function(error)
                        {
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
                                    return "Success";
                                //});
                            })
                            .catch(function(error)
                            {
                                return "Failure: " + error;
                            });
                        })
                        .catch(function(error)
                        {
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
                return message;
            })
            .then(function(message)
            {
                x.app.saveObjects();
                x.global.connection.close();
                resolve(message);
            })
            .catch(function(error)
            {
                x.global.connection.close();
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
