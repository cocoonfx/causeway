var doCausalityGridTest;
var showTracelog;

(function(){
  "use strict";

  var push = Function.prototype.apply.bind(Array.prototype.push);

  // This function collects one or more JSON files asynchronously.
  // After the number of expected have been seen (either as files or errors)
  // the parsed JSON chunks (possibly zero) are passed to callback.

  function collectJsonChunks(nExpected, callback) {
    
    var chunks = [];
 
    var collector = {
      collect: function(text) {
        if (callback) {
          var jsObj = JSON.parse(text);
          push(chunks, jsObj);
          nExpected--;
          if (nExpected === 0) {
            callback(chunks);
            callback = null;  // a bit more robust
          }
        }
      },
      noticeError: function(message) {  // expect less
        if (callback) {  // if still active, just decrement counter
          nExpected--;
          if (nExpected === 0) {
            callback(chunks);
            callback = null;  // a bit more robust
          }
        }
      }
    };
    return collector;
  }

  // This function collects one or more source files asynchronously.
  // Each file collected is added to 'srcLookup' and indexed by pathname.
  // After the number of expected have been seen (either as files or errors)
  // the srcLookup (possibly empty) is passed to callback.

  function collectSrcFiles(nExpected, callback) {
 
    var srcLookup = {};
 
    var collector = {
      collect: function(pathname, src) {
        if (callback) {
          srcLookup[pathname] = src;
          nExpected--;
          if (nExpected === 0) {
            callback(srcLookup);
            callback = null;  // a bit more robust
          }
        }
      },
      noticeError: function(message) {  // expect less
        if (callback) {  // if still active, just decrement counter
          nExpected--;
          if (nExpected === 0) {
            callback(srcLookup);
            callback = null;  // a bit more robust
          }
        }
      }
    };
    return collector;
  }

  function getURL(url, pathname, collector) {
    var request = new XMLHttpRequest();
    
    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        if (request.status === 200) {
          collector.collect(pathname, request.responseText);
        } else {
          alert('getURL(' + url + ') error: ' + request.statusText);
          collector.noticeError(request.statusText);
        }
      }
    };
    
    request.open("GET", url);
    
    request.send(null);
  }

  function getJsonFile(pathname, collector) {
    var request = new XMLHttpRequest();
    
    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        if (request.status === 200) {
          collector.collect(request.responseText);
        } else {
          alert('getJsonFile(' + pathname + ') error: ' + request.statusText);
          collector.noticeError(request.statusText);
        }
      }
    };
    
    request.open("GET", pathname);
    
    request.send(null);
  }

  // variable names prefaced with 'cg_' are at outermost scope
  var cg_logfiles = [];
  var cg_hidden = [];
  var cg_srcRoot = '';

  var cg_model = null;

  var cg_images = {};
 
  function loadImages(sources, callback) {
    var loadedImages = 0;
    var numImages = 0;
    // get num of sources
    for (var src in sources) {
      numImages++;
    }
    for (var src in sources) {
      cg_images[src] = new Image();
      cg_images[src].onload = function() {
        if (++loadedImages >= numImages) {
          callback();
        }
      };
      cg_images[src].src = sources[src];
    }
  }

  function makeWalker(srcLookup) {

    var walker = makeGraphWalker(srcLookup);  // srcLookup can be empty
    var vatMap = makeVatMap(cg_model.getMessageGraph());

    var moOutline = document.getElementById('messageOrder');
    var seOutline = document.getElementById('stackExplorer');
    
//    moOutline.style.display = 'none';
//    seOutline.style.display = 'none';

    var canvas = document.getElementById('gridCanvas');
    var context = canvas.getContext('2d');

    var gifs = {
      inturnFlat: 'images/causalityGrid/inturn-flat.gif',
      inturnPopped: 'images/causalityGrid/inturn-popped.gif',
      totFlat: 'images/causalityGrid/tot-flat.gif',
      totPopped: 'images/causalityGrid/tot-popped.gif',
      tipDown: 'images/causalityGrid/tip-down.gif',
      tipRight: 'images/causalityGrid/tip-right.gif',
      noTip: 'images/causalityGrid/no-tip.gif'
    };
 
    loadImages(gifs, function() {
      makeCausalityGridDirector(cg_model, vatMap, walker, 
                                moOutline, seOutline, canvas, 
                                context, cg_images);
    });
  }

  function getSrcFiles() {
    var pathnames = cg_model.getPathnames();
    var n = pathnames.length;
    if (n === 0) {
      makeWalker({});  // source files are not required
    } else {
      var collector = collectSrcFiles(n, function(srcLookup) {
        makeWalker(srcLookup);
      });
      for (var i = 0; i < n; i++) {
        getURL(cg_srcRoot + pathnames[i], pathnames[i], collector);
      }
    }
  }

  // The Causeway model represents the distributed message flow across
  // address-space boundaries. Causeway log files encode local messaging
  // such that a happened-before relation can be constructed.
  // The model requires at least one log file.

  function makeModel(chunks) {
    if (chunks.length === 0) {
      throw new Error('makeModel sees empty chunks array');
    }
    cg_model = makeCausewayModel(chunks, cg_hidden);
    getSrcFiles();
  }

  function getLogFiles() {
    if (cg_logfiles && cg_logfiles.length > 0) {
      var n = cg_logfiles.length;
      var collector = collectJsonChunks(n, function(chunks) { 
        makeModel(chunks);
      });
      for (var i = 0; i < n; i++) {
        getJsonFile(cg_logfiles[i], collector);
      }
    } else {
      throw new Error('must specify at least one log file');
    }
  }

  doCausalityGridTest = function doCausalityGridTest() {

    //cg_logfiles = [ 'log/live-250K.log' ];
    //cg_srcRoot = '';

    //cg_logfiles = [ 'causeway/purchase_example/workers/log/V8-workers.log' ];
    cg_logfiles = [ 'causeway/purchase_example/workers/log/FF-workers.log' ];
    //cg_logfiles = [ 'causeway/purchase_example/workers/log/JSC-workers.log' ];
    cg_hidden.push('causeway/purchase_example/workers/debug.js');  // filter out logger calls
    cg_hidden.push('causeway/purchase_example/workers/makeCausewayLogger.js');
    cg_hidden.push('workersExample.html');
    cg_srcRoot = '';

    getLogFiles();
  };

  showTracelog = function showTracelog() {
    "use strict";
    var logfile = document.getElementById("tracelog").value;
    cg_logfiles = [logfile];
    
    getLogFiles();
  };

})();


