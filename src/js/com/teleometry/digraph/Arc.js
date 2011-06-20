// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var Arc;

(function(){
  "use strict";
  
  Arc = function Arc(origin, target) {
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
  
  Arc.prototype = Object.create(GraphElement.prototype);
  Arc.prototype.constructor = Arc;
  
  Arc.prototype.isNode = function() {
    return false;
  };
  
  Arc.prototype.setOrigin = function(newOrigin) {
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
  
  Arc.prototype.setTarget = function(newTarget) {
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
  