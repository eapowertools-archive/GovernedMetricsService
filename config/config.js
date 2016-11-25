var path = require('path');
var fs = require('fs');
var extend = require('extend');
var installConfig;

var configPath = path.join(__dirname,'/../config/');
var dir = fs.readdirSync(configPath);
dir.forEach(function(file)
{
    if(file==='installConfig.js')
    {
        installConfig = require('./installConfig');
    }
})

var certPath = path.join(process.env.programdata, '/Qlik/Sense/Repository/Exported Certificates/.Local Certificates');
var logPath = path.join(__dirname,'/../log/');
var logFile = logPath + 'gms.log';

var globalHostname = "localhost";
var friendlyHostname;
var qrsHostname;
var certPathBackup;

if(certPathBackup !== undefined)
{
	certPath = certPathBackup;
}

var config = {
	certificates: {
		certPath: certPath,
		client: path.resolve(certPath, 'client.pem'),
		client_key: path.resolve(certPath,'client_key.pem'),
		server: path.resolve(certPath, 'server.pem'),
		server_key: path.resolve(certPath, 'server_key.pem'),
		root: path.resolve(certPath,'root.pem')
	},
	gms: {
		version: '1.5.3.0',
		port: 8590,
		hostname: friendlyHostname !== undefined ? friendlyHostname : globalHostname,
        routePath: path.join(__dirname, '/../routes/'),
		publicPath: path.join(__dirname, '/../public/'),
		appPath: path.join(__dirname, '/../app/'),
		appName: 'Metrics Library',
		customPropName: 'ManagedMasterItems',
    metricLibraryInputPropName: 'metrics_library_input',
		taskName: 'Reload Metrics Library',
		objectManagementTimeout: 60000
	},
	engine: {
		enginePort: 4747,
		hostname: qrsHostname !== undefined ? qrsHostname : globalHostname,
		repoAccount: 'UserDirectory=Internal;UserId=sa_repository'
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
		repoAccountUserId: 'sa_repository',
		changeInterval: 15
	}
};

if(friendlyHostname !==undefined || qrsHostname !== undefined || certPathBackup !== undefined)
{
	var mergedConfig = config;
}
else if(installConfig !== undefined)
{
	var mergedConfig = extend(true, config, installConfig);
}
else
{
	var mergedConfig = config;
}

module.exports = mergedConfig;
