// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var EventArc;

(function(){
  "use strict";

  var CLIP = 0;
  var SKIP = 1;
  var KEEP = 2;
  
  EventArc = function EventArc(origin,
                               target,
                               optTraceRecord) {
    GraphArc.call(this, origin, target);
 
    this.sourceXcoord=0;
    this.sourceYcoord=0;
   
    this.tag = KEEP;
    this.traceRecord = optTraceRecord || {
      "class": ["org.ref_send.log.Sent",
                "org.ref_send.log.Event" ],
      anchor: {
        number: 0,
        turn: origin.traceRecord.anchor.turn
      },
      message: null,
      trace: { calls: [] }
    };
  };
  
  EventArc.prototype = Object.create(GraphArc.prototype);
  EventArc.prototype.constructor = EventArc;
  
  EventArc.prototype.getOrigin = function() {
    return this.origin;
  };
  
  EventArc.prototype.getKey = function() {
    return this.traceRecord.anchor;
  };

  EventArc.prototype.setX = function( val )
  {
    this.sourceXcoord = val;
  };

  EventArc.prototype.getX = function()
  {
    return this.sourceXcoord;
  };

  EventArc.prototype.setY = function( val )
  {
    this.sourceYcoord = val;
  };

  EventArc.prototype.getY = function()
  {
    return this.sourceYcoord;
  };


})();
  
