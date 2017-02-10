<h1>Governed Metrics Service (GMS) REST API Reference</h1>

The following endpoints are available for use with the Governed Metrics Service.  All endpoints are prefaced with masterlib.

#Paths

---
##/
> Returns the hypercube definition for the data to be returned to the Governed Metrics Service for population in master libraries across apps.
>###GET
>>####Request
    https://senseHostname:gmsPort/masterlib/
>>####Response
>> Returns the json definition of the hypercube used to populate master library items.

---
##/testpage
> Navigates to the test page used for running the Governed Metrics Service in push button fashion.
>###GET
>>####Request
    https://senseHostname:gmsPort/masterlib/testpage
>>####Response
>> Rendered testpage.

---
##/getdocid
> Returns the GUID ID for the metrics library app name designated in the `config.js` file.
>###GET
>>####Request
    https://senseHostname:gmsPort/masterlib/getdocid
>>####Response
>> The example below shows a guid for the metrics library app.  This value may be different on your server.
>>####
    "4c5abffb-a2d5-4a26-a192-ac6de41746a5"

>###POST
>>####Request
    https://senseHostname:gmsPort/masterlib/getdocid
>>####Headers
    Content-Type: application/json
>>####Body
    {
        "appname":"Operations Monitor"
    }
>>####Response
>> The example below shows a guid for the application name specified in the body of the POST request.
>>####
    "48b436aa-64d4-4c6f-9bb9-bd4d64692ce8"

---
##/add/all
> Calls the update/all method
>###POST
>>####Request
    https://senseHostname:gmsPort/masterlib/add/all
>>####Headers
    null
>>####Body
    null
>>####Response

---
##/update/all
> Updates applications with the ManagedMasterItems custom property applied with the master library dimensions and measures corresponding to applied values. 
>###POST
>>####Request
    https://senseHostname:gmsPort/masterlib/update/all
>>####Headers
    null
>>####Body
    null
>>####Response

---
##/delete/fromapp
> Deletes all of the master library items applied by GMS for the supplied application name.
>###POST
>>####Request
    https://senseHostname:gmsPort/masterlib/delete/fromapp
>>####Headers
    Content-Type: application/json
>>####Body
    {
        "appname":"Operations Monitor"
    }
>>####Response

---
##/reload
> Triggers a refresh of the data contained in the Metrics Library Qlik application that stores dimension and measure metadata for use with the GMS.
>###POST
>>####Request
    https://senseHostname:gmsPort/masterlib/reload
>>####Headers
    null
>>####Body
    null
>>####Response

---
##/version
> Returns the Governed Metrics Service version.
>###GET
>>####Request
    https://senseHostname:gmsPort/masterlib/version
>>####Response
>> The example below shows version of Governed Metrics Service.
>>####
    "1.0.0"

---
##/getAllMDI
> An endpoint used by the Qlik Sense REST Connector to populate master library items from an app into the Metrics Library application.
>###GET
>>####Request
    https://senseHostname:gmsPort/masterlib/getAllMDI
>>####Response
>> The response is the definitions of dimensions and measures from apps with the MasterLibrarySource custom property applied.

---
##/notifyme
> Receives messages from the QRS api telling the Governed Metrics Service to process ownership changes on master library items applied by the service.
>###GET
>>####Request
    https://senseHostname:gmsPort/masterlib/notifyme
>>####Response
>> An array of objects matching the notification criteria set by the Governed Metrics Service prompting a call to the endpoint.

---
##/deletenotifyme
> Receives messages from the QRS api telling the Governed Metrics Service that delete operations in the repository have completed for the entities listed in body.
>###POST
>>####Request
    https://senseHostname:gmsPort/masterlib/deletenotifyme
>>####Response
>> An array of objects matching the notification criteria set by the Governed Metrics Service.

---
##/getapplist
> Retrieves a list of apps to populate a drop down box in the test page.  Used for finding master library item ids to incorporate into GMS.
>###GET
>>####Request
    https://senseHostname:gmsPort/masterlib/getapplist
>>####Response
>> JSON object with the id and name of each app in the Qlik Sense site GMS is installed.

---
##/getappobjects/:id
> Retrieves a list of dimensions and measures from the app selected in the drop down list of apps on the GMS test page.
>>####Request
    https://senseHostname:gmsPort/masterlib/getappobjects/appGuid
>>####Parameter
    id = the app guid representing the app in Qlik Sense repository.
>>####Response
>> JSON object with the ID, UID, description, type, and gms tag (where applied) for each dimension or measure.