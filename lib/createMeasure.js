
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
                return app.createMeasure(object)
                .then(function(newMeas)
                {
                    //console.log("I'm created");
                    return newMeas.getLayout()
                    .then(function(layout)
                    {
                        return layout.qInfo.qId;
                    })
                })
            }
            else
            {
                return meas.getProperties()
                .then(function(currentProps)
                {
                    if(JSON.stringify(currentProps)==JSON.stringify(object))
                    {
                        console.log("entities match, no change necessary");
                        return null;
                    }
                    else
                    {
                        return meas.setProperties(object)
                        .then(function()
                        {
                            return meas.getLayout()
                            .then(function(layout)
                            {
                                return layout.qInfo.qId;
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