var Promise = require('Bluebird');
var winston = require('winston');
var config = require('../config/config');
var qrsInteract = require('./qrsinteractions');

//set up logging
var logger = new (winston.Logger)({
	level: config.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});

var objCreators = 
{
    dimCreator: function(app, boolPublishedApp, data, tags, objId)
	{
        return new Promise(function(resolve, reject)
        {
            var dim = objCreators.dim(data,tags);
            var changeObject = {};
            app.getDimension(objId)
            .then(function(result)
            {
                if(result==null)
                {
                    app.createDimension(dim)
                    .then(function(result)
                    {
                        app.getDimension(objId)
                        .then(function(ready)
                        {
                            logger.debug('Got the new measure!::', {module: 'objCreator', method: 'dimCreator'});
                            //Only run this if the app is published.
                            if(boolPublishedApp)
                            {
                                ready.publish()
                                .then(function()
                                {
                                    logger.debug('Created Dimension ' + data[2].qText, {module: 'objCreators', method: 'dimCreator'});
                                    changeObject.changed = true;
                                    changeObject.objId = objId;
                                    resolve(changeObject);
                                })
                                .catch(function(error)
                                {
                                    logger.error('publish::' + error, {module: 'objCreators', method: 'dimCreator'});
                                    reject(new Error(error));
                                });
                            }
                            else
                            {
                                logger.debug('Created Dimension ' + data[2].qText, {module: 'objCreators', method: 'dimCreator'});
                                changeObject.changed = true;
                                changeObject.objId = objId;
                                resolve(changeObject);
                            }
                        })
                        .catch(function(error)
                        {
                            logger.error('getDimension::' + error, {module: 'objCreators', method: 'dimCreator'});
                            reject(new Error(error));
                        });
                    })
                    .catch(function(error)
                    {
                        logger.error('createDimension::' + error, {module: 'objCreators', method: 'dimCreator'});
                        reject(new Error(error));							
                    });
                }
                else
                {
                    logger.debug('I exist!' + objId, {module: 'objCreators', method: 'dimCreator'});
                    //logger.debug(result, {module: 'objCreators'});
                    result.getProperties()
                    .then(function(currentProps)
                    {
                        logger.debug('I have props', {module: 'objCreators', method: 'dimCreator'});
                        logger.debug(currentProps.qInfo, {module: 'objCreators', method: 'dimCreator'});
                        if(JSON.stringify(currentProps)==JSON.stringify(dim))
                        {
                            logger.debug('These are the same.  No processing will be performed on this metric.', {module: 'objCreators', method: 'dimCreator'});
                            changeObject.changed = false;
                            changeObject.objId = objId;
                            resolve(changeObject);
                        }
                        else
                        {
                            result.setProperties(dim)
                            .then(function(ready)
                            {
                                if(boolPublishedApp)
                                {
                                    result.publish()
                                    .then(function()
                                    {
                                        logger.debug('Updated Dimension ' + data[2].qText, {module: 'objCreators', method: 'dimCreator'});
                                        changeObject.changed = true;
                                        changeObject.objId = objId;
                                        resolve(changeObject);        
                                    })
                                    .catch(function(error)
                                    {
                                        logger.error('publish::' + error, {module: 'objCreators', method: 'dimCreator'});
                                        reject(new Error(error));
                                    });
                                }
                                else
                                {
                                    logger.debug('Updated Dimension ' + data[2].qText, {module: 'objCreators', method: 'dimCreator'});
                                    changeObject.changed = false;
                                    changeObject.objId = objId;
                                    resolve(changeObject);   
                                }
                            })
                            .catch(function(error)
                            {
                                logger.error('setProperties::' + error, {module: 'objCreators', method: 'dimCreator'});
                                reject(new Error(error));                           
                            });
                        }
                    })
                    .catch(function(error)
                    {
                        logger.error('getProperties::' + error, {module: 'objCreators', method: 'dimCreator'});
                        reject(new Error(error));
                    });
                }	
            })
            .catch(function(error)
            {
                logger.error('popMeas::getDimension::' + error, {module: 'objCreators', method: 'dimCreator'});
                reject(new Error(error));
            });    
        });
	},
    measCreator: function(app, boolPublishedApp, data, tags, objId)
    {
        return new Promise(function(resolve, reject)
        {
            var meas = objCreators.meas(data,tags);
            var changeObject = {};
            app.getMeasure(objId)
            .then(function(result)
            {
                if(result==null)
                {
                    app.createMeasure(meas)
                    .then(function(result)
                    {
                        app.getMeasure(objId)
                        .then(function(ready)
                        {
                            logger.debug('Got the new measure!::', {module: 'objCreator', method: 'measCreator'});
                            
                            //Only run this if the app is published.
                            if(boolPublishedApp)
                            {
                                ready.publish()
                                .then(function()
                                {
                                    logger.debug('Created Measure ' + data[2].qText, {module: 'objCreators', method: 'measCreator'});
                                    changeObject.changed = true;
                                    changeObject.objId = objId;
                                    resolve(changeObject);
                                })
                                .catch(function(error)
                                {
                                    logger.error('publish::' + error, {module: 'objCreators', method: 'measCreator'});
                                    reject(new Error(error));
                                });
                            }
                            else
                            {
                                logger.debug('Created Measure ' + data[2].qText, {module: 'objCreators', method: 'measCreator'});
                                changeObject.changed = true;
                                changeObject.objId = objId;
                                resolve(changeObject);
                            }
                        })
                        .catch(function(error)
                        {
                            logger.error('getMeasure::' + error, {module: 'objCreators', method: 'measCreator'});
                            reject(new Error(error));
                        });
                    })
                    .catch(function(error)
                    {
                        logger.error('createMeasure::' + error, {module: 'objCreators', method: 'measCreator'});
                        reject(new Error(error));							
                    });
                }
                else
                {
                    logger.debug('I exist!' + objId, {module: 'objCreators', method: 'measCreator'});
                    //logger.debug(result, {module: 'objCreators'});
                    result.getProperties()
                    .then(function(currentProps)
                    {
                        logger.debug('I have props', {module: 'objCreators', method: 'measCreator'});
                        logger.debug(currentProps.qInfo, {module: 'objCreators', method: 'measCreator'});
                        if(JSON.stringify(currentProps)==JSON.stringify(meas))
                        {
                            logger.debug('These are the same.  No processing will be performed on this metric.', {module: 'objCreators', method: 'measCreator'});
                            changeObject.changed = false;
                            changeObject.objId = objId;
                            resolve(changeObject);
                        }
                        else
                        {
                            result.setProperties(meas)
                            .then(function(ready)
                            {
                                if(boolPublishedApp)
                                {
                                    result.publish()
                                    .then(function()
                                    {
                                        logger.debug('Updated Measure ' + data[2].qText, {module: 'objCreators', method: 'measCreator'});
                                        changeObject.changed = true;
                                        changeObject.objId = objId;
                                        resolve(changeObject);
                                    })
                                    .catch(function(error)
                                    {
                                        logger.error('publish::' + error, {module: 'objCreators', method: 'measCreator'});
                                        reject(new Error(error));
                                    });
                                }
                                else
                                {
                                    logger.debug('Updated Measure ' + data[2].qText, {module: 'objCreators', method: 'measCreator'});
                                    changeObject.changed = true;
                                    changeObject.objId = objId;
                                    resolve(changeObject);
                                }
                            })
                            .catch(function(error)
                            {
                                logger.error('setProperties::' + error, {module: 'objCreators', method: 'measCreator'});
                                reject(new Error(error));                           
                            }); 
                        }
                    })
                    .catch(function(error)
                    {
                        logger.error('setProperties::' + error, {module: 'objCreators', method: 'measCreator'});
                        reject(new Error(error)); 
                    });
                }	
            })
            .catch(function(error)
            {
                logger.error('getMeasure::' + error, {module: 'objCreators', method: 'measCreator'});
                reject(new Error(error));
            });    
        });
    },
    meas: function(data,tags)
	{
		var meas = {
			qInfo: {
		        qId: data[3].qText.toLowerCase() + '_' + data[0].qText,
		        qType: data[1].qText.toLowerCase()
		    },
		    qMeasure: {
		        qLabel: data[2].qText,
		        qDef: data[6].qText,
		        qGrouping: "N",
		        qExpressions: [],
		        qActiveExpression: 0
		    },
		    qMetaDef: {
		        title: data[2].qText,
		        description: data[5].qText,
		        qSize: -1,
		        sourceObject: "",
		        draftObject: "",
		        tags: tags
		   	}
		};
		return meas;
	},
	dim: function(data,tags)
	{
		var dim = {
			qInfo: {
				qId: data[3].qText.toLowerCase() + '_' + data[0].qText,
				qType: data[1].qText.toLowerCase()
			},
			qDim: {
				qGrouping: "N",
				qFieldDefs: [data[6].qText],
				qFieldLabels: [data[6].qText],
                title: data[2].qText
			},
			qMetaDef: {
				title: data[2].qText,
		        description: data[5].qText,
		        qSize: -1,
		        sourceObject: "",
		        draftObject: "",
		        tags: tags
			}
		};
		return dim;
	}	    
}

module.exports = objCreators;