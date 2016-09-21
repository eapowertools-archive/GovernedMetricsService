var extend = require('extend');
var path = require('path');
var config = require('../config/config');


var hostname = 'sense3.112adams.local';
var certPath = 'F:/My Documents/_Git/GovernedMetricsService/tests/certs';
var newObj = {
    certificates: {
		certPath: certPath,
		client: path.resolve(certPath, 'client.pem'),
		client_key: path.resolve(certPath,'client_key.pem'),
		server: path.resolve(certPath, 'server.pem'),
		server_key: path.resolve(certPath, 'server_key.pem'),
		root: path.resolve(certPath,'root.pem')
	},
    gms :
    {
        hostname: hostname
    },
    engine:
    {
        hostname: hostname
    },
    qrs:
    {
        hostname: hostname,
        localCertPath: certPath
    }
};


var testConfig = extend(true, config, newObj);

module.exports = testConfig;