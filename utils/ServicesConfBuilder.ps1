$installParent = Get-Location
$installedProjects = Get-ChildItem -path $installParent | Where-Object{($_.PSIsContainer)} | foreach-object{$_.Name}
$count = 0
function getServiceDispatcherPath
{
    $Entry = Get-ChildItem "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall" -Recurse |
    ForEach-Object {Get-ItemProperty $_.pspath} | Where-Object {$_.DisplayName -eq "Qlik Sense Service Dispatcher"}

    return $Entry.InstallLocation + "servicedispatcher\services.conf"
}

$serviceDispatcherPath = getServiceDispatcherPath


function getConf
{
    param([string]$dir, [string]$app)
    #$dir = $args[0]
    #$app = $args[1]
    
    if(Test-Path "$dir\$app\config\services.conf.cfg")
    {
        $config = [IO.File]::ReadAllText("$dir\$app\config\services.conf.cfg")
        return $config
    }
}

forEach($appName in $installedProjects)
{
    #Write-Host 'this app is called' $appName
    $appWithBracks = "\[$appName\]"
    #Write-Host $appWithBracks
    $configuredApps = Select-String -Path $serviceDispatcherPath -pattern $appWithBracks

    if(!$configuredApps)
    {
        $conf = getConf $installParent $appName
        Add-Content $serviceDispatcherPath "`n$conf"
        $count++
    }
    else
    {
        Write-Host $appName" configuration already exists"
    }

}

if($count -gt 0)
{
    Stop-Service -DisplayName "Qlik Sense Service Dispatcher"
    Start-Service -DisplayName "Qlik Sense Service Dispatcher"
}