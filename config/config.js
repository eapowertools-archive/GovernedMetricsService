var path = require('path');
var fs = require('fs');
var extend = require('extend');
var installConfig;

var configPath = path.join(__dirname, '/../config/');
var dir = fs.readdirSync(configPath);
dir.forEach(function(file) {
    if (file === 'installConfig.js') {
        installConfig = require('./installConfig');
    }
})

var certPath = path.join(process.env.programdata, '/Qlik/Sense/Repository/Exported Certificates/.Local Certificates');
var logPath = path.join(__dirname, '/../log/');
var logFile = logPath + 'gms.log';

var globalHostname = "localhost";
var friendlyHostname;
var qrsHostname;
var certPathBackup;

if (certPathBackup !== undefined) {
    certPath = certPathBackup;
}

var config = {
    certificates: {
        certPath: certPath,
        client: path.resolve(certPath, 'client.pem'),
        client_key: path.resolve(certPath, 'client_key.pem'),
        server: path.resolve(certPath, 'server.pem'),
        server_key: path.resolve(certPath, 'server_key.pem'),
        root: path.resolve(certPath, 'root.pem')
    },
    gms: {
        version: '2.0.0.0',
        port: 8590,
        hostname: friendlyHostname !== undefined ? friendlyHostname : globalHostname,
        routePath: path.join(__dirname, '/../routes/'),
        publicPath: path.join(__dirname, '/../public/'),
        appPath: path.join(__dirname, '/../app/'),
        nodeModPath: path.join(__dirname, './../node_modules/'),
        docsPath: path.join(__dirname, '/../docs/site/'),
        appName: 'Governed Metrics Application',
        customPropName: 'ManagedMasterItems',
        masterLibrarySourcePropName: 'MasterLibrarySource',
        taskName: 'Reload Governed Metrics Application',
        objectManagementTimeout: 60000,
        tagRestrict: false
    },
    engine: {
        enginePort: 4747,
        hostname: qrsHostname !== undefined ? qrsHostname : globalHostname,
        repoAccount: 'UserDirectory=Internal;UserId=sa_api'
    },
    logging: {
        logPath: logPath,
        logFile: logFile,
        logLevel: 'debug'
    },
    qrs: {
        localCertPath: certPath,
        hostname: qrsHostname !== undefined ? qrsHostname : globalHostname,
        repoAccountUserDirectory: 'INTERNAL',
        repoAccountUserId: 'sa_api',
        changeInterval: 15
    }
};

if (friendlyHostname !== undefined || qrsHostname !== undefined || certPathBackup !== undefined) {
    var mergedConfig = config;
} else if (installConfig !== undefined) {
    var mergedConfig = extend(true, config, installConfig);
} else {
    var mergedConfig = config;
}

module.exports = mergedConfig;