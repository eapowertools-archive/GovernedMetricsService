var Promise = require('bluebird')
var config = require('../config/config');
var qrsInteract = require('./qrsInstance');
var fs = require('fs');
var logger = require('./logger');

var qrsNotify = {
    createNotification: function() {
        return new Promise(function(resolve, reject) {
            var path = "/notification?name=appobject&changetype=Add";
            path += "&filter=owner.userId eq '" + config.qrs.repoAccountUserId + "' and owner.userDirectory eq '" + config.qrs.repoAccountUserDirectory + "'";
            var body = "https://" + config.gms.hostname + ":" + config.gms.port + "/masterlib/notifyme";
            logger.debug('Creating notification service entry.', { module: 'qrsNotify', method: 'createNotification' });
            qrsInteract.Post(path, body, 'json')
                .then(function(result) {
                    logger.info('Handle for notification service entry:' + result.body.value, { module: 'qrsNotify', method: 'createNotification' });
                    resolve(result.body.value);
                })
                .catch(function(error) {
                    logger.error(error, { module: 'qrsNotify', method: 'createNotification' });
                    reject(error);
                });
        });
    },
    deleteNotification: function(handle) {
        return new Promise(function(resolve, reject) {
            var path = "/notification?handle=" + handle;
            console.log(path);
            logger.debug('deleting notification service entry: ' + handle, { module: 'qrsNotify', method: 'deleteNotification' });
            qrsInteract.Delete(path)
                .then(function(result) {
                    logger.info('Response code for deletion: ' + result, { module: 'qrsNotify', method: 'deleteNotification' });
                    resolve(result);
                })
                .catch(function(error) {
                    logger.error(error, { module: 'qrsNotify', method: 'deleteNotification' });
                    reject(error);
                });
        });
    }
};

module.exports = qrsNotify;