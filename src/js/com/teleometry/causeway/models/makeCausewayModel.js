// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

/**
 *  This function takes an array of parsed JSON trace log records and
 *  a FlexSet of pathnames to filter out. A causewayModel object is
 *  returned that will answer queries on the resulting messageGraph.
 *
 *  Let's say the FlexSet, hiddenSrcParths, contains a single element:
 *      "/utils/makeCausewayLogger.js"
 *  filterMessageGraph will filter out all stacks frames for that source.
 *
 */

var makeCausewayModel;

(function(){
  "use strict";

  makeCausewayModel = function makeCausewayModel(jsonChunks,
                                                 hiddenSrcPaths) {

    jsonChunks = JSON.parse(JSON.stringify(jsonChunks));

    var messageGraph = makeMessageGraph(jsonChunks);

    filterMessageGraph(messageGraph, hiddenSrcPaths);

    var causewayModel = {

      getMessageGraph: function() {
        return messageGraph;
      },

      getVatTurns: function() {
        var ordered = {};  // process order

        var seen = new FlexSet();
        messageGraph.top.deepOutsPre(function(edge, target) {
          if (!seen.contains(target)) {
            seen.addElement(target);
            var id = target.id;
            if (id.loop !== 'bottom') {
              var nodes = ordered[id.loop] || [];
              nodes.push(target);
              ordered[id.loop] = nodes;
            }
          }
        });

        for (var vatName in ordered) {
          if (ordered.hasOwnProperty(vatName)) {
            ordered[vatName].sort(by('id.number'));
          }
        }
        // for each vat, a list of turns sorted by turn number
        return ordered;
      },

      getPathnames: function() {
        var pathnames = {};

        messageGraph.top.deepOutsPre(function(edge, target) {
          if (edge.traceRecord.trace) {
            var stack = edge.traceRecord.trace.calls;
            if (stack.length > 0) {
              for (var i = 0, iLen = stack.length; i < iLen; i++) {
                pathnames[stack[i].source] = true;
              }
            }
          }
          if (target.traceRecord.trace) {
            var stack = target.traceRecord.trace.calls;
            if (stack.length > 0) {
              for (var i = 0, iLen = stack.length; i < iLen; i++) {
                pathnames[stack[i].source] = true;
              }
            }
          }
        });

        var result = [];
        for (var pn in pathnames) {
          if (pathnames.hasOwnProperty(pn)) {
            result.push(pn);
          }
        }
        return result;
      }
    };

    return causewayModel;
  };
})();

