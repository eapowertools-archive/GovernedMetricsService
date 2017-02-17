#Governed Metrics Service

##Latest Release == [2.0.3](https://github.com/eapowertools/GovernedMetricsService/releases/latest)

##Documentation
Please read the Governed Metrics Service **[documentation](http://eapowertools.github.io/GovernedMetricsService/)** before installing the Governed Metrics Service.

##Minimum Requirements:
The Governed Metrics Service uses the Qlik Sense Service Dispatcher and Nodejs to launch a REST api as a background service for updating metrics in Qlik Sense applications.  Therefore, the Governed Metrics Service requires Qlik Sense Server.

The Governed Metrics Service has been tested with Qlik Sense 3.1.x and 3.2.   

For now, the Governed Metrics Service requires a licensed Qlik Sense server site running version 2.2.4 or higher.

Please do not install for use with Qlik Sense desktop.  The Governed Metrics Service will not work.

Before installing the Governed Metrics Service, **we highly recommend** going through the Qlik Sense server QMC configuration instructions in the documentation.  Application, custom property, and task names will be requested during the install and it's easier on your memory if you have created them in advance.  [Direct Link to QMC configuration section in docs](http://eapowertools.github.io/GovernedMetricsService/user-guide/qsconfig/) 

##Install
To install the Governed Metrics Service, use the **[installer](https://s3.amazonaws.com/eapowertools/governedmetricsservice/bin/GovernedMetricsService.exe)**.

##Description
Qlik Sense enables self-service visualization with a balance of control and agility that gives IT confidence that the visualizations that users are empowered to create are correct.  One way this is enabled is through the use of ![masteritems.png](https://github.com/eapowertools/GovernedMetricsService/blob/master/img/masteritems.png) Master Items.  A Master Item is a dimension or measure that is defined by a central IT or BI team or line of business analyst and deployed to users in conjunction with a Qlik Sense application.
 
This capability enables users to create visualizations with trusted dimensions and measures without having to author or understand the underlying business logic.  This is an important requirement of modern self-service analytics platforms.
 
The Qlik Governed Metrics Service (GMS) Power Tool builds upon this capability by allowing metrics that are defined externally to Qlik Sense to be loaded and applied to one or more applications. The metrics that are loaded to each application are configurable and managed through the Qlik Management Console via custom properties.

<div style="overflow-x:auto;">
<table style="border: none;">
<tr>
<td style="border: none;">
<img src="https://github.com/eapowertools/GovernedMetricsService/blob/master/img/workflow.png">
</td>
<td style="border: none;">
<ul>
<li>Metrics defined in an external database or XLS.</li>
<li>Metrics extracted into a Metrics Library QVF application.</li>
<li>GMS Power Tool reads the Metrics Library QVF and applies metrics to one or more applications.</li>
</ul>
</td>
</table>
</div>

##Promotion
The Governed Metrics Service is part of the EA Team Governed Self-Service Reference Deployment.  To learn more about governed self-service and how to centrally manage master library dimensions and measures in your Qlik Sense site, visit the **[Governed Self-Service](https://community.qlik.com/community/qlik-sense/qlik-sense-governed-self-service)** space on **[Qlik Community](community.qlik.com)**.  

##License
**[MIT](https://github.com/eapowertools/GovernedMetricsService/blob/master/license)**

If you experience an issue, do not contact Qlik Support.  Please open an issue here: **[Issues](https://github.com/eapowertools/GovernedMetricsService/issues)**

For more information, please visit the [EAPowertools](https://community.qlik.com/community/qlik-sense/ea-powertools) space on Qlik Community.
