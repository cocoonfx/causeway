
var EventArc = function(origin,
                        target,
                        optTraceRecord) {
    Arc.call(this, origin, target);
    
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

EventArc.prototype = Object.beget(Arc.prototype);
EventArc.prototype.constructor = EventArc;

EventArc.prototype.getKey = function() {
    return this.traceRecord.anchor;
};
