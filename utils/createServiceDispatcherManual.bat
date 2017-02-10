@ECHO OFF

sc query "QlikEAPowerToolsServiceDispatcher"

IF %ERRORLEVEL% EQU 0 (GOTO END) ELSE (GOTO ADDSERVICE)

:ADDSERVICE
echo Enter the path and executable for the powertools service:
set /P theBinPath=

echo Enter the account the service will run as in domain\userid format:
set /P theUserId= 

echo Enter the password for the account that will run services: 
set /P thePassword= 

sc create QlikEAPowerToolsServiceDispatcher binPath= "%theBinPath%" DisplayName= "Qlik EAPowerTools Service Dispatcher" start= auto obj= %theUserId% password= %thePassword%
sc description "QlikEAPowerToolsServiceDispatcher" "Service Dispatcher for running EA Powertools" 


:END


