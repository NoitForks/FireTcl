var FireTcl = {};      

define(["./command_line", "./utils/ua-parser", "./window_manager", "./clipboard", "./utils/filepath", "./utils/json", "./utils/oo"], function(commandLine, UAParser, firetclWindow, firetclClipboard, pathUtils, jsonUtils, ooUtils) {
    var ua_parser = new UAParser();
    var browser_name = ua_parser.getBrowser()["name"]
    
    if (browser_name == "Mozilla") {
        var commandLine_parameters = commandLine.get_parameters_for_firefox()
    }
            
    var chromeWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIWebNavigation)
                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                   .rootTreeItem
                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIDOMWindow);
                   
    firetclWindow.setChromeWindow(chromeWindow);
        
    Object.defineProperty(FireTcl, "command_line", {
        value: commandLine_parameters,
        writable: false
    });
    
    var OS_name = commandLine_parameters.os;
    Object.defineProperty(FireTcl, "os_name", {
        value: OS_name,
        writable: false
    });
    
    pathUtils.setOS(OS_name);
    
    var base_path = commandLine_parameters.base_path;
    Object.defineProperty(FireTcl, "base_path", {
        value: base_path,
        writable: false
    });
    
    var URL_base_path = "file:///"+ base_path.replace("\\","/")
    Object.defineProperty(FireTcl, "URL_base_path", {
        value: URL_base_path,
        writable: false
    });
    
    var package_json = jsonUtils.load_json_from_file(FireTcl.URL_base_path + "/package.json")
    Object.defineProperty(FireTcl, "package_json", {
        value: package_json,
        writable: false
    });
        
    var path_to_tcl_library = pathUtils.join(base_path, "tcl_library")
    Object.defineProperty(FireTcl, "path_to_tcl_library", {
        value: path_to_tcl_library,
        writable: false
    });

    FireTcl.errorCode = "";
    FireTcl.errorInfo = "";
        
    FireTcl.tclException = function(message, options) {
        this.message = message;
        this.options = options
    };
        
    FireTcl.pathUrl = function (relative_path) {
        relative_path = relative_path.trim().replace("\\","/")
            
        if (relative_path.charAt(0) === "/") {
            return this.URL_base_path + relative_path
        } else {
            return this.URL_base_path + "/"+ relative_path
        }
    };
    
    var messageManager = {};
    
    FireTcl.registerCallback = function () {
        if (arguments.length == 1) {
            var messages_and_callbacks = arguments[0]
                
            if (typeof messages_and_callbacks !== "object") {
                throw "Invalid argument for FireTcl.registerCallback()"
            }
                
            for (var message_code in messages_and_callbacks) {
                if (messages_and_callbacks.hasOwnProperty(message_code)) {
                    var callback = messages_and_callbacks[message_code];
                
                    messageManager[message_code] = callback;
                }
            }
        } else if (arguments.length == 2) {
            var message_code = arguments[0];
            var callback = arguments[1];
                
            messageManager[message_code] = callback;
        } else {
            throw "Invalid argument for FireTcl.registerCallback()"
        }
    };
        
    FireTcl.unregisterCallback = function (message_code) {
        delete messageManager[message_code]
    };
    
    FireTcl.Workers = {
        "State":{
            "LOADING": 0,
            "INITIALIZING": 1,
            "READY": 2,
            "BUSY": 3
        },
        "stateNames": ["LOADING", "INITIALIZING", "READY", "BUSY"],
        
        "workers": {},
        "send": function(worker_name, tcl_script, callback, errback) {
            try {
                var worker = this.workers[worker_name]
            } catch (e) {
                throw "There is no worker named: " + worker_name
            }
            
            worker.interactiveEval(tcl_script, callback, errback)
        },
        "terminate": function (worker_name) {
            try {
                var worker = this.workers[worker_name]
            } catch (e) {
                throw "There is no worker named: " + worker_name
            }
            worker.terminate()
        },
        "createOne": function (worker_name, package_of_worker, message_processor, on_ready_state) {
            var worker = FireTcl.create_worker(worker_name, package_of_worker, message_processor, on_ready_state);
            
            this.workers[worker_name] = worker;
            
            return worker
        }
    }
    
    
    FireTcl.Window = firetclWindow;
    FireTcl.Clipboard = firetclClipboard;
    FireTcl.Path = pathUtils;
        
        
    var styleSheets = package_json.css;
        
    for (var i = 0; i < styleSheets.length; i++) {
        firetclWindow.loadStyleSheet(styleSheets[i]);
    }
    firetclWindow.setSettings(package_json.window)
        
    
    function inject_firebug () {

        var scriptTag = document.createElement('script');
        scriptTag.type = "text/javascript";
        scriptTag.src = 'http://getfirebug.com/firebug-lite.js#startOpened';
        document.getElementsByTagName('head')[0].appendChild(scriptTag);        
    }
    
    function application_main(applicationMain) {
        FireTcl.App = applicationMain;
            
        if (commandLine_parameters.firebug_lite) {
            inject_firebug();
        }
    }
    
    require(["firetcl/firetcl_with_js_ctypes"], function(firetclWithJsCtypes) {
        ooUtils.addMixin(FireTcl, firetclWithJsCtypes)
        
        require(["../main"],application_main)
    })
    
});
