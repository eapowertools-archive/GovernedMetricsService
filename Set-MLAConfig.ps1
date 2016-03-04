
<#
.SYNOPSIS
Sets configuration for Metrics Library Applicator ReST API
.DESCRIPTION
The metrics Library Applicator ReST API creates master library dimesnions and measures.
This configuration script sets the config.js file items required for the ReST API to function.

.EXAMPLE
Set-MLAConfig %metricsApplicatorPort% %senseEnginePort% %senseQrsPort% %senseServerHostName% %metricsAdminUserDirectory% %metricsAdminUserId% %metricsAppName% %masterItemsCustomPropName%
.EXAMPLE
Set-MLAConfig 8590 4747 4242 sense22.112adams.local sense22 metricsadmin 'Metrics Library' ManagedMasterItems

.PARAMETER metricsApplicatorPort
The port the ReST API runs on DEFAULT==8590
.PARAMETER senseEnginePort 
The port the Qlik Sense Engine runs on DEFAULT==4747
.PARAMETER senseQrsPort
The Qlik Sense Repository Service listen port DEFAULT==4242
.PARAMETER senseServerHostName
The hostname for the Qlik Sense server REQUIRED
.PARAMETER metricsAdminUserDirectory
The userDirectory (alias domain) for the account MLA runs as REQUIRED
.PARAMETER metricsAdminUserId
The userId for the account MLA runs as REQUIRED
.PARAMETER metricsAppName
The Qlik Sense app containing the metric definitions DEFAULT==Metrics Library
.PARAMETER masterItemsCustomPropName
The name of the custom property used to identify apps populated with Master Items DEFAULT==ManagedMasterItem
#>



[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)][int]$metricsApplicatorPort,
    [Parameter(Mandatory=$false)][int]$senseEnginePort,
    [Parameter(Mandatory=$false)][int]$senseQrsPort,
    [Parameter(Mandatory=$true)][string]$senseServerHostName,
    [Parameter(Mandatory=$true)][string]$metricsAdminUserDirectory,
    [Parameter(Mandatory=$true)][string]$metricsAdminUserId,
    [Parameter(Mandatory=$false)][string]$metricsAppName,
    [Parameter(Mandatory=$false)][string]$masterItemsCustomPropName
    )

    <# 
    for debugging purposes, hard coded parameters are below.
    
    $metricsApplicatorPort = 8590
    $senseEnginePort = 4747
    $senseQrsPort = 4242
    $senseServerHostName = "sense22.112adams.local"
    $metricsAdminUserDirectory = "sense22"
    $metricsAdminUserId = "administrator"
    $

    #>

    #create the javascript file