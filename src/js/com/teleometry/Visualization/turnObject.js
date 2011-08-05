
function turnObject()
{
    this.name;
    this.counter = 0;

    this.trnNodes = new Array();
    this.trnCnt = 0;

    this.addNodeToTurn = function ( node )
    {
        this.name = node.name;
        this.counter++;

        this.trnNodes[ this.trnCnt ] = node;
        this.trnCnt++;
    };

}

function addTurn( turns, ind, node )
{
//document.write("node "+node.name+" ind "+ind+"<br/>");
    if( turns[ind] == undefined )
        turns[ ind ] = new turnObject();

    turns[ ind ].addNodeToTurn( node );

}
