var Promise = require('bluebird');
var itemCount = require('./checkRepoTest');

var promiseWhile = Promise.method(function(condition, action) {
    if (!condition()) return;
    return action().then(promiseWhile.bind(null, condition, action));
});

var sum = 0,
    stop = 931;

var appId = '831bc2ea-a43b-46f7-9ad2-d843cb9c4764'


promiseWhile(function() {
    // Condition for stopping
    return sum < stop;
}, function() {
    // Action to run, should return a promise
    return itemCount.count(appId)
            .then(function(repoVals)
            {
                sum = repoVals
                console.log(repoVals);
                return sum;
            });
}).then(function() {
    // Notice we can chain it because it's a Promise, 
    // this will run after completion of the promiseWhile Promise!
    console.log("Done");
});



// promiseWhile(function() {
//     // Condition for stopping
//     return sum < stop;
// }, function() {
//     // Action to run, should return a promise
//     return new Promise(function(resolve, reject) {
//         // Arbitrary 250ms async method to simulate async process
//         // In real usage it could just be a normal async event that 
//         // returns a Promise.
//         setTimeout(function() {
//             sum++;
//             // Print out the sum thus far to show progress
//             console.log(sum);
//             resolve();
//         }, 2000);
//     });
// }).then(function() {
//     // Notice we can chain it because it's a Promise, 
//     // this will run after completion of the promiseWhile Promise!
//     console.log("Done");
// });