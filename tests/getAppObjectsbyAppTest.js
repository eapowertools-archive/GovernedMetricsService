var qrsInteract = require('./qrsInstance');
var config = require('./testConfig');
var Promise = require('bluebird');
var getOwnedAppObjects = require('./getOwnedAppObjectsTest');
var getAppOwner = require('./getAppOwner');
//var segregateAppObjects = require('./segregateAppObjects');
var fs = require('fs');

var x = {};

var appId = '831bc2ea-a43b-46f7-9ad2-d843cb9c4764';

getOwnedAppObjects.getOwnedAppObjects("INTERNAL","sa_repository", appId)
.then(function(body)
{
    //x.body = body;
    // var destFile = fs.createWriteStream('ownedAppObjects.json',{defaultEncoding:'utf8'});
    // destFile.on('finish', function()
    // {
    //     console.log('File Done!');
    // });

    // destFile.write(JSON.stringify(body, null, "\t"));
    // destFile.end();
    var postPath = "/selection";
    return qrsInteract.Post(postPath, body, 'json');
})
.then(function(selection)
{
    x.selectionId = selection.body.id;
    return getAppOwner.getAppOwner(appId);
})
.then(function(owner)
{
    var body = 
    {
        "latestModifiedDate": buildModDate(),
        "type": "App.Object",
        "properties": [{
            "name": "owner",
            "value": owner.id,
            "valueIsDifferent": false,
            "valueIsModified": true
        }]
    };
    
    var putPath = "/selection/" + x.selectionId + "/app/object/synthetic";

    return qrsInteract.Put(putPath, body)
    .then(function(sCode)
    {
        return sCode.statusCode;
    });

})
.then(function(sCode)
{
    if(sCode == 204)
    {
        var deletePath = "/selection/" + x.selectionId;
        qrsInteract.Delete(deletePath)
        .then(function(result) {
            //logger.debug('qrsChangeOwner::Deleting selection for ownership change.' + result, {module: 'qrsChangeOwner'});
            return result;
        })
        .catch(function(error) {
            logger.error('qrsChangeOwner::delete selection::' + JSON.stringify(error) , {module: 'qrsChangeOwner'});
            reject(new Error(error));
        });        
    }
})
.catch(function(error)
{
    console.log(error);
});


function buildModDate() {
    var d = new Date();
    return d.toISOString();
}

