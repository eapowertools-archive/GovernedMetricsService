var path = require('path');
var extend = require('extend');

//For production
//var certPath = 'C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates';

var certPath = 'C:/masterlib/certs';
var routePath = path.join(__dirname, 'server/routes/');
var publicPath = path.join(__dirname, 'public/');

var config = extend(true, {
	port: 8590,
	enginePort: 4747,
	hostname: 'sense22.112adams.local',
	virtualProxy: 'sdkheader',
	//headerName: 'hdr-sense-sdkheader',
	userDirectory: 'sense22',
	userId: 'qlikservice',
	certificates: {
		client: path.resolve(certPath, 'client.pem'),
		client_key: path.resolve(certPath,'client_key.pem'),
		server: path.resolve(certPath, 'server.pem'),
		server_key: path.resolve(certPath, 'server_key.pem'),
		root: path.resolve(certPath,'root.pem')
	},
	routePath: routePath,
	publicPath: publicPath,
	appName: 'Metrics Libary',
	customPropName: 'subjectarea'
});

module.exports = config;