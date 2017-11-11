const enigma = require('enigma.js');
const enigmaInstance = require("./enigmaInstance");
const Promise = require('bluebird')
const config = require('../config/config');
const hypercube = require('./setCubeDims');
const getdoc = require('./getdocid');
const fs = require('fs');
const logger = require('./logger');

const colorFunctions = {
    openSession: function () {
        let session = enigma.create(enigmaInstance(config, "colorHyperCube"));
        return session;
    },
    closeSession: function (session) {
        return session.close()
            .then(function () {
                logger.info("session closed", {
                    module: "getColorHyperCube"
                });
            })
    },
    getColorTableObject: function (session, appName) {
        return new Promise(function (resolve, reject) {
            let cube = hypercube.setColorCubeDefault;
            let x = {}
            x.session = session;
            return session.open()
                .then(function (global) {
                    return getdoc.getDocId(appName)
                        .then(function (doc) {
                            return global.openDoc(doc, '', '', '', false);
                        })
                        .then(function (app) {
                            return x.app = app;
                        })
                        .then(function (app) {
                            return app.createSessionObject(cube)
                        })
                        .then(function (obj) {
                            x.obj = obj;
                            resolve(x);
                        })

                })
                .catch(function (error) {
                    return session.close()
                        .then(function () {
                            reject(error);
                        });
                })
        })

    },
    getColorTableDimValues: function (x, dimId) {
        let fieldName = {
            "qFieldName": "MetricDimId"
        }
        let selectedValues = {
            "qFieldValues": [{
                "qText": dimId,
                "qIsNumeric": false,
                "qNumber": 0
            }],
            "qToggleMode": false,
            "qSoftLock": false
        }
        return x.app.getField()
            .then(function (field) {
                return field.selectValues(selectedValues)
                    .then(function () {
                        return x.obj.getLayout()
                    })
                    .then(function (layout) {
                        let arrValues = [];
                        for (let i = 0; i <= layout.qHyperCube.qSize.qcy; i += 50) {
                            let fetch = [{
                                qLeft: 0,
                                qTop: i,
                                qWidth: layout.qHyperCube.qSize.qcx,
                                qHeight: 50
                            }];
                            arrValues.push(fetch);
                        }
                        return arrValues;
                    })
                    .then(function (fetchVals) {
                        return Promise.all(fetchVals.map(function (fetch) {
                            return x.obj.getHyperCubeData("/qHyperCubeDef", fetch);
                        }))
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

                        return x.app.clear()
                            .then(function () {
                                resolve(finalArr);
                            })

                    })
            })
            .catch(function (error) {
                return session.close()
                    .then(function () {
                        reject(JSON.stringify(error));
                    })
            })
    }
}