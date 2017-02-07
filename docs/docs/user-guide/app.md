#Create the Metrics Library application
<a name="top"></a>

The Metrics Library app is the repository the Governed Metrics Service uses to distribute metrics to apps in a Qlik Sense site.  __<u>The app requires specific named fields to work properly.</u>__ 

Source data for the Metrics Library app may be loaded from any data source.  Loaded data needs to conform to the specification described in the general section below.

* [General Configuration](app.md#general)
* [Loading Metrics Metadata to the Metrics Library](app.md#loadingdata)    
    + [Loading Data from a folder or database Data Connection](app.md#standard)    
    + [Loading Data using the MDI ReST Endpoint](app.md#MDI)


<a name="general"></a>
## General Configuration 

###The Metrics Library App

  1. From the Hub, create an app called "Metrics Library" and open it.
  ![createNewApp](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/app/createnewapp.png)

  2. Click on the data load editor button to launch the Data Load Editor.

<a name="fieldDefs"></a>
###Field Definitions and Structure

The Governed Metrics Service relies on specific field names to distribute metrics.  While the source data field names do not have to match, the field names Qlik Sense will use need to be the following: 

* __ID__ - The ID field is a numeric primary key field for metrics distributed by the GMS natively.  Put another way, when importing metrics via MDI or adopting manually created Master Library items the ID field must be filled with the Qlik Sense Engine object id.  When a new metric is delivered to to apps exclusively through GMS, a numeric value is used.
<br><br>

* __UID__ - This is the field the Governed Metrics Service applies to new master library items to be created or uses to detect existing master library items to make changes.  The UID can be one of two items:
    1. A hardcoded value representing an existing master library item id.
    2. It is a modified 128 bit hash composite of the MetricSubject field and ID field.  Uses the expression `if(isnull(UID),KeepChar(Hash128(MetricSubject,ID),'$(chars)'),UID) as UID`

* __MetricSubject__ - The MetricSubject MUST equal the [ManagedMasterItems](qsconfig.md#Step4) custom property value.  When the Governed Metrics Service reads the Metrics Library app tables, this field is used to identify which apps will receive the dimension or measure.
<br><br>
    
* __MetricType__ - This field identifies where in the Master Library a metric will be added.
<br><br>

* __MetricName__ - The MetricName field contains the friendly name displayed in the Master Library for the dimension or measure.
<br><br>

* __MetricDescription__ - This field contains a description for the dimension or measure.  When a user clicks on a Master Library item, the description will appear in the pop user interface.
<br><br>

* __MetricFormula__ - The MetricFormula contains the dimension field name or the expression to be used for the dimension or measure.
<br><br>

* __MetricOwner__ - This field identifies who owns the metric for informational purposes.
<br><br>

* __MetricTags__ - The MetricTags field is a semicolon delimited list of descriptive tags to be added to the dimension or measure Master Library item to aid search.
<br><br>

* __MetricGrouping__ - The MetricGrouping field identifies if dimensions are single (N), or drilldown (H).  Measures are only ever single (N).

###Sample Source Data Table

Below is an example of the resulting table of information expected to be loaded from the data source.

| ID | UID | MetricSubject | MetricType | MetricName | MetricDescription | MetricFormula | MetricOwner | MetricTags | MetricGrouping |
| ------------- | ------------- | ---------- | ---------- | ----------------- | -------------- | ----------- | ---------- | ---------- | ---------- |
| 1 | EDSMNFH8F | Customer Service | Measure | % Resolved in SLA | Percentage of Tickets handled within SLA | Sum({< [Call Ctr Days to Resolve] = {'0', '1', '2', '3', '4', '5', '6'} > } [Call Ctr Call #])/sum([Call Ctr Call #]) | Linda Lee | Key KPI;Call | N |
| 2 | P29OSdkE | Sales | Dimension | Country | Customer Country | Customer Country | Chad Johnson | Customer | N |
| 3 | L2SDNCHDJEL4ritdsR | Finance | Measure | Costs | Cost Amount | sum([Sales Costs]) | Gordon Wyse | Cost | N |
| ABCD | ABCD | Sales | Dimension | TimeDrill | Fiscal time drill down | FiscalYear, FiscalQuarter, FiscalMonth | Sales | time;drill | H |
|  | sales_5 | Sales | Measure | SumCalc | A fake calculation | sum(1) | some person | fake;metric | N | 


<a name="loadingdata"></a>
##Loading Metrics Metadata to the Metrics Library

Loading data to the Metrics Library is the same as loading data into a standard Qlik Sense app.  There are some guidelines to follow depending on the data source metrics metadata will be loaded from.  In general, metrics metadata will be loaded from a centralized location like a database, MS Excel, or CSV file.  In the 2.0.0 release of GMS, a new method of loading data using the Qlik REST Connector makes it possible to load metrics metadata from the master library items of other apps in a Qlik Sense site.

<a name="standard"></a>
###Loading Data from a folder or database Data Connection

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
    MetricGrouping
	FROM [lib://AttachedFiles/MetricsLibrary.csv]
	(txt, codepage is 1252, embedded labels, delimiter is '\t', msq);
```

When creating a data connection from a folder or database, we recommend using the above as the template script.  

While all the fields are important and required, the UID field is most critical because it is the field used to identify existing metrics deployed to applications through GMS, and the value of this field will be used to generate the engine object id of new dimensions and measures added by GMS.  It may be necessary to alter this template script to identify the source field names, but it is mandatory that the destination field names reflect the values described in the **[field definitions](app.md#fieldDefs)** section on this page.

<a name="MDI"></a>
##Loading Data using the MDI REST Endpoint

Beginning in GMS 2.0.0, a REST endpoint is available to reach into other Qlik Sense applications and extract the master library dimension and measure definitions.  The definitions are formatted and loaded into the Metrics Library as if they were stored in the central data store for metrics metadata.  The advantages of this capability are reuse of existing metrics stored in apps and a way to categorize master items by using an app as the storage container for definitions.  This capability is useful when no central metrics data source exists.

To access the MDI REST endpoint, use the Qlik REST Connector and follow the directions below to configure a connection and identify a MasterLibrarySource application.

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
