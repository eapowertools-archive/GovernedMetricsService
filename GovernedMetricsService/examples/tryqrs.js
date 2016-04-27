//qrs test

var qrs = require('qrs');
var config = require('./config');

var qrsConfig = {
	authentication: 'certificates',
	host: 'sense22.112adams.local',
	useSSL: true,
	cert: config.certificates.client,
	key: config.certificates.client_key,
	root: config.certificates.root,
	port: config.qrsPort,
	headerKey: 'X-Qlik-User',
	headerValue: 'UserDirectory:Internal;UserId:sa_repository'
};

var myQrs = new qrs(qrsConfig);

console.log('hello');
myQrs.get('qrs/app')
.then(function(data){
	console.log('return something');
	console.log(data);
});
