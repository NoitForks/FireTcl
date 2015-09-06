define(["./tcl_interpreter_loader", "./utils/oo"], function(tclLoader, ooUtils) {
    var path_to_tcl_library = FireTcl.path_to_tcl_library;
    
    var path_to_tcl_dll = FireTcl.package_json.tcl_dll[FireTcl.os_name];       
		
    if (!FireTcl.Path.isAbsolute(path_to_tcl_dll)) {
        path_to_tcl_dll = FireTcl.Path.join(FireTcl.base_path, path_to_tcl_dll);
    }

    var Tcl_interpreter = tclLoader.load(path_to_tcl_dll)
            
    window.addEventListener('beforeunload', tclLoader.unload);

    var path_to_firetcl_main = FireTcl.Path.join(path_to_tcl_library, "firetcl", "firetcl_main.tcl");
    Tcl_interpreter.evalFile(path_to_firetcl_main);
   
    var FINISHED_OK = 0; 
    var FINISHED_WITH_EXCEPTION = 1; 
    var JS_EVALUATION = 2;
    var MESSAGE_TO_BROWSER = 3;
    
    var JS_OK = 0;
    var JS_ERROR = 1;
        
    firetcl_with_js_ctypes = {
        "interactiveEval": function(tcl_script) {
            var tcl_result, js_result, coroutine_name;
            
            this.setVar("::FireTcl::Tcl_script", tcl_script)
            tcl_result =  JSON.parse(this.callTcl("::FireTcl::Eval_tcl_in_browser 1"));

            coroutine_name = tcl_result.coroutineName;

            while(true) {
                if (tcl_result.status == FINISHED_OK) {
                    return tcl_result.value;
                }
                
                if (tcl_result.status == FINISHED_WITH_EXCEPTION) {
                    FireTcl.errorInfo = tcl_result.exceptionOptions["-errorinfo"];
                    FireTcl.errorCode = tcl_result.exceptionOptions["-errorcode"];

                    throw new FireTcl.tclException(tcl_result.exceptionMessage, tcl_result.exceptionOptions);
                }
                   
                try {
                    if (tcl_result.status == MESSAGE_TO_BROWSER) {
                        js_result = processMessage(tcl_result.messageCode, tcl_result.messageContent);
                    } else {
                        js_result = (new Function(tcl_result.jsScript))()
                    }
                    
                    this.setVar("::FireTcl::JS_result", JSON.stringify(js_result))                   
                    tcl_result = JSON.parse(this.callTcl("::FireTcl::Eval_tcl_in_browser 0 " + coroutine_name + " " + JS_OK));
                } catch(exception) {
                    this.setVar("::FireTcl::JS_result", JSON.stringify(exception))
                    tcl_result = JSON.parse(this.callTcl("::FireTcl::Eval_tcl_in_browser 0 " + coroutine_name + " " + JS_ERROR));
                }
                
            }

        },

        "close": function (aForceQuit) {
            var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].
            getService(Components.interfaces.nsIAppStartup);

            // eAttemptQuit will try to close each XUL window, but the XUL window can cancel the quit
            // process if there is unsaved data. eForceQuit will quit no matter what.
            var quitSeverity = aForceQuit ? Components.interfaces.nsIAppStartup.eForceQuit :
                                  Components.interfaces.nsIAppStartup.eAttemptQuit;
            appStartup.quit(quitSeverity);
        },

        "create_worker": function (worker_name, package_of_worker, message_processor, on_ready_state) {

            var workerState = FireTcl.Workers.State;
            
            var worker = new ChromeWorker("js/firetcl/web_worker.js");
            var state = workerState.LOADING;
                    
            var number_of_locks = 1;
                    
            worker.state = function () {
                return state
            }
                    
            Object.defineProperty(worker, "name", {
                value: worker_name,
                writable: false
            });
                    
            Object.defineProperty(worker, "package_name", {
                value: package_of_worker,
                writable: false
            });
                                        
            worker.on_ready_state = on_ready_state;                    
            worker.message_processor = message_processor;
                    
            worker.callback = null;
            worker.errback = null;
                    
            worker.isReady = function () {
                return state === workerState.READY;
            }
            
            worker.send = function(tcl_script, callback, errback) {
                if (state !== workerState.READY) {
                    throw "The worker '"+ worker_name + "' is not ready. Its state is: "+ FireTcl.Workers.stateNames[state]
                }
                    
                this.state = workerState.BUSY;
                    
                this.callback = callback;
                this.errback = errback;

                this.postMessage(["Eval_Tcl", tcl_script]);
            }
                
            worker.preserve = function () {
                number_of_locks += 1
            }
            
            worker.release = function () {
                number_of_locks -= 1;
                if (number_of_locks == 0) {
                    this.terminate()
                }
            }
            
            worker.onmessage = (function(worker, workerState, tclList, tclException, path_to_tcl_dll, path_to_firetcl_main, path_to_tcl_library, package_of_worker, JS_OK, JS_ERROR) {
                var handlers_for_internal_communication = {
                    "Worker_Loaded": function() {
                        state = workerState.INITIALIZING;

                        worker.postMessage(["Initialize", {"path_to_firetcl_main":path_to_firetcl_main, "path_to_tcl_library":path_to_tcl_library, "path_to_tcl_dll":path_to_tcl_dll, "package_of_worker":package_of_worker}]);
                    },
                    "Worker_Initialized": function () {
                        state = workerState.READY;
                        if (typeof worker.on_ready_state !== "undefined") {
                            worker.on_ready_state()
                        }
                    },
                    "Tcl_Result": function (result) {
                        if (worker.callback) {
                            worker.callback(result)
                        }
                    
                        worker.callback = worker.errback = null;
                    
                        state = workerState.READY;
                        
                        if (typeof worker.on_ready_state !== "undefined") {
                            worker.on_ready_state()
                        }
            
                    },
                    "Tcl_Exception": function (exception_info) {
                        exception = new tclException(exception_info[0], exception_info[1]);
                        if (worker.errback) {
                            worker.errback(exception)
                        } else {
                            throw exception
                        }
                    
                        worker.callback = worker.errback = null;
                    
                        state = workerState.READY;
                        
                        if (typeof worker.on_ready_state !== "undefined") {
                            worker.on_ready_state()
                        }
                    },
                    "Eval_JS": function (js_script) {                            
                        setTimeout(function(){
                            var js_evaluated;
                                                   
                            try {
                                js_evaluated = (new Function(js_script))();
                                worker.postMessage(["JS_Result",[JS_OK, JSON.stringify(js_evaluated)]]);
                            } catch(exception) {
                                worker.postMessage(["JS_Result",[JS_ERROR, JSON.stringify(exception)]]);
                            } 
                        
                        }, 1);
                    },
                    "Process_Message": function (message_content) {
                        var messageCode = message_content[0];
                        var messageContent = message_content[1];
                        
                        if (worker.message_processor && worker.message_processor.hasOwnProperty(messageCode)) {
                            var messageHandler = worker.message_processor[messageCode];
                        } else if (messageManager.hasOwnProperty(messageCode)) {
                            var messageHandler = messageManager[messageCode]
                        } else {
                            var messageError = "Message '" + messageCode + "' has no associated callback";
                            worker.postMessage(["JS_Result", [JS_ERROR, messageError]]);
                        }
                    
                        setTimeout(function(){
                            var js_evaluated;
                        
                            try  {
                                js_evaluated = messageHandler(messageContent);
                                worker.postMessage(["JS_Result",[JS_OK, JSON.stringify(js_evaluated)]]);
                            } catch(exception) {
                                worker.postMessage(["JS_Result",[JS_ERROR, JSON.stringify(exception)]]);
                            }
                        }, 1);
                    }
            
                }
                
                return function (event) {
                    // event.data[0]: message_name
                    // event.data[1]: message_content
                    handlers_for_internal_communication[event.data[0]](event.data[1])
                }
            })(worker, workerState, FireTcl.tclList, FireTcl.tclException, path_to_tcl_dll, path_to_firetcl_main, path_to_tcl_library, package_of_worker, JS_OK, JS_ERROR);

            return worker
        }
    }
    
    ooUtils.addMixin(firetcl_with_js_ctypes, Tcl_interpreter)
    
    return firetcl_with_js_ctypes
});


