
var makeSourcilloscopeModel = (function() {
    var globFiles = [],           //array of files
        sourceTurns = {},         //holds turn information
        map = new FlexMap(),      //map for extra node/edge info
        model,                    //causewayModel variable
        jsonChunks,               //chunks from log file
        hiddenSrcPaths,           //paths to ignore
        vatMap,                   //vatMap variable
        walker,                   //vatMap walker variable
        canvas,                   //canvas variable
        ctx,                      //canvas context variable
        maxX,                     //maximum x value for visualization
        dotAlpha,                 //alpha for the dotted lines for process order
        linesToRemove = [],       //key type: integer, value type: line object                       
        chunkMap = new FlexMap(); // key type: line object, value type: chunk

    //if user has clicked the canvas
    function sourceClick(e) {
        var x, y,
            i, j, k, q, //loop variables
            line,
            node,
            edge;

        //if click is in defined space
        if (e.pageX !== undefined && e.pageY !== undefined) {
            x = e.pageX;
            y = e.pageY;
          
          if (x < 35) {
              for (i = 0; i < globFiles.length; i += 1) {
                  if (y > globFiles[i].ycoord && y < globFiles[i].ycoord + 20) {
                      globFiles[i].show = !globFiles[i].show;
                      jsonChunksCopy = deepJSONCopy(jsonChunks);
                      for (j = 0; j < globFiles[i].lines.length; j += 1) {
                          line = globFiles[i].lines[j];
                          if (!globFiles[i].show) {
                              if (chunkMap.get(line) === undefined) {
                                  chunkMap.set(line, []);
                              }
                              findChunk(line);
                              linesToRemove.push(line);
                          } else {
                              for (k = 0; k < linesToRemove.length; k += 1) {
                                  if( line === linesToRemove[k]) {
                                      linesToRemove.splice(k,1);
                                      break;
                                  }
                              }
                          }
                      }
                      for ( k = 0; k < linesToRemove.length; k += 1) { 
                          for (q = 0; q < chunkMap.get(linesToRemove[k]).length; q += 1) {
                              removeChunk(jsonChunksCopy, chunkMap.get(linesToRemove[k])[q] );
                          }
                      }

                      sourceTurns = [];
                      for (k = 0; k < globFiles.length; k += 1) {
                          for (q = 0; q < globFiles[k].lines.length; q += 1) {
                              globFiles[k].lines[q].lnElements = [];
                          }
                      }

                      gatherCellInformation(jsonChunksCopy);
                      drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, map, 1);
                      return;                      
                  }
              }
          } 
          else if (x > 35 && x <= 60) { //check box          
              for (i = 0; i < globFiles.length; i += 1) {
                  for (j = 0; j < globFiles[i].lines.length; j += 1) {
                      line = globFiles[i].lines[j];
                      if (y > line.ycoord && y < line.ycoord + 10) {
                          jsonChunksCopy = deepJSONCopy(jsonChunks);
                          if (line.show) {
                              line.show = !line.show;
                              if (chunkMap.get(line) === undefined) {
                                  chunkMap.set(line, []);
                              }
                              findChunk(line);
                              linesToRemove.push(line);
                          } else {
                              line.show = !line.show;
                              for (k = 0; k < linesToRemove.length; k += 1) {
                                  if (line === linesToRemove[k]) {
                                      linesToRemove.splice(k,1);
                                  }
                              }
                          }
                          for (k = 0; k < linesToRemove.length; k+=1) {
                              for (q = 0; q < chunkMap.get(linesToRemove[k]).length; q += 1) {
                                  removeChunk(jsonChunksCopy, chunkMap.get(linesToRemove[k])[q]);
                              }
                          }

                          sourceTurns = [];
                          for (k = 0; k < globFiles.length; k += 1) {
                              for (q = 0; q < globFiles[k].lines.length; q += 1) {
                                  globFiles[k].lines[q].lnElements = [];
                              }
                          }

                          gatherCellInformation(jsonChunksCopy);
                          drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, map, 1);
                          return;
                      }//k
                  }//j
              }//i     
          }
          else if (x > 60 && x < 320) { //check if user has clicked a source file message to highlight
              for (i = 0; i < globFiles.length; i += 1) {
                  for (j = 0; j < globFiles[i].lines.length; j += 1) {
                      line = globFiles[i].lines[j];
                      if (y > line.ycoord && y < line.ycoord + 10) {
                          resetAlpha(.2); //set everything transparent
                          for (k = 0; k < line.lnElements.length; k += 1) {
                              if(line.isgot) {
                                  setTransparencyNode(sourceTurns, line.lnElements[k], map);  //set chosen nodes
                              } else {
                                  setTransparencyEdge(sourceTurns, line.lnElements[k], map);  //set chosen edges
                              }
                              map.get(line.lnElements[k]).hlight = 1; // highlight nodes/edges
                          }
                          drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, map, .2);
                          return;
                      }//k
                  }//j
              }//i
          }
          else if (x > 320 && y < 30) { // user clicked turn bar at the top
            for (i in sourceTurns) {
                //find turn
                node = sourceTurns[i].trnNode;
                if (x > map.get(node).x - 15 && x < map.get(node).x + 15) {
                    resetAlpha(.2);
                    // show only nodes that can be executed concurrently with chosen turn
                    for (k = 0; k < sourceTurns[i].trnConc.length; k += 1) {
                        map.get(sourceTurns[i].trnConc[k]).alpha = 1;
                        map.get(sourceTurns[i].trnConc[k]).hlight = 1;
                    }
                    drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, map, .2);
                    return;
                }
            }//for
          }
          else { //if user has clicked a node or edge
            for ( i in sourceTurns ) { //loop through turns
                //check if user has clicked a got node
                node = sourceTurns[i].trnNode;
                if (x > map.get(node).x - 15 && x < map.get(node).x + 15
                 && y > map.get(node).y - 15 && y < map.get(node).y + 15) {
                    resetAlpha(.2);
                    setTransparencyNode(sourceTurns, node, map)
                    map.get(node).hlight = 1;
                    drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, map, .2);
                    return;
                }

                //check if user has clicked an edge
                for (j = 0; j < sourceTurns[i].trnEdges.length; j += 1) {
                    edge = sourceTurns[i].trnEdges[j];
                    if (x > map.get(edge).x - 10 && x < map.get(edge).x + 10
                    &&  y > map.get(edge).y - 5 && y < map.get(edge).y + 15) {
                        resetAlpha(.2);
                        setTransparencyEdge(sourceTurns, edge, map);
                        map.get(edge).hlight = 1;
                        drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, map, .2);
                        return;
                    }
                }
            }// for loop, nodes and edges
        }// else
        //draw everything if user clicks anywhere else
        resetAlpha(1);
        drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, map, 1);
      }// if valid click
    }

    //draws process order only
    function sourceDblClick(e) {
        var x, y,
            i,
            node;

        //if click is in defined space
        if (e.pageX !== undefined && e.pageY !== undefined) {
            x = e.pageX;
            y = e.pageY;

            for (i in sourceTurns) {
                //check if user has clicked a got node
                node = sourceTurns[i].trnNode;
                if (x > map.get(node).x - 15 && x < map.get(node).x + 15
                 && y > map.get(node).y - 15 && y < map.get(node).y + 15) {
                    resetAlpha(.2);
                    drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, map, 1);
                    return;
                }
            }
        }
    }//dblclick

    //setting alpha for nodes and edges
    function resetAlpha(alpha) {
        var i, j;

        for (i in sourceTurns) {
            map.get(sourceTurns[i].trnNode).alpha = alpha;
            map.get(sourceTurns[i].trnNode).hlight = 0;

            for (j = 0; j < sourceTurns[i].trnEdges.length; j += 1) {
                map.get(sourceTurns[i].trnEdges[j]).alpha = alpha;
                map.get(sourceTurns[i].trnEdges[j]).hlight = 0;
            }
        }
    }

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

    function findChunk(line) {
        var i, j, k, //loop variables
            source,  //source to match
            span,    //span to match
            chunk,   //chunks 
            piece,   //specific piece of chunk
            found;   //found boolean

        for (i = 0; i < line.lnElements.length; i += 1) {
            source = line.lnElements[i].traceRecord.trace.calls[0].source;
            span = line.lnElements[i].traceRecord.trace.calls[0].span;
            found = false;
            for (j = 0; j < jsonChunks.length; j += 1) {
                chunk = jsonChunks[j];
                if (chunk['trace'] !== undefined) {
                    for(k in chunk['trace']['calls']) {
                       piece = chunk['trace']['calls'][k];
                       if(piece['source'] == source && piece['span'][0][0] == span[0][0] && piece['span'][0][1] == span[0][1]) {
                             chunkMap.get(line).push(deepJSONCopy(chunk));
                             found = true;
                             break;
                       }
                    }
                }
                if (found) {
                    break;
                }
            }
        }
    }

    function removeChunk (jsonChunksCopy, chunk) {
        var i, j, k, //loop variables
            cpiece,  //chunk piece from chunk argument
            jpiece;  //chunk piece from jsonChunksCopy

        function normalizeStack(chunk) {
            if(!('track' in chunk))
                chunk.trace = {calls: []};
            return chunk;
        }
        for (i = 0; i < jsonChunksCopy.length; i += 1) {
            if (jsonChunksCopy[i]['trace'] !== undefined) {
                for(j in jsonChunksCopy[i]['trace']['calls']) {
                    jpiece = jsonChunksCopy[i]['trace']['calls'][j];
                    for( k in chunk['trace']['calls'] ) {
                        cpiece = chunk['trace']['calls'][k];
                        if (jpiece['source'] === cpiece['source'] 
                         && jpiece['span'][0][0] === cpiece['span'][0][0] 
                         && jpiece['span'][0][1] === cpiece['span'][0][1]) {
                            normalizeStack( jsonChunksCopy[i] );
                            return;              
                        }
                    }
                }
            }  
        }
    }
 
    function setTransparencyNode(sourceTurns, node, map) {
        var alpha = 1,
            done = 0;

        map.get(node).alpha = alpha;
        //start with 'out' edges, setTransparencyEdge will go through 'in' edges as well
        if (sourceTurns[node.name].trnEdges.length > 0) {
            node.outs(function(edge) {
                setTransparencyEdge(sourceTurns, edge, map);
                done = 1;
            });
        }
        if (!done) { // if no 'out' edges, loop through 'in' edges
            node.ins(function(edge) {
                setTransparencyEdge(sourceTurns, edge, map);
            });
        }
    }

    function setTransparencyEdge(sourceTurns, edge, map) {
        var alpha = 1,
            src; // specific sourceTurn    

        function setTransparentRight(turn) {
            var i,
                target; // edge target

            map.get( turn.trnNode ).alpha = alpha; //node transparency
            for (i = 0; i < turn.trnEdges.length; i += 1) {
                map.get(turn.trnEdges[i]).alpha = alpha; // edge transparency
                //continue to the right, out edges
                target = turn.trnEdges[i].getTarget();
                if (target !== undefined && target.name !== "bottom: 0") {
                    setTransparentRight(sourceTurns[target.name]);
                }
            }
        }

        function setTransparentLeft(turn, edge) {
            var i,
                origin; // edge origin

            map.get( turn.trnNode ).alpha = alpha; // node transparency
            for (i = 0; i < turn.trnEdges.length; i += 1) {
                if (turn.trnEdges[i] === edge) {
                    map.get(turn.trnEdges[i]).alpha = alpha; // edge transparency
                    turn.trnNode.ins(function(nextEdge) {
                        //continue to the left, in edges
                        origin = nextEdge.getOrigin();
                        if (origin !== undefined && origin.name !== "top: 0") {
                            setTransparentLeft(sourceTurns[origin.name], nextEdge);
                        }
                    });
                }
            }
        }

        map.get( edge ).alpha = alpha;
        if (edge.getOrigin().name !== "top: 0") {
            src = sourceTurns[edge.getOrigin().name]; //find relevant sourceTurn object
            map.get( src.trnNode ).alpha = alpha;
            //check right, out
            if (sourceTurns[edge.getTarget().name] !== undefined && edge.getTarget().name !== "bottom: 0") {
                setTransparentRight(sourceTurns[edge.getTarget().name]); 
            }
            //check left, in
            if (sourceTurns[edge.getOrigin().name] !== undefined && edge.getOrigin().name !== "top: 0") {
                setTransparentLeft(sourceTurns[edge.getOrigin().name], edge);
            }
        }
    }

    function gatherCellInformation(jsonChunksCopy) {
        var i, j, k,
            cellGrid,
            alpha = 1,
            startNdx = 320, //begin drawing nodes/edges after files 
            ndspcg = 10,    //spacing between nodes/edges in turn
            trnspcg = 40,   //spacking between turns
            trn,            //turn object
            cell,           //one cell of cellGrid
            stack,          //stack from log file for nodes/edges
            label,          //sent message
            counter,        //counts concurrency within turn
            concNodes;      //stores concurrent nodes 

        //get message graph when filtering
        if (jsonChunksCopy !== undefined) {
            model = makeCausewayModel(jsonChunksCopy, hiddenSrcPaths);
        }

        cellGrid = makeCellGrid(model);
        dotAlpha = 1; //used for dotted lines connecting process order
        maxX =  0; // max x value for turns, used for file background

        for (i in cellGrid.cells) {
            //adding node to turn object
            trn = new turnObject();
            trn.addNodeToTurn(cellGrid.cells[i].node);
            trn.turn = i;
            map.set(trn.trnNode,{x:0, y:0, alpha:0, hlight:0});
            map.get(trn.trnNode).x = startNdx;
            map.get(trn.trnNode).alpha = alpha;

            startNdx += ndspcg;
            cell = cellGrid.cells[i];

            //stack trace for gots
            stack = cell.node.traceRecord.trace.calls;
            if (stack.length > 0) {
                label = walker.getElementLabel(trn.trnNode, vatMap);
                checkFile(globFiles, stack[0].source, stack[0].span, label, trn.trnNode, 1);
            }

            cell.node.outs(function(edge) {
                stack = edge.traceRecord.trace.calls;
                if (stack.length > 0) {
                    if (!hiddenSrcPaths.contains(stack[0].source)) {
                        label = walker.getElementLabel(edge,vatMap);
                        //adding edges to file object
                        checkFile(globFiles, stack[0].source, stack[0].span, label, edge);
                        //setting edge alpha and x coordinates
                        map.set(edge, {x:0, y:0, alpha:0, hlight:0});
                        map.get(edge).x = startNdx;
                        map.get(edge).alpha = alpha;

                        trn.addEdgeToTurn(edge);
                        startNdx += ndspcg;
                    }
                }
            });

            //ether
            if (trn.trnNode.traceRecord.trace.calls.length === 0) {
                map.get(trn.trnNode).y = 20;
            }
            sourceTurns[trn.trnNode.name] = trn;
            startNdx += trnspcg;

            if(maxX < startNdx) {
                maxX = startNdx;
            }
        }

        //loop for concurrency
        for (i in cellGrid.byCols) {
            counter = 0;
            concNodes = [];
            for (j in cellGrid.byCols[i]) {
                concNodes.push(cellGrid.byCols[i][j].node); //keep track of nodes that can be executed together
                counter++;
            }
            for (j in cellGrid.byCols[i] ) {
                sourceTurns[cellGrid.byCols[i][j].node.name].concurrent = counter; // add number of concurrent nodes
                for (k = 0; k < concNodes.length; k += 1) {
                    sourceTurns[cellGrid.byCols[i][j].node.name].addConcToTurn(concNodes[k]); // add concurrent nodes for turn
                }
            }
        }
    }

    return function( _causewayModel, _jsonChunks, _hiddenSrcPaths, _vatMap, _walker, _canvas, _ctx ) {
        model = _causewayModel;
        jsonChunks = _jsonChunks;
        hiddenSrcPaths = _hiddenSrcPaths;
        vatMap = _vatMap;
        walker = _walker;
        canvas = _canvas;
        ctx = _ctx;

        canvas.addEventListener("click", sourceClick, false);
        canvas.addEventListener("dblclick", sourceDblClick, false);

        gatherCellInformation();

        //put files/nodes/edges on the screen initially
        drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, map, dotAlpha, 1);      
    };
}());
