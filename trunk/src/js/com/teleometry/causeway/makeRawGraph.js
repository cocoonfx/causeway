
var graph = null;

var makeRawGraph = function(jsonChunks) {

    var msgMap = {};
    var condMap = {};
    
    var resolveds = [];
    
    //var graph = new MessageGraph();
    graph = new MessageGraph();
    
    // top has no incoming edges; bottom has no outgoing edges
    var top = graph.makeTurnNode({loop:"top", number:0});
    var bottom = graph.makeTurnNode({loop:"bottom", number:0});
    graph.addTurnNode(top);
    graph.addTurnNode(bottom);
    
    // set of source paths seen during parse
    var pathnames = new FlexSet();

    function getOrMakeTurnNode(id) {
        var node = graph.get(id);
        if (!node) {
            node = graph.makeTurnNode(id);
            graph.addTurnNode(node);
        }
        return node;
    }
    
    // Ignoring duplicate (chunkMap) problem
    
    for (var i = 0; i < jsonChunks.length; i++) {
        var chunk = jsonChunks[i];
        
        // ...
        
        var majorType = chunk["class"][chunk["class"].length -2];
        if (majorType === "org.ref_send.log.Sent") {
            var origin = getOrMakeTurnNode(chunk.anchor.turn);
            
            var edge = msgMap[chunk.message];
            if (!edge) {
                edge = graph.makeEventArc(origin, bottom);
                msgMap[chunk.message] = edge;
            } else {
                if (edge.origin === top) {
                    edge.setOrigin(origin);
                } else {
                    warn("conflict");
                }
            }
            edge.traceRecord = chunk;

            // skip setting comment to "# return"
    
            var condition = chunk.condition;
            if (condition) {
                // TODO assert that types must include SentIf
                var messages = condMap[condition] || [];
                messages.push(chunk.message);
                condMap[condition] = messages;
            }
        } else if (majorType === "org.ref_send.log.Got") {
            var target = getOrMakeTurnNode(chunk.anchor.turn);
            
            var edge = msgMap[chunk.message];
            if (!edge) {            
                edge = graph.makeEventArc(top, target);
                msgMap[chunk.message] = edge;
            } else {
                if (edge.target === bottom) {
                    edge.setTarget(target);
                } else {
                    warn("conflict");
                }
            }
            target.traceRecord = chunk;
        } else if (majorType === "org.ref_send.log.Resolved") {
            resolveds.push(chunk);
        } else if (majorType === "org.ref_send.log.Comment") {
            var origin = getOrMakeTurnNode(chunk.anchor.turn);
            var edge = graph.makeEventArc(origin, bottom);
            edge.traceRecord = chunk;
        } else {
            warn("unrecognized major type");
        }
    }
    
    for (var i = 0; i < resolveds.length; i++) {
        var r = resolveds[i];
        
        var messages = condMap[r.condition];
        if (messages) {
            for (var j = 0; j < messages.length; j++) {
                var m = messages[j];
                var target = msgMap[m].target;
                var edge = graph.makeEventArc(origin, target);
                edge.traceRecord = r;
                // skip setting comment to "# resolved"
            }
        }
    }
    
    var roots = graph.getRoots();
    for (var i = 0; i < roots.length; i++) {
        var r = roots[i];
        if (r !== top) {
            graph.makeEventArc(top, r);
        }
    }
    
    // skipping pathnames
    
    return {graph: graph, top: top, pathnames: []};
};
