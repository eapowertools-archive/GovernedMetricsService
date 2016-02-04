function setCubeDims(obj)
{
	
	//create the dimension list for the hypercubedef
	var hyperCubeDims = [];
	var dims = obj.dims;
	dims.forEach(function(dim){
		var dimension = {
			qLibraryId:"",
			qNullSuppression: false,
			qDef: {
				qGrouping: "N",
				qFieldDefs: [dim.fieldname],
				qFieldLabels: [dim.label]
			}
		};
		hyperCubeDims.push(dimension);
	});

	//create the hypercubedef and return the object
	var hypercubedef = {
		qInfo: {
			qId: "MasterLibTable",
			qType: "Table"
		},
		qHyperCubeDef: {
			qDimensions: hyperCubeDims,
			qInitialDataFetch: [
				{
					qTop: 0,
					qHeight: 50,
					qLeft: 0,
					qWidth: hyperCubeDims.length
				}
			]
		}

	}
	return hypercubedef;
}

module.exports = setCubeDims;