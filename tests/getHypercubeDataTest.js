var config = require('./testConfig');
var qsocks = require('qsocks');
var qsocksInstance = require('./qsocksInstance');
var getdoc = require('./getdocid');
var hypercube = require('../lib/setCubeDims');
var fs = require('fs');


var x = {};
var cube = hypercube.setCubeDefault();
getdoc.getDocId(config.gms.appName)
.then(function(doc)
{
    var app2Connect = qsocksInstance(doc);
    qsocks.Connect(app2Connect)
    .then(function(global)
    {
        return x.global = global;
    })
    .then(function(global)
    {
        x.global.openDoc(doc, '', '', '', false)
        .then(function(app)
        {
            x.app = app;
            return x.app.createSessionObject(cube);
        })
        .then(function(obj)
        {
            x.obj = obj;
            return obj.getLayout();
        })
        .then(function(layout)
        {
            var arrValues = [];
            x.qSize = layout.qHyperCube.qSize;
            for(var i=0;i<=x.qSize.qcy;i+=50)
            {
                var fetch = [{qLeft:0,qTop:i,qWidth:x.qSize.qcx,qHeight:50}];
                arrValues.push(fetch);
            }
            return arrValues;
        })
        .then(function(fetchVals)
        {
            return Promise.all(fetchVals.map(function(fetch)
            {
                return x.obj.getHyperCubeData('/qHyperCubeDef',fetch);
            }));
        })
        .then(function(dataVals)
        {
            var finalArr =[];
            for(var i=0;i<dataVals.length;i++)
            {
                if(dataVals[i][0].qMatrix.length != 0)
                {
                    dataVals[i][0].qMatrix.forEach(function(item)
                    {
                        finalArr.push(item);
                    });
                }
            }
            
            return x.data = finalArr;
        })
        .then(function(data)
        {
            var destFile = fs.createWriteStream('hcube.json',{defaultEncoding:'utf8'});
            destFile.on('finish', function()
            {
                console.log('File Done!');
            });

            destFile.write(JSON.stringify(data, null, "\t"));
            destFile.end();
        })
        .catch(function(error)
        {
            console.log(error);
        });
    });
});
