var qrsInteract = require('./qrsInstance');
var config = require('./testConfig');
var Promise = require('bluebird');
var getOwnedAppObjects = require('./getOwnedAppObjectsTest');
var getAppOwner = require('./getAppOwner');
var changeOwner = require('./changeOwner');
//var segregateAppObjects = require('./segregateAppObjects');
var fs = require('fs');

var x = {};

var appId = '831bc2ea-a43b-46f7-9ad2-d843cb9c4764';

changeOwner.changeAppObjectOwner("INTERNAL","sa_repository", appId);