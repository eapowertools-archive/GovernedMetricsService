#Troubleshooting Governed Metrics Service

The Governed Metrics Service generates log output in daily log files in the governedmetricsservice\log folder.  In addition, the log output is streamed to the test page when the GMS is run.  

###The Governed Metrics Service testpage does not render (connection refused or timeout)
- Description: When browsing to the GMS test page, the test page does not render.
- Cause: The GMS uses the Qlik EA Powertools Service Dispatcher to run and the service dispatcher service has not been installed.
- Explanation: On certain operating systems (I'm looking at you Windows 7 and 10) the Powertools service dispatcher does not install during the GMS installation.
- Resolution: In the Utils folder of the governedmetricsservice folder is a batch file called createServiceDispatcherManual.bat.  Before running, make sure the powertools service does not exist in the services list.  Run this batch file with administrator privileges.  When prompted for the path, please include the full path + executable for the powertools service (powertoolsService.exe).  Once the service is installed start the service and attempt to load the gms page again.

- Cause: The GMS requires is not accessible via http.
- Explanation: GMS requires https.  If a third party certificate is not provided during installation, the Qlik Sense generated certificates are used.
- Resolution: Browse to https://senseserver:8590/masterlib/testpage.

###409 Errors
- Description: When running the GMS update process, errors may be returned with a code 409.  
- Cause: This error appears when a conflict in the repository api occurs.  
- Explanation: Typically, conflicts arise when changes are made to repository entries but the modification dates are not valid.  In the case of GMS, it may be due to having multiple notification processes for creating dimensions or measures.
- Resolution: Stop and start all Qlik Sense services, then restart the Qlik EA Powertools Service Dispatcher service.  This will cause the notification entries in the repository to purge and GMS will create new entries.

###qText is undefined
- Description: When running the GMS update process, a qText is undefined error appears.
- Cause: Required fields in the metrics library table of the Governed Metrics Application are missing.
- Explanation: GMS requires specific fields labeled and filled with information to perform updates to applications.
- Resolution: Please refer to the [Field Definitions and Structure](app.md#fieldDefs) section of the documentation.