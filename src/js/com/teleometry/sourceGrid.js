var doCausalityGridTest;

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

  function makeWalker(chunksCopy,srcLookup,hidden) {

    var walker = makeGraphWalker(srcLookup);
    var vatMap = makeVatMap(model.getMessageGraph());

    var canvas = document.getElementById('gridCanvas');
    var context = canvas.getContext('2d');

    //makeCausalityGridDirector(model, vatMap, walker, canvas, context);
    //makeStatisticsModel( model, chunks, hidden, vatMap, walker, canvas, context );

    makeSourcilloscopeModel( model, chunksCopy, hidden, vatMap, walker, canvas, context );
 }

  function deepJSONCopy(input) {
    if (null === input || 'object' !== typeof input) {
      return input;
    }
    var output, key;
    if (Array.isArray(input)) {
      output = [];
      for (key = 0; key !== input.length; key += 1) {
        output[key] = deepJSONCopy(input[key]);
      }
    } else {
      output = {};
      for (key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          output[key] = deepJSONCopy(input[key]);
        }
      }
    }
    return output;
  }

  function makeModel(chunks) {

    var srcURL = "";

    var chunksCopy = deepJSONCopy(chunks);
    for (var i = 0; i < chunksCopy.length; i += 1)
    {
      if (!('trace' in chunksCopy[i])) {
        chunksCopy[i].trace = {calls: []};
      }
    }

    var hidden = new FlexSet();
    hidden.addElement("makeCausewayLogger.js");
    hidden.addElement("workersExample.html");

    model = makeCausewayModel(chunks, hidden);

    var pathnames = model.getPathnames();
    if (pathnames.length > 0) {
      
      var getter = new AsyncGetSource(pathnames.length, function(srcLookup) {
                                      makeWalker(chunksCopy,srcLookup,hidden);
      });
        
      for (var p = 0, pLen = pathnames.length; p < pLen; p++) {
        getSourceFile(srcURL, pathnames[p], getter);
      }
    } else {
      makeWalker(null);
    }
/*
    var walker = makeGraphWalker(null);
    var canvas = document.getElementById('gridCanvas');
    var context = canvas.getContext('2d');
    makeStatisticsModel( model, hidden, makeVatMap(model.getMessageGraph()), walker,canvas,context );
*/
  }

  doCausalityGridTest = function doCausalityGridTest() {

    var parser = new AsyncParse(1, function(chunks) {
                                makeModel(chunks);
    });
    
    getTraceLog("causeway/log/html/buyer.log", parser);
  };
})();
