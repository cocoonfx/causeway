// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeGraphWalker;

(function(){
  "use strict";

  makeGraphWalker = function makeGraphWalker(srcLookup) {

    function normalizeSpan(span) {
      var first = 1;
      var fo = 0;

      var s0 = span[0];
      if (s0) {
        first = s0[0] || 1;
        fo = s0[1] || 0;
      }

      var last = first;
      var lo = fo;

      var s1 = span[1];
      if (s1) {
        last = s1[0] || first;
        lo = s1[1] || fo;
      }

      var ns = {};

      ns.firstLine = first;
      ns.firstOffset = fo;
      ns.lastLine = last;
      ns.lastOffset = lo;

      return ns;
    }

    function getOptLine(stackEntry) {

      if (stackEntry.source && stackEntry.span) {
        var source = srcLookup[stackEntry.source];
        if (source) {
          var normalSpan = normalizeSpan(stackEntry.span);
          var lines = source.split("\n");
          if (normalSpan.firstLine <= lines.length) {
            return lines[normalSpan.firstLine -1];
          }
        }
      }
      return null;
    }

    function getEntryLabel(element, entryIndex, vatMap) {

      var result = "";

      var stack = element.traceRecord.trace.calls;
      if (stack.length > entryIndex) {
        var se = stack[entryIndex];
        if (se.source && se.span) {
          var line = getOptLine(se);
          if (line) {
            var normalSpan = normalizeSpan(se.span);
            var slice = line.slice(normalSpan.firstOffset -1);
            return slice;
          }
        }
      }
      return result;
    }

    var graphWalker = {

      // Returns the best label for a graph element.
      // The preference is:
      //   1. Developer comments in trace log record.
      //   2. Source code referred to by trace record.
      //   3. Vat name followed by turn number.
      //   4. Log event type.

      getElementLabel: function(element, vatMap) {

        var result = "";

        if (element.traceRecord.text) {
          result += "# " + element.traceRecord.text;
        } else if (srcLookup && element.traceRecord.trace.calls) {
          result += getEntryLabel(element, 0, vatMap);
        }

        if (result === "") {
          if (element.isNode()) {
            var id = element.traceRecord.anchor.turn;
            var attr = vatMap[id.loop];
            result += attr.displayName + "," + id.number;
          } else {
            var c = element.traceRecord['class'][0].split(".");
            result += "## " + c[c.length -1];
          }
        }
        return result;
      }
    };

    return graphWalker;
  };
})();
