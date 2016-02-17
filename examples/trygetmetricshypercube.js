//try getmetricshypercube

var hypercube = require('./getmetricshypercubesingle');

hypercube.getMetricsTable(null,function(error, result)
{
	var flags = [];
	var subjectAreas = [];
	var l = result.length;
	var i;

	for(i=0;i<l;i++)
	{
		var item = result[i];
		if(flags[item[3].qText]) continue;
		flags[item[3].qText] = true;
		subjectAreas.push(item[3].qText);
	}

	console.log(subjectAreas);

});