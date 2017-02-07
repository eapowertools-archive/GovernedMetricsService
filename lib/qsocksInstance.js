var config = require('../config/config');
var fs = require('fs');

var qsocksInstance = function(appId) {
    return qConfig2 = {
        host: config.engine.hostname,
        port: config.engine.enginePort,
        origin: 'https://' + config.engine.hostname,
        isSecure: true,
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/json',
            'x-qlik-xrfkey': 'abcdefghijklmnop',
            'X-Qlik-User': config.engine.repoAccount
        },
        key: fs.readFileSync(config.certificates.client_key),
        cert: fs.readFileSync(config.certificates.client),
        appname: appId || null
    };
}

module.exports = qsocksInstance;