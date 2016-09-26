var winston = require('winston');
var config = require('../config/config');
require('winston-daily-rotate-file');

//set up logging
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.DailyRotateFile)({ filename: config.logging.logFile, prepend: true})
    ]
});


var createMeasure = 
{
    createMeasure: function(app, data, tags)
    {
        var objId = data[3].qText.toLowerCase() + '_' + data[0].qText;
        var object = meas(data, tags);
        return app.getMeasure(objId)
        .then(function(meas)
        {
            if(meas == null)
            {
                logger.debug("Measure: " + objId + " does not exist.  Creating", {module: "createMeasure"});
                return app.createMeasure(object)
                .then(function(newMeas)
                {
                    logger.debug("Measure: " + objId + " Created", {module: "createMeasure"});
                    
                    return newMeas.getLayout()
                    .then(function(layout)
                    {
                        return "CREATED";
                        //return layout.qInfo.qId;
                    })
                })
            }
            else
            {
                return meas.getProperties()
                .then(function(currentProps)
                {
                    logger.debug("Measure: " + objId + " exists.  Checking for changes.", {module: "createMeasure"});
                    if(JSON.stringify(currentProps)==JSON.stringify(object))
                    {
                        logger.debug("Measure: " + objId + " no changes found.", {module: "createMeasure"});
                        return "SAME";
                    }
                    else
                    {
                        logger.debug("Measure: " + objId + " found changes.  Setting properties.", {module: "createMeasure"});
                        return meas.setProperties(object)
                        .then(function()
                        {
                            logger.debug("Measure: " + objId + " new properties set.", {module: "createMeasure"});
                            return meas.getLayout()
                            .then(function(layout)
                            {
                                return "UPDATED"
                                //return layout.qInfo.qId;
                            });
                        });
                    }
                });
            }
        });
    }
};

module.exports = createMeasure;

function meas(data,tags)
{
    var meas = {
        qInfo: {
            qId: data[3].qText.toLowerCase() + '_' + data[0].qText,
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
            description: data[5].qText,
            qSize: -1,
            sourceObject: "",
            draftObject: "",
            tags: tags,
            gms: true
        }
    };
    return meas;
}