
var createDimension =
{
    createDimension: function(app, data, tags)
    {
        var objId = data[3].qText.toLowerCase() + '_' + data[0].qText;
        var object = dim(data, tags);
        return app.getDimension(objId)
        .then(function(dim)
        {
            if(dim === null)
            {
                return app.createDimension(object)
                .then(function(newDim)
                {
                    //console.log("I'm created");
                    return newDim.getLayout()
                    .then(function(layout)
                    {
//                                    console.log(layout);
                        return layout;
                    })
                })
            }
        });
    }
};

module.exports = createDimension;

function dim(data,tags)
	{
		var dim = {
			qInfo: {
				qId: data[3].qText.toLowerCase() + '_' + data[0].qText,
				qType: data[1].qText.toLowerCase()
			},
			qDim: {
				qGrouping: "N",
				qFieldDefs: [data[6].qText],
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
                gms:true
			}
		};
		return dim;
	}