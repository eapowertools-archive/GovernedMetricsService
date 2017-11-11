var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');
var logger = require('./logger');

var getDocId = {
    getDocId: function (appName) {
        return new Promise(function (resolve, reject) {
            logger.info('getDocId::running getdoc.getDocId', {
                module: 'getdocid'
            });
            var path = "/app"
            path += "?filter=name eq '" + appName + "'";
            logger.debug('getDocId::qrsInteract::' + path, {
                module: 'getdocid'
            });
            qrsInteract.Get(path)
                .then(function (result) {
                    logger.debug('getDocId::qrsInteract::' + appName + ' id:' + result.body[0].id, {
                        module: 'getdocid'
                    });
                    resolve(result.body[0].id);
                })
                .catch(function (error) {
                    logger.error('getDocId::qrsInteract::' + error, {
                        module: 'getdocid'
                    });
                    reject(new Error(error));
                });
        });
    },
    getAppReference: function (appName) {
        return new Promise(function (resolve, reject) {
            logger.info('getDocId::running getAppReference', {
                module: 'getdocid'
            });
            var path = "/app"
            path += "?filter=name eq '" + appName + "'";
            logger.debug('getDocId::qrsInteract::' + path, {
                module: 'getdocid'
            });
            qrsInteract.Get(path)
                .then(function (result) {
                    logger.debug('getDocId::qrsInteract::' + appName + ' id:' + result.body[0].id, {
                        module: 'getdocid'
                    });
                    resolve(result.body[0]);
                })
                .catch(function (error) {
                    logger.error('getDocId::qrsInteract::' + error, {
                        module: 'getdocid'
                    });
                    reject(new Error(error));
                });
        })
    }
};

module.exports = getDocId;