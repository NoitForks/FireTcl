define({
        "get_parameters_for_firefox": function() {
            var chromeWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIWebNavigation)
                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                   .rootTreeItem
                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIDOMWindow);
            
            var commandLineXPCOM = chromeWindow.arguments[0].QueryInterface(Components.interfaces.nsICommandLine);
            
            this.parameters = {
                "os": commandLineXPCOM.handleFlagWithParam('os', false),
                "base_path": commandLineXPCOM.handleFlagWithParam('base_path', false),
                "firebug_lite": commandLineXPCOM.handleFlag('firebug_lite', true)
            }
            
            return this.parameters
        },
        "parameters": null
});

