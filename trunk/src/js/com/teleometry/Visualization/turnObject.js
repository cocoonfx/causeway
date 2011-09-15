// used to hold nodes and edges within a turn
function TurnObject(name, node)
{
    this.name = name;
    this.trnNode = node

    this.trnEdges = []; // edges for turn
    this.trnConc = [];  // concurrent nodes
}

TurnObject.prototype.addEdgeToTurn = function(edge) {
    this.trnEdges.push(edge);
};

TurnObject.prototype.addConcToTurn = function(node) {
    this.trnConc.push(node);
};

