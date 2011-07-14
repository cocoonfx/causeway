

function nodeObj()
{
    this.name;
    this.level = -1;

    //edges in and edges out
    this.edgIn = new Array();
    this.edgOut = new Array();
    this.eInCnt = 0;
    this.eOutCnt = 0;


    this.setNode = function( origin )
    {
        this.name = origin;
    };

    this.addInEdge = function( edge )
    {
        this.edgIn[ this.eInCnt ] = edge;
        this.eInCnt++;
    };

    this.addOutEdge = function( edge )
    {
        this.edgOut[ this.eOutCnt ] = edge;
        this.eOutCnt++;
    };

    // searches edges to find deepest parent level for nodes with new incoming edges
    this.findDeepestParentLevel = function()
    {
        var i;
        var minLevel = -1;

        for( i = 0; i < this.eInCnt; i++)
        {
            if( this.edgIn[i].ndIn.level > minLevel )
                minLevel = this.edgIn[i].ndIn.level;
        }

        return minLevel;
    };

}


function addNode( name )
{
    nodes[nCnt] = new nodeObj();
    nodes[nCnt].setNode( name );
    nCnt++;
}

// finds if node is already in data structure and returns index, returns -1 if not
function findNode( origin )
{
    var i;
    for( i = 0; i < nodes.length; i++ )
    {
        if( nodes[i].name == origin )
            return i;
    }

    return -1;
}

