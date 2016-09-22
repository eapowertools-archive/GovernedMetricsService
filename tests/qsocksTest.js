var qsocks = require('qsocks');
var qsocksInstance = require('./qsocksInstance');

var appId = '831bc2ea-a43b-46f7-9ad2-d843cb9c4764';

var app2Connect = qsocksInstance(appId);

var x = {};
qsocks.Connect(app2Connect)
.then(function(global)
{
    return x.global = global;
})
.then(function(global)
{
    return global.openDoc(appId,'','','',true);
})
.then(function(app)
{
    return app.getAppLayout();
})
.then(function(layout)
{
    console.log(layout);
})
.then(function()
{
    x.global.connection.close();
})
.catch(function(error)
{
    console.log(error);
})
