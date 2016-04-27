//Marcus Spitzmiller
//1/8/2016


Description:
This is a demo asset to show how external metrics defined in a source outside of qlik could be read in.  This small page is a better front end than excel or access and looks better during a demo.

Prequisites
	Install nodejs found at http://nodejs.org/
	by default points to an access database.  It is using the OLEDB provider >>> Microsoft.ACE.OLEDB.12.0, so you need this.  See 
https://social.msdn.microsoft.com/Forums/en-US/1d5c04c7-157f-4955-a14b-41d912d50a64/how-to-fix-error-the-microsoftaceoledb120-provider-is-not-registered-on-the-local-machine?forum=vstsdb

	if you can't connect to the database.

TO run:
	run ExternalMetrics.bat > 
		this starts the node server which communicates with the back end database
		then it launches URL ****http://localhost:8185*** > and the metrics library will display.  
			You can't open index.htm directly from the filesystem, it won't work that way.
	

Note: This obviously isn't production ready.  In real life, a customer would use their own metric management software.

