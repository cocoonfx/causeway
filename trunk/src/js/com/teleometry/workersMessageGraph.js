
var doMessageGraphTest;

(function(){
  "use strict";

  var AsyncParse = function(nExpected,
                            callback) {

    this.nExpected = nExpected;
    this.callback = callback;
    this.chunks = [];
    
    // skip nExpected < 1
  };

  AsyncParse.prototype.parse = function(text) {

    if (this.callback !== null) {
    
      var jsObj = JSON.parse(text);
      this.chunks = this.chunks.concat(jsObj);
        
      this.nExpected -= 1;
      if (this.nExpected <= 0) {
          this.callback(this.chunks);
          this.callback = null;
      }
    }
  };

  var AsyncGetSource = function(nExpected,
                                callback) {

    this.nExpected = nExpected;
    this.callback = callback;
    this.map = {};
    
    // skip nExpected < 1
  };

  AsyncGetSource.prototype.addToMap = function(pathname, source) {

    if (this.callback !== null) {
    
      this.map[pathname] = source;
        
      this.nExpected -= 1;
      if (this.nExpected <= 0) {
          this.callback(this.map);
          this.callback = null;
      }
    }
  };

  function getSourceFile(url, pathname, callback) {
    var request = new XMLHttpRequest();
    
    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        if (request.status === 200) {
          callback.addToMap(pathname, request.responseText);
        } else {
          alert("Error " + request.status + ": " + request.statusText);
        }
      }
    };

    request.open("GET", url + pathname);

    request.setRequestHeader("User-Agent", "XMLHttpRequest");
    request.setRequestHeader("Accept-Language", "en");
    
    request.send(null);
  }

  function getTraceLog(url, callback) {
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

  var model = null;

  function makeWalker(srcLookup) {

    var walker = makeGraphWalker(srcLookup);
    var vatMap = makeVatMap(model.getMessageGraph());

    var domElement = document.getElementById('dotfile');

    exportToDotHTML(model.getMessageGraph().top, 
                    vatMap, 
                    walker, 
                    domElement);
  }

  function makeModel(chunks) {

    var srcURL = "http://localhost:8080/causeway/purchase_example/workers/";

    var hidden = new FlexSet();
    hidden.addElement("makeCausewayLogger.js");

    model = makeCausewayModel(chunks, hidden);

    var pathnames = model.getPathnames();
    if (pathnames.length > 0) {
      
      var getter = new AsyncGetSource(pathnames.length, function(srcLookup) {
                                      makeWalker(srcLookup);
      });
        
      for (var p = 0, pLen = pathnames.length; p < pLen; p++) {
        getSourceFile(srcURL, pathnames[p], getter);
      }
    } else {
      makeWalker(null);
    }
  }

  doMessageGraphTest = function doMessageGraphTest() {

    var logURL = "http://localhost:8080/causeway/purchase_example/workers/log/";
    
    var parser = new AsyncParse(1, function(chunks) {
                                makeModel(chunks);
    });
    
    getTraceLog(logURL + "workers.log", parser);
  };
})();
