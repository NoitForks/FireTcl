pref("toolkit.defaultChromeURI", "chrome://firetcl/content/firefox_extension/chrome/main.xul");
//pref("toolkit.defaultChromeFeatures", "dialog=no, chrome, centerscreen");
//pref("toolkit.singletonWindowType", display

// La siguiente opción interfiere con el comando "dump"
//pref("javascript.options.strict", false)

/* debugging prefs, disable these before you deploy your application! */
pref("browser.dom.window.dump.enabled", true);
pref("javascript.options.showInConsole", true);
//pref("javascript.options.strict", true);
pref("nglayout.debug.disable_xul_cache", true);
pref("nglayout.debug.disable_xul_fastload", true);
