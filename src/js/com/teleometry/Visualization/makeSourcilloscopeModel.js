
var makeSourcilloscopeModel = ( function()
{
    var globFiles = [];
    var sourceTurns = {};
    var map = new FlexMap();

    var canvas;
    var ctx;
    var model;
    var jsonChunks;
    var hiddenSrcPaths;
    var vatMap;
    var walker;

    var maxX;
    var dotAlpha;

    var linesToRemove = []; //key type: integer, value type: line object                       
    var chunkMap = new FlexMap(); // key type: line object, value type: chunk

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
          
          if( x < 35 ) {
              for(var i = 0; i < globFiles.length; i++ ) {
                  if( y > globFiles[i].ycoord && y < globFiles[i].ycoord+20 ) {
                      globFiles[i].show = !globFiles[i].show;
                      jsonChunksCopy = deepJSONCopy(jsonChunks);
                      for(var j = 0; j < globFiles[i].lines.length; j++ ) {
                          var line = globFiles[i].lines[j];
                          if( line.show ) {
                              line.show = !line.show;
                              if( chunkMap.get(line) == undefined )
                                  chunkMap.set( line, {chunk:null} );
                              chunkMap.get(line).chunk = findChunk( line );
                              linesToRemove.push(line);
                          }
                          else {
                              line.show = !line.show;
                              for(var k = 0; k < linesToRemove.length; k += 1) {
                                  if( line === linesToRemove[k]) {
                                      linesToRemove.splice(k,1);
                                  }
                              }
                          }
                      }
                      for (var k=0; k < linesToRemove.length; k+=1 ) { // in chunksToRemove ) {
                              removeChunk(jsonChunksCopy, chunkMap.get(linesToRemove[k]).chunk );
                      }

                      sourceTurns = [];
                      for(var k = 0; k < globFiles.length; k++ ) {
                          for(var q = 0; q < globFiles[k].lines.length; q++) {
                              globFiles[k].lines[q].lnElements = [];
                          }
                      }

                      gatherCellInformation(jsonChunksCopy);
                      drawSourcilloscopeGrid( globFiles, sourceTurns, canvas, ctx, maxX, map, 1 );
                      return;                      
                  }
              }
          }
                      

          if( x> 35 && x <= 60 ) //check box
          {
              for(var i = 0; i < globFiles.length; i++ )
              {
                  for(var j = 0; j < globFiles[i].lines.length; j++ )
                  {
                      var line = globFiles[i].lines[j];
                      if( y > line.ycoord && y < line.ycoord+10 )
                      {
                          jsonChunksCopy = deepJSONCopy(jsonChunks);


                          if( line.show )
                          {

                              line.show = !line.show;
                              if( chunkMap.get(line) == undefined )
                                  chunkMap.set( line, {chunk:null} );
                              chunkMap.get(line).chunk = findChunk( line );

                              linesToRemove.push(line);
                          }
                          else
                          {
                              line.show = !line.show;
                              for(var k = 0; k < linesToRemove.length; k += 1) {
                                  if( line === linesToRemove[k]) {
                                      linesToRemove.splice(k,1);
                                  }
                              }
                          }
                          for (var k=0; k < linesToRemove.length; k+=1 ) { // in chunksToRemove ) {
                                  removeChunk(jsonChunksCopy, chunkMap.get(linesToRemove[k]).chunk );
                          }

                          sourceTurns = [];
                          for(var k = 0; k < globFiles.length; k++ ) {
                              for(var q = 0; q < globFiles[k].lines.length; q++) {
                                  globFiles[k].lines[q].lnElements = [];
                              }
                          }

                          gatherCellInformation(jsonChunksCopy);
                          drawSourcilloscopeGrid( globFiles, sourceTurns, canvas, ctx, maxX, map, 1 );
                          return;
                      }//k
                  }//j
              }//i     
          }
          else if( x > 60 && x < 320 ) //check if user has clicked a source file message to highlight
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
          else if ( x > 320 && y < 30 ) // user clicked turn bar at the top
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

    function deepJSONCopy(input) {
        if (null === input || 'object' !== typeof input) {
            return input;
        }
        var output, key;
        if (Array.isArray(input)) {
            output = [];
            for (key = 0; key !== input.length; key += 1) {
                output[key] = deepJSONCopy(input[key]);
            }
        } else {
            output = {};
            for (key in input) {
                if (Object.prototype.hasOwnProperty.call(input, key)) {
                    output[key] = deepJSONCopy(input[key]);
                }
            }
        }
        return output;
    }


    function findChunk( line )
    {
   
        for( var i = 0; i < line.lnElements.length; i += 1) 
        {
            var source = line.lnElements[i].traceRecord.trace.calls[0].source;
            var span = line.lnElements[i].traceRecord.trace.calls[0].span;

            for( var j = 0; j < jsonChunks.length; j++ )            
            {
                var chunk = jsonChunks[j];
                if( chunk['trace'] != undefined )
                {
                    for( k in chunk['trace']['calls'] )
                    {
                       var piece = chunk['trace']['calls'][k];
                       if( piece['source'] == source && piece['span'][0][0] == span[0][0] && piece['span'][0][1] == span[0][1] )
                       {
                           return deepJSONCopy( chunk );
                       }
                    }
                }
   
            }
        }

    }

    function removeChunk( jsonChunksCopy, chunk )
    {
        function normalizeStack( chunk ) {
            if( !('track' in chunk ))
                chunk.trace = {calls: []};
            return chunk;
        }

        for(var i = 0; i < jsonChunksCopy.length; i++ )
        {
           if( jsonChunksCopy[i]['trace'] != undefined )
           {

               for( j in jsonChunksCopy[i]['trace']['calls'] )
               {
                   var jpiece = jsonChunksCopy[i]['trace']['calls'][j];
                   //var cpiece
                   for( k in chunk['trace']['calls'] )
                   {
                       var cpiece = chunk['trace']['calls'][k];

                       if( jpiece['source'] ==  cpiece['source'] 
                           && jpiece['span'][0][0] == cpiece['span'][0][0] 
                           && jpiece['span'][0][1] == cpiece['span'][0][1] )
                       {

                           normalizeStack( jsonChunksCopy[i] );

                           return;              
                       }
                   }
               }

            }
        }


    };
 
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

    };


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


    function gatherCellInformation( jsonChunksCopy )
    {
        //get message graph
        if( jsonChunksCopy != undefined )
            model = makeCausewayModel( jsonChunksCopy, hiddenSrcPaths );


        var cellGrid = makeCellGrid(model);

        var alpha = 1;
        dotAlpha = 1; //used for dotted lines connecting process order

        var counterins = 0;
        var counterouts = 0;

        var startNdx = 320; // begin drawing nodes/edges after file names
        var ndspcg = 10; // spacing between nodes/edges in a turn
        var trnspcg = 40; // spacing between turns
        maxX =  0; // max x value for turns, used for file background

        for( i in cellGrid.cells )
        {

            //adding node to turn object
            var trn = new turnObject();
            trn.addNodeToTurn( cellGrid.cells[i].node );
            trn.turn = i;
            map.set( trn.trnNode, { x: 0, y: 0, alpha: 0, hlight: 0, line:null } );
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
        //drawSourcilloscopeGrid( globFiles, sourceTurns, canvas, ctx, maxX, map, dotAlpha, 1 );
    

    };


    return function( _causewayModel, _jsonChunks, _hiddenSrcPaths, _vatMap, _walker, _canvas, _ctx )
    {
        canvas = _canvas;
        ctx = _ctx;
        model = _causewayModel;
        jsonChunks = _jsonChunks;
        //jsonChunksCopy = deepJSONCopy(jsonChunks);

        hiddenSrcPaths = _hiddenSrcPaths;
        vatMap = _vatMap;
        walker = _walker;

        canvas.addEventListener( "click", sourceClick, false );
        canvas.addEventListener( "dblclick", sourceDblClick, false );

        var grid = gatherCellInformation();

        //put files/nodes/edges on the screen initially
        drawSourcilloscopeGrid( globFiles, sourceTurns, canvas, ctx, maxX, map, dotAlpha, 1 );      

    };


}() );
