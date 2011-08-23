
function makeStatisticsModel( causewayModel, hiddenSrcPaths, vatMap, walker, canvas, ctx )
{
    //get message graph
    var messageGraph = causewayModel.getMessageGraph();

    //holds all file information
    var globFiles = new Array();
    var globCnt = new Array();
    globCnt[0] = 0;

    var cellGrid = makeCellGrid(causewayModel);

    canvas.addEventListener( "click", sourceClick, false );
    canvas.addEventListener( "dblclick", sourceDblClick, false );
  
    var sourceTurns = {};
    var map = new FlexMap();


    var alpha = 1;
    var dotAlpha = 1; //used for dotted lines connecting process order

    var counterins = 0;
    var counterouts = 0;

    var startNdx = 300; // begin drawing nodes/edges after file names
    var ndspcg = 10; // spacing between nodes/edges in a turn
    var trnspcg = 40; // spacing between turns
    var maxX =  0; // max x value for turns, used for file background
    for( i in cellGrid.cells )
    {

        //adding node to turn object
        var trn = new turnObject();
        trn.addNodeToTurn( cellGrid.cells[i].node );
        trn.turn = i;
        map.set( trn.trnNode, { x: 0, y: 0, alpha: 0, hlight: 0, file: 0, line: 0 } );
        map.get( trn.trnNode ).x = startNdx;
        map.get( trn.trnNode ).alpha = alpha;

        startNdx += ndspcg;

        var cell = cellGrid.cells[i];

        //stack trace for gots
        var ndStack = cell.node.traceRecord.trace.calls;
        if( ndStack.length > 0 )
        {
            var label = walker.getElementLabel( trn.trnNode, vatMap );
            checkFile( globFiles, globCnt, ndStack[0].source, ndStack[0].span[0][0], ndStack[0].span[0][1], label, trn.trnNode, 1 );
        }

        //var counter = 0;
        cell.node.ins( function(edge)
        {
            counterins++;
        });

        cell.node.outs( function( edge )
        {
            counterouts++;

            var stack = edge.traceRecord.trace.calls;
            if( stack.length > 0 )
            {
                if( !hiddenSrcPaths.contains( stack[0].source ) )
                {
                    var label = walker.getElementLabel(edge,vatMap);

                    //adding edges to file object
                    checkFile( globFiles, globCnt, stack[0].source, stack[0].span[0][0], stack[0].span[0][1], label, edge );

                    //setting edge alpha and x coordinates
                    map.set( edge, { x:0, y:0, alpha:0, hlight:0, file:0, line:0 } );
                    map.get( edge ).x = startNdx;
                    map.get( edge ).alpha = alpha;

                    trn.addEdgeToTurn( edge );
     
                    startNdx += ndspcg;
                }
            }
        });

        //ether
        if( trn.trnEdges.length == 0 )
        {
            map.get( trn.trnNode ).y = 80;
        }

        sourceTurns[ trn.trnNode.name ] = trn;
        startNdx += trnspcg;
      
        if( maxX < startNdx )
            maxX = startNdx;
    }


    //loop for concurrency
    for( i in cellGrid.byCols ) //loop by columns
    {
        var counter = 0;
        var concNodes = new Array();
        for( j in cellGrid.byCols[i] )
        {
            concNodes.push( cellGrid.byCols[i][j].node ); //keep track of nodes that can be executed together
            counter++;
        }
        for( j in cellGrid.byCols[i] )
        {
            sourceTurns[ cellGrid.byCols[i][j].node.name ].concurrent = counter; // add number of concurrent nodes
            var k;
            for( k = 0; k < concNodes.length; k++ )
                sourceTurns[ cellGrid.byCols[i][j].node.name ].addConcToTurn( concNodes[k] ); // add concurrent nodes for turn
        }
    }



    //put files/nodes/edges on the screen initially
    drawFiles( globFiles, canvas, ctx, maxX, map ); 
    drawNodesAndEdges( sourceTurns, canvas, ctx, dotAlpha, map );

    //if user has clicked the canvas
    function sourceClick( e )
    {
        var x;
        var y;
 
        //if click is in defined space
        if( e.pageX !== undefined && e.pageY !== undefined )
        {
            x = e.pageX;
            y = e.pageY;

          //check if user has clicked a source file message
          if( x > 20 && x < 300 )
          {
              var i;
              for( i = 0; i < globFiles.length; i++ )
              {
                  var j;
                  for( j = 0; j < globFiles[i].lines.length; j++ )
                  {
                      var line = globFiles[i].lines[j];
                      if( y > line.ycoord && y < line.ycoord+10 )
                      {
                          resetAlpha( .2 ); //set everything transparent
                          var k; 
                          for( k = 0; k < line.lnEdges.length; k++)
                          {
                              if( line.isgot )
                                  setTransparencyNode( sourceTurns, line.lnEdges[k], map );  //set chosen nodes
                              else
                                  setTransparencyEdge( sourceTurns, line.lnEdges[k], map );  //set chosen edges
                              map.get( line.lnEdges[k] ).hlight = 1; // highlight nodes/edges
                          }
 
                          redraw( .2 );
                          return;
                      }//k
                  }//j
              }//i


          }
          else if ( x > 300 && y < 30 ) // user clicked turn bar at the top
          {
            for( i in sourceTurns )
            {
                //find turn
                var node = sourceTurns[i].trnNode;
                if( x > map.get(node).x-15 && x < map.get(node).x+15 )
                {
                    resetAlpha( .2 );

                    // show only nodes that can be executed concurrently with chosen turn
                    var k;
                    for( k = 0; k < sourceTurns[i].trnConc.length; k++ )
                    {
                        map.get( sourceTurns[i].trnConc[k] ).alpha = 1;
                        map.get( sourceTurns[i].trnConc[k] ).hlight = 1;
                    }

                    redraw( .2 );
                    return;
                }

            }//for

          }
          else //if user has clicked a node or edge
          {

            for( i in sourceTurns ) //loop through turns
            {

                //check if user has clicked a got node
                var node = sourceTurns[i].trnNode;
                if(    x > map.get(node).x-15 && x < map.get(node).x+15
                   &&  y > map.get(node).y-15 && y < map.get(node).y+15 )
                {
                    resetAlpha( .2 );
                    setTransparencyNode( sourceTurns, node, map )
                    map.get( node ).hlight = 1;

                    redraw( .2 );
                    return;
                }

                //check if user has clicked an edge
                var j;
                for( j = 0; j < sourceTurns[i].trnEdges.length; j++ )
                {
                    var edge = sourceTurns[i].trnEdges[j];
                    if(    x > map.get(edge).x-10 && x < map.get(edge).x+10  
                       &&  y > map.get(edge).y-5 && y < map.get(edge).y+15 ) 
                    {
                        resetAlpha( .2 );
                        setTransparencyEdge( sourceTurns, edge, map );
                        map.get( edge ).hlight = 1;

                        redraw( .2 );
                        return;
                    }
                }     
  
            }// for loop, nodes and edges

        }// else

        //draw everything if user clicks anywhere else
        resetAlpha( 1 );
        redraw( 1 );

      }// if valid click

    }

    //draws process order only
    function sourceDblClick( e )
    {
        var x;
        var y;

        //if click is in defined space
        if( e.pageX !== undefined && e.pageY !== undefined )
        {
            x = e.pageX;
            y = e.pageY;

            for( i in sourceTurns )
            {
                //check if user has clicked a got node
                var node = sourceTurns[i].trnNode;
                if(    x > map.get(node).x-15 && x < map.get(node).x+15
                   &&  y > map.get(node).y-15 && y < map.get(node).y+15 )
                {
                    resetAlpha( .2 );
                    redraw( 1 );
                    return;
                }
            }
        }
    }//dblclick


    //setting alpha for nodes and edges
    function resetAlpha( alpha )
    {
        for( i in sourceTurns )
        {
            map.get( sourceTurns[i].trnNode).alpha = alpha;
            map.get( sourceTurns[i].trnNode ).hlight = 0;

            var j;
            for( j = 0; j < sourceTurns[i].trnEdges.length; j++ )
            {
                map.get( sourceTurns[i].trnEdges[j] ).alpha = alpha;
                map.get( sourceTurns[i].trnEdges[j] ).hlight = 0;
            }
        }
    }

    // redraw after click
    function redraw( dalpha )
    {
        ctx.clearRect( 0, 0, canvas.width, canvas.height );
        drawFiles( globFiles, canvas, ctx, maxX, map );
        dotAlpha = dalpha;
        drawNodesAndEdges( sourceTurns, canvas, ctx, dotAlpha, map );
    }


}

function setTransparencyNode( sourceTurns, node, map )
{
    var alpha = 1;
    map.get( node ).alph = alpha;
 
    var done = 0;

    //start with 'out' edges, setTransparencyEdge will go through 'in' edges as well
    if( sourceTurns[ node.name ].trnEdges.length > 0 )
    {
        node.outs( function( edge )
        {
            setTransparencyEdge( sourceTurns, edge, map );
            done = 1;
        });
    }

    if( !done ) // if no 'out' edges, loop through 'in' edges
    {
        node.ins( function( edge )
        {
            setTransparencyEdge( sourceTurns, edge, map );
        });
    }

}

function setTransparencyEdge( sourceTurns, edge, map )
{
    var alpha = 1;

    map.get( edge ).alpha = alpha;


    if( edge.getOrigin().name != "top: 0" )
    {
        var src = sourceTurns[ edge.getOrigin().name ]; //find relevant sourceTurn object

        map.get( src.trnNode ).alpha = alpha;
 
        //check right, out
        if( sourceTurns[ edge.getTarget().name ] != undefined && edge.getTarget().name != "bottom: 0" )
            setTransparentRight( sourceTurns, sourceTurns[ edge.getTarget().name ], alpha, map );

        //check left, in
        if( sourceTurns[ edge.getOrigin().name ] != undefined && edge.getOrigin().name != "top: 0" )
            setTransparentLeft( sourceTurns, sourceTurns[ edge.getOrigin().name ], edge, alpha, map );
    }
}

function setTransparentRight( sourceTurns, src, alpha, map )
{
    map.get( src.trnNode ).alpha = alpha; //node transparency

    var i;
    for( i = 0; i < src.trnEdges.length; i++ )
    {
        map.get( src.trnEdges[i] ).alpha = alpha; // edge transparency

        //continue to the right, out edges
        var target = src.trnEdges[i].getTarget();
        if( target != undefined && target.name != "bottom: 0" )
        {
            setTransparentRight( sourceTurns, sourceTurns[ target.name ] , alpha, map );
        }
    }

}

function setTransparentLeft( sourceTurns, src, edge, alpha, map )
{
    map.get( src.trnNode ).alpha = alpha; // node transparency

    var i;
    for( i = 0; i < src.trnEdges.length; i++ )
    {
        if( src.trnEdges[i] == edge )
        {
            map.get( src.trnEdges[i] ).alpha = alpha; // edge transparency
          
            src.trnNode.ins( function( edge )
            {
                //continue to the left, in edges
                var origin = edge.getOrigin();
                if( origin != undefined && origin.name != "top: 0" )
                {
                    setTransparentLeft( sourceTurns, sourceTurns[ origin.name ], edge, alpha, map );
                }
            });            
        }
    }   
}

function drawNodesAndEdges( sourceTurns, canvas, ctx, dotAlpha, map )
{
    //storing connected vats
    var conVats = {};

    if( canvas.getContext )
    {
        for( x in sourceTurns )
        {
            var node = sourceTurns[x].trnNode;

            //bar for concurrency
            ctx.fillStyle = "rgba(100,100,100,"+Math.max(1-(2*sourceTurns[x].concurrent/10),0)+")";
            ctx.fillRect( map.get(node).x+10, 10, sourceTurns[x].trnEdges.length*10+20, 10);

            var str = "" + sourceTurns[x].concurrent + "";
            ctx.fillStyle = "rgb(0,0,0)";//"black";
            ctx.font = "8pt Helvetica";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText( str, map.get(node).x , 9 );

    
            var startNdx = map.get(node).x+5;
            var startNdy = map.get(node).y+5;

            //draw nodes
            ctx.beginPath();
            ctx.fillStyle = 'rgba(0,0,0,'+map.get(node).alpha+')';
            ctx.moveTo( startNdx, startNdy );
            ctx.lineTo( startNdx+5, startNdy );
            ctx.lineTo( startNdx+5, startNdy+5 );
            ctx.lineTo( startNdx, startNdy+5 );
            ctx.closePath();
            ctx.fill();

            //highlight picked nodes
            if( map.get( node ).hlight == 1 )
            {
                ctx.fillStyle = "rgba(200,0,0,.2)";
                ctx.fillRect( map.get( node ).x, map.get( node ).y, 15, 15 );
            }

            var conx;
            var cony;

            var i;
            //setting transparancy flag for turns, so not entire turn is opaque if not all edges are shown
            var alphaFlag = 0;
            for( i = 0; i < sourceTurns[x].trnEdges.length; i++ )
            {
                if( map.get( sourceTurns[x].trnEdges[i] ).alpha == 1 )
                    alphaFlag = i;
            }

            var diffbez = 10;
            for( i = 0; i < sourceTurns[x].trnEdges.length; i++ )
            {
                var edge = sourceTurns[x].trnEdges[i];

                var startx = map.get( edge ).x+5;
                var starty = map.get( edge ).y+5;

                //draw solid black turn line
                if( i == 0 ) // line between node box and first edge box
                {
                    ctx.beginPath();
                    if( dotAlpha == 1 && map.get( edge ).alpha != 1 ) //opaque for process order
                        ctx.strokeStyle = 'rgba(0,0,0,1)';
                    else if( alphaFlag == 0 ) // when user clicks turn for concurrency
                        ctx.strokeStyle = 'rgba(0,0,0,'+map.get( edge ).alpha+' )'; 
                    else
                        ctx.strokeStyle = 'rgba(0,0,0,'+map.get( node ).alpha+' )';
                    //ctx.lineWidth = 2;
                    ctx.moveTo( startNdx+2.5, startNdy+2.5 );
                    ctx.lineTo( startx+2.5, starty+2.5 );
                    ctx.stroke();
                    ctx.lineWidth = 1;
                    
                }
                else // line between edge boxes
                {
                    ctx.beginPath();
                    if( dotAlpha == 1 && map.get( edge ).alpha != 1 ) // opaque for process order
                        ctx.strokeStyle = 'rgba(0,0,0,1)';
                    else if( i < alphaFlag )
                        ctx.strokeStyle = 'rgba(0,0,0,'+map.get( node ).alpha+' )'; // opaque until last opaque edge
                    else
                        ctx.strokeStyle = 'rgba(0,0,0,'+map.get( edge ).alpha+' )';
                    //ctx.lineWidth = 2;
                    ctx.moveTo( conx, cony );
                    ctx.lineTo( startx+2.5, starty+2.5 );
                    ctx.stroke();
                    ctx.lineWidth = 1;
                }
                conx = startx+2.5;
                cony = starty+2.5;

                //draw edge nodes
                ctx.beginPath();
                ctx.fillStyle = 'rgba(200,0,0,'+map.get( edge ).alpha+')';
                ctx.moveTo( startx, starty );
                ctx.lineTo( startx+5, starty );
                ctx.lineTo( startx+5, starty+5 );
                ctx.lineTo( startx, starty+5 );
                ctx.closePath();
                ctx.fill();

                // highlight picked edges
                if( map.get( edge ).hlight == 1 )
                {
                    ctx.fillStyle = "rgba(200,0,0,.2)";
                    ctx.fillRect( map.get( edge ).x, map.get( edge ).y, 15, 15 );
                }


                //begin drawing on right of box
                startx += 2.5;
                starty += 2.5;

                var target = edge.getTarget();
      
                //connect sent edges with bezier curves or mark fulfilleds 
                if( sourceTurns[ target.name ] != undefined )
                {
                    var endx;
                    var endy;

                    endx = map.get( sourceTurns[ target.name ].trnNode ).x+7.5;
                    endy = map.get( sourceTurns[ target.name ].trnNode ).y+7.5;

                    ctx.beginPath();
                    ctx.moveTo( startx, starty );

                    //help differentiate bezier curves
                    var eb;
                    var sb;
                    if( starty < endy )
                    {
                        sb = starty - diffbez;
                        eb = endy + diffbez;
                    }
                    else
                    {
                        sb = starty + diffbez;
                        eb = endy - diffbez;
                    }

                    //if fulfilled, mark the node
                    var str = new String( edge.traceRecord.class );
                    if( str.match("Fulfilled") != null )
                    {
                        ctx.fillStyle = 'rgba(61,89,171,'+map.get( edge ).alpha+')';                        
                        ctx.beginPath();
                        ctx.moveTo( endx-2.5, starty );
                        ctx.lineTo( endx+2.5, starty );
                        ctx.lineTo( endx, endy );
                        ctx.closePath(); 
                        ctx.fill();
                    }
                    else // if sent, draw bezier
                    {
                        ctx.bezierCurveTo( startx+(endx-startx), sb, endx-(endx-startx), eb, endx, endy );
                        ctx.strokeStyle = 'rgba(200,0,0,'+map.get( edge ).alpha+' )';
                        ctx.stroke();
                        diffbez+=5;
                    }
             
                }
                else
                    continue; 
                
            }

            //line connecting nodes between vats, process order
            if( conVats[ sourceTurns[x].name ] == undefined )
            {
                conVats[ sourceTurns[x].name ] = x;
            }
            else
            {
                var src = sourceTurns[ conVats[ sourceTurns[x].name ] ];
                var ending;
                if( src.trnEdges.length > 0 )
                    ending = src.trnEdges[ src.trnEdges.length-1 ];
                else
                    ending = src.trnNode;

                var srx = map.get( ending ).x;
                var sry = map.get( ending ).y;

                var edge = sourceTurns[x].trnNode;
                ctx.beginPath();
                ctx.strokeStyle = "rgba(0,0,0,"+dotAlpha+")";//"black";
                dottedLine( ctx, srx+7.5, sry+7.5, map.get( edge ).x+7.5, map.get( edge ).y+7.5 );
                ctx.stroke();

                conVats[ sourceTurns[x].name ] = x; //holds last known turn for specific vat
                
            }

        }

        //weird draw bug, wont go away unless I draw something irrelevant last
        ctx.beginPath();
        ctx.moveTo( 0, 0 );
        ctx.lineTo( 10,0 );
        ctx.stroke();

    }


}

//draws a dotted line between to points
function dottedLine( ctx, startx, starty, endx, endy )
{
    ctx.moveTo( startx, starty );

    var distx = endx - startx;
    var disty = endy - starty;
    var distance = Math.sqrt( distx*distx + disty*disty );

    //converting to vectors
    var vecx = distx/distance;
    var vecy = disty/distance;

    //begining dot from start point
    var curx = vecx*10;
    var cury = vecy*10;

    //loop drawing lines
    while( startx+curx < endx )
    {

        //space of 2.5
        ctx.lineTo( startx+curx, starty+cury );

        curx += vecx*2.5;
        cury += vecy*2.5;

        //draw for distance of 20
        ctx.moveTo( startx+curx, starty+cury );

        curx += vecx*20;
        cury += vecy*20;
    }
    ctx.lineTo( endx, endy );

}

function drawFiles( globFiles, canvas, ctx, maxX, map )
{

    var hspcg = 20;
 
    var i;
    var starty = 40;
    //looping through all files
    for( i = 0; i < globFiles.length; i++ )
    {
        //individualy visualizing files
        starty = drawOneFile( globFiles[i], starty, hspcg, canvas, ctx, maxX, map );
        starty += hspcg;

    }
    
}

function drawOneFile( file, starty, hspcg, canvas, ctx, maxX, map )
{


    var startx = 20;

    var nodey = starty;

    if( canvas.getContext )
    {

        //display files
        ctx.fillStyle = "rgb(0,0,0)";//"black";
        ctx.font = "10pt Helvetica";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText( file.name, startx, starty );
        
        //draw marks on top of file boxes, aesthetics only
        ctx.strokeStyle = "rgba(200,0,0,1)";
        ctx.moveTo( startx, starty );
        ctx.lineTo( startx+50, starty);
        ctx.stroke();

        starty += hspcg;

        var i;
        for( i = 0; i < file.lines.length; i++ )
        {
            //display line numbers and messages
            var str = file.lines[i].lineNum + " " + file.lines[i].message;
            ctx.fillStyle = "rgb(0,0,0)";//"black";
            ctx.font = "8pt Helvetica";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText( str, startx+20, starty );

            //setting y coordinates for nodes and edges
            var toHighlight = 1;
            var j;
            for( j = 0; j < file.lines[i].lnEdges.length; j++ )
            {
                var startxNd = map.get( file.lines[i].lnEdges[j] ).x;
                var edge = file.lines[i].lnEdges[j];

                if( edge.getOrigin().traceRecord.trace.calls.length == 0 )
                    map.get( edge.getOrigin() ).y =  nodey;
   
                if( map.get( edge ).hlight == 1 && toHighlight )
                {
                    ctx.fillStyle = "rgba(200,0,0,.2)";
                    ctx.fillRect( startx, starty, 275, 15 );
                    toHighlight = 0;
                }

                map.get( edge ).y = starty;

                file.lines[i].ycoord = starty;


            }


            starty += hspcg;
        }

    }

    //file shading
    ctx.beginPath()
    ctx.fillStyle = "rgba(200, 200, 200, 0.25)";
    ctx.fillRect( startx, nodey, maxX, starty-nodey );

    return starty;
}











