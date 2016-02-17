//tryPromise.js
var Promise = require('bluebird');

var myFunc = function helloWorld(message)
{
	return new Promise(function(resolve,reject)
	{
		if(message=="Does this work")
		{
			resolve(console.log('success!'));
		}
		else
		{
			reject(console.log('fail!'));
		}
	});
};

myFunc("Does this work")
.then(function()
{
	console.log('Yes it does');
})
.catch(function()
{
	console.log('No it didn\'t');
}).then(function()
{
	myFunc("Scoop")
	.then(function()
	{
		console.log('Yes it does');
	})
	.catch(function()
	{
		console.log('No it didn\'t');
	});	
});
