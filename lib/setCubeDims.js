var cubing = {

    setCubeDims: function(obj) {

        //create the dimension list for the hypercubedef
        var hyperCubeDims = [];
        var dims = obj.dims;
        dims.forEach(function(dim) {
            var dimension = {
                qLibraryId: "",
                qNullSuppression: false,
                qDef: {
                    qGrouping: "N",
                    qFieldDefs: [dim.fieldname],
                    qFieldLabels: [dim.label]
                }
            };
            hyperCubeDims.push(dimension);
        });

        //create the hypercubedef and return the object
        var hypercubedef = {
            qInfo: {
                qId: "MasterLibTable",
                qType: "Table"
            },
            qHyperCubeDef: {
                qDimensions: hyperCubeDims,
                qInitialDataFetch: [{
                    qTop: 0,
                    qHeight: 50,
                    qLeft: 0,
                    qWidth: hyperCubeDims.length
                }]
            }

        }
        return hypercubedef;
    },
    setCubeDefault: function() {
        var table = {
            qInfo: {
                qId: "MetricTable",
                qType: "Table"
            },
            qHyperCubeDef: {
                qDimensions: [{
                        qLibraryId: "",
                        qNullSuppression: false,
                        qDef: {
                            qGrouping: "N",
                            qFieldDefs: [
                                "ID"
                            ],
                            qFieldLabels: [
                                ""
                            ]
                        }
                    },
                    {
                        qLibraryId: "",
                        qNullSuppression: false,
                        qDef: {
                            qGrouping: "N",
                            qFieldDefs: [
                                "MetricType"
                            ],
                            qFieldLabels: [
                                ""
                            ]
                        }
                    },
                    {
                        qLibraryId: "",
                        qNullSuppression: false,
                        qDef: {
                            qGrouping: "N",
                            qFieldDefs: [
                                "MetricName"
                            ],
                            qFieldLabels: [
                                ""
                            ]
                        }
                    },
                    {
                        qLibraryId: "",
                        qNullSuppression: false,
                        qDef: {
                            qGrouping: "N",
                            qFieldDefs: [
                                "MetricSubject"
                            ],
                            qFieldLabels: [
                                ""
                            ]
                        }
                    },
                    {
                        qLibraryId: "",
                        qNullSuppression: false,
                        qDef: {
                            qGrouping: "N",
                            qFieldDefs: [
                                "MetricTags"
                            ],
                            qFieldLabels: [
                                ""
                            ]
                        }
                    },
                    {
                        qLibraryId: "",
                        qNullSuppression: false,
                        qDef: {
                            qGrouping: "N",
                            qFieldDefs: [
                                "MetricDescription"
                            ],
                            qFieldLabels: [
                                ""
                            ]
                        }
                    },
                    {
                        qLibraryId: "",
                        qNullSuppression: false,
                        qDef: {
                            qGrouping: "N",
                            qFieldDefs: [
                                "MetricFormula"
                            ],
                            qFieldLabels: [
                                ""
                            ]
                        }
                    },
                    {
                        qLibraryId: "",
                        qNullSuppression: false,
                        qDef: {
                            qGrouping: "N",
                            qFieldDefs: [
                                "MetricGrouping"
                            ],
                            qFieldLabels: [
                                ""
                            ]
                        }
                    },
                    {
                        qLibraryId: "",
                        qNullSuppression: false,
                        qDef: {
                            qGrouping: "N",
                            qFieldDefs: [
                                "MetricOwner"
                            ],
                            qFieldLabels: [
                                ""
                            ]
                        }
                    },
                    {
                        qLibraryId: "",
                        qNullSuppression: false,
                        qDef: {
                            qGrouping: "N",
                            qFieldDefs: [
                                "UID"
                            ],
                            qFieldLabels: [
                                ""
                            ]
                        }
                    }
                ],
                //qMeasures: [],
                qInitialDataFetch: [{
                    qTop: 0,
                    qHeight: 500,
                    qLeft: 0,
                    qWidth: 10
                }]
            }
        };
        return table;
    }

};





module.exports = cubing;