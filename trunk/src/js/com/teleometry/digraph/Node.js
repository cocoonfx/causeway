// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var Node;

(function(){
  "use strict";
  
  Node = function Node(name) {
    this.name = name;
    GraphElement.call(this, this, this, this, this);
  };
  
  Node.prototype = Object.create(GraphElement.prototype);
  Node.prototype.constructor = Node;
  
  Node.prototype.isNode = function() {
    return true;
  };
  
  Node.prototype.outs = function(func) {
    // left-to-right order
    var ge = this.prevOut;
    while (ge !== this) {
      // a bit more robust in case graph changes
      var next = ge.prevOut;
      func(ge, ge.target);
      ge = next;
    }
  };
  
  // Visits each descendant edge exactly once, in deep pre-order.
  
  Node.prototype.deepOutsPre = function(func) {
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
  
  // Visits each descendant edge exactly once, in deep post-order.

  Node.prototype.deepOutsPost = function(func) {
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
  
  Node.prototype.ins = function(func) {
    // left-to-right order
    var ge = this.prevIn;
    while (ge !== this) {
      // a bit more robust in case graph changes
      var next = ge.prevIn;
      func(ge, ge.origin);
      ge = next;
    }
  };
  
  Node.prototype.getOutgoingCount = function() {
    var count = 0;
    this.outs(function(edge, target) {
      count++;
    });
    return count;
  };
  
  Node.prototype.getIncomingCount = function() {
    var count = 0;
    this.ins(function(edge, origin) {
      count++;
    });
    return count;
  };
  
  Node.prototype.isRoot = function() {
    return this.prevIn === this && this.nextIn === this;
  };
  
  Node.prototype.isLeaf = function() {
    return this.prevOut === this && this.nextOut === this;
  };
})();
  