var qrsInteract = require('./qrsInstance');
var config = require('./testConfig');
var Promise = require('bluebird');


var getOwnedAppObjects = {
    getOwnedAppObjects: function(userDirectory, userId, appId)
    {
        return new Promise(function(resolve, reject)
        {
            var path = "/app/object";
            path += "?filter=owner.userId eq '" + userId + "' and owner.userDirectory eq '";
            path += userDirectory + "' and (objectType eq 'dimension' or objectType eq 'measure')";
            appId !== undefined ? path += " and app.id eq " + appId : "";
            qrsInteract.Get(path)
            .then(function(appObjects) {
                //logger.debug('AppObjects returned:', JSON.stringify(appObjects) , {module:'qrsChangeOwner',method:'changeAgent'});
                return Promise.all(appObjects.body.map(function(appObject)
                {
                    return appObject.id;
                }));
            })
            .then(function(result)
            {
                return createBody(result)
            })
            .then(function(body)
            {
                resolve(body);
            })
            .catch(function(error) {
                reject(error);
            });
        });
    
    }
};

module.exports = getOwnedAppObjects;


function createBody(arrObjects) {
    return new Promise(function(resolve, reject) 
    {
        var resultArray = [];
        var objCount = 0;

        return Promise.all(arrObjects.map(function(item)
        {
            var object = {
                "type": "App.Object",
                "objectID": item
            };
            return object; 
        }))
        .then(function(resultArray)
        {
            var result = {
                "items": resultArray
            }; 
            resolve(result);
        })
        .catch(function(error)
        {
            reject(error);
        });
    });
}