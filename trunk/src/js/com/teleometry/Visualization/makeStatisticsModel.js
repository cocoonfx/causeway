
function makeStatisticsModel( causewayModel, jsonChunks, hiddenSrcPaths, vatMap, walker, canvas, ctx, modelflag )
{
    //get message graph
    var model = causewayModel;
    if( modelflag != undefined )
        model = makeCausewayModel( jsonChunks, hiddenSrcPaths );


    //holds all file information
    var globFiles = [];

    var cellGrid = makeCellGrid(model);

    canvas.addEventListener( "click", sourceClick, false );
    canvas.addEventListener( "dblclick", sourceDblClick, false );
  
    var sourceTurns = {};
    var map = new FlexMap();

    var alpha = 1;
    var dotAlpha = 1; //used for dotted lines connecting process order

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
        map.set( trn.trnNode, { x: 0, y: 0, alpha: 0, hlight: 0 } );
        map.get( trn.trnNode ).x = startNdx;
        map.get( trn.trnNode ).alpha = alpha;

        startNdx += ndspcg;

        var cell = cellGrid.cells[i];

        //stack trace for gots
        var ndStack = cell.node.traceRecord.trace.calls;
        if( ndStack.length > 0 )
        {
            var label = walker.getElementLabel( trn.trnNode, vatMap );
            var fl = checkFile( globFiles, ndStack[0].source, ndStack[0].span, label, trn.trnNode, 1 );
        }

        cell.node.outs( function( edge )
        {

            var stack = edge.traceRecord.trace.calls;
            if( stack.length > 0 )
            {
                if( !hiddenSrcPaths.contains( stack[0].source ) )
                {
                    var label = walker.getElementLabel(edge,vatMap);

                    //adding edges to file object
                    //checkFile( globFiles, stack[0].source, stack[0].span[0][0], stack[0].span[0][1], label, edge );
                    var fl = checkFile( globFiles, stack[0].source, stack[0].span, label, edge );

                    //setting edge alpha and x coordinates
                    map.set( edge, { x:0, y:0, alpha:0, hlight:0 } );
                    map.get( edge ).x = startNdx;
                    map.get( edge ).alpha = alpha;

                    trn.addEdgeToTurn( edge );
     
                    startNdx += ndspcg;
                }
            }
        });

        //ether
        if( trn.trnNode.traceRecord.trace.calls.length == 0 )//trn.trnEdges.length == 0 )
        {
            map.get( trn.trnNode ).y = 20;
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
    drawSourcilloscopeGrid( globFiles, sourceTurns, canvas, ctx, maxX, map, dotAlpha, 1 );

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

          if( x> 20 && x < 50 ) //check box
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
                          var k;
                          for( k = 0; k < line.lnElements.length; k++)
                          {
                              removeChunkCall( line.lnElements[k] );
                          }

                          return;
                      }//k
                  }//j
              }//i     
          }
          else if( x > 50 && x < 300 ) //check if user has clicked a source file message to highlight
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
                          for( k = 0; k < line.lnElements.length; k++)
                          {
                              if( line.isgot )
                                  setTransparencyNode( sourceTurns, line.lnElements[k], map );  //set chosen nodes
                              else
                                  setTransparencyEdge( sourceTurns, line.lnElements[k], map );  //set chosen edges
                              map.get( line.lnElements[k] ).hlight = 1; // highlight nodes/edges
                          }
 
                          drawSourcilloscopeGrid( globFiles, sourceTurns, canvas, ctx, maxX, map, .2 );
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

                    drawSourcilloscopeGrid( globFiles, sourceTurns, canvas, ctx, maxX, map, .2 );
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

                    drawSourcilloscopeGrid( globFiles, sourceTurns, canvas, ctx, maxX, map, .2 );
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

                        drawSourcilloscopeGrid( globFiles, sourceTurns, canvas, ctx, maxX, map, .2 );
                        return;
                    }
                }     
  
            }// for loop, nodes and edges

        }// else

        //draw everything if user clicks anywhere else
        resetAlpha( 1 );
        drawSourcilloscopeGrid( globFiles, sourceTurns, canvas, ctx, maxX, map, 1 );
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
//                    redraw( 1 );
drawSourcilloscopeGrid( globFiles, sourceTurns, canvas, ctx, maxX, map, 1 );
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
    };


    function removeChunkCall( element )
    {
        function normalizeStack( chunk )
        {
            if( !('track' in chunk ))
            {
                chunk.trace = {calls: []};
            }
            return chunk;
        }

        var source = element.traceRecord.trace.calls[0].source;
        var span = element.traceRecord.trace.calls[0].span;
        //document.write("element: "+element.traceRecord.trace.calls[0].span+"<br/>");

        for(var i = 0; i < jsonChunks.length; i++ )
        {
            var chunk = jsonChunks[i];

           for( j in chunk['trace']['calls'] )
           {
               var piece = chunk['trace']['calls'][j];
 
               if( piece['source'] == source && piece['span'] == span )
               {
                   normalizeStack( chunk );
                   ctx.clearRect( 0, 0, canvas.width, canvas.height );
                   makeStatisticsModel( causewayModel, jsonChunks, hiddenSrcPaths, vatMap, walker, canvas, ctx, 1 )
               }
           }

        }


    };

}

function setTransparencyNode( sourceTurns, node, map )
{
    var alpha = 1;
    map.get( node ).alpha = alpha;
 
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

    };

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
    };


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
};


