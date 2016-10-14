var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');


var tagMetrics = 
{
    tagMetrics : function(appRef, appObjectId)
    {
        return new Promise(function(resolve,reject)
        {
            var x ={};
            //get the tag id
            var tagPath = "/tag?filter=name eq 'gms'";
            qrsInteract.Get(tagPath)
            .then(function(result)
            {
                If(result.body.length == 0)
                {
                    reject("Tag does not exist");
                } 
                
                x.tagId = result.body[0].id;
                var selectPath = "/selection"
                var body = {
                    "type": "App.Object",
                    "objectID": appObjectId
                };
                return qrsInteract.Post(selectPath, body, 'json');
            })
            .then(function(selection)
            {
                x.selectionId = selection.body.id;
                //now put
                var putPath = "/Selection/" + selection.id + "/app/object/synthetic";
                var body = {
                    "latestModifiedDate": buildModDate(),
                    "type": "App.Object",
                    "properties": [{
                        "name": "refList_Tag",
                        "value": {
                            "added": [x.tagId],
                            "removed": []
                        },
                        "valueIsDifferent": false,
                        "valueIsModified": true
                    }]
                };

                return qrsInteract.Put(putPath, body)
                .then(function(sCode)
                {
                    return sCode.statusCode;
                });

            })
            .then(function(sCode)
            {
                logger.info("The response code from the tag put: " + sCode, {module: "tagMetrics",app: appRef.name});
                if(sCode == 204)
                {
                    logger.info("Processed Tag Request", {module: "tagMetrics",app: appRef.name});
                    var deletePath = "/selection/" + x.selectionId;
                    qrsInteract.Delete(deletePath)
                    .then(function(result) {
                        logger.info("GMS Repo Tagging Complete", {module: "tagMetrics",app: appRef.name});
                        resolve("GMS Repo Tagging Complete");
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


module.exports = tagMetrics;

function buildModDate() {
    var d = new Date();
    return d.toISOString();
}

