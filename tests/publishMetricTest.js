var qsocks = require('qsocks');
var qsocksInstance = require('./qsocksInstance');
var config = require('./testConfig');
var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');
var publishMetrics = require('./publishMetrics');

var appId = '831bc2ea-a43b-46f7-9ad2-d843cb9c4764';
var app2Connect = qsocksInstance(appId);

publishMetrics.publishMetrics(appId)
.then(function(message)
{
    console.log(message);
})
.catch(function(error)
{
    console.log(error);
});