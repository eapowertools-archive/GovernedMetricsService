var fs = require('fs');
var Promise = require('bluebird');
var config = require('../config');

function certificates() {
	return new Promise(function(resolve,reject){
		try {
			config.certificates.server = fs.readFileSync(config.certificates.server);
			config.certificates.server_key = fs.readFileSync(config.certificates.server_key);
			config.certificates.root = fs.readFileSync(config.certificates.root);
			config.certificates.client = fs.readFileSync(config.certificates.client);
			config.certificates.client_key = fs.readFileSync(config.certificates.client_key);
			
			resolve(null);
		}
		catch (e) {
			reject(e);
		}
	})
}

module.exports = certificates;