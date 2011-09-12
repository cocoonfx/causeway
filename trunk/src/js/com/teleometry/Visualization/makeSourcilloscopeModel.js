
function makeSourcilloscopeModel(jsonChunks, hiddenSrcPaths, vatMap, walker, canvas, ctx) {
    "use strict";

    var globFiles = [],           //array of files
        sourceTurns = {},         //holds turn information
        GlyphMap = new FlexMap(), //map for extra node/edge info
        maxX,                     //maximum x value for visualization
        dotAlpha,                 //alpha for the dotted lines for process order
        linesToRemove = [],       //key type: integer, value type: line object                       
        ChunkMap = new FlexMap(), // key type: line object, value type: chunk
        NODE_SPACING = 10,        //spacing between nodes/edges in turn
        TURN_SPACING = 40,        //spacking between turns
        FILE_COORD = 35,          //spacial coordinate of file collapse
        LINE_FILTER = 60,         //spacial coordinate of line filtering
        TURNBAR_COORD = 30,       //spacial coordinate of turn bar
        GRID_START = 320;         //spacial coordinate of grid begining
 
    function list(map, predicate) {
        var key, answer;
        for (key in map) {
            if (Object.prototype.hasOwnProperty.call(map, key)) {
                answer = predicate(map[key], key);
                if (undefined !== answer) {
                    return answer;
                }
            }
        }
    }//list()

    function gatherCellInformation(jsonChunks) {
        var cellGrid,       //holds cell grid information
            startNdx = 320; //begin drawing nodes/edges after files 

        cellGrid = makeCellGrid(makeCausewayModel(jsonChunks, hiddenSrcPaths));
        dotAlpha = 1; //used for dotted lines connecting process order
        maxX =  0;    //max x value for turns, used for file background

        list(cellGrid.cells, function (cell) {
            var trn,    //turn object
                stack,  //stack from log file for nodes/edges
                label;  //sent message

            //adding node to turn object
            trn = new TurnObject(cell.node.getVatName(), cell.node);
            GlyphMap.set(trn.trnNode, {x: startNdx, y: 0, alpha: 1, hlight: false});

            startNdx += NODE_SPACING;

            //stack trace for gots
            stack = cell.node.traceRecord.trace.calls;
            if (stack.length > 0) {
                if (!hiddenSrcPaths.contains(stack[0].source)) {
                    label = walker.getElementLabel(trn.trnNode, vatMap);
                    checkFile(globFiles, stack[0].source, stack[0].span, label, trn.trnNode, 1);
                }
            }

            cell.node.outs(function (edge) {
                stack = edge.traceRecord.trace.calls;
                if (stack.length > 0) {
                    if (!hiddenSrcPaths.contains(stack[0].source)) {
                        label = walker.getElementLabel(edge, vatMap);
                        checkFile(globFiles, stack[0].source, stack[0].span, label, edge);
                        GlyphMap.set(edge, {x: startNdx, y: 0, alpha: 1, hlight: false});

                        trn.addEdgeToTurn(edge);
                        startNdx += NODE_SPACING;
                    }
                }
            });

            //ether
            if (trn.trnNode.traceRecord.trace.calls.length === 0) {
                GlyphMap.get(trn.trnNode).y = 20;
            }
            sourceTurns[trn.trnNode.name] = trn;
            startNdx += TURN_SPACING;

        });

        //setting maximum x value for file shading
        maxX = startNdx;

        //loop for concurrency
        list(cellGrid.byCols, function (column) {
            list(column, function (colCell) {
                //add nodes that can be executed together
                list(column, function (cellNode) {
                    sourceTurns[colCell.node.name].addConcToTurn(cellNode.node);
                });
            });
        });
    }


    //setting alpha for nodes and edges
    function resetAlpha(alpha) {
        var i; //loop variable

        list(sourceTurns, function (turn) {
            GlyphMap.get(turn.trnNode).alpha = alpha;
            GlyphMap.get(turn.trnNode).hlight = false;

            for (i = 0; i < turn.trnEdges.length; i += 1) {
                GlyphMap.get(turn.trnEdges[i]).alpha = alpha;
                GlyphMap.get(turn.trnEdges[i]).hlight = false;
            }
        });
    }//resetAlpha()

    function setTransparencyEdge(sourceTurns, edge, GlyphMap) {
        var originName,  //name of edge origin
            targetName;  //name of edge target

        function setTransparentRight(turn) {
            var i,      //loop variable
                target; //edge target

            GlyphMap.get(turn.trnNode).alpha = 1; //node transparency
            for (i = 0; i < turn.trnEdges.length; i += 1) {
                GlyphMap.get(turn.trnEdges[i]).alpha = 1; // edge transparency
                //continue to the right, out edges
                target = turn.trnEdges[i].getTarget();
                if (target !== undefined && target.name !== "bottom: 0") {
                    setTransparentRight(sourceTurns[target.name]);
                }
            }
        }//setTransparentRight()

        function setTransparentLeft(turn, edge) {
            var origin; //edge origin

            GlyphMap.get(turn.trnNode).alpha = 1; // node transparency
            GlyphMap.get(edge).alpha = 1; // edge transparency
            turn.trnNode.ins(function (nextEdge) {
                //continue to the left, in edges
                origin = nextEdge.getOrigin();
                if (origin !== undefined && origin.name !== "top: 0") {
                    setTransparentLeft(sourceTurns[origin.name], nextEdge);
                }
            });
        }//setTransparentLeft()

        GlyphMap.get(edge).alpha = 1;
        originName = edge.getOrigin().name;
        targetName = edge.getTarget().name;

        if (originName !== "top: 0") {
            GlyphMap.get(sourceTurns[originName].trnNode).alpha = 1;
            //check right, out
            if (sourceTurns[targetName] !== undefined && targetName !== "bottom: 0") {
                setTransparentRight(sourceTurns[targetName]);
            }
            //check left, in
            if (sourceTurns[originName] !== undefined && originName !== "top: 0") {
                setTransparentLeft(sourceTurns[originName], edge);
            }
        }
    }//setTransparencyEdge()

    function setTransparencyNode(sourceTurns, node, GlyphMap) {
        var done = false; //complete flag

        GlyphMap.get(node).alpha = 1;
        //start with 'out' edges, setTransparencyEdge will go through 'in' edges as well
        if (sourceTurns[node.name].trnEdges.length > 0) {
            node.outs(function (edge) {
                setTransparencyEdge(sourceTurns, edge, GlyphMap);
                done = true;
            });
        }
        if (!done) { // if no 'out' edges, loop through 'in' edges
            node.ins(function (edge) {
                setTransparencyEdge(sourceTurns, edge, GlyphMap);
            });
        }
    }//setTransparencyNode()

    function interactWithFiles(x, y) {
        var i, j, k,        //loop variables
            jsonChunksCopy, //copy of json Chunks
            line;           //line var for files

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
        }//deepJSONCopy()

        function findChunk(line) {
            var i, j,    //loop variables
                source,  //source to match
                span,    //span to match
                chunk,   //chunks 
                found;   //found boolean

            for (i = 0; i < line.lnElements.length; i += 1) {
                source = line.lnElements[i].traceRecord.trace.calls[0].source;
                span = line.lnElements[i].traceRecord.trace.calls[0].span;
                found = false;
                for (j = 0; j < jsonChunks.length; j += 1) {
                    chunk = jsonChunks[j];
                    if (chunk.trace !== undefined) {
                        found = list(chunk.trace.calls, function (piece) {
                            if (piece.source === source 
                             && piece.span[0][0] === span[0][0] 
                             && piece.span[0][1] === span[0][1]) {
                                ChunkMap.get(line).push(chunk);
                                return true;
                            }
                        });
                    }
                    if (found) {
                        break;
                    }
                }//j
            }//i
        }//findChunk()

        function removeChunk(jsonChunksCopy, chunk) {
            var i,             //loop variable
                done = false;  //complete flag

            function normalizeStack(chunk) {
                if (!('track' in chunk)) {
                    chunk.trace.calls = [];
                }
                return chunk;
            }
            for (i = 0; i < jsonChunksCopy.length; i += 1) {
                if (jsonChunksCopy[i].trace !== undefined) {
                    done = list(jsonChunksCopy[i].trace.calls, function (jpiece) {
                        done = list(chunk.trace.calls, function (cpiece) {
                            if (jpiece.source === cpiece.source
                             && jpiece.span[0][0] === cpiece.span[0][0]
                             && jpiece.span[0][1] === cpiece.span[0][1]) {
                                normalizeStack(jsonChunksCopy[i]);
                                return true;
                            }
                        });
                        if (done) {
                            return true;
                        }
                    });
                    if (done) {
                        return;
                    }
                }
            }
        }//removeChunk() 

        function addChunkToList(line) {
            if (ChunkMap.get(line) === undefined) {
                ChunkMap.set(line, []);
            }
            findChunk(line);
            linesToRemove.push(line);
        }//addChunkToList()

        function removeChunkFromList(line) {
            var i; //loop variable
            for (i = 0; i < linesToRemove.length; i += 1) {
                if (line === linesToRemove[i]) {
                    linesToRemove.splice(i, 1);
                    break;
                }
            }
        }//removeChunkFromList()

        function removeAllChunks() {
            var i, j; //loop variables

            for (i = 0; i < linesToRemove.length; i += 1) {
                for (j = 0; j < ChunkMap.get(linesToRemove[i]).length; j += 1) {
                    removeChunk(jsonChunksCopy, ChunkMap.get(linesToRemove[i])[j]);
                }
            }
        }//removeAllChunks()

        function resetAndDraw() {
            var i, j; //loop variables

            sourceTurns = [];
            for (i = 0; i < globFiles.length; i += 1) {
                for (j = 0; j < globFiles[i].lines.length; j += 1) {
                    globFiles[i].lines[j].lnElements = [];
                }
            }
            gatherCellInformation(jsonChunksCopy);
            drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, GlyphMap, 1);  
        }//resetAndDraw()


        if (x <= FILE_COORD) { // file collapse
            for (i = 0; i < globFiles.length; i += 1) {
                if (y > globFiles[i].ycoord && y < globFiles[i].ycoord + 20) {
                    globFiles[i].show = !globFiles[i].show;
                    jsonChunksCopy = deepJSONCopy(jsonChunks);
                    for (j = 0; j < globFiles[i].lines.length; j += 1) {
                        line = globFiles[i].lines[j];
                        if (!globFiles[i].show) {
                            addChunkToList(line);
                        } else {
                            removeChunkFromList(line);
                        }
                    }
                    removeAllChunks();
                    resetAndDraw();
                    return true;
                }
            }
        } else { //specific line chosen
            for (i = 0; i < globFiles.length; i += 1) {
                for (j = 0; j < globFiles[i].lines.length; j += 1) {
                    line = globFiles[i].lines[j];
                    if (y > line.ycoord && y < line.ycoord + 10) {
                        if (x <= LINE_FILTER) { //filter line
                            jsonChunksCopy = deepJSONCopy(jsonChunks);
                            if (line.show) {
                                addChunkToList(line);
                            } else {
                                removeChunkFromList(line);
                            }
                            line.show = !line.show;
                            removeAllChunks();
                            resetAndDraw();
                            return true;
                        } else { //highlight line
                            resetAlpha(0.2); //set everything transparent
                            for (k = 0; k < line.lnElements.length; k += 1) {
                                if (line.isgot) {
                                    setTransparencyNode(sourceTurns, line.lnElements[k], GlyphMap);
                                } else {
                                    setTransparencyEdge(sourceTurns, line.lnElements[k], GlyphMap);
                                }
                                GlyphMap.get(line.lnElements[k]).hlight = true; // highlight nodes/edges
                            }
                            drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, GlyphMap, 0.2);
                            return true;
                        }
                    }
                }//j
            }//i
        }

    }//interactWithFiles()

    function interactWithGrid(x, y) {
        var done;       //complete flag

        done = list(sourceTurns, function (turn) {
            var i,          //loop variable
                node,       //node to look at
                edge,       //edge to look at
                nodeInfo,   //node info from map
                edgeInfo;   //edge info from map

            //check if user has clicked a got node
            node = turn.trnNode;
            nodeInfo = GlyphMap.get(node);
            if (x > nodeInfo.x - 15 && x < nodeInfo.x + 15) {
                if (y < TURNBAR_COORD) { //user clicked turn bar at top
                    resetAlpha(0.2);
                    // show only nodes that can be executed concurrently with chosen turn
                    for (i = 0; i < turn.trnConc.length; i += 1) {
                        GlyphMap.get(turn.trnConc[i]).alpha = 1;
                        GlyphMap.get(turn.trnConc[i]).hlight = true;
                    }
                    drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, GlyphMap, 0.2);
                    return true;
                } else if (y > nodeInfo.y - 15 && y < nodeInfo.y + 15) { //user hit node
                    resetAlpha(0.2);
                    setTransparencyNode(sourceTurns, node, GlyphMap);
                    nodeInfo.hlight = true;
                    drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, GlyphMap, 0.2);
                    return true;
                }
            } else {
                //check if user has clicked an edge
                for (i = 0; i < turn.trnEdges.length; i += 1) {
                    edge = turn.trnEdges[i];
                    edgeInfo = GlyphMap.get(edge);
                    if (x > edgeInfo.x - 10 && x < edgeInfo.x + 10
                    &&  y > edgeInfo.y - 5 && y < edgeInfo.y + 15) {
                        resetAlpha(0.2);
                        setTransparencyEdge(sourceTurns, edge, GlyphMap);
                        edgeInfo.hlight = true;
                        drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, GlyphMap, 0.2);
                        return true;
                    }
                }
            }//node or edge
        });// loop through sourceTurns
        if (done) {
            return true;
        }
    }//interactWithGrid()


    //if user has clicked the canvas
    function sourceClick(e) {
        var x = e.pageX,  //clicked x coordinate
            y = e.pageY,  //clicked y coordinate
            done = false; //complete flag

        //if click is in defined space
        if (x === undefined || y === undefined) {
            return;
        }

        if (x <= GRID_START) { //if user clicked file section
            done = interactWithFiles(x, y);
        } else { //if user has clicked past the files
            done = interactWithGrid(x, y);
        }

        //draw everything if user clicks anywhere else
        if (!done) {
            resetAlpha(1);
            drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, GlyphMap, 1);
        }
    }//sourceClick()

    //draws process order only
    function sourceDblClick(e) {
        var x = e.pageX, //clicked x coordinate
            y = e.pageY, //clicked y coordinate
            nodeInfo;    //turn node information

        //if click is not in defined space
        if (x === undefined || y === undefined) {
            return;
        }
 
        list(sourceTurns, function (turn) {
            //check if user has clicked a got node
            nodeInfo = GlyphMap.get(turn.trnNode);
            if (x > nodeInfo.x - 15 && x < nodeInfo.x + 15
             && y > nodeInfo.y - 15 && y < nodeInfo.y + 15) {
                resetAlpha(0.2);
                drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, GlyphMap, 1);
                return true;
            }
        });
    }//sourceDblClick()

    canvas.addEventListener("click", sourceClick, false);
    canvas.addEventListener("dblclick", sourceDblClick, false);

    gatherCellInformation(jsonChunks);

    //put files/nodes/edges on the screen initially
    drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, GlyphMap, dotAlpha, 1);      
}
