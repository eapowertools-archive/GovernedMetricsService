<h2>GMS Prerequisites</h2>


Minimum Requirements:

- The Governed Metrics Service requires Qlik Sense Server.
- The Governed Metrics Service runs through the Qlik EA Powertools Service Dispatcher.
- The Governed Metrics Service uses **port 8590** by default for the rest interface.  This is configurable during installation.
- The Governed Metrics Service uses **port 4747** to communicate with the Qlik Sense Engine Service.
- The Governed Metrics Service uses **port 4242** to communicate with the Qlik Sense Repository Service (QRS).
- The Governed Metrics Service has been tested with Qlik Sense 3.x.x
- A data source that can be accessed via Data Connection in Qlik Sense (Excel, ODBC etc.)
- The Governed Metrics Service requires a licensed Qlik Sense server.
- Please do not install for use with Qlik Sense desktop.  The Governed Metrics Service will not work.

Before installing the Governed Metrics Service, __we highly recommend__ going through the Qlik Sense server QMC configuration instructions in the documentation.  Application, custom property, and task names will be requested during the install and it's easier on your memory if you have created them in advance.