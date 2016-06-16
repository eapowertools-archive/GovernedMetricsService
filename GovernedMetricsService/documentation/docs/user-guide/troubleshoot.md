#Troubleshooting Installation Issues

Sometimes, installations don't always go the way we want them too.  Thankfully, the Metrics Library Editor and the Governed Metrics Service are NodeJS applications that can be edited on the fly without recompilation.  Below are some potential issues with making the GMS operationsal and what to do to resolve them.

##Issue: The Metrics Library Editor does not load in a browser.

###Possible Causes:
  - The port for the Metrics Library Editor is already in use.
  - Access to the Metrics Library Editor is restricted to https instead of http.
  
>####The port for the Metrics Library Editor is already in use.

>The Metrics Library Editor uses port 8185 by default.  To change the port, open the ExternalMetrics.js file in a text editor using administrator privileges located in the MetricsLibraryEditor folder.
>
>At the bottom of the file, is the following entry:
>  
    http.createServer(app).listen(8185);
>Change the port number of 8185 to a TCP port number not in use.  Restart the Service Dispatcher Service.

>####Access to the Metrics Library Editor is restricted to https instead of http.

