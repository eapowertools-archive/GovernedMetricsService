var winston = require('winston');
var config = require('../config/config');
require('winston-daily-rotate-file');

//set up logging
var logger = new(winston.Logger)({
    level: config.logging.logLevel,
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.DailyRotateFile)({ filename: config.logging.logFile, prepend: true })
    ]
});

var createDimension = {
    createDimension: function(appRef, app, data, tags) {
        var objId = data[3].qText.toLowerCase() + '_' + data[0].qText;
        var object = dim(data, tags);
        return app.getDimension(objId)
            .then(function(dim) {
                if (dim === null) {
                    logger.debug("Dim: " + objId + " does not exist.  Creating", { module: "createDimension", app: appRef.name });
                    return app.createDimension(object)
                        .then(function(newDim) {
                            logger.debug("Dim: " + objId + " Created", { module: "createDimension", app: appRef.name });
                            return newDim.getLayout()
                                .then(function(layout) {
                                    return "CREATED";
                                    //return layout.qInfo.qId;
                                })
                        })
                } else {
                    return dim.getProperties()
                        .then(function(currentProps) {
                            logger.debug("Dim: " + objId + " exists.  Checking for changes.", { module: "createDimension", app: appRef.name });
                            if (JSON.stringify(currentProps) == JSON.stringify(object)) {
                                logger.debug("Dim: " + objId + " no changes found.", { module: "createDimension", app: appRef.name });
                                return "SAME";
                            } else {
                                logger.debug("Dim: " + objId + " found changes.  Setting properties.", { module: "createDimension", app: appRef.name });
                                return dim.setProperties(object)
                                    .then(function() {
                                        logger.debug("Dim: " + objId + " new properties set.", { module: "createDimension", app: appRef.name });
                                        return dim.getLayout()
                                            .then(function(layout) {
                                                return "UPDATED"
                                            });
                                    });
                            }
                        });
                }
            });
    }
};

module.exports = createDimension;

function dim(data, tags) {
    var dim = {
        qInfo: {
            qId: data[3].qText.toLowerCase() + '_' + data[0].qText,
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
            description: data[5].qText,
            qSize: -1,
            sourceObject: "",
            draftObject: "",
            tags: tags,
            gms: true
        }
    };
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