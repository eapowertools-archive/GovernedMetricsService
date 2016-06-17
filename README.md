#Governed Metrics Service

Please read the Governed Metrics Service **[documentation](http://eapowertools.github.io/QSGovernedMetrics)** before installing the Governed Metrics Service.

To install the Governed Metrics Service, use the **[installer](https://github.com/eapowertools/QSGovernedMetrics/releases/download/RC5/GovernedMetricsService.exe)**.

Qlik Sense enables self-service visualization with a balance of control and agility that gives IT confidence that the visualizations that users are empowered to create are correct.  One way this is enabled is through the use of ![masteritems.png](https://github.com/eapowertools/QSGovernedMetrics/blob/master/img/masteritems.png) Master Items.  A Master Item is a dimension or measure that is defined by a central IT or BI team or line of business analyst and deployed to users in conjunction with a Qlik Sense application.
 
This capability enables users to create visualizations with trusted dimensions and measures without having to author or understand the underlying business logic.  This is an important requirement of modern self-service analytics platforms.
 
The Qlik Governed Metrics Service (GMS) Power Tool builds upon this capability by allowing metrics that are defined externally to Qlik Sense to be loaded and applied to one or more applications. The metrics that are loaded to each application are configurable and managed through the Qlik Management Console via custom properties.

<div style="overflow-x:auto;">
<table style="border: none;">
<tr>
<td style="border: none;">
<img src="https://github.com/eapowertools/QSGovernedMetrics/blob/master/img/workflow.png">
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
GMS Power Tool is a node.js based module that plugs into the existing Qlik Service Dispatcher framework.
