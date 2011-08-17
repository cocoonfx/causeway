
function makeStatisticsModel( causewayModel, hiddenSrcPaths, vatMap, walker, canvas, ctx )
{
    //get message graph
    var messageGraph = causewayModel.getMessageGraph();

    //holds all file information
    var globFiles = new Array();
    var globCnt = new Array();
    globCnt[0] = 0;

    var bins = new Array(); //used for statistics

    //array of nodes
    var nodes = {};
    var nCnt = new Array();
    nCnt[0] = 0;
  
    //turns data structure
    var cells = new Array();
 
    var cellGrid = makeCellGrid(causewayModel);

    var tmp = 2;  
  
    canvas.addEventListener( "click", sourceClick, false );
  
    var sourceTurns = {};

    var alpha = 1;
    var dotAlpha = 1; //used for dotted lines connecting process order

    var prevCol = -1;
    var prevCell;

    var startNdx = 300;
    var ndspcg = 10;
    var trnspcg = 40;
    var cnt = 0;
    for( i in cellGrid.cells )
    {

        //adding node to turn object
        var trn = new turnObject();
        trn.addNodeToTurn( cellGrid.cells[i].node );
        trn.trnNode.setX( startNdx );  //setting x coordinate
        trn.trnNode.setAlpha( alpha ); //setting initial alpha
        startNdx += ndspcg;

        var cell = cellGrid.cells[i];
        
        //keeping track of concurrency to display at top
        if( cell.col == prevCol && prevCell != undefined )
        {
            trn.concurrent = 1;
            sourceTurns[ prevCell.node.name ].concurrent = 1;
        }

        prevCol = cell.col; //keep track of previous node to see if parallelism is possible
        prevCell = cell;

        cell.node.outs( function( edge )
        {

            trn.name = edge.getOrigin().getVatName();
            var stack = edge.traceRecord.trace.calls;
            if( stack.length > 0 )
            {
                if( !hiddenSrcPaths.contains( stack[0].source ) )
                {
                    var label = walker.getElementLabel(edge,vatMap);
                    //adding edges to file object
                    checkFile( globFiles, globCnt, stack[0].source, stack[0].span[0][0], label, edge );

                    //setting edge alpha and x coordinates
                    edge.setX( startNdx );
                    edge.setAlpha( alpha );
                    trn.addEdgeToTurn( edge );
     
                    startNdx += ndspcg;
                }
            }
        });

        //ether
        if( trn.trnEdges.length == 0 )
        {
            trn.trnNode.setY( 20 );
        }

        sourceTurns[ trn.trnNode.name ] = trn;
        cnt++;
        startNdx += trnspcg;
    }


    //put files on the screen
    drawFiles( globFiles, globCnt, nodes, canvas, ctx ); 


    //if use has clicked the canvas
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
                              setTransparencyEdge( sourceTurns, line.lnEdges[k] );  //set chosen edges
                          }
 
                          ctx.clearRect( 0, 0, canvas.width, canvas.height );
                          drawFiles( globFiles, globCnt, nodes, canvas, ctx, line );
                          dotAlpha = .2;
                          drawNodesAndEdges( sourceTurns, canvas, ctx, dotAlpha );

                      }//k
                  }//j
              }//i


          }
          else //if user has clicked a node or edge
          {

            for( i in sourceTurns )
            {

                //check if user has clicked a got node
                var node = sourceTurns[i].trnNode;
                if(    x > node.getX()-15 && x < node.getX()+15
                   &&  y > node.getY()-15 && y < node.getY()+15 )
                {
                    resetAlpha( .2 );
                    setTransparencyNode( sourceTurns, node )

                    ctx.clearRect( 0, 0, canvas.width, canvas.height );
                    drawFiles( globFiles, globCnt, nodes, canvas, ctx );
                    dotAlpha = .2;
                    drawNodesAndEdges( sourceTurns, canvas, ctx, dotAlpha );
                    return;
                }

                //check if user has clicked an edge
                var j;
                for( j = 0; j < sourceTurns[i].trnEdges.length; j++ )
                {
                    var edge = sourceTurns[i].trnEdges[j];
                    if(    x > edge.getX()-20 && x < edge.getX()+20  
                       &&  y > edge.getY()-10 && y < edge.getY()+10 ) 
                    {
                        pickEdge = edge;
                        resetAlpha( .2 );
                        setTransparencyEdge( sourceTurns, pickEdge );

                        ctx.clearRect( 0, 0, canvas.width, canvas.height );
                        drawFiles( globFiles, globCnt, nodes, canvas, ctx );
                        dotAlpha = .2;
                        drawNodesAndEdges( sourceTurns, canvas, ctx, dotAlpha );
                        return;
                    }
                }     
  
            }

            //draw everything if user clicks anywhere else
            resetAlpha( 1 );
            ctx.clearRect( 0, 0, canvas.width, canvas.height );
            drawFiles( globFiles, globCnt, nodes, canvas, ctx );
            dotAlpha = 1;
            drawNodesAndEdges( sourceTurns, canvas, ctx, dotAlpha );
        }//for loop, nodes and edges

      }//else

    }


    //setting alpha for nodes and edges
    function resetAlpha( alpha )
    {
        for( i in sourceTurns )
        {
            sourceTurns[i].trnNode.setAlpha( alpha );

            var j;
            for( j = 0; j < sourceTurns[i].trnEdges.length; j++ )
                sourceTurns[i].trnEdges[j].setAlpha( alpha );

        }
    }


    drawNodesAndEdges( sourceTurns, canvas, ctx, dotAlpha );


}

function setTransparencyNode( sourceTurns, node )
{
    var alpha = 1;
    node.setAlpha( alpha );
 
    var done = 0;

    if( sourceTurns[ node.name ].trnEdges.length > 0 )
    {
        node.outs( function( edge )
        {
            setTransparencyEdge( sourceTurns, edge );
            done = 1;
        });
    }

    if( !done )
    {
        node.ins( function( edge )
        {
            setTransparencyEdge( sourceTurns, edge );
        });
    }

}

function setTransparencyEdge( sourceTurns, edge )
{
    var alpha = 1;
    edge.setAlpha( alpha );

    var src = sourceTurns[ edge.getOrigin().name ];
    src.trnNode.setAlpha( alpha );

    if( sourceTurns[ edge.getTarget().name ] != undefined && edge.getTarget().name != "bottom: 0" )
        setTransparentRight( sourceTurns, sourceTurns[ edge.getTarget().name ], alpha );

    if( sourceTurns[ edge.getOrigin().name ] != undefined && edge.getOrigin().name != "top: 0" )
        setTransparentLeft( sourceTurns, sourceTurns[ edge.getOrigin().name ], edge, alpha );

}

function setTransparentRight( sourceTurns, src, alpha )
{
    src.trnNode.setAlpha( alpha )

    var i;
    for( i = 0; i < src.trnEdges.length; i++ )
    {
        src.trnEdges[i].setAlpha( alpha );
        var target = src.trnEdges[i].getTarget();
        if( target != undefined && target.name != "bottom: 0" )
        {
            setTransparentRight( sourceTurns, sourceTurns[ target.name ] , alpha );
        }
    }

}

function setTransparentLeft( sourceTurns, src, edge, alpha )
{
    src.trnNode.setAlpha( alpha );

    var i;
    for( i = 0; i < src.trnEdges.length; i++ )
    {
        if( src.trnEdges[i] == edge )
        {
            src.trnEdges[i].setAlpha( alpha );
          
            src.trnNode.ins( function( edge )
            {
                var origin = edge.getOrigin();
                if( origin != undefined && origin.name != "top: 0" )
                {
                    setTransparentLeft( sourceTurns, sourceTurns[ origin.name ], edge, alpha );
                }
            });            
        }
    }   
}

function drawNodesAndEdges( sourceTurns, canvas, ctx, dotAlpha )
{
    var conVats = {};

    var counter = 0
    if( canvas.getContext )
    {
        var prevVatName;
        var prevX;
        var prevCol;
        for( x in sourceTurns )
        {

            //bar for concurrency
            if( sourceTurns[x].concurrent )
            {
                ctx.fillStyle = "rgba(200,200,200,.4)";
                ctx.fillRect( sourceTurns[x].trnNode.getX(), 10, sourceTurns[x].trnEdges.length*10+10+20, 10);
            }
            else
            { 
                ctx.fillStyle = "rgba(200,200,200,1)";
                ctx.fillRect( sourceTurns[x].trnNode.getX(), 10, sourceTurns[x].trnEdges.length*10+10+20, 10);
            }
    
            var startNdx = sourceTurns[x].trnNode.getX()+5;
            var startNdy = sourceTurns[x].trnNode.getY()+5;

            //draw nodes
            ctx.beginPath();
            ctx.fillStyle = 'rgba(0,0,0,'+sourceTurns[x].trnNode.getAlpha()+')';
            ctx.moveTo( startNdx, startNdy );
            ctx.lineTo( startNdx+5, startNdy );
            ctx.lineTo( startNdx+5, startNdy+5 );
            ctx.lineTo( startNdx, startNdy+5 );
            ctx.closePath();
            ctx.fill();


            var conx;
            var cony;


            var i;
            for( i = 0; i < sourceTurns[x].trnEdges.length; i++ )
            {
                var edge = sourceTurns[x].trnEdges[i];
                var node = sourceTurns[x].trnNode;

                var startx = edge.getX()+5;
                var starty = edge.getY()+5;

                if( i == 0 ) // line between node box and first edge box
                {
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(0,0,0,'+node.getAlpha()+' )';
                    //ctx.lineWidth = 2;
                    ctx.moveTo( startNdx+2.5, startNdy+2.5 );
                    ctx.lineTo( startx+2.5, starty+2.5 );
                    ctx.stroke();
                    ctx.lineWidth = 1;
                    
                }
                else // line between edge boxes
                {
//document.write("edge alpha "+edge.getAlpha()+"<br/>");
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(0,0,0,'+node.getAlpha()+' )';
                    //ctx.lineWidth = 2;
                    ctx.moveTo( conx, cony );
                    ctx.lineTo( startx+2.5, starty+2.5 );
                    ctx.stroke();
                    ctx.lineWidth = 1;
                }

/*
                //draw edge nodes
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(0,0,0,.5)';
                ctx.moveTo( startx, starty );
                ctx.lineTo( startx+5, starty );
                ctx.lineTo( startx+5, starty+5 );
                ctx.lineTo( startx, starty+5 );
                ctx.closePath();
                ctx.fill();
*/
                conx = startx+2.5;
                cony = starty+2.5;

                //begin drawing on right of box
                startx += 2.5;//10;
                starty += 2.5;

                var target = edge.getTarget();
      
                //connect edges with bezier curves
                if( sourceTurns[ target.name ] != undefined )
                {
                    var endx;
                    var endy;

                    endx = sourceTurns[ target.name ].trnNode.getX()+7.5;
                    endy = sourceTurns[ target.name ].trnNode.getY();

                    ctx.beginPath();
                    ctx.moveTo( startx, starty );

                    ctx.bezierCurveTo( startx+(endx-startx), starty, endx-(endx-startx), endy, endx, endy+7.5 );
                    ctx.strokeStyle = 'rgba(200,0,0,'+edge.getAlpha()+' )';
                    ctx.stroke();
                    
                }
                else
                    continue; 
                
            }
            //line connecting edges between vats
            if( conVats[ sourceTurns[x].name ] == undefined )
            {
                conVats[ sourceTurns[x].name ] = x;
            }
            else
            {
                var src = sourceTurns[ conVats[ sourceTurns[x].name ] ];
                var ending;
                if( src.counter > 0 )
                    ending = src.trnEdges[ src.trnEdges.length-1 ];
                else
                    ending = src.trnNode;

                var srx = ending.getX();
                var sry = ending.getY();

                var edge = sourceTurns[x].trnNode;
                ctx.beginPath();
                ctx.strokeStyle = "rgba(0,0,0,"+dotAlpha+")";//"black";
//                ctx.moveTo( srx+7.5, sry+7.5 );
//                ctx.lineTo( edge.getX()+7.5, edge.getY()+7.5 );
                dottedLine( ctx, srx+7.5, sry+7.5, edge.getX()+7.5, edge.getY()+7.5 );
                ctx.stroke();

                conVats[ sourceTurns[x].name ] = x;
                
            }

   
            counter++;
        }

        ctx.beginPath();
        ctx.moveTo( 0, 0 );
        ctx.lineTo( 10,10 );
        ctx.stroke();
    }


}

function dottedLine( ctx, startx, starty, endx, endy )
{
    ctx.moveTo( startx, starty );

    var distx = endx - startx;
    var disty = endy - starty;
    var distance = Math.sqrt( distx*distx + disty*disty );

    var vecx = distx/distance;
    var vecy = disty/distance;

    var curx = vecx*10;
    var cury = vecy*10;
    while( startx+curx < endx )
    {

        ctx.lineTo( startx+curx, starty+cury );

        curx += vecx*2.5;
        cury += vecy*2.5;

        ctx.moveTo( startx+curx, starty+cury );

        curx += vecx*20;
        cury += vecy*20;
    }
    ctx.lineTo( endx, endy );

}

function drawFiles( globFiles, globCnt, nodes, canvas, ctx, shadeLine )
{

    var hspcg = 20;
 
    var i;
    var starty = 40;
    //looping through all files
    for( i = 0; i < globFiles.length; i++ )
    {
        //individualy visualizing files
        starty = drawOneFile( globFiles[i], starty, hspcg, canvas, ctx, shadeLine );
        starty += hspcg;

    }
    
}

function drawOneFile( file, starty, hspcg, canvas, ctx, shadeLine )
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

/*
            //if user clicked a line, shade it
            if( shadeLine != undefined && file.lines[i] == shadeLine )
            {
                ctx.fillStyle = "rgba(200,0,0,.1)";
                ctx.fillRect( startx, starty, 1100, hspcg );
            }
*/

            var j;
            for( j = 0; j < file.lines[i].lnEdges.length; j++ )
            {
                var startxNd = file.lines[i].lnEdges[j].getX();
                var edge = file.lines[i].lnEdges[j];

                edge.getOrigin().setY( nodey );
                edge.setY( starty );

                file.lines[i].ycoord = starty;

                //if user clicked a line, shade it
                if( shadeLine != undefined && file.lines[i] == shadeLine )
                {
                    ctx.fillStyle = "rgba(200,0,0,.2)";
                    ctx.fillRect( edge.getX(), starty, 15, 15 );
                }

            }


            starty += hspcg;
        }

    }

    //file shading
    ctx.beginPath()
    ctx.fillStyle = "rgba(200, 200, 200, 0.25)";
    ctx.fillRect( startx, nodey, 1100, starty-nodey );

    return starty;
}











