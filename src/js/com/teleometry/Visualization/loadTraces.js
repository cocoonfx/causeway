
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

var nHheight = 6;
var nHwidth = 6;
var xHspcg = 250;
var yHspcg = 60;
var xInitialSpcg = 60;
var yInitialSpcg = 60;

function loadTraces()
{
    // adding nodes to list individually
    // data structure adapts accordingly
    addElement( "[top,0]", "[buyer,0]", "##Sent", "black", "blue", 0,1 );
    addElement( "[buyer,0]", "[product,1]", "postMessage({'msg': 'isAvailable',", "blue", "green",1,2 );
    addElement( "[product,1]", "[buyer,1]", "postMessage({'msg': msg,", "green", "blue",2,2 );
    addElement( "[buyer,1]", "[buyer,3]", "send(teller, 'run', [data.answer]);", "blue", "red",2,4 );
    addElement( "[buyer,0]", "[accounts,1]", "postMessage({'msg': 'doCreditCheck',", "blue", "purple",1,2 );
    addElement( "[accounts,1]", "[buyer,4]", "postMessage({'msg': msg," , "purple", "blue",2,5 );
    addElement( "[buyer,4]", "[buyer,6]", "send(teller, 'run', [data.answer]);", "blue", "blue",5,7 );
    addElement( "[buyer,6]", "[buyer,7]", "send(tellAreAllTrue, 'run', [true]);", "blue", "blue",7,8 );
    addElement( "[buyer,7]", "[bottom,0]", "# All queries answered true", "blue", "red",8,1 );
    addElement( "[buyer,7]", "[product,3]", "postMessage({'msg': 'placeOrder',", "blue", "green",8,4 );
    addElement( "[product,3]", "[buyer,8]", "postMessage({'msg': msg,", "green", "blue",4,9 );
    addElement( "[buyer,8]", "[buyer,9]", "send(reporter, 'run', [data.answer]);", "blue", "blue",9,10 );
    addElement( "[buyer,9]", "[bottom,0]", "# Order placed for West Coast Buyers", "blue", "red",10,1 );
    addElement( "[buyer,0]", "[product,2]", "postMessage({'msg': 'canDeliver',", "blue", "green",1,3 );
    addElement( "[product,2]", "[buyer,2]", "postMessage({'msg': msg,", "green", "blue",3,3 );
    addElement( "[buyer,2]", "[buyer,5]", "send(teller, 'run', [data.answer]);", "blue", "red",3,6 );


//    addElement( "[buyer,3]", "[tester,1]", "standard message", "red", "red" );
//    addElement( "[buyer,3]", "[tester,2]", "standard message", "red", "red" );
//    addElement( "[buyer,3]", "[tester,3]", "standard message", "red", "red" );
//    addElement( "[buyer,4]", "[tester,4]", "standard message", "blue", "red" );
//    addElement( "[product,1]", "[tester,5]", "standard message", "green", "red" );
//    addElement( "[tester,5]", "[tester,6]", "standard message", "red", "red" );
//    addElement( "[tester,6]", "[tester,7]", "standard message", "red", "red" );

//    addElement( "[top,0]", "[test,1]", "make paths", "black", "red" );
//    addElement( "[test,1]", "[accounts,1]", "readable", "red", "purple" );


    //visualization starting with the beginning node
    visualize( nodes[0] );


    //printInfo();
};


function addElement( origin, target, label, colorO, colorT, orderO, orderT )
{

    //add new edge
    addEdge( label );

    //add or insert for origin node
    var loc = findNode( origin );
    if( loc === -1 ) // if node doesn't exist, create one
    {

        addNode( origin, colorO, orderO );
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

        addNode( target, colorT, orderT );
        nodes[nodes.length-1].addInEdge( edges[ edges.length-1 ] );
        edges[ edges.length-1 ].ndOut = nodes[ nodes.length-1 ];

        nodes[nodes.length-1].setgInd(); 

        addToLevel( nodes[ nodes.length-1 ] );

    }
    else // add new edge info to existing node
    {
        nodes[loc].addInEdge( edges[ edges.length-1 ] );
        edges[ edges.length-1 ].ndOut = nodes[loc];

        nodes[loc].setgInd();

        //check and move to higher level if new deeper edge connection
        var lvl = nodes[loc].findDeepestParentLevel();
        if( lvl !== (nodes[loc].level - 1) )
            moveToLevel( nodes[loc], lvl+1 );

    }


}

function printInfo()
{
    var i;
    for( i = 0; i < levels.length; i++ )
    {

        var j;
        for( j = 0; j < levels[i].nodes.length; j++ )
        {
            var nd = levels[i].nodes[j];
            document.write("nodes "+nd.name+" "+nd.gInd+"<br/>");
        }
    }

}

//recurse through the graph and visualize
function visualize( node )
{

    //draw node
    //drawNodeVert( node );
//    node.setgInd();
    if( !node.drawn )
{
        node.setgInd();
//}
        drawNodeHoriz( node );   
}

    var i;
    for( i = 0; i < node.eOutCnt; i++ )
    {
        //draw arc
        //drawArcVert( node.edgOut[i] );
        if( !node.edgOut[i].drawn )
            drawArcHoriz( node.edgOut[i] );
        visualize( node.edgOut[i].ndOut );
    }

}


function drawNodeHoriz( node )
{
    var index = locateLevelIndex( node );
    lvl = node.level;
    depth = Math.max( node.gInd, levels[lvl].depth );
    node.gInd = depth;

    var canvas = document.getElementById("canvas");

    var startx = xInitialSpcg + xHspcg*lvl;
    var starty = yInitialSpcg + yHspcg*depth;


    if (canvas.getContext)
    {
        var ctx = canvas.getContext("2d");

        ctx.fillStyle = node.color;
        ctx.fillRect (startx, starty, nHwidth, nHheight);

        ctx.fillStyle = node.color;
        ctx.font = "8pt Helvetica";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(node.name,startx,starty-30);

    }
    
    levels[lvl].depth = Math.max( node.gInd+1, levels[lvl].depth+1 );
    node.drawn = 1;
    node.drawnDepth = depth;
}


function drawArcHoriz( edge )
{
    //start and end nodes
    var startNode = edge.ndIn;
    var endNode = edge.ndOut;

    //if(!endNode.drawn)
    endNode.setgInd();

    var slvl = startNode.level;
    var elvl = endNode.level;
    var sInd = Math.max( startNode.gInd, levels[slvl].depth -1 );//locateLevelIndex( startNode );
    var eInd;
    if(!endNode.drawn)
        eInd = Math.max( endNode.gInd, levels[elvl].depth  );//locateLevelIndex( endNode );
    else
        eInd = endNode.drawnDepth;//endNode.gInd;

    var canvas = document.getElementById("canvas");
 
    var startx = xInitialSpcg + xHspcg*slvl + nHwidth/2;
    var starty = yInitialSpcg + yHspcg*sInd + nHheight/2; 

    var endx = xInitialSpcg + xHspcg*elvl + nHwidth/2;
    var endy = yInitialSpcg + yHspcg*eInd + nHheight/2;    

    if( canvas.getContext )
    {
        var ctx = canvas.getContext("2d");
        ctx.lineJoin = "round";
        ctx.lineWidth = 1;


        //if edge connects nodes further than one level apart
      for( i = slvl; i < elvl; i++ )
      {
        if(i > slvl && i < elvl )
            levels[i].depth = Math.max( startNode.gInd+1, levels[i].depth+1 );
            //levels[i].depth++;

        if( elvl - i > 1 )// && sCenterX == eCenterX )
        {
           ctx.beginPath()
           ctx.moveTo( startx, starty )
           startx += xHspcg;// + nHwidth/2;
           ctx.lineTo( startx, starty );
           ctx.stroke()

        }
        else
        {
            ctx.beginPath();
            if( sInd == eInd )
            {
                ctx.moveTo( startx, starty );
                ctx.lineTo( startx+.1*xHspcg, starty-.3*yHspcg );
                ctx.lineTo( startx+.9*xHspcg, starty-.3*yHspcg );
                ctx.lineTo( endx, endy );
                ctx.stroke();

                var centerx = startx+.1*xHspcg;//(startx+xHspcg)/2;
                var centery = starty-.3*yHspcg;

                ctx.fillStyle = startNode.color;
                ctx.font = "8pt Helvetica";
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.fillText( edge.label, centerx, centery );

            }
            else
            {
                var yindex = eInd-sInd - 1;
                ctx.moveTo( startx, starty );
                ctx.lineTo( startx+.1*xHspcg, starty+.3*yHspcg + yHspcg*yindex );
                ctx.lineTo( startx+.9*xHspcg, starty+.3*yHspcg + yHspcg*yindex );
                ctx.lineTo( endx, endy );
                ctx.stroke();

                var centerx = startx+.1*xHspcg;
                var centery = starty+.3*yHspcg + yHspcg*yindex;

                ctx.fillStyle = startNode.color;//"blue";
                ctx.font = "8pt Helvetica";
                ctx.textAlign = "left";
                ctx.textBaseline = "bottom";
                ctx.fillText( edge.label, centerx, centery );

            }
        }
      }

    }

    edge.drawn = 1;
}

function drawArcDown( lDiff, startx, starty, ex, ey )
{
    ex.value = startx + 10;
    ey.value = starty + yHspcg*lDiff;
}

function drawNodeVert( node )
{

    //uncomment for step by step view
    alert("node "+node.name);

    //locate
    var index = locateLevelIndex( node );
    var lvl = node.level;

    var canvas = document.getElementById("canvas");

    var startx, starty, width, height;

    //setting height and width of node
    height = nHeight;
    starty = lvl * (nHeight+nSpacing);
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
    var slvl = startNode.level;
    var elvl = endNode.level;

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
        if (elvl - slvl > 1 && sCenterX == eCenterX )
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
