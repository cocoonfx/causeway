// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var GraphElement;

(function(){
  "use strict";
  
  GraphElement = function GraphElement(prevIn, nextIn, prevOut, nextOut) {
    this.prevIn = prevIn;
    this.nextIn = nextIn;
    this.prevOut = prevOut;
    this.nextOut = nextOut;
  };
})();
  