var logger = require('./logger');
var socketHelper = require("./socketHelper");

var createDimension = {
    updateDimension: function (appRef, app, data, tags) {
        var objId = data[9].qText;
        var object = dim(data, tags);
        return app.getDimension(objId)
            .then(function (dim) {
                return dim.getProperties()
                    .then(function (currentProps) {
                        socketHelper.logMessage("debug", "gms", "Dim: " + objId + " exists.  Checking for changes in app " + appRef.name, __filename)
                        if (JSON.stringify(currentProps) == JSON.stringify(object)) {
                            socketHelper.logMessage("debug", "gms", "Dim: " + objId + " no changes found in app " + appRef.name, __filename)
                            return "SAME";
                        } else {
                            socketHelper.logMessage("debug", "gms", "Dim: " + objId + " found changes for app " + appRef.name + ".  Setting properties.", __filename)
                            return dim.setProperties(object)
                                .then(function () {
                                    socketHelper.logMessage("debug", "gms", "Properties set on dim: " + objId + " in app " + appRef.name + ".", __filename)
                                    return dim.getLayout()
                                        .then(function (layout) {
                                            return "UPDATED"
                                        });
                                });
                        }
                    });
            })
            .catch(function (error) {
                socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename)
                return error;
            });
    },
    createDimension: function (appRef, app, data, tags) {
        var objId = data[9].qText;
        var object = dim(data, tags);
        socketHelper.logMessage("debug", "gms", "Dim: " + objId + " does not exist.  Creating in app " + appRef.name, __filename)

        return app.createDimension(object)
            .then(function (newDim) {
                socketHelper.logMessage("debug", "gms", "Created dim " + objId + " in app " + appRef.name, __filename)
                return newDim.getLayout()
                    .then(function (layout) {
                        return "CREATED";
                    })
            })
            .catch(function (error) {
                socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename)
                return error;
            });
    }
};

module.exports = createDimension;

function dim(data, tags) {
    var dim = {
        qInfo: {
            qId: data[9].qText,
            qType: data[1].qText.toLowerCase()
        },
        qDim: {
            qGrouping: data[7].qText,
            qFieldDefs: buildArray(data[7].qText, data[6].qText),
            qFieldLabels: [data[2].qText],
            title: data[2].qText
        },
        qMetaDef: {
            title: data[2].qText,
            description: data[5].qText == "" ? data[2].qText : data[5].qText,
            qSize: -1,
            sourceObject: "",
            draftObject: "",
            tags: tags,
            gms: true
        }
    };
    return dim;

    if (data[10].qText !== undefined) {
        if (data[10].qText !== '' || data[10].qText !== null || data[10].qText !== '-') {
            dim.qDim.coloring = {
                baseColor: {
                    color: data[10].qText,
                    index: -1
                },
                changeHash: Math.random().toString(),
                colorMapRef: data[9].qText
            }
        }
    }


    return dim;
}

function buildArray(groupingCode, fieldDefs) {
    var result = [];
    if (groupingCode.toUpperCase() == "N") {
        result.push(fieldDefs)
    } else {
        var splitString = fieldDefs.split(",");
        result = splitString;
    }
    return result;
}