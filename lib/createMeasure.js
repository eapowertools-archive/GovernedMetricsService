var logger = require('./logger');
var socketHelper = require("./socketHelper");

var createMeasure = {
    updateMeasure: function (appRef, app, data, tags) {
        var objId = data[9].qText;
        var object = meas(data, tags);
        return app.getMeasure(objId)
            .then(function (meas) {
                return meas.getProperties()
                    .then(function (currentProps) {
                        socketHelper.logMessage("debug", "gms", "Measure: " + objId + " exists.  Checking for changes in app " + appRef.name, __filename)
                        if (JSON.stringify(currentProps) == JSON.stringify(object)) {
                            socketHelper.logMessage("debug", "gms", "No changes found in measure: " + objId + " for app " + appRef.name, __filename)
                            return "SAME";
                        } else {
                            socketHelper.logMessage("debug", "gms", "Found changes in measure: " + objId + " for app " + appRef.name, __filename);
                            return meas.setProperties(object)
                                .then(function () {
                                    socketHelper.logMessage("debug", "gms", "New properties set for measure: " + objId + " in app " + appRef.name, __filename);
                                    return meas.getLayout()
                                        .then(function (layout) {
                                            return "UPDATED"
                                        });
                                });
                        }
                    });
            })
            .catch(function (error) {
                socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                return error;
            })
    },
    createMeasure: function (appRef, app, data, tags) {
        var objId = data[9].qText;
        var object = meas(data, tags);
        socketHelper.logMessage("debug", "gms", "Measure: " + objId + " does not exist.  Creating in app " + appRef.name, __filename);
        return app.createMeasure(object)
            .then(function (newMeas) {
                socketHelper.logMessage("debug", "gms", "Measure: " + objId + " created in app " + appRef.name, __filename);
                return newMeas.getLayout()
                    .then(function (layout) {
                        return "CREATED";
                        //return layout.qInfo.qId;
                    })
            })
            .catch(function (error) {
                socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(error), __filename);
                return error;
            })
    }
};

module.exports = createMeasure;

function meas(data, tags) {
    var meas = {
        qInfo: {
            qId: data[9].qText,
            qType: data[1].qText.toLowerCase()
        },
        qMeasure: {
            qLabel: data[2].qText,
            qDef: data[6].qText,
            qGrouping: "N",
            qExpressions: [],
            qActiveExpression: 0
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

    if (data[10].qText !== undefined) {
        if (data[10].qText !== '' || data[10].qText !== null || data[10].qText !== '-') {
            meas.qMeasure.coloring = {
                baseColor: {
                    color: data[10].qText,
                    index: -1
                }
            }
        }
    }

    return meas;
}