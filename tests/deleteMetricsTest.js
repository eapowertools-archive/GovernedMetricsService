var qsocks = require('qsocks');
var qsocksInstance = require('./qsocksInstance');
var fs = require('fs');
var Promise = require('bluebird');


var appId = '831bc2ea-a43b-46f7-9ad2-d843cb9c4764';
var app2Connect = qsocksInstance(appId);


var stuff = {};
stuff.appId = appId;
qsocks.Connect(app2Connect)
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
    return stuff.measureList = stuff.app.createSessionObject(measureListDef());
})
.then(function(obj)
{
    return obj.getLayout();
})
.then(function(layout)
{

    var items = layout.qMeasureList.qItems;
    var mList = items.filter(filterMasterItems);
    
    return Promise.all(mList.map(function(listItem)
    {
        return stuff.app.destroyMeasure(listItem.qInfo.qId)
        .then(function(success)
        {
            var measureInfo = listItem.qMeta.title + ':' + listItem.qInfo.qId;
            console.log(measureInfo + " deleted!");
            return null;
        });
    }));
})
.then(function()
{
    return stuff.dimensionList = stuff.app.createSessionObject(dimensionListDef());
})
.then(function(obj)
{
    return obj.getLayout();
})
.then(function(layout)
{
    var items = layout.qDimensionList.qItems;
    var dList = items.filter(filterMasterItems);
    
    return Promise.all(dList.map(function(listItem)
    {
        return stuff.app.destroyDimension(listItem.qInfo.qId)
        .then(function(success)
        {
            var dimInfo = listItem.qMeta.title + ':' + listItem.qInfo.qId;
            console.log(dimInfo + " deleted!");
            return null;
        });
    }));
})
.then(function()
{
    console.log("Delete Complete");
    stuff.global.connection.close();
})
.catch(function(error)
{
    console.log(error);
});


function measureListDef()
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
};

function dimensionListDef()
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
};

// function filterMasterItems(items)
// {
// 	//console.log(items.qMeta.tags);
// 	if(items.qInfo.qId.startsWith("revenue_")== true)
// 	{
// 		//console.log('Found One!');
// 		return true;
// 	}
// 	else
// 	{
// 		//console.log('Not a MasterItem');
// 		return false;
// 	} 
// };

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

