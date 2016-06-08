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
        return new Promise(function(resolve)
        {
            var dim = objCreators.dim(data,tags);
            
            app.getDimension(objId)
            .then(function(result)
            {
                if(result==null)
                {
                    app.createDimension(dim)
                    .then(function()
                    {
                        app.getDimension(objId)
                        .then(function(ready)
                        {
                            //Only run this if the app is published.
                            if(boolPublishedApp)
                            {
                                ready.publish()
                                .then(function()
                                {
                                    logger.debug('popMeas::Created Dimension ' + data[2].qtext, {module: 'objCreators'});
                                    resolve(objId);
                                })
                                .catch(function(error)
                                {
                                    logger.error('popMeas::publish::' + error, {module: 'objCreators'});
                                    reject(new Error(error));
                                });
                            }
                        })
                        .catch(function(error)
                        {
                            logger.error('popMeas::getDimension::' + error, {module: 'objCreators'});
                            reject(new Error(error));
                        });
                    })
                    .catch(function(error)
                    {
                        logger.error('popMeas::createDimension::' + error, {module: 'objCreators'});
                        reject(new Error(error));							
                    });
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
                                logger.debug('popMeas::Updated Dimension ' + data[2].qText, {module: 'objCreators'});
                                resolve(objId);        
                            })
                            .catch(function(error)
                            {
                                logger.error('popMeas::publish::' + error, {module: 'objCreators'});
                                reject(new Error(error));
                            });
                        }
                    })
                    .catch(function(error)
                    {
                        logger.error('popMeas::setProperties::' + error, {module: 'objCreators'});
                        reject(new Error(error));							
                    });
                }	
            })
            .catch(function(error)
            {
                logger.error('popMeas::getDimension::' + error, {module: 'objCreators'});
                reject(new Error(error));
            });    
        });
	},
    measCreator: function(app, boolPublishedApp, data, tags, objId)
    {
        return new Promise(function(resolve)
        {
            var meas = objCreators.meas(data,tags);
            
            app.getMeasure(objId)
            .then(function(result)
            {
                if(result==null)
                {
                    app.createMeasure(meas)
                    .then(function()
                    {
                        app.getMeasure(objId)
                        .then(function(ready)
                        {
                            //Only run this if the app is published.
                            if(boolPublishedApp)
                            {
                                ready.publish()
                                .then(function()
                                {
                                    logger.debug('popMeas::Created Measure ' + data[2].qtext, {module: 'objCreators'});
                                    resolve(objId);
                                })
                                .catch(function(error)
                                {
                                    logger.error('popMeas::publish::' + error, {module: 'objCreators'});
                                    reject(new Error(error));
                                });
                            }
                        })
                        .catch(function(error)
                        {
                            logger.error('popMeas::getMeasure::' + error, {module: 'objCreators'});
                            reject(new Error(error));
                        });
                    })
                    .catch(function(error)
                    {
                        logger.error('popMeas::createMeasure::' + error, {module: 'objCreators'});
                        reject(new Error(error));							
                    });
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
                                logger.debug('popMeas::Updated Measure ' + data[2].qText, {module: 'objCreators'});
                                resolve(objId);
                            })
                            .catch(function(error)
                            {
                                logger.error('popMeas::publish::' + error, {module: 'objCreators'});
                                reject(new Error(error));
                            });
                        }
                    })
                    .catch(function(error)
                    {
                        logger.error('popMeas::setProperties::' + error, {module: 'objCreators'});
                        reject(new Error(error));							
                    });
                }	
            })
            .catch(function(error)
            {
                logger.error('popMeas::getMeasure::' + error, {module: 'objCreators'});
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
				title: data[2].qText,
				qFieldLabels: [data[6].qText]
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