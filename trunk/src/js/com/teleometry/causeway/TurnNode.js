
var TurnNode = function(id, optTraceRecord) {
    Node.call(this, id);
    
    this.tag = KEEP;
    // initialize with fake got record
    this.traceRecord = optTraceRecord || {
        "class": ["org.ref_send.log.Got",
                  "org.ref_send.log.Event" ],
        anchor: {
            number: 0,
            turn: id,
        },
        message: null,
        trace: { calls: [] }
    };
};

TurnNode.prototype = Object.beget(Node.prototype);
TurnNode.prototype.constructor = TurnNode;

TurnNode.prototype.getOrigin = function() {
    return this;
};

TurnNode.prototype.getVatName = function() {
    return this.traceRecord.anchor.turn.loop;
};
