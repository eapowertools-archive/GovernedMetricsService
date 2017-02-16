var qrsInteract = require('./qrsInstance');
var qsocksInstance = require('./qsocksInstance');
var Promise = require('bluebird');
var qsocks = require('qsocks');
var fs = require('fs');
var path = require('path');
var logger = require('./logger');


var getMdis = {

    // TODO: getMdis should return all master data items from a specific Qlik
    // Sense app. I have provided the code that reads my specific certificate,
    // but I am not 100% sure how this would work in the gms app.
    getMdis: function(qsApp, metricSubject) {
        return new Promise(function(resolve, reject) {
            logger.debug("metricSubject:" + metricSubject);
            var app2Connect = qsocksInstance(qsApp);
            var x = {};
            qsocks.Connect(app2Connect)
                .then(function(global) {
                    return global.openDoc(qsApp, '', '', '', true)
                })
                .then(function(app) {
                    return app.createSessionObject({
                        "qInfo": {
                            "qType": "DimensionList"
                        },
                        "qDimensionListDef": {
                            "qType": "dimension",
                            "qData": {
                                "title": "/title",
                                "tags": "/tags",
                                "grouping": "/qDim/qGrouping",
                                "info": "/qDimInfos"
                            }
                        },
                        "qMeasureListDef": {
                            "qType": "measure",
                            "qData": {
                                "title": "/title",
                                "tags": "/tags",
                                "info": "/q",
                                "measure": "/qMeasure"
                            }
                        }
                    })
                })
                .then(function(list) {
                    return list.getLayout()
                })
                .then(function(layout) {
                    var dimensions = layout.qDimensionList.qItems;
                    var measures = layout.qMeasureList.qItems;

                    var dimensionsReduced = dimensions.reduce(function(dims, d) {
                        dims.push({
                            "ID": d.qInfo.qId,
                            "UID": d.qInfo.qId,
                            "MetricSubject": metricSubject,
                            "MetricType": d.qInfo.qType,
                            "MetricName": d.qMeta.title,
                            "MetricDescription": d.qMeta.description == "" ? d.qMeta.title : d.qMeta.description,
                            "MetricFormula": d.qData.info[0].qName,
                            "MetricOwner": "MDI Api",
                            "MetricTags": d.qMeta.tags.join(';'),
                            "MetricGrouping": d.qData.grouping,
                            "MetricColor": null
                        })
                        return dims
                    }, [])
                    var measuresReduced = measures.reduce(function(measures, m) {
                        measures.push({
                            "ID": m.qInfo.qId,
                            "UID": m.qInfo.qId,
                            "MetricSubject": metricSubject,
                            "MetricType": m.qInfo.qType,
                            "MetricName": m.qMeta.title,
                            "MetricDescription": m.qMeta.description == "" ? m.qMeta.title : m.qMeta.description,
                            "MetricFormula": m.qData.measure.qDef,
                            "MetricOwner": "MDI Api",
                            "MetricTags": m.qMeta.tags.join(';'),
                            "MetricGrouping": m.qData.measure.qGrouping,
                            "MetricColor": findColor(m.qData.measure)
                        })
                        return measures
                    }, [])
                    var masterDataItems = dimensionsReduced.concat(measuresReduced)
                    return masterDataItems
                })
                .then(function(mdis) {
                    resolve(mdis);
                })
                .catch(function(error) {
                    reject(new Error("Could not find any Qlik Sense apps with the custom property " + customPropertyName));
                })
        });
    }


};

module.exports = getMdis;

function findColor(measure) {
    if (measure.hasOwnProperty("baseColor")) {
        return measure.baseColor.color;
    } else {

        return null;
    }
}