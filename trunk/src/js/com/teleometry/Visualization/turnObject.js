// used to hold nodes and edges within a turn
function turnObject()
{
    this.name;
    this.turn;
    this.concurrent = 0;

    this.trnNode; // node

    this.trnEdges = new Array(); // edges for turn

    this.trnConc = new Array(); // concurrent nodes

    this.addNodeToTurn = function ( node )
    {
        this.name = node.getVatName();
        this.trnNode = node;
    };

    this.addEdgeToTurn = function( edge )
    {
        this.trnEdges.push( edge );
    };

    this.addConcToTurn = function( node )
    {
        this.trnConc.push( node );
    };      

}

