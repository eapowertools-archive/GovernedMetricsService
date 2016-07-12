var qrsInteract = require('qrs-interact');
var config = require('../config/config');

var qrsInstance = new qrsInteract(config.qrs);

module.exports = qrsInstance;