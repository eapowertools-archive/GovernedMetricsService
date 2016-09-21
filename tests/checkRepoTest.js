var qrsInteract = require('./qrsInstance');
var config = require('./testConfig');
var Promise = require('bluebird');

//var appId = '831bc2ea-a43b-46f7-9ad2-d843cb9c4764'

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

