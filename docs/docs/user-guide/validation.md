<h1>GMS Example Walkthrough</h1>

The Governed Metrics Service installs with a sample data source that can be used with the Metrics Library application and one of the GSS example applications (Executive Dashboard.qvf). To use the sample data source and application, do the following steps:

1. Locate the Executive Dashboard.qvf and GMS.xlsx files that were installed with the Governed Metrics Service. Both are located in the "C:\Program Files\Qlik\Sense\EAPowerTools\GovernedMetricsService\demo" directories by default.
2. In the QMC, import the Executive Dashboard.qvf to the QMC and assign the Custom Property attribute "__Sales__" for the __ManagedMasterItems__ property.
3. Ensure a task has been created for the Governed Metrics Application [here](/user-guide/qmc.md#task) if you have not done so.
9. Run the task and ensure the GMA application has reloaded.
10. Open the Executive Dashboard application in the Hub and verify the KPI Dashboard sheet is all "Incomplete Visualations". This is basically a sheet of objects tied into governed metrics that have to be pushed out from the Governed Metrics Service.
![Add Data](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/test/GMS_IncompleteViz.png)
11. In a new tab, navigate to the GMS test page: https://localhost:8590/masterlib/testpage
12. Test the connection. If successful hit the "Reload Metrics Library and Update Apps" button.
![Add Data](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/test/GMS_ReloadandUpdate.png)
13. It may take a few seconds to run, but after confirmation navigate back over to the Executive Dashboard > KPI Dashboard sheet. Refresh the page and you should see all objects now rendered utilizing governed metrics that were updated into the master items list by the GMS.
![Add Data](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/test/GMS_FinalResult.png)

***Please note that it may take up to 15 seconds for new items to show up in an app.
