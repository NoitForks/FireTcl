define( {        
        load_json_from_file: function (file_name) {   
            var jsonObject;
                
            var xobj = new XMLHttpRequest();
            xobj.overrideMimeType("application/json");
    
            xobj.open('GET', file_name, false);
            xobj.onreadystatechange = function () {
                if (xobj.readyState == 4) {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                    jsonObject = JSON.parse(xobj.responseText);
                }
            };
                
            xobj.send(null);
            return jsonObject;  
        }
});

