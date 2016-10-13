var itemCount = require('./checkRepoTest');

var appId = '831bc2ea-a43b-46f7-9ad2-d843cb9c4764'

itemCount.count(appId)
.then(function(result)
{
    console.log(result);
});

