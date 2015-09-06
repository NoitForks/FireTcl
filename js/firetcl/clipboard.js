/*
 *
 * Functions for accessing to this.
 *
 * Summary of Functions:
 *  clipboard.setText                Copy plain text to this.
 *  clipboard.getText                Get plain text from this.
 *  clipboard.getHtml                Get HTML source code from this.
 *                                       Must be sure clipboard contains HTML
 *  clipboard.containsHtml           Check if clipboard contains HTML source
 *                                       code.
 *  clipboard.containsFlavors        Check if clipboard contains specific
 *                                       formats (ie flavors).
 *  clipboard.createTransferable     Create a transferable object useful
 *                                       to copy multiple formats to this.
 *  clipboard.copyFromTransferable   Copy multiple format to this.
 *
 */

 /*
  Example usage:

    var html = "<span style='color:red'>hello color</span>";
    var text = "hello normal";
    
    var transferable = clipboard.addTextDataFlavor("text/html", html);
    transferable = clipboard.addTextDataFlavor("text/unicode", text, transferable);
    clipboard.copyFromTransferable(transferable);
    
    v = "";
    if (clipboard.containsHtml()) {
        v = clipboard.getHtml();
    } else {
        v = "No HTML code found in clipboard";
    }
    
    alert("html\n" + v + "\n\nText\n" + clipboard.getText());
    
    clipboard.setText("new text in cb");
 */


define(function() {

    const { classes: Cc, interfaces: Ci, utils: Cu } = Components;
    Cu.import("resource://gre/modules/Services.jsm");

    var _cbSvc = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
    var flavorSupportsCStringMap = {};


    return {
    
        emptyClipboard: function() {
            _cbSvc.emptyClipboard(_cbSvc.kGlobalClipboard);
        },

        getTextFlavor: function(textFlavor) {
            var transferable = this.createTransferable();
            if (_cbSvc && transferable) {
                transferable.addDataFlavor(textFlavor);

                _cbSvc.getData(transferable, _cbSvc.kGlobalClipboard);

                var str       = {};
                var strLength = {};
        
                transferable.getTransferData(textFlavor, str, strLength);
                if (str.value && str.value instanceof Ci.nsISupportsString) {
                    // Gecko returns the number of bytes, instead of number of chars...
                    return str.value.data.substr(0, strLength.value / 2);
                }
                if (str.value && str.value instanceof Ci.nsISupportsCString) {
                    return str.value.data;
                }
            }
            return null;
        },

        /**
        * Get HTML source code from this.
        * @returns {string}  The html text from the this.
        */
        getHtml: function() {
            if (this.containsFlavors(["text/html"])) {
                return this.getTextFlavor("text/html");
            }

            // No normal text/html, try native HTML on Windows.
            if (Services.appinfo.OS == "WINNT" && this.containsFlavors(["application/x-moz-nativehtml"])) {
                
                var data = this.getTextFlavor("application/x-moz-nativehtml");
                // The HTML clipboard format is documented at
                // http://msdn.microsoft.com/en-us/library/ms649015.aspx
                // It has a header (lines ending with any of CR, CRLF, LF).
                // The start of the content is determined by the "StartHTML" header.
                var metadata = { StartHTML: Number.POSITIVE_INFINITY };
                var lineMatcher = new RegExp("\r\n|\r|\n", "mg");
                do {
                    var startIndex = lineMatcher.lastIndex;
                    if (!lineMatcher.exec(data)) {
                        break;
                    }
                    var line = data.substring(startIndex, lineMatcher.lastIndex)
                           .replace(/[\r\n]+$/, "");
                    var [, key, value] = /([^:]+):(.*)/.exec(line);
                    if (/^(?:Start|End)(?:HTML|Fragment|Selection)$/.test(key)) {
                        value = parseInt(value, 10); // This is a decimal number
                    }
                    metadata[key] = value;
                } while (lineMatcher.lastIndex < metadata.StartHTML);
            
                if (("StartFragment" in metadata) && ("EndFragment" in metadata)) {
                    data = data.substring(metadata.StartFragment, metadata.EndFragment);
                } else if (("StartHTML" in metadata) && ("EndHTML" in metadata)) {
                    data = data.substring(metadata.StartHTML, metadata.EndHTML);
                }
                return data;
            }

            // This will fail - and throw an appropriate exception
            return this.getTextFlavor("text/html");
        },

        /**
        * Get plain text from this.
        * @returns {string}  The text from the this.
        */
        getText:function() {
            return this.getTextFlavor("text/unicode");
        },

        /**
        * Check if clipboard contains text in HTML format. Returns true if clipboard
        * contains HTML text, false otherwise.
        * @returns {boolean}
        */
        containsHtml: function() {
            var flavours = ["text/html"];
            if (Services.appinfo.OS == "WINNT") {
                // Try the Windows native HTML format (CF_HTML).
                flavours.push("application/x-moz-nativehtml");
            }
            return this.containsFlavors(flavours);
        },

        /**
        * Check if clipboard contains at least one of passed formats (ie flavor).
        * Returns true if clipboard contains one of passed flavor, false otherwise.
        *
        * @param {array} flavors  Mime-type strings (eg ["text/html", "text/unicode"])
        * @returns {boolean}
        */
        containsFlavors: function(flavors) {
            const kClipboardIID = Components.interfaces.nsIClipboard;

            if (kClipboardIID.number == "{8b5314ba-db01-11d2-96ce-0060b0fb9956}") {
                var flavorArray = Components.classes["@mozilla.org/supports-array;1"]
                    .createInstance(Components.interfaces.nsISupportsArray);
        
                    for (var i = 0; i < flavors.length; ++i) {
                        var kSuppString = Components.classes["@mozilla.org/supports-cstring;1"]
                                   .createInstance(Components.interfaces.nsISupportsCString);
                        kSuppString.data = flavors[i];
                        flavorArray.AppendElement(kSuppString);
                    }        
                    return _cbSvc.hasDataMatchingFlavors(flavorArray, _cbSvc.kGlobalClipboard);
            } else {
                return _cbSvc.hasDataMatchingFlavors(flavors, flavors.length, kClipboardIID.kGlobalClipboard);
            }
        },
        
        _getSupportsCString: function(flavor) {
            var supportCString = flavorSupportsCStringMap[flavor];
            
            if (typeof (supportCString) == "undefined") {
                supportCString = Components.classes["@mozilla.org/supports-cstring;1"]
                               .createInstance(Components.interfaces.nsISupportsCString);
                supportCString.data = flavor;
                flavorSupportsCStringMap[flavor] = supportCString;
            }
            
            return supportCString;
        },
        
        /**
         * Create a transferable object useful to copy multiple formats to clipboard
         * and return with it.
         *
         * @returns {Components.interfaces.nsITransferable}
         */
        createTransferable: function() {
            return Components.classes["@mozilla.org/widget/transferable;1"]
                            .createInstance(Components.interfaces.nsITransferable);
        },
        
        /**
         * Add a text flavor (eg html or plain text) to a transferable object, if
         * passed transferable is null or not defined a new one is created.
         * Returns the tranferable object.
         *
         * @param {string} flavor  The mime-type flavor (eg "text/html").
         * @param {string} text  The text to add.
         * @param transferable {Components.interfaces.nsITransferable}
         *        (Optional)  The tranferable to use, if null a new object is created.
         *
         * @returns {Components.interfaces.nsITransferable}
         */
        addTextDataFlavor: function(flavor, text, transferable) {
            if (!transferable) {
                transferable = this.createTransferable();
            }
            transferable.addDataFlavor(flavor);
            var string = Components.classes["@mozilla.org/supports-string;1"]
                            .createInstance(Components.interfaces.nsISupportsString);
            string.data = text;
            transferable.setTransferData(flavor, string, text.length * 2);
            
            return transferable;
        },
        
        /**
        * Copy to clipboard using a tranferable object, this allows to copy text in
        * multiple format for example the same text as HTML and plain text.
        *
        * @param transferable {Components.interfaces.nsITransferable}
        *        The tranferable object
        */
        copyFromTransferable: function(transferable) {
            if (!transferable) {
                return;
            }
            _cbSvc.setData(transferable, null, Components.interfaces.nsIClipboard.kGlobalClipboard);
        },
        
        /**
        * Set the clipboard to contain the plain text provided.
        *
        * @param {string} text  The text to copy to this.
        */
        setText: function(text) {
            var transferable = this.addTextDataFlavor("text/unicode", text);
            this.copyFromTransferable(transferable);
        }
    }

})
