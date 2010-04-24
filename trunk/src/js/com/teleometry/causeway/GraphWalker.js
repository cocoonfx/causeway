
var normalizeSpan = function(span) {

    var first = 1;
    var fo = 0;
    
    var s0 = span[0];
    if (s0) {
        first = s0[0] || 1;
        fo = s0[1] || 0;
    }
    
    var last = first;
    var lo = fo;

    var s1 = span[1];
    if (s1) {
        last = s1[0] || first;
        lo = s1[1] || fo;
    }

    var ns = {};
    
    ns.firstLine = first;
    ns.firstOffset = fo;
    ns.lastLine = last;
    ns.lastOffset = lo;
    
    return ns;
}

var dbgSrcLookup = null;

var GraphWalker = function(srcRootDirName,
                           graph,
                           srcLookup) {
                           
    this.srcRootDirName = srcRootDirName;
    this.graph = graph;
    this.srcLookup = srcLookup;
    
    dbgSrcLookup = srcLookup;
    
    // skip trailing / fixup
};

GraphWalker.prototype.getOptLine = function(stackEntry) {

    if (stackEntry.source && stackEntry.span) {
    
        var pathname = this.srcRootDirName + stackEntry.source;
        var source = this.srcLookup[pathname];
        if (source) {
            var normalSpan = normalizeSpan(stackEntry.span);
            var lines = source.split("\n");
            if (normalSpan.firstLine <= lines.length) {
                return lines[normalSpan.firstLine -1];
            }
        }
    }
    return null;
};

GraphWalker.prototype.getEntryLabel = function(element,
                                               entryIndex,
                                               vatMap) {
    var result = "";
    
    var stack = element.traceRecord.trace.calls;
    if (stack.length > entryIndex) {
        var se = stack[entryIndex];
        if (se.source && se.span) {
            var line = this.getOptLine(se);
            if (line) {
                var normalSpan = normalizeSpan(se.span);
                var slice = line.slice(normalSpan.firstOffset);
                return slice;
            }
        }
    }
    return result;
};

GraphWalker.prototype.getElementLabel = function(element,
                                                 vatMap) {
    var result = "";
    
    if (element.isNode()) {
        var id = element.traceRecord.anchor.turn;
        var attr = vatMap[id.loop];
        result += "[" + attr.displayName + ", " + id.number + "]";
    }
    if (element.traceRecord.text) {
        // skip causeway comments
        result += "# " + element.traceRecord.text;
    } else if (element.traceRecord.trace.calls) { 
        result += this.getEntryLabel(element, 0, vatMap);
    }
    
    if (result === "") {
        var c = element.traceRecord.class[0].split(".");
        result += "## " + c[c.length -1];
    }
    return result;
};

