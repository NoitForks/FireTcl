define(function () {
    var tclDLL = null;
    
    return {       
        unload: function() {
            if (tclDLL !== null) {
                tclDLL.close();            
                tclDLL = null;
            } else {
                throw "It's not possible to unload, because the interpreter it wasn't loaded first"
            }
        },
        
        load: function(path_to_tcl_dll) {
                           
            if (tclDLL !== null) {
                throw "The interpreter has been loaded"
            }
            
            if (typeof ctypes === "undefined") {
                Components.utils.import("resource://gre/modules/ctypes.jsm");
            }
            
            tclDLL = ctypes.open(path_to_tcl_dll);
        
            var interp_ptr = ctypes.StructType("interp").ptr;
            var Tcl_ObjPtr = ctypes.StructType("Tcl_Obj").ptr;
    
            var interp_ptr = ctypes.StructType("interp").ptr;
            var Tcl_ObjPtr = ctypes.StructType("Tcl_Obj").ptr;

            var TCL_OK = 0;
            var TCL_ERROR = 1;

            var Tcl_CreateInterp = tclDLL.declare("Tcl_CreateInterp", ctypes.default_abi, interp_ptr);
            var Tcl_Init = tclDLL.declare("Tcl_Init", ctypes.default_abi, ctypes.int, interp_ptr);
        
            var Tcl_GetStringResult = tclDLL.declare("Tcl_GetStringResult", ctypes.default_abi,  ctypes.char.ptr, interp_ptr);

            var Tcl_Eval = tclDLL.declare("Tcl_Eval", ctypes.default_abi, ctypes.int, interp_ptr, ctypes.char.ptr);        
            var Tcl_EvalFile = tclDLL.declare("Tcl_EvalFile", ctypes.default_abi, ctypes.int, interp_ptr, ctypes.char.ptr);
        
            var Tcl_Merge = tclDLL.declare("Tcl_Merge", ctypes.default_abi, ctypes.char.ptr, ctypes.int, ctypes.char.ptr.array());
        
            var Tcl_GetObjResult = tclDLL.declare("Tcl_GetObjResult", ctypes.default_abi, Tcl_ObjPtr, interp_ptr);
            var Tcl_GetIntFromObj = tclDLL.declare("Tcl_GetIntFromObj", ctypes.default_abi, ctypes.int, interp_ptr, Tcl_ObjPtr, ctypes.int.ptr);
        
            var Tcl_SetVar = tclDLL.declare("Tcl_SetVar", ctypes.default_abi, ctypes.char.ptr, interp_ptr, ctypes.char.ptr, ctypes.char.ptr, ctypes.int);
            var Tcl_GetVar = tclDLL.declare("Tcl_GetVar", ctypes.default_abi, ctypes.char.ptr, interp_ptr, ctypes.char.ptr, ctypes.int);
               
            var interp = Tcl_CreateInterp();

            if (TCL_OK != Tcl_Init (interp)) {
                throw "Tcl_Init error: " + Tcl_GetStringResult(interp).readString() + "\n";
            }
        
            var tcl_version = Tcl_GetVar(interp, "::tcl_version", 0).readString();
    
            return {
                tclVersion: function () { 
                    return tcl_version
                },
            
                callTcl: function(tcl_script) {
	
                    Tcl_Eval(interp, tcl_script);
                    var result = Tcl_GetStringResult(interp).readString();
	
                    return result
                },
            
                tclList: function() {
                    var list_of_Cstrings = []
                    for (i=0; i<=arguments.length; i++) {
                        list_of_Cstrings.push(ctypes.char.array()(arguments[i]+ ""))
                    }
            
                    var CArray_of_Strings = ctypes.char.ptr.array()(list_of_Cstrings);
                    var cStringResult = Tcl_Merge(arguments.length, CArray_of_Strings)
            
                    return cStringResult.readString()
                },
            
                evalFile: function (path_to_file) {
                    if ( Tcl_EvalFile (interp, path_to_file) != TCL_OK) {
                        throw "The file '"+path_to_file+"' can not be evaluated"
                    }
                },
        
                getVar: function (varName) {
                    var cValue = Tcl_GetVar(interp, varName, 0)
                    if (cValue === null) {
                        throw "Varname '"+varname+"' doesn't exists"
                    } else {
                        return cValue.readString();
                    }
                },
        
                setVar: function (varName, newValue) {
                    return Tcl_SetVar(interp, varName, newValue+"",0).readString();
                }
           
        
            } /* object returned by the load method */
        } /* load method */
    } /* callback of define() */
    
});
