
function makeSourcilloscopeModel(jsonChunks, hiddenSrcPaths, vatMap, walker, canvas, ctx) {
    "use strict";

    var globFiles = [],           //array of files
        sourceTurns = {},         //holds turn information
        glyphMap = new FlexMap(), //map for extra node/edge info
        lineMap = new FlexMap(),  //map for mouseover highlighting
        maxX,                     //maximum x value for visualization
        dotAlpha,                 //alpha for the dotted lines for process order
        linesToRemove = [],       //key type: integer, value type: line object                       
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

    function gatherCellInformation(jsonChunksCurrent) {
        var cellGrid,              //holds cell grid information
            startNdx = GRID_START; //begin drawing nodes/edges after files 

        cellGrid = makeCellGrid(makeCausewayModel(jsonChunksCurrent, hiddenSrcPaths));
        dotAlpha = 1; //used for dotted lines connecting process order
        maxX =  0;    //max x value for turns, used for file background

        list(cellGrid.cells, function (cell) {
            var trn,    //turn object
                stack,  //stack from log file for nodes/edges
                label;  //sent message

            //adding node to turn object
            trn = new TurnObject(cell.node.getVatName(), cell.node);
            glyphMap.set(trn.trnNode, {x: startNdx, y: 0, alpha: 1, hlight: false, border:  false});
            startNdx += NODE_SPACING;

            //stack trace for gots
            stack = cell.node.traceRecord.trace.calls;
            if (stack.length > 0) {
                label = walker.getElementLabel(trn.trnNode, vatMap);
                checkFile(globFiles, stack[0].source, stack[0].span, label, trn.trnNode, true);
            }

            //stack trace for sent events
            cell.node.outs(function (edge) {
                stack = edge.traceRecord.trace.calls;
                if (stack.length > 0) {
                    label = walker.getElementLabel(edge, vatMap);
                    checkFile(globFiles, stack[0].source, stack[0].span, label, edge, false);
                    glyphMap.set(edge, {x: startNdx, y: 0, alpha: 1, hlight: false, border: false});

                    trn.addEdgeToTurn(edge);
                    startNdx += NODE_SPACING;
                }
            });

            //ether
            if (trn.trnNode.traceRecord.trace.calls.length === 0) {
                glyphMap.get(trn.trnNode).y = 20;
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

        list(sourceTurns, function (turn) {
            glyphMap.get(turn.trnNode).alpha = alpha;
            glyphMap.get(turn.trnNode).hlight = false;

            turn.trnEdges.forEach(function (edge) {
                glyphMap.get(edge).alpha = alpha;
                glyphMap.get(edge).hlight = false;
            });
        });
    }//resetAlpha()

    function setTransparentRight(turn) {
        var target; //edge target

        glyphMap.get(turn.trnNode).alpha = 1; //node transparency
        turn.trnNode.outs(function (nextEdge) {
            if(glyphMap.get(nextEdge)) {
                glyphMap.get(nextEdge).alpha = 1; // edge transparency
                target = nextEdge.getTarget();
                if (target !== undefined && target.name !== "bottom: 0") {
                    setTransparentRight(sourceTurns[target.name]);
                }
            }
        });
    }//setTransparentRight()

    function setTransparentLeft(turn, edge) {
        var origin; //edge origin

        glyphMap.get(turn.trnNode).alpha = 1; // node transparency
        turn.trnNode.ins(function (nextEdge) {
            //continue to the left, in edges
            if(glyphMap.get(nextEdge)) {
                glyphMap.get(nextEdge).alpha = 1; //edge transparency
                origin = nextEdge.getOrigin();
                if (origin !== undefined && origin.name !== "top: 0") {
                    setTransparentLeft(sourceTurns[origin.name], nextEdge);
                }
            }
        });
    }//setTransparentLeft()


    function setTransparencyEdge(edge) {
        var originName = edge.getOrigin().name,  //name of edge origin
            targetName = edge.getTarget().name;  //name of edge target

        glyphMap.get(edge).alpha = 1;
        if (targetName !== "bottom: 0") {
            setTransparentRight(sourceTurns[targetName]);
        }
        if (originName !== "top: 0") {
            glyphMap.get(sourceTurns[originName].trnNode).alpha = 1;
            setTransparentLeft(sourceTurns[originName], edge);
        }
    }//setTransparencyEdge()

    function setTransparencyNode(node) {
        glyphMap.get(node).alpha = 1;
        node.outs(function (edge) {
            var targetName = edge.getTarget().name;
            if (targetName !== "bottom: 0" && glyphMap.get(edge)) { 
                glyphMap.get(edge).alpha = 1;
                setTransparentRight(sourceTurns[targetName]);
            }
        });
        node.ins(function (edge) {
            var originName = edge.getOrigin().name;
            if (originName !== "top: 0" && glyphMap.get(edge)) {
                glyphMap.get(edge).alpha = 1;
                setTransparentLeft(sourceTurns[originName], edge);
            }
        });
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

        function removeChunk(line) {
            var jpiece; //calls array from chunk
            jsonChunksCopy.forEach(function (jchunk) {
                if (jchunk.trace && jchunk.trace.calls.length > 0) {
                    jpiece = jchunk.trace.calls[0];
                    if (jpiece.source === line.source
                     && jpiece.span[0][0] === line.span[0][0]
                     && jpiece.span[0][1] === line.span[0][1]) {
                        jchunk.trace.calls = [];
                        return;
                    }
                }
            });
        }//removeChunk() 

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
            linesToRemove.forEach( function(rmline) {
                removeChunk(rmline);
            });
        }//removeAllChunks()

        function resetAndDraw() {
            sourceTurns = [];
            globFiles.forEach(function (file) {
                file.lines.forEach(function (line) {
                    line.lnElements = [];
                });
            });
            gatherCellInformation(jsonChunksCopy);
            drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, glyphMap, 1);  
        }//resetAndDraw()


        if (x <= FILE_COORD) { // file collapse
            globFiles.forEach(function (file) {
                if (y > file.ycoord && y < file.ycoord + 20) {
                    file.show = !file.show;
                    jsonChunksCopy = deepJSONCopy(jsonChunks);
                    file.lines.forEach(function (line) {
                        if (!file.show) {
                            linesToRemove.push(line);
                        } else {
                            removeChunkFromList(line);
                        }
                    });
                    removeAllChunks();
                    resetAndDraw();
                    return true;
                }
            });
        } else { //specific line chosen
            for (i = 0; i < globFiles.length; i += 1) {
                if(!globFiles[i].show) {
                    continue;
                }
                for (j = 0; j < globFiles[i].lines.length; j += 1) {
                    line = globFiles[i].lines[j];
                    if (y > line.ycoord && y < line.ycoord + 20) {
                        if (x <= LINE_FILTER) { //filter line
                            jsonChunksCopy = deepJSONCopy(jsonChunks);
                            if (line.show) {
                                linesToRemove.push(line);
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
                                    setTransparencyNode(line.lnElements[k]);
                                } else {
                                    setTransparencyEdge(line.lnElements[k]);
                                }
                                glyphMap.get(line.lnElements[k]).hlight = true;
                            }
                            drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, 
                                                   ctx, maxX, glyphMap, 0.2);
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
                nodeGlyph,  //node info from glyphMap
                edgeGlyph;  //edge info from glyphMap

            //check if user has clicked a got node
            node = turn.trnNode;
            nodeGlyph = glyphMap.get(node);
            if (x > nodeGlyph.x && x < nodeGlyph.x + 15) {
                if (y < TURNBAR_COORD) { //user clicked turn bar at top
                    resetAlpha(0.2);
                    // show only nodes that can be executed concurrently with chosen turn
                    for (i = 0; i < turn.trnConc.length; i += 1) {
                        glyphMap.get(turn.trnConc[i]).alpha = 1;
                        glyphMap.get(turn.trnConc[i]).hlight = true;
                    }
                    drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, 
                                           ctx, maxX, glyphMap, 0.2);
                    return true;
                } else if (y > nodeGlyph.y && y < nodeGlyph.y + 15) { //user hit node
                    resetAlpha(0.2);
                    setTransparencyNode(node);
                    nodeGlyph.hlight = true;
                    drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, 
                                           ctx, maxX, glyphMap, 0.2);
                    return true;
                }
            } else {
                //check if user has clicked an edge
                for (i = 0; i < turn.trnEdges.length; i += 1) {
                    edge = turn.trnEdges[i];
                    edgeGlyph = glyphMap.get(edge);
                    if (x > edgeGlyph.x && x < edgeGlyph.x + 15
                    &&  y > edgeGlyph.y && y < edgeGlyph.y + 15) {
                        resetAlpha(0.2);
                        setTransparencyEdge(edge);
                        edgeGlyph.hlight = true;
                        drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, 
                                               ctx, maxX, glyphMap, 0.2);
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
            drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, glyphMap, 1);
        }
    }//sourceClick()

    //draws process order only
    function sourceDblClick(e) {
        var x = e.pageX, //clicked x coordinate
            y = e.pageY, //clicked y coordinate
            nodeGlyph;   //turn node information

        //if click is not in defined space
        if (x === undefined || y === undefined) {
            return;
        }
 
        list(sourceTurns, function (turn) {
            //check if user has clicked a got node
            nodeGlyph = glyphMap.get(turn.trnNode);
            if (x > nodeGlyph.x && x < nodeGlyph.x + 15
             && y > nodeGlyph.y && y < nodeGlyph.y + 15) {
                resetAlpha(0.2);
                drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, glyphMap, 1);
                return true;
            }
        });
    }//sourceDblClick()

    function mouseMove(e) {
        var x = e.pageX, //x coordinate of mouse click
            y = e.pageY; //y coordinate of mouse click
 
        if (x === undefined || y === undefined)
            return;
  
        globFiles.forEach(function (file) {
            file.lines.forEach(function (line) {
                var lineGlyph,    //line information from lineMap
                    elementGlyph, //element information from glyphMap
                    imageData;    //image data from source line

                if(lineMap.get(line) === undefined)
                    lineMap.set(line, {image: null, border: false});
                lineGlyph = lineMap.get(line);
                for(var i = 0; i < line.lnElements.length; i++) {
                    elementGlyph = glyphMap.get(line.lnElements[i]);
                    //if mouse is hovering over a got/sent event, highlight
                    if (x > elementGlyph.x && x < elementGlyph.x + 15
                     && y > elementGlyph.y && y < elementGlyph.y + 15
                     && lineGlyph.border === false) {
                        //copy non-highlighted line image before highlighting
                        lineGlyph.image = ctx.getImageData(LINE_FILTER, elementGlyph.y, line.textLen, 15);
                        ctx.fillStyle = 'rgba(178,34,34,.15)';
                        ctx.fillRect(60, elementGlyph.y, line.textLen, 15);
                        ctx.fill();
                        lineGlyph.border = true;
                        elementGlyph.border = true;
                        break;
               
                    } //if mouse is not on got/sent event, paste non-highlighted line
                    else if( (x < elementGlyph.x || x > elementGlyph.x+15
                          ||  y < elementGlyph.y || y > elementGlyph.y+15 )
                           && lineGlyph.border === true && elementGlyph.border === true) {
                        if(lineGlyph.image !== null) {
                            ctx.putImageData(lineGlyph.image, LINE_FILTER, elementGlyph.y);
                            lineGlyph.border = false;
                            elementGlyph.border = false;
                            break;
                        }
                    }

                }
            });
        });
    }//mouseMove()

    canvas.addEventListener("click", sourceClick, false);
    canvas.addEventListener("dblclick", sourceDblClick, false);
    canvas.onmousemove = function(e) {
        mouseMove(e);
    }

    gatherCellInformation(jsonChunks);

    //put files/nodes/edges on the screen initially
    drawSourcilloscopeGrid(globFiles, sourceTurns, canvas, ctx, maxX, glyphMap, dotAlpha, 1);      
}
