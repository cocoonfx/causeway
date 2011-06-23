// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var GraphArc;

(function(){
  "use strict";
  
  GraphArc = function GraphArc(origin, target) {
    this.origin = origin;
    this.target = target;
    
    var ono = origin.nextOut;
    var tni = target.nextIn;
    
    GraphElement.call(this, target, tni, origin, ono);
    
    ono.prevOut = this;
    this.origin.nextOut = this;
    tni.prevIn = this;
    this.target.nextIn = this;
  };
  
  GraphArc.prototype = Object.create(GraphElement.prototype);
  GraphArc.prototype.constructor = GraphArc;
  
  GraphArc.prototype.isNode = function() {
    return false;
  };
  
  GraphArc.prototype.setOrigin = function(newOrigin) {
    // splice out the old
    var no = this.nextOut;
    var po = this.prevOut;
    no.prevOut = po;
    po.nextOut = no;
    
    // splice in the new
    var nono = newOrigin.nextOut;
    nono.prevOut = this;
    newOrigin.nextOut = this;
    this.nextOut = nono;
    this.prevOut = newOrigin;
    
    this.origin = newOrigin;
  };
  
  GraphArc.prototype.setTarget = function(newTarget) {
    // splice out the old
    var ni = this.nextIn;
    var pi = this.prevIn;
    ni.prevIn = pi;
    pi.nextIn = ni;
    
    // splice in the new
    var ntni = newTarget.nextIn;
    ntni.prevIn = this;
    newTarget.nextIn = this;
    this.nextIn = ntni;
    this.prevIn = newTarget;
    
    this.target = newTarget;
  };
})();
  