#Using the GMS Test Page

GMS provide two methods for testing the service:

1. A test page to confirm the GMS is active.  It is accessible via the browser at [https://localhost:8590/masterlib/testpage](https://localhost:8590/masterlib/testpage) where localhost is the hostname for your Qlik Sense server.
![WebInterface](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/test/testpage1.png)
<br><br>

2. Using Postman, it is possible to contact the GMS.  Learn more about Postman here: **[Postman](https://www.getpostman.com/)**.

It is accessible via the browser at [https://localhost:8590/masterlib/testpage](https://localhost:8590/masterlib/testpage)     
**Please note the Governed Metrics Service uses https.  Attempting use on http will result in a failed connection**

##Test Page Components:

1. __Test Connection __: This button verifies that the Governed Metrics Service is connected to Qlik Sense.
2. __Reload Metrics Library App__: This button will reload your Metrics Library application and output confirmation of task completion.
3. __Update Metrics in Apps__: This button will push all designated governed metrics to any/all corresponding Qlik Sense application(s).
4. __Reload Metrics Library and Update Apps__: This button combines the Reload and Update button functions into one task.
5. __Delete Metics from an App__: Enter the application name on the bottom right input box you wish to delete the metrics from, then apply.

##Finding Object Ids for existing master library items

A new feature in GMS 2.0 is the ability in the test page to find the ids of master library dimensions and measures that may not be part of GMS, but make sense to be integrated.

Flipping the Master Library Search toggle presents an interface to select an app and view the master library item object Ids.
![Search](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/test/testpage2.png)

Once viewing an apps master library items, it's possible to export them to a csv to copy and paste them to the data source where GMS pulls from and add them across multiple apps.
![export](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/test/testpage3.png)




##Next Steps - Validation
Time to verify and test! If you have completed the steps above, click the "Reload Metrics library and Update Apps" button and wait for the confirmation message.

If you would like to use the GMS sample data and example included in installation proceed to the next page.

**Please note the time it takes for master library items from GMS to appear in apps varies on the creation of the repository reference of the created objects.
