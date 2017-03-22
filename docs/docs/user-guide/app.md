<a name="top"></a>
<h1>The GMA (Governed Metrics Application)</h1>

The Governed Metrics App (GMA) is a compliance application for Qlik Sense providing insight into master library dimensions and measures that have been deployed through the Governed Metrics Service (GMS).

Source data for the Metrics Library portion of the GMA may be loaded from any data source.  Loaded data needs to conform to the specification described in the general section below.

* [General Configuration](app.md#general)
    + [Import the Governed Metrics Application](app.md#import)
* [Loading Metrics Metadata to the GMA](app.md#loadingdata)
    + [Update the GMA Data Connection](app.md#dataConn)
    + [Field Definitions and Structure](app.md#fieldDefs)
    + [Sample Source Data Table](app.md#sample)    
    + [Loading Data from a folder or database Data Connection](app.md#standard)    
    + [Loading Data using the MDI ReST Endpoint](app.md#MDI)
    + [Creating the MDI REST Connection in the Data Load Editor](app.md#mdicreate)


<a name="general"></a>
## General Configuration

<a name="import"></a>
###Import the Governed Metrics Application

The Governed Metrics Application is part of the GMS installation.  From the installation directory, navigate to the gma folder and observe the Governed Metrics App.qvf file.

To import the GMA app to a Qlik Sense server:

1. Launch a web browser and navigate to the QMC for the Qlik Sense site.
<br><br>
2. Click on the Apps menu item on the left side of the screen.
<br>
![2](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/app/import1.png)
<br><br>

3. Click the import button at the bottom of the screen.
<br>
![3](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/app/import2.png)
<br><br>

4. Click the Choose File button and navigate to the gma folder inside the folder Governed Metrics Service is installed. Default path:
  ```
  %programfiles%\Qlik\Sense\EAPowerTools\GovernedMetricsService\gma
  ```    
  
<br>
![4](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/app/import3.png)
<br><br>

5. Select the Governed Metrics App.qvf file and click the Import Button.
<br>
![5](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/app/import4.png)
<br><br>

<a name="loadingdata"></a>
<h2>Loading Metrics Metadata to the GMA</h2>

Loading data to the Metrics Library is the same as loading data into a standard Qlik Sense app.  There are some guidelines to follow depending on the data source metrics metadata will be loaded from.  In general, metrics metadata will be loaded from a centralized location like a database, MS Excel, or CSV file.  In the 2.0.0 release of GMS, a new method of loading data using the Qlik REST Connector makes it possible to load metrics metadata from the master library items of other apps in a Qlik Sense site.

<a name="dataConn"></a>
###Update the GMA Data Connection

After importing the GMA application, it may be necessary to update the lib references in the script to point to the appropriate data connection.  Follow these steps to update data connections in an app.

1. Open a new browser tab and navigate to the Qlik Sense Hub.    
<br>

2. Open the Governed Metrics Application and proceed to the data load editor.    
![gma1](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/app/gma1.png)
![gma2](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/app/gma2.png)
<br>

3. Click on the Metrics Library section of the load script.    
![gma3](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/app/gma3.png)
<br>

4. Review the MetricsLibrary table load in the script.  Observe the entry for the data source location.    
    ```
    FROM [lib://EAPowerToolsGMS/GMS.xlsx]
    (ooxml, embedded labels, table is Sheet1);
    ```    
<br>

5. Now review the available data connections from the list on the right.  If there is a match for EAPowerToolsGMS then there is no update required.  If a data connection with a different name appears in the list that points to the source of Metrics Library metadata, replace the EAPowerToolsGMS in the script with the name of the connection where the source data resides.  If no connection to source data exists, proceed to create one and update the script with the new data connection name.
<br><br>

<a name="fieldDefs"></a>
###Field Definitions and Structure

The Governed Metrics Service relies on specific field names to distribute metrics.  While the source data field names do not have to match, the field names Qlik Sense will use need to be the following:

* __ID__ - **(REQUIRED)** The ID field is a numeric primary key field for metrics distributed by the GMS natively.
> __Usage:__    
> ___A.___ The ID field must be filled with the Qlik Sense Engine object id when importing metrics via MDI or adopting manually created Master Library items into GMS.    
>
> ___B.___ Use a unique numeric value when a new metric is delivered to apps exclusively through GMS.
<br>

* __UID__ - **(REQUIRED)** The UID is the field the Governed Metrics Service applies to new master library items to be created or uses to detect existing master library items to make changes.  The UID can be one of two items:
> __Usage:__    
> ___1.___ A hardcoded value representing an existing master library item id.  For MDI and adopted master library items, this value is the same as the ID.    
>
> ___2.___ If the UID is left blank at the source, GMS will create a UID with a modified 128 bit hash composite of the MetricSubject field and ID field.  The hash has non-alphanumeric characters stripped out for support as object ids in Qlik Sense objects.  Uses the expression `if(isnull(UID),KeepChar(Hash128(MetricSubject,ID),'$(chars)'),UID) as UID`.

* __MetricSubject__ - **(REQUIRED)** The MetricSubject MUST equal the ManagedMasterItems custom property value.  When the Governed Metrics Service reads the Metrics Library app tables, this field is used to identify which apps will receive the dimension or measure.
<br><br>

* __MetricType__ - **(REQUIRED)** This field identifies if the metric is a dimension or measure.
<br><br>

* __MetricName__ - **(REQUIRED)** The MetricName field contains the friendly name displayed in the Master Library for the dimension or measure.
<br><br>

* __MetricDescription__ - This field contains a description for the dimension or measure.  When a user clicks on a Master Library item, the description will appear in the pop user interface.
<br><br>

* __MetricFormula__ - **(REQUIRED)** The MetricFormula contains the dimension field name(s) or the expression to be used for the dimension or measure.
> __Usage:__    
> ___A.___ For measures, the field is a string literal of the expression without the initial equal sign.    
>
> ___B.___ For single dimensions, enter the field name the dimension will reference.  Do not square bracket field names with multiple words and spaces.    
>
> ___C.___ For calculated dimensions, the field is a string literal **including** the initial equal sign.  If using Excel as the data source, add an apostrophe before the equal sign so that Excel will treat the expression as a string literal.    
>
> ___D.___ For drilldown dimensions, enter the field names to group together as comma separated values.  Do not include square brackets surrounding field names.
<br>

* __MetricOwner__ - This field identifies who owns the metric for informational purposes.
<br><br>

* __MetricTags__ - The MetricTags field is a semicolon delimited list of descriptive tags to be added to the dimension or measure Master Library item to aid search.
<br><br>

* __MetricGrouping__ - **(REQUIRED)** The MetricGrouping field identifies if dimensions are single (N), or drilldown (H).  Measures are only ever single (N).

* __MetricColor__ - **Available in Qlik Sense 3.2 and higher**, the MetricColor is applicable only to measure master items.  A hex color code value (e.g. #ffffff) may be supplied in this field to set a color for a measure.  If no hex value is supplied, no color will be set.

<a name="sample"></a>
###Sample Source Data Table

Below is an example of the resulting table of information expected to be loaded from the data source.

| ID | UID | MetricSubject | MetricType | MetricName | MetricDescription | MetricFormula | MetricOwner | MetricTags | MetricGrouping | MetricColor |
| ------------- | ------------- | ---------- | ---------- | ----------------- | -------------- | ----------- | ---------- | ---------- | ---------- | | ---------- |
| 1 | EDSMNFH8F | Customer Service | Measure | % Resolved in SLA | Percentage of Tickets handled within SLA | Sum({< [Call Ctr Days to Resolve] = {'0', '1', '2', '3', '4', '5', '6'} > } [Call Ctr Call #])/sum([Call Ctr Call #]) | Linda Lee | Key KPI;Call | N |
| 2 | P29OSdkE | Sales | Dimension | Country | Customer Country | Customer Country | Chad Johnson | Customer | N |
| 3 | L2SDNCHDJEL4ritdsR | Finance | Measure | Costs | Cost Amount | sum([Sales Costs]) | Gordon Wyse | Cost | N |
| ABCD | ABCD | Sales | Dimension | TimeDrill | Fiscal time drill down | FiscalYear, FiscalQuarter, FiscalMonth | Sales | time;drill | H |
|  | sales_5 | Sales | Measure | SumCalc | A fake calculation | sum(1) | some person | fake;metric | N | #46c646

<a name="standard"></a>
##Loading Data from a Folder or Database Data Connection

Here is an example of a load statement for loading metrics from an MS Excel file.

```
SET chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';

MetricsLibrary:
	LOAD
    ID,
    if(isnull(UID),KeepChar(Hash128(MetricSubject,ID),'$(chars)'),UID) as UID,
    MetricSubject,
    MetricType,
    MetricName,
    MetricDescription,
    MetricFormula,
    MetricOwner,
    MetricTags,
    MetricGrouping,
    MetricColor
    FROM [lib://EAPowerToolsGMS/GMS.xlsx]
    (ooxml, embedded labels, table is Sheet1);
```

While all the fields are important and required, the UID field is most critical because it is the field used to identify existing metrics deployed to applications through GMS, and the value of this field will be used to generate the engine object id of new dimensions and measures added by GMS.  It may be necessary to alter this template script to identify the source field names, but it is mandatory that the destination field names reflect the values described in the **[field definitions](app.md#fieldDefs)** section on this page.

<a name="MDI"></a>
##Loading Data using the MDI REST Endpoint

Beginning in GMS 2.0.0, a REST endpoint is available to reach into other Qlik Sense applications and extract the master library dimension and measure definitions.  The definitions are formatted and loaded into the Metrics Library as if they were stored in the central data store for metrics metadata.  The advantages of this capability are reuse of existing metrics stored in apps and a way to categorize master items by using an app as the storage container for definitions.  This capability is useful when no central metrics data source exists.

<strong style="color:red"><i>This is a completely optional section of the guide.  If Qlik Sense apps with master library dimensions and measures will be used as a source of metric metadata, please follow the steps below to set up a connection.</i></strong>

<strong style="background:gold;">In order for the MDI capability to work, the Governed Metrics Service must be running.</strong>


To access the MDI REST endpoint, use the Qlik REST Connector and follow the directions below to configure a connection and identify a MasterLibrarySource application.

<a name="mdicreate"></a>
###Creating the MDI REST Connection in the Data Load Editor

1. Click on New Connection and choose Qlik REST Connector.
![1](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/mdi/1.png)
<br><br>

2. Enter the URL for the MDI endpoint.  The endpoint url is https://%senseServerName%:%gmsPort%/masterlib/getallMDI.
![2](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/mdi/3.png)
<br><br>

3. For Data options make sure the auto detect checkbox is checked and the key generation strategy is sequential.
![3](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/mdi/4.png)
<br><br>

4. In the authentication section, set windows authentication to **No** and leave the userid and password fields blank.
![4](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/mdi/5.png)
<br><br>

5. Authentication to the REST api uses the certificates GMS is set up to use during installation.  In the Use certificate dropdown, choose installed to use a certificate installed on the windows server through certificate management, or choose From file to enter the paths for the certificate and private key files for authentication.
![5](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/mdi/6.png)
<br><br>

6. In the Pagination section, set the Pagination type to None.
![6](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/mdi/7.png)
<br><br>

7. For the getAllMDI path, there is no need for query parameters.
![7](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/mdi/8.png)
<br><br>

8. Provide a name for the connection, test the connection and click Save.
![8](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/mdi/9.png)
<br><br>

9. Open the data preview window.  Click the checkbox next to root.  This will show the data fields in the preview window.
![9](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/mdi/10.png)

10. Click the Insert script button to add the load script to the data load editor.
