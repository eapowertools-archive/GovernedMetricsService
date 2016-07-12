var path = require('path');
var extend = require('extend');

//For production


//var certPath = 'C:/masterlib/certs/masterlib';

var routePath = path.join(__dirname, '/../routes/');
var publicPath = path.join(__dirname, '/../public/');
var logPath = path.join(__dirname,'/../log/');
var appPath = path.join(__dirname, '/../app/');

var logFile = logPath + 'masterlib.log';

var globalHostname = 'masterlib.112adams.local';

var config = {
	default: 
		extend(true, {
			port: 8590,
			enginePort: 4747,
			repoAttempts: 4000,
			hostname: globalHostname,
			userDirectory: 'masterlib',
			userId: 'qvadmin',
			changeInterval: 15,
			routePath: routePath,
			publicPath: publicPath,
			appPath: appPath,
			logPath: logPath,
			logFile: logFile,
			logLevel: 'info',
			appName: 'Metrics Library',
			customPropName: 'ManagedMasterItems',
			taskName: 'Reload Metrics Library'
		}),
	qrs: {
		hostname: globalHostname
	}
};

function convertDate() {
  function pad(s) { return (s < 10) ? '0' + s : s; }
  var d = new Date();
  return [d.getUTCFullYear(), '-', pad(d.getUTCMonth()+1), '-', pad(d.getUTCDate())].join('');
}

module.exports = config;