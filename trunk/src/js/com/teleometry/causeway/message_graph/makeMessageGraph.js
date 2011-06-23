// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeMessageGraph;

(function(){
  "use strict";
  
  function normalizeStack(chunk) {
    if (!('trace' in chunk)) {
      chunk.trace = {calls: []};
    }
    return chunk;
  }
  
  makeMessageGraph = function makeMessageGraph(jsonChunks) {
    
    var msgMap = {};
    var condMap = {};
    
    var resolveds = [];
    
    var mg = new MessageGraph();
    var top = mg.top;
    var bottom = mg.bottom;
    
    function getOrMakeTurnNode(id) {
      var node = mg.getTurnNodeFromId(id);
      if (!node) {
        node = mg.makeTurnNode(id);
        mg.addTurnNode(node);
      }
      return node;
    }
    
    // TODO Ignore duplicate chunks
    
    for (var i = 0, iLen = jsonChunks.length; i < iLen; i++) {
      var chunk = normalizeStack(jsonChunks[i]);
      
      // ...
      
      var majorType = chunk.class[chunk.class.length -2];
      if (majorType === "org.ref_send.log.Sent") {
        var origin = getOrMakeTurnNode(chunk.anchor.turn);
        
        var edge = msgMap[chunk.message];
        if (!edge) {
          edge = mg.makeEventArc(origin, bottom);
          msgMap[chunk.message] = edge;
        } else if (edge.origin === top) {
          edge.setOrigin(origin);
        } else {
          console.log('conflict');
        }
        edge.traceRecord = chunk;
        
        var condition = chunk.condition;
        if (condition) {
          // TODO assert that types must include SentIf
          var messages = condMap[condition] || [];
          messages.push(chunk.message);
          condMap[condition] = messages;
        }
      } else if (majorType === "org.ref_send.log.Got") {
        var target = getOrMakeTurnNode(chunk.anchor.turn);
        
        var edge = msgMap[chunk.message];
        if (!edge) {            
          edge = mg.makeEventArc(top, target);
          msgMap[chunk.message] = edge;
        } else if (edge.target === bottom) {
          edge.setTarget(target);
        } else {
          console.log('conflict');
        }
        target.traceRecord = chunk;
      } else if (majorType === "org.ref_send.log.Resolved") {
        resolveds.push(chunk);
      } else if (majorType === "org.ref_send.log.Comment") {
        var origin = getOrMakeTurnNode(chunk.anchor.turn);
        var edge = mg.makeEventArc(origin, bottom);
        edge.traceRecord = chunk;
      } else {
        console.log('unrecognized major type: ' + majorType);
      }
    }
    
    for (var i = 0, iLen = resolveds.length; i < iLen; i++) {
      var r = resolveds[i];
      
      var messages = condMap[r.condition];
      if (messages) {
        
        var origin = getOrMakeTurnNode(r.anchor.turn);
        
        for (var j = 0; j < messages.length; j++) {
          var m = messages[j];
          var target = msgMap[m].target;
          var edge = mg.makeEventArc(origin, target);
          edge.traceRecord = r;
        }
      }
    }
    
    var roots = mg.getRoots();
    for (var i = 0, iLen = roots.length; i < iLen; i++) {
      var r = roots[i];
      if (r !== top) {
        mg.makeEventArc(top, r);
      }
    }
    
    return mg;
  };
})();
  