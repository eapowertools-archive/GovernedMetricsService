var Promise = require('bluebird')
var config = require('../config/config');
var winston = require('winston');
var qrsInteract = require('./qrsInstance');

//set up logging
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logging.logFile})
    ]
});

var qrsNotify = {
    setNotification: function()
    {
        //This method creates the notification service entry that will tell the sausage machine when the app objects have been added
        //to the repository.
        return new Promise(function(resolve, reject)
        {
            var path = "/notification";
            path += "?name=appobject&changetype=Add";
            path += "&filter=owner.userId eq '" + config.qrs.repoAccountUserId + "' and owner.userDirectory eq '" + config.qrs.repoAccountUserDirectory + "'";
            var body = "http://" + config.gms.hostname + ":" + config.gms.port + "/masterlib/notifyme";
            logger.debug('Creating notification service entry.', {module: 'qrsNotifyCreation', method: 'setNotification'});
            qrsInteract.Post(path, body,'json')
            .then(function(result)
            {
                logger.info('Handle for notification service entry:' + result.value, {module: 'qrsNotifyCreation', method: 'setNotification'});
                resolve(result.value);
            })
            .catch(function(error)
            {
                logger.error(error, {module: 'qrsNotifyCreation', method: 'setNotification'});
                reject(error); 
            });
        });
    },
    delNotification: function(notifyHandle)
    {
        return new Promise(function(resolve, reject)
        {
            var path = "/notification";
            path += "?handle=" + notifyHandle;
            logger.debug('deleting notification service entry: ' + notifyHandle, {module: 'qrsNotifyCreation', method: 'delNotification'});
            qrsInteract.Delete(path)
            .then(function(result)
            {
                logger.info('Response code for deletion: ' + result, {module: 'qrsNotifyCreation', method: 'delNotification'});
                resolve(result);
            })
            .catch(function(error)
            {
                logger.error(error, {module: 'qrsNotifyCreation', method: 'detNotification'});
                reject(error); 
            });
        })
    }    
};

module.exports = qrsNotify;