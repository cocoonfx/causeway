

function edgeObj()
{
    this.label;

    this.ndIn;
    this.ndOut;

    this.setEdge = function( label )
    {
        this.label = label;
    };
}


function addEdge( label )
{
    edges[edgCnt] = new edgeObj();
    edges[edgCnt].setEdge( label );
    edgCnt++;
}

