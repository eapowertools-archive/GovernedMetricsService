var _ = require('lodash');
var logger = require('./logger');
var socketHelper = require("./socketHelper");

var qlikExpressionsParser = {
    getTypeFromMatrix: function (matrix, type) {
        matrixOfType = [];

        for (var i = 0; i < matrix.length; i++) {
            if (matrix[i][1].qText.toLowerCase() === type) {
                matrixOfType.push({
                    expression: matrix[i][6].qText,
                    position: i
                });
            }
        }

        return matrixOfType;
    },

    getFieldsFromMeasures: function (measure) {
        var qlikFieldRegexp = /\[(.*?)\]/g,
            fields = [],
            match;

        while ((match = qlikFieldRegexp.exec(measure)) !== null) {
            fields.push(match[1])
        }

        fields = _.sortedUniq(fields.sort(sortAlphabetical));

        return fields;
    },

    getFieldsFromDimensions: function (dimension) {
        var fields = dimension.split(',');

        fields = _.map(fields, function (field) {
            return _.trim(field);
        });
        fields = _.sortedUniq(fields.sort(sortAlphabetical));

        return fields;
    },

    getVariablesFromMeasures: function (measure) {
        var qlikVariableRegexp = /\$\(=?(.*?)\)/g,
            variables = [],
            match;

        while ((match = qlikVariableRegexp.exec(measure)) !== null) {
            variables.push(match[1])
        }

        fields = _.sortedUniq(variables.sort(sortAlphabetical));

        return fields;
    },

    sortedArraysIntersection: function (gmsFieldsList, appFieldsList) {
        var i = 0,
            j = 0;
        var intersection = [];

        while (i < appFieldsList.length && j < gmsFieldsList.length) {
            if (appFieldsList[i] > gmsFieldsList[j]) {
                j++
            } else if (appFieldsList[i] < gmsFieldsList[j]) {
                i++
            } else {
                intersection.push(gmsFieldsList[j]);
                i++;
                j++;
            }
        }

        return intersection;
    },

    getComputableMeasures: function (gmsMeasuresList, appMetadata) {
        var measure, fields, fieldsIntersection,
            variablesIntersection, computableMeasures = [];

        for (var i = 0; i < gmsMeasuresList.length; i++) {
            measure = gmsMeasuresList[i];

            fields = this.getFieldsFromMeasures(measure.expression);
            variables = this.getVariablesFromMeasures(measure.expression);

            fieldsIntersection = this.sortedArraysIntersection(fields, appMetadata.fields);
            variablesIntersection = this.sortedArraysIntersection(variables, appMetadata.variables);

            if (fieldsIntersection.length === fields.length && variablesIntersection.length === variables.length) {
                computableMeasures.push(measure);
            }
        }
        return computableMeasures;
    },

    getComputableDimensions: function (gmsDimensionsList, appMetadata) {
        var dimension, fields, fieldsIntersection, computableDimensions = [];

        for (var i = 0; i < gmsDimensionsList.length; i++) {
            dimension = gmsDimensionsList[i];

            fields = this.getFieldsFromDimensions(dimension.expression);
            fieldsIntersection = this.sortedArraysIntersection(fields, appMetadata.fields);

            if (fieldsIntersection.length === fields.length) {
                computableDimensions.push(dimension);
            }
        }

        return computableDimensions;
    },

    /**
     * Given the measures and dimensions stored in the GMS, it performs
     * an intersection with the fields and variables of a given application
     * and returns a filtered versionf of the GMS hypercube containing only
     * measures/dimensions that can be rendered in the given app
     * @param {Object} measures
     * @param {Object} dimensions
     * @param {Object} appMetadata
     * @param {Object} matrix
     * @return {Object} filteredMatrix
     */
    getFilteredMatrix: function (measures, dimensions, appMetadata, matrix) {
        socketHelper.logMessage("debug", "gms", 'Checking the master metrics against this app\'s ' + appMetadata.fields.length + ' fields and ' +
            appMetadata.variables.length + ' variables', __filename);

        var computableMeasures = this.getComputableMeasures(measures, appMetadata);
        var computableDimensions = this.getComputableDimensions(dimensions, appMetadata);

        var measuresFilteredMatrix = computableMeasures.map(function (o) {
            return matrix[o.position]
        });
        var dimensionsFilteredMatrix = computableDimensions.map(function (o) {
            return matrix[o.position]
        });

        return measuresFilteredMatrix.concat(dimensionsFilteredMatrix);
    }
}

function sortAlphabetical(a, b) {
    var textA = a.toUpperCase();
    var textB = b.toUpperCase();
    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
}


module.exports = qlikExpressionsParser;