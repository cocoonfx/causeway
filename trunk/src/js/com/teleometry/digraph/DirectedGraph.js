// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var DirectedGraph;

(function(){
  "use strict";
  
  DirectedGraph = function DirectedGraph() {
    this.graph = Object.create(null);
  };
  
  DirectedGraph.prototype.addNode = function(node) {
    this.graph[node.name] = node;
  };
  
  DirectedGraph.prototype.removeNode = function(node) {
    delete this.graph[node.name];
  };
  
  DirectedGraph.prototype.getNodeFromName = function(name) {
    return this.graph[name];
  };
  
  DirectedGraph.prototype.getRoots = function() {
    var roots = [];
    for (var name in this.graph) {
      var node = this.graph[name];
      if (node.isRoot()) {
        roots.push(node);
      }
    }
    return roots;
  };
  
  DirectedGraph.prototype.getLeaves = function() {
    var leaves = [];
    for (var name in this.graph) {
      var node = this.graph[name];
      if (node.isLeaf()) {
        leaves.push(node);
      }
    }
    return leaves;
  };
  
  DirectedGraph.prototype.getSize = function() {
    var n = 0;
    for (var name in this.graph) {
      ++n;
    }
    return n;
  };
})();
  