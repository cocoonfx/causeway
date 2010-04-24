
var CausewayModel = function(chunks) {
    
    var raw = makeRawGraph(chunks);
    
    // var filtered = filterGraph(raw.graph, 
    //                            raw.top,
    //                            uninterestingFilter);
    
    this.top = raw.top;
    this.graph = raw.graph;
};

CausewayModel.prototype.getTop = function() {

    return this.top;
};

CausewayModel.prototype.getBottom = function() {

    return this.graph.get({loop:"bottom", number:0});
};

CausewayModel.prototype.getVatSet = function() {

    var vatSet = {};
    
    this.top.deepOutsPre(function(edge, target) {
        var id = target.id;
        if (id.loop !== "bottom") {
            vatSet[id.loop] = true;
        }
    });
    
    var result = [];
    for (var vatName in vatSet) {
        if (vatSet.hasOwnProperty(vatName)) {
            result.push(vatName);
        }
    }
    return result;
};

var dbgOrdered = null;

CausewayModel.prototype.getPOMap = function() {

    var ordered = {};
    
    this.top.deepOutsPre(function(edge, target) {
        var id = target.id;
        if (id.loop !== "bottom") {
            var nodes = ordered[id.loop] || [];
            nodes.push(target);
            ordered[id.loop] = nodes;
        }
    });
    
    for (var vatName in ordered) {
        if (ordered.hasOwnProperty(vatName)) {
            ordered[vatName].sort(by('id.number'));
        }
    }
    
    dbgOrdered = ordered;

    return ordered;
};

CausewayModel.prototype.getPathnames = function() {

    var pathnames = {};
    
    this.top.deepOutsPre(function(edge, target) {
        if (target.traceRecord.trace) {
            var stack = target.traceRecord.trace.calls;
            if (stack) {
                for (var i = 0; i < stack.length; i++) {
                    pathnames[stack[i].source] = true;
                }
            }
        }
    });

    var result = [];
    for (var pn in pathnames) {
        if (pathnames.hasOwnProperty(pn)) {
            result.push(pn);
        }
    }
    return result;
};

CausewayModel.prototype.exportToDotFile = function(root,
                                                   //dotFile,
                                                   vatMap) {
    this.graph.connectTheDots(root, 
                              //dotFile, 
                              vatMap);
};