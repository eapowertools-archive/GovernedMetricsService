var qrsInteract = require('./qrsInstance');
var bluebird = require('bluebird');


var getAppOwner = 
{
    getAppOwner : function(appId)
    {
        return new Promise(function(resolve,reject)
        {
            var path = "/app/full";
            path += "?filter=id eq " + appId;
            return qrsInteract.Get(path)
            .then(function(result)
            {
                resolve(result[0].owner);
            })
            .catch(function(error)
            {
                reject(error);
            });
        })
    }
};


module.exports = getAppOwner;