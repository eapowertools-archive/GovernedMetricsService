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
            var path = "/app/object";
            path += "?filter=tags.name eq 'gms' and (objectType eq 'dimension' or objectType eq 'measure') and (app.published eq true and app.id eq " + appId + ")";
            console.log(path);
            qrsInteract.Get(path)
            .then(function(appObjects)
            {
                return appObjects.body.map(function(appObject)
                {
                    return appObject.id;
                });
            })
            .then(function(arrObjects)
            {
                return Promise.all(arrObjects.map(function(appObjectId)
                {
                    var putPath = "/app/object/" + appObjectId + "/publish";
                    //console.log(putPath);
                    var body = "";
                    return qrsInteract.Put(putPath, body)
                    .then(function(sCode)
                    {
                        //console.log("return code: " + sCode);
                        if(sCode.statusCode==200)
                        {
                            console.log("Published " + appObjectId);
                            //logger.info("Published appObject: " + appObjectId, {module:"publishMetrics"});
                            return 1;
                        }
                        else
                        {
                            console.log(sCode);
                            //logger.info("Failed to publish appObject: " + appObjectId, {module:"publishMetrics"});
                            return 0;
                        }
                    })
                    .catch(function(error)
                    {
                        console.log(error);
                        reject(error);
                    });
                }))
                .then(function(resultArray)
                {
                    var successCount = 0;
                    resultArray.forEach(function(item)
                    {
                        successCount += item;
                    });
                    logger.info("Published " + successCount + " of " + resultArray.length + "App Objects", {module:"publishMetrics"});
                    resolve("Published " + successCount + " of " + resultArray.length + "App Objects");
                })
                .catch(function(error)
                {
                    reject(error);
                });
            })
            .catch(function(error)
            {
                //logger.error("Error in publishMetrics: " + JSON.stringify(error), {module:"publishMetrics"});
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
