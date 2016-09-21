var qsocks = require('qsocks');
var qsocksInstance = require('./qsocksInstance');

var app2Connect = qsocksInstance('831bc2ea-a43b-46f7-9ad2-d843cb9c4764');

qsocks.Connect(app2Connect)
.then(function(global)
{
    console.log(global);
    global.connection.close();
})
