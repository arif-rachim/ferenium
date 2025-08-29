!define APPNAME "EsnaadM"
!define DESCRIPTION "EsnaadM is a versatile mobile application developed by jac.mil.ae"
!define COMPANYNAME "www.gal.ae"
!define WEBSITE "https://www.gal.ae"
!define VERSION "2.0.0"
!define INSTALLDIR "$PROGRAMFILES64\${APPNAME}"
!define OUTPUTDIR "export"
!define OUTPUTFILE "${OUTPUTDIR}\${APPNAME}_Installer.exe"

Outfile ${OUTPUTFILE}
InstallDir ${INSTALLDIR}
RequestExecutionLevel admin
ShowInstDetails show

Section "Install"
    SetOutPath $INSTDIR
    File /r "build\esnaadm-win32-x64\*.*"

    ; Create Start Menu Shortcut
    CreateShortcut "$SMPROGRAMS\${APPNAME}.lnk" "$INSTDIR\EsnaadM.exe"
    WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
    Delete "$INSTDIR\Uninstall.exe"
    Delete "$SMPROGRAMS\${APPNAME}.lnk"
    RMDir /r "$INSTDIR"
SectionEnd