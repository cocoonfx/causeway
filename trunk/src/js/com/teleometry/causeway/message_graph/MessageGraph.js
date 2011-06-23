// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var MessageGraph;

(function(){
  "use strict";
  
  MessageGraph = function MessageGraph() {
    this.digraph = new DirectedGraph();
    this.top = new TurnNode({loop:"top", number:0});
    this.bottom = new TurnNode({loop:"bottom", number:0});
    this.digraph.addNode(this.top);
    this.digraph.addNode(this.bottom);
  };
  
  MessageGraph.prototype.addTurnNode = function(node) {
    this.digraph.addNode(node);
  };
  
  MessageGraph.prototype.removeTurnNode = function(node) {
    this.digraph.removeNode(node);
  };
  
  MessageGraph.prototype.getTurnNodeFromId = function(id) {
   return this.digraph.getNodeFromName(TurnNode.idToName(id));
  };
  
  MessageGraph.prototype.makeTurnNode = function(id) {
    return new TurnNode(id);
  };
  
  MessageGraph.prototype.makeEventArc = function(origin, target) {
    return new EventArc(origin, target);
  };
  
  MessageGraph.prototype.getRoots = function() {
    return this.digraph.getRoots();
  };
  
  MessageGraph.prototype.getLeaves = function() {
    return this.digraph.getLeaves();
  };
  
  MessageGraph.prototype.getSize = function() {
    return this.digraph.getSize();
  };
})();
  