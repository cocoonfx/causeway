// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var TurnNode;

(function(){
  "use strict";

  var CLIP = 0;
  var SKIP = 1;
  var KEEP = 2;

  TurnNode = function TurnNode(id, optTraceRecord) {
    GraphNode.call(this, TurnNode.idToName(id));
    this.id = id;

    this.tag = KEEP;
    // initialize with fake got record
    this.traceRecord = optTraceRecord || {
      "class": ["org.ref_send.log.Got",
                "org.ref_send.log.Event" ],
      anchor: {
        number: 0,
        turn: id
      },
      message: null,
      trace: { calls: [] }
    };
  };

  TurnNode.idToName = function(id) {
    return id.loop + ": " + id.number;
  };

  TurnNode.prototype = Object.create(GraphNode.prototype);
  TurnNode.prototype.constructor = TurnNode;

  TurnNode.prototype.getOrigin = function() {
    return this;
  };

  TurnNode.prototype.getVatName = function() {
    return this.traceRecord.anchor.turn.loop;
  };

})();
