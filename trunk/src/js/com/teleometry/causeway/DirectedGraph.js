
function getIdent(id) {
    return id.loop + ": " + id.number;
}

var DirectedGraph = function() {
    this.graph = {};
};

DirectedGraph.prototype.addNode = function(node) {
    this.graph[getIdent(node.traceRecord.anchor.turn)] = node;
};

DirectedGraph.prototype.removeNode = function(node) {
    delete this.graph[getIdent(node.traceRecord.anchor.turn)];
};

DirectedGraph.prototype.get = function(id) {
    return this.graph[getIdent(id)];
};

DirectedGraph.prototype.getRoots = function() {
    var roots = [];
    for (var ident in this.graph) {
        var v = this.graph[ident];
        if (v.isRoot()) {
            roots.push(v);
        }
    }
    return roots;
};

DirectedGraph.prototype.getLeaves = function() {
    var leaves = [];
    for (var ident in this.graph) {
        var v = this.graph[ident];
        if (v.isLeaf()) {
            leaves.push(v);
        }
    }
    return leaves;
};
