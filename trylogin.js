//tryLogin

var login = require('./login');
var killSession = require('./killsession');

login.login(function(error, result)
{
	if(error)
	{
		console.log(error);
	}
	else
	{
		console.log(result);
		killSession.logout(result, function(error, message)
		{
			if(error)
			{
				console.log('Error: ' + error);
			}
			else
			{
				console.log(message);
			}
		});
	}
});