const logger = require("./logger");

function createColorMap(appRef, app, data, colorData) {
    let objId = "ColorMapModel_" + data[9].qText;
    let object = colorMapDef(data, colorData);
    return app.getObject(objId)
        .then(function (colorModel) {
            if (colorModel === null) {
                logger.debug("ColorMapModel: " + objId + " does not exist.  Creating", {
                    module: "createColorMap",
                    app: appRef.name
                });
                return app.createObject(object)
                    .then(function (newColorMap) {
                        logger.debug("ColorMapModel: " + objId + " Created", {
                            module: "createColorMap",
                            app: appRef.name
                        });
                        return newColorMap.getLayout()
                            .then(function (layout) {
                                return "CREATED";
                                //return layout.qInfo.qId;
                            })
                    })
            } else {
                return colorModel.getProperties()
                    .then(function (currentProps) {
                        logger.debug("ColorMapModel: " + objId + " exists.  Checking for changes.", {
                            module: "createColorMap",
                            app: appRef.name
                        });
                        if (JSON.stringify(currentProps) == JSON.stringify(object)) {
                            logger.debug("ColorMapModel: " + objId + " no changes found.", {
                                module: "createColorMap",
                                app: appRef.name
                            });
                            return "SAME";
                        } else {
                            logger.debug("ColorMapModel: " + objId + " found changes.  Setting properties.", {
                                module: "createColorMap",
                                app: appRef.name
                            });
                            return colorModel.setProperties(object)
                                .then(function () {
                                    logger.debug("ColorMapModel: " + objId + " new properties set.", {
                                        module: "createColorMap",
                                        app: appRef.name
                                    });
                                    return dim.getLayout()
                                        .then(function (layout) {
                                            return "UPDATED"
                                        });
                                });
                        }
                    })
            }

        })
}


module.exports = createColorMap;

function colorMapDef(data, colorData) {

    let colors = []
    colorData.forEach(function (colorItem) {
        colors.push({
            "value": colorItem[1].qText,
            "baseColor": {
                "color": colorItem[2].qText,
                "index": -1
            }
        })
    })

    //placeholders for nul, oth, pal,and others


    let colorDef = {
        "qInfo": {
            "qId": "ColorMapModel_" + data[9].qText,
            "qType": "ColorMap"
        },
        "colorMap": {
            "colors": colors,
            "nul": setColor(data, 12),
            "oth": setColor(data, 13),
            "pal": setColor(data, 14),
            "single": setColor(data, 15),
            "usePal": setBool(15),
            "autoFill": setBool(16)
        }
    }


    return colorDef;
}

function setColor(data, index) {
    if (data[index].qText !== undefined) {
        if (data[index].qText !== '' || data[index].qText !== null || data[index].qText !== '-') {
            return {
                "color": data[index].qText,
                "index": -1
            }
        }
    } else {
        if (index == 15) {
            return {
                "color": "none",
                "index": 0
            }
        }
        return null;
    }

}

function setBool(data, index) {
    if (data[index].qText !== undefined) {
        if (data[index].qText !== '' || data[index].qText !== null || data[index].qText !== '-') {
            return true;
        }
    } else {
        return false;
    }
}