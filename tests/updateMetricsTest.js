var qrsInteract = require('./qrsInstance');
var config = require('./testConfig');
var Promise = require('bluebird');
var fs = require('fs');
var objectMgmt = require('../lib/objectManagement');
var changeOwner = require('../lib/changeOwner');
var publishMetrics = require('./publishMetrics');


//this test will load 1000 metrics into the specified app above.
var file = fs.readFileSync('hcube.json');
var data = JSON.parse(file.toString());
var appId = '831bc2ea-a43b-46f7-9ad2-d843cb9c4764';
var subjectAreas = ["Revenue"];


//create or update metrics
objectMgmt.manageObjects(appId, data, subjectAreas)
.then(function(message)
{
    console.log(message);
    changeOwner.changeAppObjectOwner(config.qrs.repoAccountUserDirectory, config.qrs.repoAccountUserId, appId)
    .then(function(message)
    {
        console.log(message);
        return publishMetrics.publishMetrics(appId)
        .then(function(message)
        {
            console.log(message);
        })
        .catch(function(error)
        {
            console.log(error);
        });
    })
    .catch(function(error)
    {
        console.log(error);
    });
})
.catch(function(error)
{
    console.log(error);
});

//change ownership if required
//publish if required
//exit gracefully






function getAppSubjectAreas(appRef, customProp)
{
	return new Promise(function (resolve)
	{
		var result = [];
		var itemCount = 0;
		return Promise.all(appRef.customProperties.map(function(item)
		{
			if(item.definition.name==customProp)
			{
				return item.value;
			}
		}))
		.then(function(arrValues)
		{
			resolve(arrValues);
		});
	});

}