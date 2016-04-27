//tryLogin

var login = require('./login');
var killSession = require('./killsession');

login.login()
.then(function(cookies)
{
	console.log('successful login');
	console.log(cookies);
	return cookies;
})
.then(function(cookies)
{
	killSession.logout(cookies)
	.then(function(result)
	{
		console.log(result);
	})
	.catch(function(error)
	{
		console.log(error);
	});
})
.catch(function(error)
{
	console.log(error);
});