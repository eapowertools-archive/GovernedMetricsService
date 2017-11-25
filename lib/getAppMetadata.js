var Promise = require('bluebird');
var fs = require('fs');
var enigma = require('enigma.js');
var enigmaInstance = require('./enigmaInstance');
var config = require('../config/config');
var logger = require('./logger');
var socketHelper = require("./socketHelper")


var getAllFieldsHypercube = {
    "qInfo": {
        "qType": "FieldList"
    },
    "qFieldListDef": {
        "qShowSystem": true,
        "qShowHidden": false,
        "qShowDerivedFields": true,
        "qShowSemantic": true,
        "qShowSrcTables": true,
        "qShowImplicit": true
    }
}

var getAllVariablesHypercube = {
    "qInfo": {
        "qType": "VariableList"
    },
    "qVariableListDef": {
        "qType": "variable",
        "qShowReserved": true,
        "qShowConfig": true,
        "qData": {
            "tags": "/tags"
        }
    }
}

function sortAlphabetical(a, b) {
    var textA = a.toUpperCase();
    var textB = b.toUpperCase();
    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
}

function getAppMetadata(appId) {
    socketHelper.logMessage("debug", "gms", 'running getAppMetadata', __filename);

    var glob;
    var session = enigma.create(enigmaInstance(config, "getAppMetadata"));

    return session.open()
        .then(function (global) {
            glob = global;
            return global.openDoc(appId);
        })
        .then(function (doc) {
            return Promise.props({
                fields: doc.createSessionObject(getAllFieldsHypercube),
                variables: doc.createSessionObject(getAllVariablesHypercube)
            });
        })
        .then(function (result) {
            var out = {};

            for (key in result) {
                out[key] = result[key].getLayout();
            }

            return Promise.props(out);
        })
        .then(function (layouts) {
            return session.close()
                .then(function () {
                    socketHelper.logMessage("debug", "gms", 'Returning a list of fields of length ' + layouts.fields.qFieldList.qItems.length, __filename);
                    socketHelper.logMessage("debug", "gms", 'Returning a list of variables of length ' + layouts.variables.qVariableList.qItems.length, __filename);

                    var fields = layouts.fields.qFieldList.qItems.map(function (data) {
                        return data.qName
                    }).sort(sortAlphabetical)

                    var variables = layouts.variables.qVariableList.qItems.map(function (data) {
                        return data.qName
                    }).sort(sortAlphabetical);

                    return {
                        fields: fields,
                        variables: variables
                    };
                });
        })
        .catch(function (err) {
            return session.close()
                .then(function () {
                    socketHelper.logMessage("error", "gms", "Error: " + JSON.stringify(err), __filename);

                })
        });
}

module.exports = getAppMetadata;