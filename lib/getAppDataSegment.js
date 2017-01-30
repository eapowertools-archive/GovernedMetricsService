var Promise = require('bluebird');
var config = require('../config/config');
var qrsInteract = require('./qrsInstance');
var logger = require('./logger');


var getAppDataSegment = {

    getAppDataSegment: function(app) {
        return new Promise(function(resolve, reject) {
            logger.info('getAppDataSegment::Obtaining appDataSegment for ' + app.name, { module: getAppDataSegment });
            var path = "/app/datasegment/full";
            path += "?filter=app.id eq " + app.id;
            logger.debug('getAppDataSegment::PATH::' + path, { module: 'getAppDataSegment' });
            return qrsInteract.Get(path)
                .then(function(result) {
                    logger.debug(result.body[0].contentHash);
                    logger.debug('getAppDataSegment::Returned hash::' + result.body[0].contentHash, { module: 'getAppDataSegment' });
                    resolve(result.body[0])
                })
                .catch(function(error) {
                    logger.error('getAppDataSegment::Error retrieving contenthash::' + JSON.stringify(error), { module: 'getAppDataSegment' });
                    reject(new Error(error));
                });
        });
    }

}

module.exports = getAppDataSegment;