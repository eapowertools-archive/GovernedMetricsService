var qrsInteract = require('../lib/qrsinteractions');

qrsInteract.get('https://masterlib.112adams.local:4242/qrs/executionresult?xrfkey=ABCDEFG123456789&filter=executionID eq 7d4050ee-5c06-4b03-9cbe-fefc697fab40')
.then(function(response)
{
	console.log(response);
});