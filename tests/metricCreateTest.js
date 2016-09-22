var qsocks = require('qsocks');
var qsocksInstance = require('./qsocksInstance');
var fs = require('fs');
var Promise = require('bluebird');
var itemCount = require('./checkRepoTest');
var createDimension = require('./createDimension');
var createMeasure = require('./createMeasure');
var objectMgmt = require('./objectManagementTest');

var appId = '831bc2ea-a43b-46f7-9ad2-d843cb9c4764'
var app2Connect = qsocksInstance(appId);

//this test will load 1000 metrics into the specified app above.
var file = fs.readFileSync('hcube.json');

var data = JSON.parse(file.toString());

return objectMgmt.manageObjects(appId,data);


// var x = {};
// qsocks.Connect(app2Connect)
// .then(function(global)
// {
//     x.global = global;
//     return global.openDoc(appId,'','','',true)
//     .then(function(app)
//     {
//         x.app = app;
//         var reducedData = data.filter(filterMetrics(['Revenue']));
//         return reducedData;
//     })
//     .then(function(reducedData)
//     {
//         return Promise.map(reducedData, function(data)
//         {
//             var tags = createTags(data);
//             //console.log(objId);
//             if(data[1].qText.toLowerCase()=='dimension')
//             {
//                 return createDimension.createDimension(x.app, data, tags);
//             }
//             if(data[1].qText.toLowerCase()=='measure')
//             {
//                 return createMeasure.createMeasure(x.app, data, tags);
//             }                
//         });
//     })
//     .then(function(resultArray)
//     {
//         console.log('result of obj creation: ' + resultArray.length);
//         var metVals = resultArray.length;
//         var repoVals = 0;
//         promiseWhile(function() {
//             // Condition for stopping
//             return repoVals < metVals;
//         }, function() {
//             // Action to run, should return a promise
//             return itemCount.count(appId)
//                     .then(function(result)
//                     {
//                         repoVals = result
//                         console.log(repoVals);
//                         return repoVals;
//                     })
//                     .timeout(30000)
//                     .catch(Promise.TimeoutError, function(error)
//                     {
//                         console.log('Timeout getting information from repo.');
//                     });
//         }).then(function() {
//             // Notice we can chain it because it's a Promise, 
//             // this will run after completion of the promiseWhile Promise!
//             console.log("Done");
//         });
//     })
//     .catch(function(error)
//     {
//         console.log(error)
//     });
// })
// .then(function()
// {
//     x.global.connection.close();
// })
// .catch(function(error)
// {
//     console.log(error)
// });


// function filterMetrics(subjectAreas)
// {
// 	return function(obj)
// 	{
// 		return subjectAreas.filter(function(subjectArea)
// 		{
// 			return subjectAreas.indexOf(obj[3].qText) > -1;
// 		}).length === subjectAreas.length;
// 	}	
// }

// function createTags(data)
// {
//     var tags = [];
//     var tagString = data[4].qText.split(";");
//     tagString.forEach(function(tagValue)
//     {
//         tags.push(tagValue);
//     });

//     tags.push("MasterItem");
//     tags.push(data[3].qText);
//     tags.push(data[3].qText.toLowerCase() + '_' + data[0].qText);
//     return tags;
// }

// var promiseWhile = Promise.method(function(condition, action) 
// {
//     if (!condition()) return;
//     return action().then(promiseWhile.bind(null, condition, action));
// });