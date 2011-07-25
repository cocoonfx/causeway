

function nodeObj()
{
    this.name; 
    this.level = -1;
    this.gInd = 0;
    this.color;
    this.drawn = 0;
    this.drawnDepth = 0;
    this.order = 0;

    //edges in and edges out
    this.edgIn = new Array();
    this.edgOut = new Array();
    this.eInCnt = 0;
    this.eOutCnt = 0;
 

    this.setNode = function( origin, color, order )
    {
        this.name = origin;
        this.color = color;
        this.order = order;
    }

    this.addInEdge = function( edge )
    {
        this.edgIn[ this.eInCnt ] = edge;
        this.eInCnt++;
    }

    this.addOutEdge = function( edge )
    {
        this.edgOut[ this.eOutCnt ] = edge;
        this.eOutCnt++;
    }    

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
    }

    this.setgInd = function()
    {
        //var nd = nodes[ nodes.length-1 ];
        var i; 
        var prnt;
        var ind = 0;
        var num = 0;
        for( i = 0; i < this.edgIn.length; i++ )
        {
            if( num < this.edgIn[i].ndIn.gInd )
            {
                num = this.edgIn[i].ndIn.gInd;
                //prnt = this.edgIn[i].ndIn;
                ind = i;
            }
        }

        if( this.edgIn.length > 0 )
        {   

            prnt = this.edgIn[ind].ndIn;
            for( i = 0; i < prnt.edgOut.length; i++ )
            {
                if( prnt.edgOut[i].ndOut.name == this.name )
                    ind = i;
            }

            //this.gInd = (prnt.edgOut.length-1) + prnt.gInd;
            this.gInd = prnt.gInd + this.edgIn.length-1;    
            //this.gInd = prnt.gInd + ind + this.edgIn.length-1;
        }
        else
        {
            this.gInd = 0;
        }
    }

}


function addNode( name, color, order )
{
    nodes[nCnt] = new nodeObj();
    nodes[nCnt].setNode( name,color,order );
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


