!include "MUI2.nsh"
!define APPNAME "EsnaadM"
!define DESCRIPTION "EsnaadM is a mobile application developed by jac.mil.ae"
!define COMPANYNAME "jac.mil.ae"
!define WEBSITE "http://jac.mil.ae"
!define VERSION "2.0.0"
!define INSTALLDIR "$PROGRAMFILES64\${APPNAME}"
!define OUTPUTDIR "export"
!define OUTPUTFILE "${OUTPUTDIR}\${APPNAME}_Installer.exe"
!define MUI_ICON "dist\icons\win\icon.ico"
!define MUI_UNICON "dist\icons\win\icon.ico"

Outfile ${OUTPUTFILE}
InstallDir ${INSTALLDIR}
RequestExecutionLevel admin
ShowInstDetails show

Caption "${APPNAME} Installer"
!define MUI_HEADER_TEXT "${APPNAME} ${VERSION} Installation"
!define MUI_FINISHPAGE_TITLE "${APPNAME} ${VERSION} Installation Complete"
!define MUI_FINISHPAGE_TEXT "${APPNAME} ${VERSION} has been installed successfully."

!define MUI_WELCOMEPAGE  ; Enable welcome page
!define MUI_WELCOMEPAGE_TITLE "Welcome to ${APPNAME} Installer"
!define MUI_WELCOMEPAGE_TEXT "This setup will install ${APPNAME} ${VERSION} on your computer. ${DESCRIPTION}. Click Next to continue."
!define MUI_UNINSTALLER "Uninstall ${APPNAME}"

!insertmacro MUI_PAGE_WELCOME   ; Insert the Welcome Page
!insertmacro MUI_PAGE_DIRECTORY  ; Directory selection page
!insertmacro MUI_PAGE_INSTFILES  ; Installation progress page
!insertmacro MUI_PAGE_FINISH     ; Finish page

!insertmacro MUI_LANGUAGE "English"  ; Set the language


Section "Install"
    SetOutPath $INSTDIR
    File /r "build\esnaadm-win32-x64\*.*"

    ; Create Start Menu Shortcut
    CreateShortcut "$SMPROGRAMS\${APPNAME}.lnk" "$INSTDIR\EsnaadM.exe"
    WriteUninstaller "$INSTDIR\Uninstall.exe"

    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayName" "${APPNAME} 2"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "InstallLocation" "$INSTDIR"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayIcon" "$INSTDIR\EsnaadM.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "Publisher" "Global Aerospace Logistic, LLC."
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayVersion" "${VERSION}"
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "NoModify" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "NoRepair" 1
SectionEnd

UninstallCaption  "${APPNAME} Uninstall"
Section "Uninstall"
    Delete "$INSTDIR\Uninstall.exe"
    Delete "$SMPROGRAMS\${APPNAME}.lnk"
    RMDir /r "$INSTDIR"
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"
SectionEnd