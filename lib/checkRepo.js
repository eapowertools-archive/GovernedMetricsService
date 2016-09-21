var qrsInteract = require('./qrsInstance');
var config = require('../config/config');
var Promise = require('bluebird');

var repoCount = 
{
    count : function(appId)
    {
        return new Promise(function(resolve, reject)
        {
            var path = "/app/object/count";
            path += "?filter=owner.userId eq '" + config.qrs.repoAccountUserId + "' and owner.userDirectory eq '";
            path += config.qrs.repoAccountUserDirectory + "' and (objectType eq 'dimension' or objectType eq 'measure')";
            path += " and app.id eq " + appId;

            qrsInteract.Get(path)
            .then(function(result)
            {
                resolve(result.value);
            })
        })
    }
}


module.exports = repoCount;

