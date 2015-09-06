define( ["firetcl/firetcl", "tpl!console_example.tpl"], function(FireTcl, consoleTemplate) {
    // This is an example. Writte here your application.
    
    var numberOfLines = 0;
    
    var console_worker = null;
    
    function formattedTime () {
        var currentdate = new Date(); 
        return ((currentdate.getHours() < 10)?"0":"") + currentdate.getHours() +":"+ ((currentdate.getMinutes() < 10)?"0":"") + currentdate.getMinutes() +":"+ ((currentdate.getSeconds() < 10)?"0":"") + currentdate.getSeconds();
    }
    
            
    function newExecution () {
        numberOfLines = 0;
            
        document.querySelector('#firetcl_console .log').innerHTML =
                "<div class='date'>Executed at " + formattedTime() + "</div><div class='output'></div>";
    }
    
    function takeOverConsole(newConsole){
        var console = window.console
        if (!console) return
        function intercept(method){
            var original = console[method]
            console[method] = function(){
                newConsole[method](arguments[0]);
                if (original.apply){
                    // Do this for normal browsers
                    original.apply(console, arguments)
                }else{
                    // Do this for IE
                    var message = Array.prototype.slice.apply(arguments).join(' ')
                    original(message)
                }
            }
        }
        var methods = ['log', 'warn', 'error'];
        for (var i = 0; i < methods.length; i++) intercept(methods[i]);
    }

    function printOutput(msg, className) {
        var output = document.querySelector('#firetcl_console .log .output');
        
        if (!output) return;
            
        var output_line = document.createElement("PRE");
        output_line.className = 'output-line ' + className
            
        var text_node = document.createTextNode(msg);
        output_line.appendChild(text_node);
            
        output.appendChild(output_line)
            
        if (numberOfLines == this.maximumLines) {
            output.removeChild(output.childNodes[0]);  
        } else {
            numberOfLines += 1
        }
            
        output.scrollTop = output.scrollHeight;
    }
    
    var Console = {
        maximumLines: 300,
        
        build: function (element) {
            if (console_worker !== null) {
                throw "The FireTcl console was built"
            }
                       
            console_worker = FireTcl.Workers.createOne("console");

            element.innerHTML = consoleTemplate({vs: "Tcl " + FireTcl.tclVersion()})
            
            takeOverConsole(this)
        },
        
        destroy: function (){
            if (console_worker !== null) {
                console_worker.terminate()
            }
            
            document.querySelector('#firetcl_console').innerHTML = "";
        },
        
        el: function() {
            return document.querySelector('#firetcl_console');
        },
        
        log: function(msg) {
            printOutput(msg, "log_output");
        },
        
        warn: function(msg) {
            printOutput(msg, "warn_output");
        },
        
        error: function(msg) {
            printOutput(msg, "error_output");
        },
        
        clear: function () {
            document.querySelector('#firetcl_console .log').innerHTML = "";
            numberOfLines = 0;
        },
  
        showTclVersion: function () {
            var vs = FireTcl.tclVersion();
            alert("Tcl " + vs)
        },

        executeTclInMainThread: function () {
            newExecution();
            
            try {
                this.log(FireTcl.interactiveEval(this.getSource()));
            } catch (e) {
                this.showError(e);
            }

        },
        
        executeTclInWorker: function() {
            newExecution();
            console_worker.send(this.getSource(), this.log, this.showError);
        },
        
        executeJS: function () {
            newExecution();
            
            try {
                this.log(eval(this.getSource()));
            } catch (e) {
                this.showError(e);
            }
                
        },
        
        showError: function(objError) {
            if (objError instanceof FireTcl.tclException) {
                alert(JSON.stringify(objError, null, 4))
            } else {
                alert(objError)
            }
        },

        getSource: function () {
            var script = document.querySelector('#firetcl_console .editor').value
            return script
        }
    };
         
    Console.build(document.body);
    
    return Console
});
