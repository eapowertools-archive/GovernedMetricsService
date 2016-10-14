var qrsInteract = require('./qrsInstance');

var path = "/app/full?filter=name eq 'Executive Dashboard'";

qrsInteract.Get(path)
.then(function(result)
{
    console.log(result);
});