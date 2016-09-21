var qrsInteract = require('./qrsInstance');
var config = require('./testConfig');
var bluebird = require('bluebird');
var getOwnedAppObjects = require('./getOwnedAppObjectsTest');
var getAppOwner = require('./getAppOwner');
//var segregateAppObjects = require('./segregateAppObjects');

var x = {};

var appId = '831bc2ea-a43b-46f7-9ad2-d843cb9c4764';

getOwnedAppObjects.getOwnedAppObjects("INTERNAL","sa_repository", appId)
.then(function(body)
{
    var postPath = "/selection";
    return qrsInteract.Post(postPath, body, 'json');
})
.then(function(selection)
{
    var path = "/selection";
    path += "/" + selection.id + "/app/object/full";
    path += "?orderby=app.id";
    return qrsInteract.Get(path);
})
.then(function(objInfo)
{
    
    return arrObjects = objInfo.map(function(obj)
    {
        return obj.id;
    });
    //return segregateAppObjects.segregateAppObjects(objInfo);

})
.then(function(arrObjects)
{
    x.arrObjects = arrObjects;
    return getAppOwner.getAppOwner(appId);
})
.then(function(owner)
{
    return {
        "appObjects" : x.arrObjects,
        "appId" : appId,
        "ownerId": owner.id
    };
})
.then(function(changeObject)
{
    console.log(changeObject);
})
.catch(function(error)
{
    console.log(error);
});




