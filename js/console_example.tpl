<div id="firetcl_console">
    <h1>FireTcl</h1>
    <div class="control_panel">
        <button type="button" onclick="FireTcl.App.executeTclInMainThread();">Execute Tcl in main thread</button>
        <button type="button" onclick="FireTcl.App.executeTclInWorker();">Execute Tcl in worker</button>
        <button type="button" onclick="FireTcl.App.executeJS()">Eval javascript</button>
        <button type="button" onclick="alert('It\'s responsive');">Check responsiveness</button>        
        <button type="button" onclick="FireTcl.App.clear()">Clear console</button> 
    </div>
                    
    <textarea class="editor" rows="15" cols="120"></textarea>
    <div class="tcl_version"><%= vs %></div>
        
    <div class="log"></div>
	
</div>
