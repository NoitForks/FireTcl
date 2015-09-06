# FireTcl
FireTcl is a new way to develop desktop applications using web technology and Tcl. 

It embeds a Tcl interpreter into firefox. 

The advantages of using web technology are:
- Many important companies has their product web-based. This translates to more pressure to add more features and new
standards to the web. Internet is evolving fast.
- Nowadays browsers are very well equipped, and make abstractions of technical details and differences between
operating systems. It guives you a lot of possibilites out of the box: rendering of different image formats, a canvas for
 2D and 3D drawing, bidireccional communications with the server, peer to peer communication with other browsers without any
  intermediary, video and audio players, an API to store persistent data,...
- Almost everyone with a personal computer has a browser installed. Browsers form part of everyday life of people for
communicating, entertainment, research, business,...
- There is a lot of web experts around the world and it's easier to hire.
- A big community. This means a lot of libraries for code reuse, tutorials and resolved questions on internet.

FireTcl guives you the possibility to eval Tcl code in the main thread or in a worker using a separate thread. The Tcl code
evaluated can execute also javascript and interact with the DOM.

### Version 
2.0.4

### Requirements
Tcl 8.6 and Firefox

### Installation
The file "package.json" is a JSON file describing several properties for initializing the application. 
It's a readable file and easy to understand.

For installing FireTcl, it's only necessary to write the path to the dynamic link library of the Tcl interpreter 
on the file "package.json". 

One of the properties in "package.json" is named "tcl_dll". The value of this property should be a dictionary containing for each operating
system you want to support, the path to the corresponding dynamic Tcl library. The possible operating system names are the
same than the values returned by the variable "$::tcl_platform(os)". For example:
    Linux
    Windows NT
    
Add all the packages used in you application inside the directory "tcl_library", and provide all the necessary "package ifneeded" commands
on tcl_library/pkgIndex.tcl because this directory will be automatically added to the variable "auto_path" and for code organization.

### Tutorial
Once the path to the dynamic library of the Tcl interpreter has been setup in the file "package.json", you can run a simple application 
executing "firetcl.tcl".

A simple editor with these buttons will appear on the screen:

- a button to eval code as Tcl in the main thread  
- a button to eval code as Tcl in a worker
- a button to eval code as Javascript
    
    It's possible to experiment with the framework using the global object FireTcl and the API described below.
        
- a button to checking resposiveness of the application
    
    Here you can see that cpu intensive task evaluated in the main thread can freeze the GUI.
    
- a button to clearing the console
        
The framework makes use of require.js for modularization. It also exposes a global object named FireTcl.
The main entry of the application should be in app.js.

Right now, there is a demo showing the above-mentioned editor.

The module returned by the definition on app.js, i.e. the object returned inside the callback of the "define" function, is 
automatically added to FireTcl.App.

A namespace named **FireTcl** is automatically loaded in the Tcl interpreter with these public procedures:

- ::FireTcl::eval_javascript *script*
    
    "script" is a javascript code to eval
    
    Example:
    
        ::FireTcl::eval_javascript {alert("hello world!")}
    
- ::FireTcl::get_JS_variable *variable_name*
    
    "variable_name" is the name of the variable to get the value
    
    Example:
    
        ::FireTcl::get_JS_variable document.title
    
- ::FireTcl::call_JS_function *function_name* *spec1* *data1* *spec2* *data2* ...
    
    Call the function named "function_name" with the arguments "data1" converted to a javascript value according to the specication "spec1",
    "data2" converted to a javascript value according to "spec2",...
    
- ::FireTcl::log_to_browser *msg*

    "msg" is a text message to log on the browser console
    
- ::FireTcl::dump *msg*

    "msg" is a text message to log on the terminal
    
- ::FireTcl::compile_to_json *spec* *data*

These procedures can be imported to other namespaces.

These are the exposed methods of the FireTcl object on the browser:

- FireTcl
    - path_to_tcl_library
        Path to Tcl library containing all the Tcl script of the application
        
    - base_path
        Base path of the application
        
    - package_json
        Object containing all the data loaded from the "package.json" file
        
    - interactiveEval(code)

        Eval Tcl code that can interact with the browser
    
    - callTcl(code)
    
        Eval Tcl code without interaction with the browser. It's a little bit faster.
        
    - tclVersion()
    
        Get the Tcl version
    
    - tclList(string1, string2, string3,...)
    
        Convert a list of strings in a well-formed Tcl list.
    
    - evalFile(path_to_file)
    
        Eval a file containing Tcl code.
    
    - getVar(varname)
    
        Get the value of a Tcl variable.
    
    - setVar(varname, value)
    
        Set the value of a Tcl variable.
    
    - registerCallback(message_name, callback)
    
        Associate to a message_name a callback
    
    - unregisterCallback(message_name)
    
    - Workers
    
        This is an object exposing several methods for creating and managing workers.
        These are the methods exposed in this object:
                
        * createOne(worker_name, package_of_worker, message_processor, on_ready_state)
            
            Create a worker with name "worker_name". 
            If "package_of_worker" is provided, load that package.
                
            If "message_processor" is provided, the worker process all messages using first this callback.
                
            When the worker is ready, it calls "on_ready_state" if this procedure is provided.
                
            Returns a worker object.
                
        * terminate(worker_name)
            
            Terminate abruptaly the indicated worker
            
        * send(worker_name, tcl_script, callback, errback)
                
            Send a tcl script for evaluation to a worker.
            When tcl script has been evaluated without error, call "callback".
            Otherwise, if an error happened, call "errback".
                
        * workers:
            
            Diccionary containing the list of available workers by name.
                
        A worker has these public methods and properties:
            
        * preserve()
                
            Attach one more lock to the worker.
            Only when the worker has no lock, the worker is freed.
            
        * release()
                
            Dettach a lock from the worker.
            Only when the worker has no lock, the worker is freed.
            
        * send(tcl_script, callback, errback)
                
            Evaluate tcl_script in worker. If execution finished succesfully call callback, otherwise call errback.
                
        * terminate()
            
        * isReady()
            
        and properties:
            
        * on_ready_state
            
        * message_processor
                
    - Clipboard
        *  setText(string)
        
            Set plain text to clipboard.
        
        *  getText()                
        
            Get plain text from clipboard.
        
        *  getHtml()
        
            Get HTML source code from clipboard. Must be sure clipboard contains HTML
        
        *  containsHtml()
        
            Check if clipboard contains HTML source
    - Window
        * moveTo(x,y)
            
            Move window to position (x,y) of the screen
        
        * setWidth(width_in_pixels)
            
            Set window width
        
        * setHeight(height_in_pixels)
            
            Set window height
        
        * maximize()
            
            Maximize window
        
        * minimize()
            
            Minimize window
        
        * sizeToContent()
            
            Size window to content
        
        * Scrolling
            - scrollbyPages()
            
                The same than window.scrollByPages()
            
            - scrollTo()
            
                The same than window.scrollTo()
            
            - scrollBy()
            
                The same than window.scrollBy()
            
            - scroll()
            
                The same than window.scroll()
        * title
         
            With one argument set the window title. Without arguments, get the window title.
        
        * getSelection
        
            Get the selected string.
        
        * textZoom
        
            - size
            - increase
            - decrease
            - set
            - change
            
        * fullZoom
        
            - size
            - increase
            - decrease
            - set
            - change
            
        * fullScreen
        
            - isInFullScreen
            - leave
            - toggle
            - enter

    - Path
        This module contains utilities for handling and transforming file paths. 
        All these methods perform only string transformations. 
        The file system is not consulted to check whether paths are valid. 
    
        * normalize(path):
            
            Normalize a string path, taking care of '..' and '.' parts. 
        
        * isAbsolute(path):
        
            Determines whether path is an absolute path. 
            An absolute path will always resolve to the same location, regardless of the working directory
            
        * join([path1][, path2][, ...]):

            Join all arguments together and normalize the resulting path.
            
        * resolve([from ...], to):
            
            Resolves to to an absolute path. 
            
        * relative(from, to):
            
            Solve the relative path from "from" to "to".
            
        * dirname(path):
            
            Return the directory name of a path. Similar to the Unix dirname command. 
        
        * basename(path):
            
            Return the last portion of a path. Similar to the Unix basename command.
        
        * extname(path):
        
            Return the extension of the path, from the last '.' to end of string in the last portion of the path. 
            If there is no '.' in the last portion of the path or the first character of it is '.', then it returns an empty string. Examples: 
            
        * sep:
            
            The platform-specific file separator. '\\' or '/'. 
            
        * delimiter
        
            The platform-specific path delimiter, ; or ':'. 
        
### Important notes
Evaluate intensive processing tasks in a worker to avoid freezing the GUI.

Be very cautious evaluating external web content because all the application has chrome privileges.
Chrome privilegies allows code to do everything (unlike web content, which is restricted).

Among other things in chrome there is no same origin policy, and you can call untrusted procedures (for example, for manipulating
operating system files) that are not avalaible on a normal website.

See:
    https://developer.mozilla.org/en-US/docs/Security/Firefox_Security_Basics_For_Developers

### Changing the application icon
Go to ./firefox_extension/chrome/icons/default

Copy in that directory the icons. The name of the icons should be:

    default.png
    default48.png
    default64.png
    

### Binaries for FireTcl
./binaries is my proposal for including your required binaries (for example tcllib.dll). 
But it's not necessary. You can use another and delete that directory if you want.

### Micro templates library for javascript development: tpl.js
FireTcl uses this library. It's an implementation of Underscore.js micro-templates for require.js.

You can use this library in your javascript code.

### Debugging
You can use the javascript function dump() to print on the operating system console.

Also change the variable "USER_FIREBUG_LITE" to true on the file "firetcl.tcl" to inject "firebug-lite".

### Technical overview
For embeding Tcl into firefox, the code uses the XPCOM component js-ctypes. Behind the scenes js-ctypes uses the library
libffi. Libffi is a popular and very portable library and is used in several modules of important programming languages.
 For example, in Python libffi is used in its standard library "ctypes" and in Ruby is used in its standard library "fiddle".
    
One of the uses of libffi is for interopebility between different programming languages: You can call a function of an
interpreted language from another programming language.

See:
    http://www.atmark-techno.com/~yashi/libffi.html
    https://developer.mozilla.org/en-US/docs/Mozilla/js-ctypes
    
The trick for allowing evaluation of javascript inside Tcl code has been to use coroutines.

### Contact me
If you want to contribute, report a bug, improve the code, or writte tutorials, please contact me.

Execute the next line to see my email:
    puts [binary decode hex 61706c69636163696f6e616d656469646140676d61696c2e636f6d]

