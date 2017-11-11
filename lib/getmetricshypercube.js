var enigma = require('enigma.js');
var enigmaInstance = require("./enigmaInstance");
var Promise = require('bluebird')
var config = require('../config/config');
var hypercube = require('./setCubeDims');
var getdoc = require('./getdocid');
var fs = require('fs');
var logger = require('./logger');


var getMetricsHyperCube = {
    getMetricsTable: function () {
        return new Promise(function (resolve, reject) {
            logger.info('running getmetricshypercube.getMetricsTable', {
                module: 'getmetricshypercube'
            });
            var cube = hypercube.setCubeDefault();
            var session = enigma.create(enigmaInstance(config, "metricsHyperCube"))
            var x = {};
            //get the docid for the metrics library first
            getdoc.getDocId(config.gms.appName)
                .then(function (doc) {
                    logger.debug('getMetricsTable::Metrics Library AppId: ' + doc, {
                        module: 'getmetricshypercube'
                    });
                    x.doc = doc;
                    return session.open()
                        .then(function (global) {
                            return x.global = global;
                        })
                        .then(function (global) {
                            logger.info('getMetricsTable::Opening the doc with data', {
                                module: 'getmetricshypercube'
                            });
                            return x.global.openDoc(doc, '', '', '', false)
                                .then(function (app) {
                                    return x.app = app;
                                })
                                .then(function () {
                                    logger.debug('getMetricsTable::Creating session object', {
                                        module: 'getmetricshypercube'
                                    });
                                    return x.app.createSessionObject(cube);
                                })
                                .then(function (obj) {
                                    return x.obj = obj;
                                })
                                .then(function (obj) {
                                    return x.obj.getProperties();
                                })
                                .then(function (props) {
                                    return x.props = props;
                                })
                                .then(function () {
                                    return x.obj.getLayout();
                                })
                                .then(function (layout) {
                                    return x.layout = layout;
                                })
                                .then(function () {
                                    var arrValues = [];
                                    //here we want to build the fetch array
                                    x.qSize = x.layout.qHyperCube.qSize;
                                    for (var i = 0; i <= x.qSize.qcy; i += 50) {
                                        var fetch = [{
                                            qLeft: 0,
                                            qTop: i,
                                            qWidth: x.qSize.qcx,
                                            qHeight: 50
                                        }];
                                        arrValues.push(fetch);
                                    }
                                    return arrValues;
                                })
                                .then(function (fetchVals) {
                                    return Promise.all(fetchVals.map(function (fetch) {
                                        return x.obj.getHyperCubeData('/qHyperCubeDef', fetch);
                                    }));
                                })
                                .then(function (dataVals) {
                                    var finalArr = [];
                                    for (var i = 0; i < dataVals.length; i++) {
                                        if (dataVals[i][0].qMatrix.length != 0) {
                                            dataVals[i][0].qMatrix.forEach(function (item) {
                                                finalArr.push(item);
                                            });
                                        }
                                    }

                                    return x.data = finalArr;
                                })
                                .then(function () {
                                    logger.info('Closing connection to Metrics Hypercube', {
                                        module: 'getmetricshypercube'
                                    });
                                    return session.close()
                                        .then(function () {
                                            resolve(x.data);
                                        });
                                })
                                .catch(function (error) {
                                    return session.close()
                                        .then(function () {
                                            logger.error('getMetricsTable::Error at getmetricshypercube during data retrieval::' + JSON.stringify(error), {
                                                module: 'getmetricshypercube'
                                            });
                                            reject(JSON.stringify(error));
                                        })
                                });
                        })
                        .catch(function (error) {
                            return session.close()
                                .then(function () {
                                    logger.error('getMetricsTable::enigma::' + JSON.stringify(error), {
                                        module: 'getmetricshypercube'
                                    });
                                    reject(error);
                                })
                        });
                })
                .catch(function (error) {
                    logger.error('getMetricsTable::getDocId::' + JSON.stringify(error), {
                        module: 'getmetricshypercube'
                    });
                    reject(error);
                });
        });
    }
}

module.exports = getMetricsHyperCube;