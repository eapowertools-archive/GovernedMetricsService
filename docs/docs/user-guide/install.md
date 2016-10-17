#Governed Metrics Service Installation

To install the Governed Metrics Service, click on this link below.

###[Download Governed Metrics Service Powertool](https://github.com/eapowertools/QSGovernedMetrics)

##Installation Steps

  
![thumb](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/install/thumb.png)  
1. Double click the installation executable downloaded from github. **[Link](https://github.com/eapowertools/QSGovernedMetrics)**  
---
![1](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/install/2.png)  
2. The Governed Metrics Service install starts and presents the Welcome screen.  
---
![2](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/install/3.png)  
3. The installer sets the default install directory as **C:\Program Files\Qlik\Sense\EAPowertools**.  If Qlik Sense is installed in a different drive or location, browse and specify that location.  Please click Yes to continue with the installation. 
---
![4](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/install/4.png)  
4. The Statement of Support communicates how to obtain support for the Governed Metrics Service.  Click Next. 
---
![5](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/install/5.png)  
5. The configuration screen for the installer allows you to set the configuration for the Governed Metrics Service REST API.  This includes the following:  

  - **Governed Metrics Service Port:** The TCP port for the Governed Metrics Service REST API.  
  - **Qlik Sense Node hostname:** The name of the Qlik Sense server node the Governed Metrics Service will run.  This can be a central node or a rim node, but needs to be the hostname supplied during Qlik Sense installation.  
  - **Metrics Library Application Name:** The name of the application that stores the metrics definitions the Governed Metrics Service will read from to create Master Library entries.  Enter the name of the application created during the configuration steps. **(Default: Metrics Library)**    
  - **Metrics Library Custom Property Name:** The name of the custom property containing values that will be applied to applications in a Qlik Sense site that will receive metrics definitions from the Governed Metrics Service.  Enter the name of the custom property created during the configuration steps.  **(Default: ManagedMasterItems)**  
  - **Metrics Library Data Refresh Task Name:** The Metrics Library application (name provided above) needs a refresh task so that the Governed Metrics Service may reload the Metrics Library App when updates are made to the metrics.  Enter the name of the task created during the configuration steps.  **(Reload Metrics Library)**

***It is highly encouraged that the Metrics Library items (app, custom property, tag, and task) are defined in the QMC before completing this installation.***

---
![6](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/install/6.png)  
6. The second configuration screen handles the use of a common (friendly) hostname used to connect to Qlik Sense externally.  If a different hostname (e.g. a hostname associated with a trusted certificate) is going to be used to connect to Qlik Sense, check the check box and enter the hostname that will be used in the text box.  Click the Next button to provide references to the certificate to use this hostname.

---
![7b](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/install/7.png)  
7. If the check box on the previous screen is checked, a trusted certificate is necessary to make a secure connection to the integration with the common hostname entered.  This screen prompts for certificate file references.
The certificate file location box accepts PEM or PFX file certificates.  When a PEM file is selected, a subsequent box will appear requiring a key file.

If a pfx file is selected, a passphrase is required to open the certificate file and read the private key.
![7b](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/install/8.png)

Click the Next button to proceed with the installation.

---
![8](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/install/9.png)    
8. The installer is ready to place files on the system.  Click Install to begin the installation.
---
![9](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/install/10.png)    
9. Once the installer places files on the system, the installer adds the configuration information entered earlier into the tool.  Click the Next button to continue. 
---
![10](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/install/11.png)    
10. The Service Dispatcher message dialog explains how the Governed Metrics Service uses the Qlik Sense Service Dispatcher to run.  The Service Dispatcher services.conf file will be updated during this step.  Click Next to continue.
---
![11](https://s3.amazonaws.com/eapowertools/governedmetricsservice/img/install/12.png)    
11. Click the Finish button to complete the installation.
---

##Next Steps - Testing Governed Metrics Service. 


