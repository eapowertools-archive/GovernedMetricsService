var Promise = require('bluebird');
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

var getAppDataSegment = {
    
    getAppDataSegment: function(app)
    {
        return new Promise(function(resolve, reject)
        {
            logger.info('getAppDataSegment::Obtaining appDataSegment for ' + app.name, {module: getAppDataSegment});
            var path = "/app/datasegment/full";
            path += "?filter=app.id eq " + app.id;
            logger.debug('getAppDataSegment::PATH::' + path, {module: 'getAppDataSegment'});
            qrsInteract.Get(path)
            .then(function(result)
            {
                logger.debug(result[0].contentHash);
                logger.debug('getAppDataSegment::Returned hash::'+ result[0].contentHash, {module: 'getAppDataSegment'});
                resolve(result)               
            })
            .catch(function(error)
            {
                logger.error('getAppDataSegment::Error retrieving contenthash::' + JSON.stringify(error), {module: 'getAppDataSegment'});
                reject(new Error(error));
            });            
        });
    }
    
}

module.exports = getAppDataSegment;