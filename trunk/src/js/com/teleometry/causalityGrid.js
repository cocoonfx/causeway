var doCausalityGridTest;

(function(){
  "use strict";

  var push = Function.prototype.apply.bind(Array.prototype.push);

  function collectJsonChunks(nExpected, callback) {
    if (nExpected === 0) {  // TODO(cocoonfx): handle this case
    }
    
    var chunks = [];
 
    var collector = {
      collect: function(text) {
        if (callback) {
          var jsObj = JSON.parse(text);
          push(chunks, jsObj);
          nExpected--;
          if (nExpected === 0) {
            callback(chunks);
            callback = null;
          }
        }
      },
      noticeError: function(message) {  // expect less
        if (callback) {
          nExpected--;
          if (nExpected === 0) {
            callback(chunks);
            callback = null;
          }
        }
      }
    };
    return collector;
  }

  function collectSrcFiles(nExpected, callback) {
    if (nExpected === 0) {  // TODO(cocoonfx): handle this case
    }

    var srcLookup = {};
 
    var collector = {
      collect: function(pathname, src) {
        if (callback) {
          srcLookup[pathname] = src;
          nExpected--;
          if (nExpected === 0) {
            callback(srcLookup);
            callback = null;
          }
        }
      },
      noticeError: function(message) {  // expect less
        if (callback) {
          nExpected--;
          if (nExpected === 0) {
            callback(srcLookup);
            callback = null;
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
  var cg_hidden = new FlexSet();
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
                                moOutline, canvas, context, cg_images);
    });
  }

  function getSrcFiles() {
    var pathnames = cg_model.getPathnames();
    var n = pathnames.length;
    if (n === 0) {
      makeWalker({});
    } else {
      var collector = collectSrcFiles(n, function(srcLookup) {
        makeWalker(srcLookup);
      });
      for (var i = 0; i < n; i++) {
        getURL(cg_srcRoot + pathnames[i], pathnames[i], collector);
      }
    }
  }

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

    cg_logfiles = [ 'causeway/purchase_example/workers/log/ael-workers.log' ];
    cg_hidden.addElement('makeCausewayLogger.js');  // filter out logger calls
    cg_srcRoot = 'causeway/purchase_example/workers/';

    getLogFiles();
  };
})();
