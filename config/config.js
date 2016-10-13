var path = require('path');

//For production

//var certPath = 'C:/masterlib/certs/masterlib';
var certPath = 'F:/My Documents/_Git/QlikSenseQMCUtility/certs';//path.join(process.env.programdata, '/Qlik/Sense/Repository/Exported Certificates/.Local Certificates');

var logPath = path.join(__dirname,'/../log/');
var logFile = logPath + 'masterlib.log';

var globalHostname = 'sense3.112adams.local';

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
		port: 8590,
		hostname: globalHostname,
		routePath: path.join(__dirname, '/../routes/'),
		publicPath: path.join(__dirname, '/../public/'),
		appPath: path.join(__dirname, '/../app/'),
		appName: 'Metrics Library',
		customPropName: 'ManagedMasterItems',
		taskName: 'Reload Metrics Library',
		objectManagementTimeout: 60000
	},
	engine: {
		enginePort: 4747,
		hostname: globalHostname,
		repoAccount: 'UserDirectory=Internal;UserId=sa_repository'
	},
	logging: {
		logPath: logPath,
		logFile: logFile,
		logLevel: 'debug'
	},
	qrs: {
		localCertPath: certPath,
		hostname: globalHostname,
		repoAccountUserDirectory: 'INTERNAL',
		repoAccountUserId: 'sa_repository',
		changeInterval: 15
	}
};

function convertDate() {
  function pad(s) { return (s < 10) ? '0' + s : s; }
  var d = new Date();
  return [d.getUTCFullYear(), '-', pad(d.getUTCMonth()+1), '-', pad(d.getUTCDate())].join('');
}

module.exports = config;