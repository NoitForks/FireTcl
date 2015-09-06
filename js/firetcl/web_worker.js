importScripts('../require.js');

require({
        baseUrl: "./"
    },
    ["./tcl_interpreter_loader"],
    function(tclLoader) {
        
        // Status of javascript evaluation
        var JS_OK = 0;
        var JS_ERROR = 1;
        
        // Status of Tcl evaluation
        var FINISHED_OK = 0; 
        var FINISHED_WITH_EXCEPTION = 1; 
        var JS_EVALUATION = 2;
        var MESSAGE_TO_BROWSER = 3;
        
        var Tcl_interpreter;
        
        var coroutine_name;
        
        function processResult (stringfied_result) {
            var result = JSON.parse(stringfied_result)        
            if (result.status == FINISHED_OK) {
                postMessage(["Tcl_Result", result.value]);
            } else if (result.status == FINISHED_WITH_EXCEPTION) {
                postMessage(["Tcl_Exception", [result.exceptionMessage, result.exceptionOptions]]);
            } else {
                if (result.coroutineName) {
                    coroutine_name = result.coroutineName;
                }
                
                if (result.status == MESSAGE_TO_BROWSER) {
                    postMessage(["Process_Message", [result.messageCode, result.messageContent]]);                        
                } else {
                   
                    postMessage(["Eval_JS", [result.jsScript]]);                    
                }
            }
        }
        
        onmessage = function(event) {
            var message_name = event.data[0];
            var message_content = event.data[1];
            
            if (message_name == "Initialize") {                
                Tcl_interpreter = tclLoader.load(message_content["path_to_tcl_dll"]);

                Tcl_interpreter.evalFile(message_content["path_to_firetcl_main"]);

                Tcl_interpreter.callTcl("::FireTcl::Init; lappend auto_path {" + message_content["path_to_tcl_library"] +" }");

                if (message_content["package_of_worker"]) {
                    Tcl_interpreter.callTcl("package require " + message_content["package_of_worker"]);
                }
                
                postMessage(["Worker_Initialized"]);
            } else if (message_name == "Eval_Tcl") {
                var tcl_script = message_content;
                
                Tcl_interpreter.setVar("::FireTcl::Tcl_script", tcl_script)
                var stringfied_result = Tcl_interpreter.callTcl("::FireTcl::Eval_tcl_in_browser 1 ");
                processResult(stringfied_result);

            } else if (message_name == "JS_Result") {
                var status_of_evaluation = message_content[0];
                // result of javascript evalution or message error
                var result = message_content[1];
                
                Tcl_interpreter.setVar("::FireTcl::JS_result", result)

                stringfied_result = Tcl_interpreter.callTcl("::FireTcl::Eval_tcl_in_browser 0 " + coroutine_name + " " + status_of_evaluation);

                processResult(stringfied_result);
            }
        }
        
        function update_Tcl () {
            Tcl_interpreter.callTcl("update");
            setTimeout(update_Tcl, 0);
        }
        
        setTimeout(update_Tcl, 0);

        postMessage(["Worker_Loaded"]);
        
    }
    
);


