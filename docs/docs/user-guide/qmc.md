#QMC Configuration
<a name="top"></a>

After creating the Metrics Library application, open the QMC to complete the Governed Metrics Service configuration

* [Configure the Metrics Library Reload Task](qmc.md#task)
* [Create a gms tag](qmc.md#tag)
* [Add and Configure the ManagedMasterItems Custom Property](qmc.md#managedmasteritems)
* [Add and Configure the MasterLibrarySource Custom Property](qmc.md#masterlibrarysource)


<a name="task"></a>
## Configure the Metrics Library Reload Task

The reload task refreshes the Metrics Library application with the latest version of metrics stored in data sources. 

  1. Navigate to the Metrics Library app in QMC and click "More actions"    
  ![AppList](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/reload/applist.png) 
<br><br>

  2. Select the "Create new reload task option"    
  ![ReloadButton](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/reload/reloadtaskbutton.png)
<br><br>

  3. Name the task with the value entered during the installation of the Governed Metrics Service. "Reload task of Metrics Library" is the default.    
  ![Task Creation Dialog](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/reload/reloadtask.png)
  ![5](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/install/5.png)    
<br><br>

  4. Save the task and return to the QMC main page.


<a name="tag"></a>
## Create a gms tag

To assist the creation, modification, and deletion of dimensions and measures using the Governed Metrics Service, the process applies a tag to created items.  This tag needs to be created in the QMC before it can be used by the process.

To create the gms tag:

  1. Navigate to the Tags menu item in the QMC.
  2. Click the "Create New" button.
  3. Enter ***gms*** into the Name field.
  4. Click Apply.

![tag](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/tag/tag.png)

<a name="managedmasteritems"></a>
## Add and Configure the ManagedMasterItems Custom Property

Apps receive metrics based on the ManagedMasterItems custom property value applied to them.

Looking back on the sample source data table observe the MetricsSubject column.  

| ID | UID | MetricSubject | MetricType | MetricName | MetricDescription | MetricFormula | MetricOwner | MetricTags | MetricGrouping |
| ------------- | ------------- | ---------- | ---------- | ----------------- | -------------- | ----------- | ---------- | ---------- | ---------- |
| 1 | EDSMNFH8F | Customer Service | Measure | % Resolved in SLA | Percentage of Tickets handled within SLA | Sum({< [Call Ctr Days to Resolve] = {'0', '1', '2', '3', '4', '5', '6'} > } [Call Ctr Call #])/sum([Call Ctr Call #]) | Linda Lee | Key KPI;Call | N |
| 2 | P29OSdkE | Sales | Dimension | Country | Customer Country | Customer Country | Chad Johnson | Customer | N |


This column corresponds directly to the values entered into the ManagedMasterItems custom property.  For the different metrics supplied from the data source, a MetricsSubject identifies the apps that will receive the dimension or measure in the master library.

To create the ManagedMasterItems custom property:

  1. Navigate to the Custom Properties menu item in the QMC.  
  2. Click "Create new" and provide a name for the custom property that matches the value entered in the configuration page of the Governed Metrics Service install. In this example we use "ManagedMasterItems"
  3. Select the "Apps" resource checkbox.
  4. Add values to the custom property that match values in the MetricsSubject field and click apply.

![customprop](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/customprop/customprop.png)

## Apply the ManagedMasterItems custom property values to apps


Now that the custom property for populating metrics to applications exists, the values need to be set on applications for when the Governed Metrics Service performs an update.

__Do not apply ManagedMasterItems custom property values to the Metrics Library application.__


To add a custom property value to an app:

1. Go back to the Apps section of the QMC and double click on an App reference in the list.  
![AppList](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/reload/applist.png)
<br><br>

2. When the app screen appears, activate the Custom properties section by clicking on the term located on the right side of the screen.    
![AppList](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/app/applyprop1.png)
<br><br>

3. Click on the dialog box next to ManagedMasterItems (or the custom property created for GMS) and type or select the custom property values to apply to the app.    
![AppList](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/app/applyprop2.png)

<a name="masterlibrarysource"></a>
## Add and Configure the MasterLibrarySource Custom Property

During the Metrics Library app configuration, the MDI capability was described and included how to connect to apps to acquire master library items.  The MasterLibrarySource custom property needs to be applied to the apps that will supply the Metrics Library with metrics through MDI.

To create the MasterLibrarySource custom property:

  1. Navigate to the Custom Properties menu item in the QMC.  
  2. Click "Create new" and provide a name for the custom property that matches the value entered in the configuration page of the Governed Metrics Service install. In this example we use "MasterLibrarySource"
  3. Select the "Apps" resource checkbox.
  4. Add values to the custom property that will represent the MetricSubject field in the Metrics Library app and click apply.

![customprop](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/customprop/masterlibsrc1.png)
![customprop](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/customprop/masterlibsrc2.png)

## Apply the MasterLibrarySource custom property values to apps

Now that the custom property for populating metrics to applications exists, the values need to be set on applications for when the Governed Metrics Service performs an update.

__Do not apply ManagedMasterItems custom property values to the Metrics Library application.__


To add a custom property value to an app:

1. Go back to the Apps section of the QMC and double click on an App reference in the list.  
![mlsource](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/reload/applist.png)
<br><br>

2. When the app screen appears, activate the Custom properties section by clicking on the term located on the right side of the screen.    
<br>
3. Click on the dialog box next to MasterLibrarySource and type or select the custom property value to apply to the app.    
![mlsource](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/customprop/masterlibsrc3.png)


<h3>Next up: Testing the Governed Metrics Service</h3>