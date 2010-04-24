
var getDisplayName = function(vatName) {

    var parts = vatName.split("/");
    var i = parts.length -1;
    while (i >= 0) {
        var part = parts[i];
        if (part !== "") {
            return part;
        }
        i -= 1;
    }
    return vatName;
};

var getSourceFile = function(url, callback) {
    var request = new XMLHttpRequest();
    
    request.onreadystatechange = function() {
        if (request.readyState === 4) {
            if (request.status === 200) {
                callback.addToLookupTable(url, request.responseText);
            } else {
                alert("Error " + request.status + ": " + request.statusText);
            }
        }
    };
    
    request.open("GET", url);
    
    request.setRequestHeader("User-Agent", "XMLHttpRequest");
    request.setRequestHeader("Accept-Language", "en");
    
    request.send(null);
}

var dbgPathnames = null;
var dbgModel = null;
var dbgVatMap = null;
var dbgPOM = null;

var testMessageGraph = function(rootDirName, 
                                chunks) {
        
    // X Windows named colors for writing dotfiles
    var vatColors = [ "mediumblue", "forestgreen", "indigo", "chocolate" ];

    var model = new CausewayModel(chunks);
    dbgModel = model;
        
    var vats = model.getVatSet();
    
    var vatMap = {};
    for (var i = 0; i < vats.length; i++) {
    
        var name = getDisplayName(vats[i]);
        
        vatMap[vats[i]] = {displayName: name, color: vatColors[i]};
    }
    vatMap["top"] = {displayName: "top", color: "black"};
    vatMap["bottom"] = {displayName: "bottom", color: "black"};
    
    dbgVatMap = vatMap;
    
    var pathnames = model.getPathnames();
    dbgPathnames = pathnames;
    
    if (pathnames.length > 0) {
        var teller = new AsyncGetter(pathnames.length, function(srcLookupTable) {
            var graphWalker = new GraphWalker(rootDirName,
                                              model.getTop(),
                                              srcLookupTable);
            //model.exportToDotFile(model.getTop(),
                                  //vatMap,
                                  //graphWalker);
            var mov = new MessageOrderView(document.getElementById('messageOrderTree'),
                                           model,
                                           vatMap,
                                           graphWalker);
                                           
            var pom = model.getPOMap();
            dbgPOM = pom;
            var pov = new ProcessOrderView(document.getElementById('processOrderTree'),
                                           pom,
                                           vatMap,
                                           graphWalker);
        });
        for (var p = 0; p < pathnames.length; p++) {
            getSourceFile(rootDirName + pathnames[p], teller);
        }
    }
};

var getTraceLog = function(url, callback) {
    var request = new XMLHttpRequest();
    
    request.onreadystatechange = function() {
        if (request.readyState === 4) {
            if (request.status === 200) {
                callback.parse(request.responseText);
            } else {
                alert("Error " + request.status + ": " + request.statusText);
            }
        }
    };
    
    request.open("GET", url);
    
    request.setRequestHeader("User-Agent", "XMLHttpRequest");
    request.setRequestHeader("Accept-Language", "en");
    
    request.send(null);
}

var testCauseway = function() {

    YAHOO.log("entered testCauseway");

    var traceLogsURL = "http://localhost:8080/purchase_example/";
    
    var teller = new AsyncAnd(4, function(chunks) {
        testMessageGraph("http://localhost:8080/purchase_example/", chunks);
    });
                      
    getTraceLog(traceLogsURL + "account.json", teller); 
    getTraceLog(traceLogsURL + "buyer.json", teller); 
    getTraceLog(traceLogsURL + "product.json", teller); 
    getTraceLog(traceLogsURL + "shipper.json", teller); 
};
