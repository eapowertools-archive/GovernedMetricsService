var Promise = require('bluebird');
var fs = require('fs');
var enigma = require('enigma.js');
var enigmaInstance = require('./enigmaInstance');
var config = require('../config/config');
var logger = require('./logger');

var qConfig = {
    host: config.engine.hostname,
    port: config.engine.enginePort,
    origin: 'https://' + config.engine.hostname,
    isSecure: true,
    rejectUnauthorized: false,
    headers: {
        'Content-Type': 'application/json',
        'x-qlik-xrfkey': 'abcdefghijklmnop',
        'X-Qlik-User': config.engine.repoAccount
    },
    key: fs.readFileSync(config.certificates.client_key),
    cert: fs.readFileSync(config.certificates.client),
    appname: null
};

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

function getAppMetadata(appId){
    logger.info('running getAppMetadata', { module: 'getAppFields' });

    var glob;
    var session = enigma.create(enigmaInstance(config));

    return session.open(qConfig)
        .then(function(global){
            glob = global;
            return global.openDoc(appId);
        })
        .then(function(doc){
            return Promise.props({
                fields: doc.createSessionObject(getAllFieldsHypercube),
                variables: doc.createSessionObject(getAllVariablesHypercube)
            });
        })
        .then(function(result){
            var out = {};

            for(key in result){
                out[key] = result[key].getLayout();
            }

            return Promise.props(out);
        })
        .then(function(layouts){
            session.close();

            logger.info('Returning a list of fields of length ' + layouts.fields.qFieldList.qItems.length, { module: 'getAppMetadata' });
            logger.info('Returning a list of variables of length ' + layouts.variables.qVariableList.qItems.length, { module: 'getAppMetadata' });

            var fields = layouts.fields.qFieldList.qItems.map(function(data){
                return data.qName
            }).sort(sortAlphabetical)

            var variables = layouts.variables.qVariableList.qItems.map(function(data){
                return data.qName
            }).sort(sortAlphabetical);

            return { fields: fields, variables: variables };
        })
        .catch(function(err){
            logger.error('getAppFields:: ' + JSON.stringify(err), { module: 'getAppFields' });
        });
}

module.exports = getAppMetadata;
