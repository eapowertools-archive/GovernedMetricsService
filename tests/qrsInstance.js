var qrsInteract = require('qrs-interact');
var config = require('./testConfig');

var qrsInstance = new qrsInteract(config.qrs);

module.exports = qrsInstance;