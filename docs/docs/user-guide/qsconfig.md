#Qlik Sense Server Configuration for Governed Metrics Service

Configuring Qlik Sense Server to use the Governed Metrics Service is a snap.  To begin distributing dimensions and measures to Qlik Sense applications, complete the tasks below.

* [Create the Metrics Library app](qsconfig.md#Step1).
* [Create Metrics Library Field Names & Data Connection](qsconfig.md#Step2).
* [Create a reload task for the Metrics Library app](qsconfig.md#Step3).
* [Create a tag for marking governed dimensions and measures](qsconfig.md#Step4)
* [Create the ManagedMasterItems custom property and add values](qsconfig.md#Step5)
* [Apply the ManagedMasterItems custom property values to apps](qsconfig.md#Step6).

<a name="Step1"></a> 
## Step 1: Create the Metrics Library App

  1. From the Hub, create an app called "Metrics Library"
  2. In the Metrics Library app, create a Data Connection to your source data. For more information on Metrics Library configuration and requirements: [link](qsconfig.md#metrics-library-app-field-names)
  3. Reload the Metrics Library app to verify you are connected and loading in the correct data. 
  4. Save and close the app (it is okay to leave in the My Work stream)

![createNewApp](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/app/createnewapp.png)


<a name="Step2"></a> 
## Step 2: Create Metrics Library App Field Names & Data Connection

The Metrics Library app is the main application the Governed Metrics Service reads during the update process to apply dimensions and measures to all associated applications.  __<u>The app requires specific named fields to work properly.</u>__ 

You must create a Data Connection to the data source in the Metrics Library app using the specifications below. The data source can be created manually or you can use the example data that was included in the installation. Please see the [example](/user-guide/validation.md) after reviewing the configuration requirements. 

The source data for the Metrics Library app - the central list of metrics - can be loaded from any data source.  However, when loading the data, the field names must conform to the following and contain the specified information. 

Field Name definitions for the Metrics Library data source:

* __ID__ - The unique ID can be generated in the load script automatically or defined in your data source. There is an example [here](qsconfig.md#MetricsLibrary) of how to generate it in the script. 

* __MetricSubject__ - The MetricSubject MUST equal the [ManagedMasterItems](qsconfig.md#Step4) custom property value.  When the Governed Metrics Service reads the Metrics Library app tables, this field is used to identify which apps will receive the dimension or measure.

* __MetricType__ - This field identifies where in the Master Library a metric will be added.

* __MetricName__ - The MetricName field contains the friendly name displayed in the Master Library for the dimension or measure.

* __MetricDescription__ - This field contains a description for the dimension or measure.  When a user clicks on a Master Library item, the description will appear in the pop user interface.

* __MetricFormula__ - The MetricFormula contains the dimension field name or the expression to be used for the dimension or measure.

* __MetricOwner__ - This field identifies who owns the metric for informational purposes.

* __MetricTags__ - The MetricTags page is a semicolon delimited list of descriptive tags to be added to the dimension or measure Master Library item to aid search.

###Sample Source Data Table
| ID | MetricSubject | MetricType | MetricName | MetricDescription | MetricFormula | MetricOwner | MetricTags |
| ------------- | ------------- | ---------- | ---------- | ----------------- | -------------- | ----------- | ---------- |
| 1 | Customer Service | Measure | % Resolved in SLA | Percentage of Tickets handled within SLA | Sum({< [Call Ctr Days to Resolve] = {'0', '1', '2', '3', '4', '5', '6'} > } [Call Ctr Call #])/sum([Call Ctr Call #]) | Linda Lee | Key KPI;Call |
| 2 | Sales | Dimension | Country | Customer Country | Customer Country | Chad Johnson | Customer |
| 3 | Finance | Measure | Costs | Cost Amount | sum([Sales Costs]) | Gordon Wyse | Cost |

<a name="MetricsLibrary"></a>
```
MetricsLibrary:

	LOAD
    RowNo() AS ID, //ID does not exist in source data so we generate it in the script
    MetricSubject,
    MetricType,
    MetricName,
    MetricDescription,
    MetricFormula,
    MetricOwner,
    MetricTags
	FROM [lib://AttachedFiles/MetricsLibrary.csv]
	(txt, codepage is 1252, embedded labels, delimiter is '\t', msq);
```

<a name="Step3"></a>
## Step 3: Create a reload task for the Metrics Library app

After creating the Metrics Library app, a reload task needs to be created for it so the Governed Metrics Service can request updated metrics before applying them to apps.

  1. Navigate to the Metrics Library app in QMC and click "More actions"
  2. Select the "Create new reload task option"
  3. Name the task the same value entered in the task name provided during the installation of the GMS itself. "Reload task of Metrics Library" is the default.
  4. Save the task and exit.



![AppList](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/reload/applist.png) ![ReloadButton](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/reload/reloadtaskbutton.png)


![Task Creation Dialog](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/reload/reloadtask.png)

<a name="Step4"></a>
## Step 4: Create a gms tag to mark dimensions and measures.

To assist the creation, modification, and deletion of dimensions and measures using the Governed Metrics Service, the process applies a tag to created items.  This tag needs to be created in the QMC before it can be used by the process.

To create the gms tag:

  1. Navigate to the Tags menu item in the QMC.
  2. Click the "Create New" button.
  3. Enter ***gms*** into the Name field.
  4. Click Apply.

![tag](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/tag/tag.png)

<a name="Step5"></a>
## Step 5: Create the ManagedMasterItems custom property and add values

In order to identify the applications that will receive metrics, the ManagedMasterItems custom property contains the values to be applied to apps.

Looking back on the sample source data table above, observe the MetricsSubject column.  This column directly corresponds to the values entered into the ManagedMasterItems custom property.  For the different metrics supplied from the data source, a MetricsSubject identifies the apps that will receive the dimension or measure in the master library.

To create the ManagedMasterItems custom property:

  1. Navigate to the Custom Properties menu item in the QMC.  
  2. Click "Create new" and provide a name for the custom property that matches the value entered in the configuration page of the Governed Metrics Service install. In this example we use "ManagedMasterItems"
  3. Select the "Apps" resource checkbox.
  4. Add values to the custom property that match values in the MetricsSubject field and click apply.

![customprop](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/customprop/customprop.png)

<a name="Step6"></a>
## Step 6: Apply the ManagedMasterItems custom property values to apps


Now that the custom property for populating metrics to applications exists, the values need to be set on applications for when the Governed Metrics Service performs an update.

__Do not apply ManagedMasterItems custom property values to the Metrics Library application.__


To add a custom property value to an app:

1. Go back to the Apps section of the QMC and double click on an App reference in the list.  
![AppList](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/reload/applist.png)

2. When the app screen appears, activate the Custom properties section by clicking on the term located on the right side of the screen.    
![AppList](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/app/applyprop1.png)

3. Click on the dialog box next to ManagedMasterItems (or the custom property created for GMS) and type or select the custom property values to apply to the app.    
![AppList](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/app/applyprop2.png)

##Next Steps - Installing the Governed Metrics Service. Click Next to proceed.
