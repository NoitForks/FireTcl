define(function () {
    var webNavigation = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebNavigation);
    var docShell = webNavigation.QueryInterface(Components.interfaces.nsIDocShell);
    var contentViewer = docShell.contentViewer
    
    
    function zoomElements(node, scaleFactor, textonly) {
        var childNodes = node.childNodes;

        // recursive calls

        var childNode;
        for (var i = 0; i < childNodes.length; i++) {
            childNode = childNodes[i];
      
            if (childNode.nodeType == 1) {
                zoomElements(childNode, scaleFactor, textonly);
            }
        }

        // for frames
        if (node.contentDocument) {
            zoomElements(node.contentDocument, scaleFactor, textonly);
        }

        // processing the elements

        // zooms on texts
    
        // changes the font size
        try {
            var fontSize = node.ownerDocument.defaultView.getComputedStyle(node, "").getPropertyValue("font-size");
            if (node.origFontSize) {
                fontSize = node.origFontSize;
            } else {
                node.origFontSize = fontSize;
            }
            fontSize = fontSize.substr(0, fontSize.length - 2);
            node.style.fontSize = (fontSize * scaleFactor) + "px";
        } catch (e) {}

        // changes the line height
        try {
            var lineHeight = node.ownerDocument.defaultView.getComputedStyle(node, "").getPropertyValue("line-height");
            if (lineHeight != "normal") {
                if (node.origLineHeight) {
                    lineHeight = node.origLineHeight;
                } else {
                    node.origLineHeight = lineHeight;
                }
                lineHeight = lineHeight.substr(0, lineHeight.length - 2);
                node.style.lineHeight = (lineHeight * scaleFactor) + "px";
            }
        } catch (e) {}
  

        // returns if textonly is set to true
        if (textonly) { return; }
  
        // zooms on images
        try {
            if (node.localName == "IMG") {
                var width = node.ownerDocument.defaultView.getComputedStyle(node, "").getPropertyValue("width");
                width = width.substr(0, width.length - 2);
                var height = node.ownerDocument.defaultView.getComputedStyle(node, "").getPropertyValue("height");
                height = height.substr(0, height.length - 2);

                if ( (width != 'au') && (height != 'au') ) {
                    if (node.origWidth && node.origHeight) {
                        width = node.origWidth;
                        height = node.origHeight;
                    } else {
                        node.origWidth = width;
                        node.origHeight = height;
                    }
                    node.setAttribute("width", width * scaleFactor);
                    node.setAttribute("height", height * scaleFactor);
                }
            }
        } catch (e) {}

    }

    function is_number (num) {
        return Number(num)===num 
    }
        
    function is_natural_number (num) {
        if (is_number(num) && num%1===0 && num >=0) {
            return true
        } else {
            return false
        }
    }
        
    var chromeWindow = null;

                
    return {
            setChromeWindow: function (chromeWindow_parameter) {
                if(chromeWindow !== null) {
                    throw "The chrome window was set before"
                } else {
                    chromeWindow = chromeWindow_parameter

                }
            },
            setSettings: function (settings) {
                if (settings.size_mode === "maximized") {
                    this.maximize();
                } else if (settings.size_mode === "minimized") {
                    this.minimize();
                } else if (settings.size_mode === "content") {
                    this.sizeToContent()
                } else {
                    if (typeof settings.width !== "undefined" && typeof settings.height !== "undefined") {
                        window.resizeTo(settings.width, settings.height);
                    }
                }
                
                if (typeof settings.title !== "undefined") {
                    this.title(settings.title)
                }
                
                if (typeof settings.full_zoom !== "undefined") {
                    this.fullZoom.set(settings.full_zoom)
                }
                
                if (typeof settings.text_zoom !== "undefined") {
                    this.textZoom.set(settings.text_zoom)
                }
                
            },
            
            loadStyleSheet: function (filename) {
                var fileref = document.createElement("link")
                fileref.setAttribute("rel", "stylesheet")
                fileref.setAttribute("type", "text/css")
                fileref.setAttribute("href", filename)
        
                document.getElementsByTagName("head")[0].appendChild(fileref)
            },
            
            moveTo: function (x,y) {
                window.moveTo(x,y)
            },
                        
            setWidth: function (width) {
                height = window.outerHeight;
                window.resizeTo(width, height);
            },
            
            setHeight: function (height) {
                width = window.outerWidth;
                window.resizeTo(width, height);
            },
            
            maximize: function () {
                window.maximize()
            },
            
            minimize: function () {
                window.minimize()
            },
            
            sizeToContent: function () {
                window.sizeToContent()
            },
            
            Scrolling: {
            
                scrollbyPages: function (pages) {
                    window.scrollByPages(pages)
                },
                scrollTo: function (x,y) {
                    window.scrollTo(x,y)
                },
                scrollBy: function (x,y) {
                    window.scrollBy(x,y)
                },
                scroll: function (x,y) {
                    window.scroll(x,y)
                }
                
            },
            
            title: function () {
                
                if (arguments.length == 1) {
                    var title = arguments[0];
                    
                    if (chromeWindow) {
                        chromeWindow.document.title = title;
                    } else {
                        window.document.title = title;
                    }
                } else {
                    if (chromeWindow) {
                        return chromeWindow.document.title;
                    } else {
                        return window.document.title;
                    }
                }
                
            },
            
            mainWindow: function () {
                return mainWindow
            },

            
            /*
            maximize: function () {
                window.resizeTo(screen.availWidth, screen.availHeight);
                window.moveTo(0,0)
            },*/

            getSelection : function () {
                return window.getSelection().toString()
            },
            
            textZoom: {
                size: 1,
                
                increase: function () {
                    this.change(0.1)
                },
            
                decrease: function () {
                    this.change(-0.1)
                },
                
                set: function (size) {
                    if (!is_number(size)) return;
                    
                    this.size = size;
                    
                    if (typeof contentViewer.textZoom !== "undefined") {
                        contentViewer.textZoom = size;
                        
                    }  else {
                        zoomElements(document.body, size, true);
                    }
                },
            
                change: function (incrSize) {
                    if (!is_number(incrSize)) return;
                    
                    this.size += incrSize;               
                    
                    if (typeof contentViewer.textZoom !== "undefined") {
                        contentViewer.textZoom += incrSize;
                    }  else {
                        zoomElements(document.body, this.size);
                    }
                }
                
            },
            
            fullZoom: {
                size: 1,
                increase: function () {
                    this.change(0.1)
                },
            
                decrease: function () {
                    this.change(-0.1)
                },
                
                set: function (size) {
                    if (!is_number(size)) return;
                    
                    this.size = size;
                    
                    if (typeof contentViewer.fullZoom !== "undefined") {
                        contentViewer.fullZoom = size
                    } else {
                        zoomElements(document.body, size);
                    }
                },
            
                change: function (incrSize) {
                    if (!is_number(incrSize)) return;
                    
                    this.size += incrSize;
                    
                    if (typeof contentViewer.fullZoom !== "undefined") {
                        contentViewer.fullZoom += incrSize
                    }  else {
                        zoomElements(document.body, this.size);
                    }
                }
            },
            
            fullScreen: {
                isInFullScreen: function () {
                    return window.fullScreen
                },
                
                leave: function (){
                    window.fullScreen = false
                },

                toggle: function (){
                    if (window.fullScreen){
                        window.fullScreen = false
                    }else{
                        window.fullScreen = true
                    }
                },
        
                enter: function (){
                    window.fullScreen = true
                }
            }
    }
});
