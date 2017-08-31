//updatemetrics.js
var config = require("../config/config")
var Promise = require('bluebird')
var objectMgmt = require('./objectManagement');
var changeOwner = require('./changeOwner');
var publishMetrics = require('./publishMetrics');
var fs = require('fs');
var logger = require('./logger');

var updateMetrics = {
    updateMetrics: function (appRef, data) {
        return new Promise(function (resolve, reject) {
            var appId = appRef.id;
            var ownerId = appRef.owner.id;
            logger.info('Calling updateMetrics on application:' + appRef.name + ' with id:' + appId, {
                module: 'updateMetrics',
                method: 'updateMetrics',
                app: appRef.name
            });
            var x = {};

            return getAppSubjectAreas(appRef, config.gms.customPropName)
                .then(function (appSubjectAreas) {
                    logger.info(appSubjectAreas, {
                        module: 'updateMetrics',
                        method: 'updateMetrics',
                        app: appRef.name
                    });
                    x.appSubjectAreas = appSubjectAreas;
                    return objectMgmt.manageObjects(appRef, appId, data, appSubjectAreas)
                        .then(function (message) {
                            logger.info(message, {
                                module: 'updateMetrics',
                                app: appRef.name
                            });
                            var result = {
                                result: message
                            };
                            resolve(result);
                        })
                        .catch(function (error) {
                            logger.debug(error, {
                                module: 'updateMetrics',
                                app: appRef.name
                            });
                            reject(error);
                        });
                })
                .catch(function (error) {
                    logger.debug(error, {
                        module: 'updateMetrics',
                        app: appRef.name
                    });
                    reject(error);
                });
        });
    }
};

function buildModDate() {
    var d = new Date();
    return d.toISOString();
}

function filterMetrics(subjectAreas) {
    return function (obj) {
        return subjectAreas.filter(function (subjectArea) {
            return subjectAreas.indexOf(obj[3].qText) > -1;
        }).length === subjectAreas.length;
    }
}

function getAppSubjectAreas(appRef, customProp) {
    return new Promise(function (resolve) {
        var result = appRef.customProperties.filter(function (item) {
            return item.definition.name == customProp;
        })

        var values = result.map(function (item) {
            return item.value
        });

        resolve(values);

    });
    // return new Promise(function (resolve)
    // {
    // 	var result = [];
    // 	var itemCount = 0;
    // 	return Promise.all(appRef.customProperties.map(function(item)
    // 	{
    // 		if(item.definition.name==customProp)
    // 		{
    // 			return item.value;
    // 		}
    // 	}))
    // 	.then(function(arrValues)
    // 	{
    // 		resolve(arrValues);
    // 	});
    // });

}

module.exports = updateMetrics;