// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var GraphNode;

(function(){
  "use strict";
  
  GraphNode = function GraphNode(name) {
    this.name = name;
    GraphElement.call(this, this, this, this, this);
  };
  
  GraphNode.prototype = Object.create(GraphElement.prototype);
  GraphNode.prototype.constructor = GraphNode;
  
  GraphNode.prototype.isNode = function() {
    return true;
  };
  
  // Iterates through the outgoing edges, invoking
  // the function on each edge-target pair.
  GraphNode.prototype.outs = function(func) {
    // left-to-right order
    var ge = this.prevOut;
    while (ge !== this) {
      // a bit more robust in case graph changes
      var next = ge.prevOut;
      func(ge, ge.target);
      ge = next;
    }
  };
  
  // Iterates through all edges transitively outgoing from
  // this node in pre-order. To iterate through all edge-target
  // pairs a node can be visited multiple times but each edge
  // is visited exactly once.
  GraphNode.prototype.deepOutsPre = function(func) {
    var seen = new FlexSet();
    function walk(node) {
      if (seen.contains(node)) { return; }
      seen.addElement(node);
      node.outs(function(edge, target) {
        // do parent before children
        func(edge, target);
        walk(target);
      });
    }
    walk(this);
  };
  
  // Iterates through all edges transitively outgoing from
  // this node in post-order. To iterate through all edge-target
  // pairs a node can be visited multiple times but each edge
  // is visited exactly once.
  GraphNode.prototype.deepOutsPost = function(func) {
    var seen = new FlexSet();
    function walk(node) {
      if (seen.contains(node)) { return; }
      seen.addElement(node);
      node.outs(function(edge, target) {
        // do children before parent
        walk(target);  
        func(edge, target);
      });
    }
    walk(this);
  };
  
  // Iterates through the incoming edges, invoking
  // the function on each edge-origin pair.
  GraphNode.prototype.ins = function(func) {
    // left-to-right order
    var ge = this.prevIn;
    while (ge !== this) {
      // a bit more robust in case graph changes
      var next = ge.prevIn;
      func(ge, ge.origin);
      ge = next;
    }
  };
  
  // Iterates through all edges transitively incoming to
  // this node in pre-order. To iterate through all edge-origin
  // pairs a node can be visited multiple times but each edge
  // is visited exactly once.
  GraphNode.prototype.deepInsPre = function(func) {
    var seen = new FlexSet();
    function walk(node) {
      if (seen.contains(node)) { return; }
      seen.addElement(node);
      node.ins(function(edge, origin) {
        func(edge, origin);
        walk(origin);
      });
    }
    walk(this);
  };
  
  GraphNode.prototype.getOutgoingCount = function() {
    var count = 0;
    this.outs(function(edge, target) {
      count++;
    });
    return count;
  };
  
  GraphNode.prototype.getIncomingCount = function() {
    var count = 0;
    this.ins(function(edge, origin) {
      count++;
    });
    return count;
  };
  
  GraphNode.prototype.isRoot = function() {
    return this.prevIn === this && this.nextIn === this;
  };
  
  GraphNode.prototype.isLeaf = function() {
    return this.prevOut === this && this.nextOut === this;
  };
})();
  