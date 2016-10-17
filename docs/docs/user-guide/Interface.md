#Using the GMS Test Page

![WebInterface](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/webint/GMS_TestConnection.png)


It is accessible via the browser at [http://localhost:8590/masterlib/testpage](http://localhost:8590/masterlib/testpage) 

##Test Page Components:

1. __Test Connection __: This button verifies that the Governed Metrics Service is connected to Qlik Sense.
2. __Reload Metrics Library App__: This button will reload your Metrics Library application and output confirmation of task completion. 
3. __Update Metrics in Apps__: This button will push all designated governed metrics to any/all corresponding Qlik Sense application(s).
4. __Reload Metrics Library and Update Apps__: This button comines the Reload and Update button functions into one task. 
5. __Delete Metics from an App__: Enter the application name on the bottom right input box you wish to delete the metrics from, then apply. 

There are two methods for testing:

1. A test page to confirm the GMS is active.  It is accessible via the browser at [http://localhost:8590/masterlib/testpage](http://localhost:8590/masterlib/testpage) where localhost is the hostname for your Qlik Sense server.

2. If you use Postman, it is possible to contact the GMS using it.  If you are unfamiliar with Postman and want to become acquainted go here: **[Postman](https://www.getpostman.com/)**.

##Next Steps - Validation
Time to verify and test! If you have completed the steps above, click the "Reload Metrics library and Update Apps" button and wait for the confirmation message. 

If you would like to use the GMS sample data and example that were included in installation then please proceed to the next page. 

**Please note that it may take up to 15 seconds for new items to show up in an app. 



