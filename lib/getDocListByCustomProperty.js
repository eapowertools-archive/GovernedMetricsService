var qrsInteract = require('./qrsInstance');
var Promise = require('bluebird');
var config = require('../config/config');
var winston = require('winston');
require('winston-daily-rotate-file');

//set up logging
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.DailyRotateFile)({ filename: config.logging.logFile, prepend:true})
    ]
});

var getDocList =

	// TODO: getDocListByCustomProperty should return an array with the id of all
	//  Qlik Sense apps with the given customPropertyName
	getDocListByCustomProperty: function(customPropertyName)
	{
		return new Promise(function(resolve, reject)
		{
			// Code to get array of docs goes here
			// The array could have the name 'docList'
			if (docList.length < 1)
			{
				reject(new Error("Could not find any Qlik Sense apps with the custom property " + customPropertyName))
			}
			else
			{
				resolve(docList)
			}


		});
	}
};

module.exports = getDocList;
