var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');
var config = require('../config/config');
var logger = require('./logger');
var socketHelper = require("./socketHelper");

var changeOwner = {
    changeAppObjectOwner: function (body, appInfo) {
        return new Promise(function (resolve, reject) {
            socketHelper.logMessage("debug", "gms", "Starting App Object Ownership change on " + appInfo.name + " with owner " + appInfo.owner, __filename);
            var x = {};
            var postPath = "/selection";
            return qrsInteract.Post(postPath, body, 'json')
                .then(function (selection) {

                    x.selectionId = selection.body.id;
                    var tagPath = "/tag?filter=name eq 'gms'";
                    return qrsInteract.Get(tagPath);
                }).then(function (tags) {
                    if (tags.body.length == 0) {
                        reject("Tag does not exist");
                    } else {
                        x.tagId = tags.body[0].id;
                    }
                })
                .then(function () {
                    var body = {
                        "latestModifiedDate": buildModDate(),
                        "type": "App.Object",
                        "properties": [{
                                "name": "owner",
                                "value": appInfo.ownerId,
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
                            },
                            {
                                "name": "approved",
                                "value": true,
                                "valueIsDifferent": false,
                                "valueIsModified": true
                            }
                        ]
                    };
                    var putPath = "/selection/" + x.selectionId + "/app/object/synthetic";

                    return qrsInteract.Put(putPath, body)
                        .then(function (sCode) {
                            return sCode.statusCode;
                        })
                        .catch(function (error) {
                            socketHelper.logMessage("error", "gms", "Failed on put of ownership change objects for app: " + appInfo.name, __filename);
                            reject(error);
                        });

                })
                .then(function (sCode) {
                    if (sCode == 204) {
                        socketHelper.logMessage("debug", "gms", "Processed Change Ownership Request", __filename);

                        var deletePath = "/selection/" + x.selectionId;
                        return qrsInteract.Delete(deletePath)
                            .then(function (result) {
                                resolve("Change Ownership Complete");
                            })
                            .catch(function (error) {
                                socketHelper.logMessage("error", "gms", "Failed on delete call of the selection during ownership change for app: " + appInfo.name, __filename);
                                reject(error);
                            });
                    }
                })
                .catch(function (error) {
                    socketHelper.logMessage("error", "gms", "Failed on Post to get selection id during ownership change for app: " + appInfo.name, __filename);
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