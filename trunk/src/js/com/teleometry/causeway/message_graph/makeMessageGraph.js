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

    for (var i = 0, iLen = jsonChunks.length; i < iLen; i++) {
      var chunk = normalizeStack(jsonChunks[i]);

      var majorType = chunk['class'][chunk['class'].length -2];
      if (majorType === "org.ref_send.log.Sent") {

        var origin = getOrMakeTurnNode(chunk.anchor.turn);

        // An EventArc (edge) represents a single message send
        // from an origin TurnNode to a target TurnNode.
        // Notice that this chunk belongs to the edge.

        var edge = msgMap[chunk.message];
        if (!edge) {

          // Sent event is seen first.
          // Make the edge with a placeholder target, 'bottom'.
          // Put the edge in msgMap at this message id.
          // Later, when-if the Got event is seen this edge
          // will be found and updated with the actual target.

          edge = mg.makeEventArc(origin, bottom);
          msgMap[chunk.message] = edge;

        } else if (edge.origin === top) {

          // Got event seen first.
          // The edge already exists and has a placeholder
          // origin 'top'. Just update the origin.

          edge.setOrigin(origin);
 
        } else {

          // Got event seen first but the placeholder has
          // already been updated. Check for a duplicate 
          // event record. Duplicates can result from network
          // retries and can be safely ignored.

          var s1 = JSON.stringify(chunk);
          var s2 = JSON.stringify(edge.traceRecord);
          if (s1 !== s2) {
            throw new Error('conflicting Sent for message: ' + chunk.message);
          }
        }

        // The chunk belongs to the edge.
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

          // Got event is seen first.
          // Make the edge with a placeholder origin, 'top'.
          // Put the edge in msgMap at this message id.
          // Later, when-if the Sent event is seen this edge
          // will be found and updated with the actual origin
          // and the traceRecord for the edge.

          edge = mg.makeEventArc(top, target);
          msgMap[chunk.message] = edge;

        } else if (edge.target === bottom) {

          // Sent event seen first.
          // The edge already exists and has a placeholder
          // target 'bottom'. Just update the target.

          edge.setTarget(target);

        } else {

          // Sent event seen first but the placeholder has
          // already been updated. Check for a duplicate 
          // event record. Duplicates can result from network
          // retries and can be safely ignored.

          var s1 = JSON.stringify(chunk);
          var s2 = JSON.stringify(target.traceRecord);
          if (s1 !== s2) {
            throw new Error('conflicting Got for message: ' + chunk.message);
          }
        }

        // The chunk belongs to the target.
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
