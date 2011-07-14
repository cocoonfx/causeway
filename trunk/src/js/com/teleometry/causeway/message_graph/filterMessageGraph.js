// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var filterMessageGraph;

(function(){
  "use strict";

  var CLIP = 0, SKIP = 1, KEEP = 2;

  var compareAnchors = by('turn.loop', by('turn.number', by('number')));

  // Sort the out edges from a given turn by anchor.

  var sortOutgoing = function(top) {

    // seen is still useful, since deepOuts* only suppresses duplicate
    // edge visits, not duplicate node visits.
    var seen = new FlexSet();

    top.deepOutsPre(function(ignoredEdge, node) {

      if (seen.contains(node)) { return; }
      seen.addElement(node);

      var edges = new FlexMap();

      node.outs(function(outgoing, target) {
        edges.set(outgoing.getKey(), outgoing);
      });

      var edgeKeys = edges.getKeys(compareAnchors);

      for (var i = 0, ilen = edgeKeys.length; i < ilen; i++) {
        var k = edgeKeys[i];
        var edge = edges.get(k);
        // splice out, splice back in
        // doesn't change graph topology, but
        // does change the order of edges
        edge.setOrigin(node);
      }
    });
  };

  function hideFrames(stack, hiddenSrcPaths) {
    var result = [];
    for (var i = 0, ilen = stack.length; i < ilen; i++) {
      var se = stack[i];
      var srcPath = se.source;
      if (!hiddenSrcPaths.contains(srcPath)) {
        result.push(se);
      }
    }
    return result;
  }

  // Hide the stack frames corresponding to uninteresting source paths

  function hideDetail(top, hiddenSrcPaths) {
    var seen = new FlexSet();
    top.deepOutsPre(function(edge, node) {
      edge.traceRecord.trace.calls =
        hideFrames(edge.traceRecord.trace.calls || [],
                   hiddenSrcPaths);

      if (seen.contains(node)) { return; }
      seen.addElement(node);
      node.traceRecord.trace.calls =
        hideFrames(node.traceRecord.trace.calls || [],
                   hiddenSrcPaths);
    });
  }

  function lastCause(edge) {
    return edge === edge.target.nextIn;
  }

  function aggregate(edge, newTarget, isLastCause) {
    var curLast = newTarget.nextIn;
    edge.setTarget(newTarget);
    edge.traceRecord.message = newTarget.traceRecord.message;
    if (curLast.isNode() || isLastCause) { return; }
    curLast.setTarget(newTarget);
  }

  function devoraOne(top) {
    top.deepOutsPost(function(edge, node) {
      var nodeStack = node.traceRecord.trace.calls;
      if (nodeStack.length === 0) {
        var tag = CLIP;
        node.outs(function(grandEdge, ignored) {
          tag = Math.max(tag, grandEdge.tag);
        });
        node.tag = tag;
      }
      var edgeStack = edge.traceRecord.trace.calls;
      if (edgeStack.length === 0) {
        edge.tag = Math.min(node.tag, SKIP);
      }
    });
  }

  function devoraTwo(messageGraph, top) {
    var dummy = messageGraph.makeTurnNode({loop: 'dummy', number: 0});
    var seen = new FlexSet();
    var orphans = [];

    function devoraThree(root) {
      if (seen.contains(root)) { return; }
      seen.addElement(root);

      var edgeList = [];
      root.outs(function(outgoing, ignored) {
        edgeList.push(outgoing);
      });
      for (var i = 0, ilen = edgeList.length; i < ilen; i++) {
        var edge = edgeList[i];
        var target = edge.target;
        devoraThree(target);

        if (edge.tag === CLIP) {
          edge.setOrigin(dummy);
          edge.setTarget(dummy);
        } else if (target.tag <= SKIP &&
                   target.getOutgoingCount() >= 1) {
          var grandTargets = new FlexMap();
          var maxGETag = CLIP;
          target.outs(function(ge, gt) {
            grandTargets.set(gt, ge);
            maxGETag = Math.max(maxGETag, ge.tag);
          });
          if (maxGETag <= SKIP) {
            var firstTime = true;
            grandTargets.getKeys().forEach(function(gt) {
              var ge = grandTargets.get(gt);
              var e;
              if (firstTime) {
                e = edge;
                firstTime = false;
              } else {
                e = messageGraph.makeEventArc(root,
                                              target,
                                              edge.traceRecord);
                e.tag = edge.tag;
              }
              aggregate(e, gt,
                        lastCause(edge) && lastCause(ge));
              // BUG: XXX...
              orphans.push(ge);
            });
          }
        }
      }
    }
    devoraThree(top);

    for (var i = 0, ilen = orphans.length; i < ilen; i++) {
      var orphan = orphans[i];
      orphan.setOrigin(dummy);
      orphan.setTarget(dummy);
    }
  }

  filterMessageGraph = function filterMessageGraph(messageGraph,
                                                   hiddenSrcPaths) {

    if (hiddenSrcPaths) {
      hideDetail(messageGraph.top, hiddenSrcPaths);
    }

    devoraOne(messageGraph.top);

    devoraTwo(messageGraph, messageGraph.top);

    sortOutgoing(messageGraph.top);
  };
})();
