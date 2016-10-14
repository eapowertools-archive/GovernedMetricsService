var qrsInteract = require('./qrsInstance');
var config = require('../config/config');
var Promise = require('bluebird');
var getOwnedAppObjects = require('./getOwnedAppObjectsTest');
var getAppOwner = require('./getAppOwner');


var changeOwner =
{
    changeAppObjectOwner : function(userDirectory, userId, appId)
    {
        var x = {};
        getOwnedAppObjects.getOwnedAppObjects(userDirectory, userId, appId)
        .then(function(body)
        {
            var postPath = "/selection";
            return qrsInteract.Post(postPath, body, 'json');
        })
        .then(function(selection)
            {
                x.selectionId = selection.body.id;
                var tagPath = "/tag?filter=name eq 'gms'";
                return qrsInteract.Get(tagPath);
            }).then(function(tags)
            {
                if(tags.body.length == 0)
                {
                    reject("Tag does not exist");
                } 
                
                x.tagId = tags.body[0].id;
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
                },
                {
                    "name": "refList_Tag",
                    "value": {
                        "added": [x.tagId],
                        "removed": []
                    },
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
    }
};

module.exports = changeOwner;


function buildModDate() {
    var d = new Date();
    return d.toISOString();
}

