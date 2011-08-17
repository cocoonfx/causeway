
function turnObject()
{
    this.name;
    this.counter = 0;
    this.turn;
    this.concurrent = 0;

    this.trnNode;

    this.trnEdges = new Array();

    this.addNodeToTurn = function ( node )
    {
        this.name = node.getVatName();
        this.trnNode = node;
    };

    this.addEdgeToTurn = function( edge )
    {
        this.trnEdges.push( edge );
        this.counter++;
    }

}

function addTurn( turns, ind, node )
{
//document.write("node "+node.name+" ind "+ind+"<br/>");
    if( turns[ind] == undefined )
        turns[ ind ] = new turnObject();

    turns[ ind ].addNodeToTurn( node );
    turns[ ind ].turn = ind;
}
