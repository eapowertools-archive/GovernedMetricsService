var qrsInteract = require('./qrsInstance');
var bluebird = require('bluebird');
var getOwnedAppObjects = require('./getOwnedAppObjects');
var getAppOwner = require('./getAppOwner');


var changeOwner =
{
    changeAppObjectOwner : function(userDirectory, userId, appId)
    {
        return new Promise(function(resolve, reject)
        {
            console.log("Beginning Change Ownership");
            var x = {};
            getOwnedAppObjects.getOwnedAppObjects(userDirectory, userId, appId)
            .then(function(body)
            {
                console.log(body);
                var postPath = "/selection";
                return qrsInteract.Post(postPath, body, 'json');
            })
            .then(function(selection)
            {
                x.selectionId = selection.id;
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
                    return sCode;
                });

            })
            .then(function(sCode)
            {
                if(sCode == 204)
                {
                    var deletePath = "/selection/" + x.selectionId;
                    qrsInteract.Delete(deletePath)
                    .then(function(result) {
                        resolve("Change Ownership Complete");
                    })
                    .catch(function(error) {
                        reject(error);
                    });        
                }
            })
            .catch(function(error)
            {
                reject(error);
            });
        });
    }
};

module.exports = changeOwner;


function buildModDate() {
    var d = new Date();
    return d.toISOString();
}

