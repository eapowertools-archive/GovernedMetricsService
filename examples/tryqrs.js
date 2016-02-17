//qrs test

var qrsInteract = require('./qrsinteractions.js');

qrsInteract.get("https://sense22.112adams.local/sdkheader/qrs/app?xrfkey=ABCDEFG123456789&filter=customProperties.definition.name eq 'subjectarea' and customProperties.value eq 'CallCenter'", function(error, result)
{
	result.forEach(function(item)
	{
		console.log(item.id);
	});
});
