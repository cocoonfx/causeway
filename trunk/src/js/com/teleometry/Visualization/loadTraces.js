// loads information into levels and nodes


var nodes = new Array();
var levels = new Array();
var edges = new Array();
var nCnt = 0;
var lvlCnt = 0;
var edgCnt = 0;

var scrnW = 800;
var nMaxWidth = 150;
var nMinWidth = 50;
var nMaxHeight = 60;
var nMinHeight = 30;
var nHeight = 60;
var nSpacing = 20;

function loadTraces()
{

    // adding nodes to list individually
    // data structure adapts accordingly
    addElement( "[top,0]", "[buyer,0]", "##Sent");
    addElement( "[buyer,0]", "[product,1]", "postMessage({'msg': 'isAvailable',");
    addElement( "[product,1]", "[buyer,1]", "postMessage({'msg': msg,");
    addElement( "[buyer,1]", "[buyer,3]", "send(teller, 'run', [data.answer]);" );
    addElement( "[buyer,0]", "[accounts,1]", "postMessage({'msg': 'doCreditCheck',");
    addElement( "[accounts,1]", "[buyer,4]", "postMessage({'msg': msg," );
    addElement( "[buyer,4]", "[buyer,6]", "send(teller, 'run', [data.answer]);" );
    addElement( "[buyer,6]", "[buyer,7]", "send(tellAreAllTrue, 'run', [true]);" );
    addElement( "[buyer,7]", "[bottom,0]", "# All queries answered true" );
    addElement( "[buyer,7]", "[product,3]", "postMessage({'msg': 'placeOrder'," );
    addElement( "[product,3]", "[buyer,8]", "postMessage({'msg': msg," );
    addElement( "[buyer,8]", "[buyer,9]", "send(reporter, 'run', [data.answer]);" );
    addElement( "[buyer,9]", "[bottom,0]", "# Order placed for West Coast Buyers" );
    addElement( "[buyer,0]", "[product,2]", "postMessage({'msg': 'canDeliver'," );
    addElement( "[product,2]", "[buyer,2]", "postMessage({'msg': msg," );
    addElement( "[buyer,2]", "[buyer,5]", "send(teller, 'run', [data.answer]);" );

    //visualization starting with the beginning node
    visualize( nodes[0] );


};


function addElement( origin, target, label )
{

    //add new edge
    addEdge( label );

    //add or insert for origin node
    var loc = findNode( origin );
    if( loc === -1 ) // if node doesn't exist, create one
    {
        addNode( origin );
        nodes[ nodes.length-1 ].addOutEdge( edges[ edges.length-1 ] );
        edges[ edges.length-1 ].ndIn = nodes[ nodes.length-1 ];
      
        addToLevel( nodes[ nodes.length-1 ] );
    }
    else // add new edge info to existing node
    {
        nodes[loc].addOutEdge( edges[ edges.length-1 ] );
        edges[ edges.length-1 ].ndIn = nodes[loc];

    }


    //add or insert for target node
    var loc = findNode( target );
    if( loc === -1 ) // if node doesn't exist, create one
    {
        addNode( target );
        nodes[nodes.length-1].addInEdge( edges[ edges.length-1 ] );
        edges[ edges.length-1 ].ndOut = nodes[ nodes.length-1 ];

        addToLevel( nodes[ nodes.length-1 ] );
    }
    else // add new edge info to existing node
    {
        nodes[loc].addInEdge( edges[ edges.length-1 ] );
        edges[ edges.length-1 ].ndOut = nodes[loc];

        //check and move to higher level if new deeper edge connection
        var lvl = nodes[loc].findDeepestParentLevel();
        if( lvl !== (nodes[loc].level - 1) )
            moveToLevel( nodes[loc], lvl+1 ); 
    }


}

//recurse through the graph and visualize
function visualize( node )
{

    //draw node
    drawNodeVert( node );

    var i;
    for( i = 0; i < node.eOutCnt; i++ )
    {
        //draw arc
        drawArcVert( node.edgOut[i] );
        visualize( node.edgOut[i].ndOut );
    }

}

function drawNodeVert( node )
{

    //uncomment for step by step view
    //alert("node "+node.name);

    //locate
    var index = locateLevelIndex( node );
    lvl = node.level;

    var canvas = document.getElementById("canvas");
    
    var startx, starty, width, height;

    //setting height and width of node
    height = nHeight;
    starty = lvl * (nHeight+nSpacing)
    startx = 0;

    width = Math.round( (scrnW - nSpacing*levels[lvl].nCnt)/levels[lvl].nCnt );
    width = Math.max( width, nMinWidth );
    width = Math.min( width, nMaxWidth );

    startx = index * (width+nSpacing);

    //centering node
    if( width * levels[lvl].nCnt < scrnW )
    {
        var cent = function()
        {
            var cent = (index+1)* Math.round( scrnW/(levels[lvl].nCnt+1) );
            //return (cent - (width)/2);
            return cent;
        }();  
        startx = (cent - (width)/2);
    }

    //drawing the node
    if (canvas.getContext)
    {
        var ctx = canvas.getContext("2d");

        ctx.fillStyle = "rgb(200,0,0)";
        ctx.fillRect (startx, starty, width, height);

        ctx.fillStyle = "black";
        ctx.font = "8pt Helvetica";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(node.name,cent,starty+nHeight/2);
    }

}

function drawArcVert( edge )
{
    //start and end nodes
    var startNode = edge.ndIn;
    var endNode = edge.ndOut;

    var sInd = locateLevelIndex( startNode );
    var eInd = locateLevelIndex( endNode );
    slvl = startNode.level;
    elvl = endNode.level;

    var canvas = document.getElementById("canvas");

    //coordinates of line start and end
    var sCenterX = (sInd+1) * ( scrnW/(levels[slvl].nCnt+1) );  
    var sCenterY = slvl * (nHeight+nSpacing) + nHeight/2;

    var eCenterX = (eInd+1) * ( scrnW/(levels[elvl].nCnt+1) ); 
    var eCenterY = elvl * (nHeight+nSpacing) + nHeight/2;

    if( canvas.getContext )
    {
        var ctx = canvas.getContext("2d");
        
        //if edge connects nodes further than one level apart
        if( elvl - slvl > 1 && sCenterX == eCenterX )
        {
            ctx.beginPath();
            ctx.moveTo( sCenterX, sCenterY );
            ctx.lineTo( sCenterX - 30, sCenterY + nHeight/2 );
            ctx.lineTo( eCenterX - 30, eCenterY - nHeight/2 );
            ctx.lineTo( eCenterX, eCenterY );
            ctx.stroke(); 
        }
        else
        {
            ctx.beginPath();
            ctx.moveTo( sCenterX, sCenterY );
            ctx.lineTo( eCenterX, eCenterY );
            ctx.stroke();

            ctx.fillStyle = "blue";
            ctx.font = "8pt Helvetica";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText( edge.label, eCenterX, eCenterY-nHeight/2 );

        }
    }

}
