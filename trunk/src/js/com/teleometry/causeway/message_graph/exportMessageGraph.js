// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

/**
 * This function exports Causeway's message graph to the dot format
 * recognized by GraphViz. (GraphViz is opensource and must be downloaded and
 * run separately to see the graph).
 *
 * This is useful for debugging filtering functions. For example,
 * the devora filter in filterMessageGraph has 2 passes. The first pass sets
 * tags in TurnNode & EventArc objects to CLIP or SKIP. Initially,
 * all tags are KEEP.
 *
 * The first pass tags the graph; the 2nd pass modifies the graph. The 2nd
 * pass ensures that causality is preserved, even as subgraphs are deleted.
 *
 * To test a new filtering function, run the tagging pass, then export.
 * Open the dotfile.gv in GraphViz. Nodes and edges to CLIP are
 * indicated (red), to SKIP (yellow), and to KEEP (normal color). At a
 * glance, it should be clear whether the tagging is correct or not.
 */

var exportToDotHTML;

(function(){
  "use strict";

  var CLIP = 0;
  var SKIP = 1;
  var KEEP = 2;

  var tagToColor = function(tag, normal) {
    if (tag === CLIP) {
      return "firebrick";
    } else if (tag === SKIP) {
      return "goldenrod";
    } else if (tag === KEEP) {
      return normal;
    } else {
      throw new Error('unrecognized tag: ' + tag);
    }
  };

  function connectTheDots(root, vatMap, graphWalker) {
    var szspec = '"' + '8.5, 11' + '"';
    var lspec = '"' + 'Causeway Message Graph' + '"';

    var dotSrc = [
      'digraph messageGraph {\n',
      'size = ', szspec, ';\n',
      'label = ', lspec, ';\n',
      'fontsize = 16;\n',
      'labelloc = t;\n',
      'labeljust = r;\n',
      'node [shape=plaintext, fontsize=10];\n'
    ];

    var seen = new FlexSet();

    root.deepOutsPre(function(edge, target) {

      var origin = edge.origin;
      var oid = origin.traceRecord.anchor.turn;
      var tid = target.traceRecord.anchor.turn;

      var oname = graphWalker.getElementLabel(origin, vatMap);
      var tname = graphWalker.getElementLabel(target, vatMap);

      // dot format requires X11 color names.
      var ocolor = tagToColor(origin.tag,
                              vatMap[oid.loop].color.x11Color);
      var tcolor = tagToColor(target.tag,
                              vatMap[tid.loop].color.x11Color);

      var ospec = '[' + oname + ']';
      var tspec = '[' + tname  + ']';
      var ocspec = '[fontcolor=' + ocolor + ']';
      var tcspec = '[fontcolor=' + tcolor + ']';

      // deepOutsPre visits edges exactly once, but nodes
      // can be visited multiple times. Here, visited nodes
      // are remembered so that node specs are written once.

      if (!seen.contains(origin)) {
        seen.addElement(origin);
        dotSrc.push('"', ospec, '" ', ocspec, ';\n');
      }
      if (!seen.contains(target)) {
        seen.addElement(target);
        dotSrc.push('"', tspec, '" ', tcspec, ';\n');
      }

      var ep = graphWalker.getElementLabel(edge, vatMap) || '[]';

      var ecolor = tagToColor(edge.tag, 'lightslategray');

      var espec = '[color=' + ecolor + ' label=' + '"' + ep + '"]';

      dotSrc.push('"', ospec, '" -> "', tspec, '" ', espec, ';\n');
    });

    dotSrc.push('}\n');

    return dotSrc.join('');
  }

  var re = new RegExp('([<>"])', 'g');
  var entity = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };
  function encode(entityChar) {
    return entity[entityChar];
  }
  function htmlEncode(str) {
    return str.replace(re, encode);
  }

  exportToDotHTML = function exportToDotHTML(root,
                                             vatMap,
                                             graphWalker,
                                             domElement) {
    domElement.innerHTML = [
      '<br></br><pre>',
      htmlEncode(connectTheDots(root, vatMap, graphWalker)),
      '</pre><br></br>'
    ].join('');
  };
})();