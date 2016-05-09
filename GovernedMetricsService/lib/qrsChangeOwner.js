var Promise = require('bluebird')
var config = require('../config/config');
var winston = require('winston');
var QRS = require('qrs');

/* Scaffolding for QRS */
var qrsConfig = {
	authentication: 'certificates',
	host: config.hostname,
	useSSL: true,
	cert: config.certificates.client,
	key: config.certificates.client_key,
	ca: config.certificates.root,
	port: config.qrsPort,
	headerKey: 'X-Qlik-User',
	headerValue: config.repoAccount,
	rejectUnauthorized: false
};

//set up logging
var logger = new (winston.Logger)({
	level: config.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});

var myQrs = new QRS(qrsConfig);
var x = {};
var result ='';
var changeOwner = 
{
    changeOwner: function(objectId, ownerId)
    {
        return new Promise(function(resolve)
        {
            myQrs.post('qrs/selection/app/object',[{"key": "id", "value": "eq " + objectId}])
            .then(function(result)
            {
                logger.info('qrsChangeOwner:: Selection on app.object ' + objectId + ' created.', {module: 'qrsChangeOwner'});
                x.id = result.id;
                var body =
                {
                    "latestModifiedDate": buildModDate(),
                    "type": "App.Object",
                    "properties": [
                    {
                        "name":"owner",
                        "value": ownerId,
                        "valueIsDifferent": false,
                        "valueIsModified": true
                    }]
                };
                logger.debug('qrsChangeOwner::Body for changing owner on app.object. ' +  JSON.stringify(body), {module: 'qrsChangeOwner'});
                myQrs.put('qrs/selection/' + result.id + '/app/object/synthetic')
                .then(function()
                {
                    //added the value
                    logger.info('qrsChangeOwner::Changed ownership of ' + objectId + ' to user ' + ownerId, {module: 'qrsChangeOwner'});
                    myQrs.delete('qrs/selection/' + x.id)
                    .then(function()
                    {
                        logger.info('qrsChangeOwner::Deleting selection for ownership change.', {module: 'qrsChangeOwner'});
                        resolve();
                    })
                    .catch(function(error)
                    {
                       logger.error('qrsChangeOwner::delete selection::' + error , {module: 'qrsChangeOwner'});
                       reject(new Error(error)); 
                    });
                })
                .catch(function(error)
                {
                   logger.error('qrsChangeOwner::change ownership::' + error , {module: 'qrsChangeOwner'})
                   reject(new Error(error)); 
                });
            })
            .catch(function(error)
            {
               logger.error('qrsChangeOwner::create selection::' + error , {module: 'qrsChangeOwner'})
               reject(new Error(error)); 
            });
        })
    }
};

function buildModDate()
{    
    var d = new Date();
    return d.getUTCFullYear() + '-' + (d.getMonth() < 10 ? '0'+d.getMonth() : d.getMonth()) + 
    		'-' + (d.getUTCDay() < 10 ? '0'+d.getUTCDay() : d.getUTCDay()) + 
        'T' + (d.getUTCHours() < 10 ? '0'+d.getUTCHours() : d.getUTCHours()) +
        ':' + (d.getUTCMinutes() < 10 ? '0'+d.getUTCMinutes() : d.getUTCMinutes()) + 
        ':' + (d.getUTCSeconds() < 10 ? '0'+d.getUTCSeconds() : d.getUTCSeconds()) +
        '.' + d.getUTCMilliseconds() + 'Z';
}

module.exports= changeOwner;