#Governed Metrics Service (GMS) REST API Reference

The following endpoints are available for use with the Governed Metrics Service.  All endpoints are prefaced with 

#Paths

---
##/getdocid
> Returns the GUID ID for the metrics library app name designated in the `config.js` file.
>###GET
>>####Request
    http://senseHostname:gmsPort/masterlib/getdocid
>>####Response
>> The example below shows a guid for the metrics library app.  This value may be different on your server.
>>####
    "4c5abffb-a2d5-4a26-a192-ac6de41746a5"

>###POST
>>####Request
    http://senseHostname:gmsPort/masterlib/getdocid
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
    http://senseHostname:gmsPort/masterlib/add/all
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
    http://senseHostname:gmsPort/masterlib/update/all
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
    http://senseHostname:gmsPort/masterlib/delete/fromapp
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
    http://senseHostname:gmsPort/masterlib/reload
>>####Headers
    null
>>####Body
    null
>>####Response