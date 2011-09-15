var drawSourcilloscopeGrid = (function () {
    "use strict";

    var EDGE_COLOR = 'rgba(178,34,34,',
        NODE_COLOR = 'rgba(0,0,0,',
        FULFILLED_COLOR = 'rgba(61,89,171,',
        SHADE_COLOR = 'rgba(200, 200, 200, 0.25)',
        TURNBAR_COLOR = 'rgba(100,100,100,';
 
    function list(map, predicate) {
        var key;
        for (key in map) {
            if (Object.prototype.hasOwnProperty.call(map, key)) {
                predicate(map[key], key);
            }
        }
    }//list()

    function dottedLine(ctx, startx, starty, endx, endy) {

        var distx = endx - startx, 
            disty = endy - starty, 
            distance = Math.sqrt(distx * distx + disty * disty), 
            vecx = distx / distance, 
            vecy = disty / distance, 
            x = startx + vecx * 10, 
            y = starty + vecy * 10;

        ctx.moveTo(startx, starty);
        //loop drawing lines
        while (Math.sqrt((startx - x) * (startx - x) + (starty - y) * (starty - y)) < distance) {
            ctx.lineTo(x, y);

            //spacing of 2.5
            x += vecx * 2.5;
            y += vecy * 2.5;
            ctx.moveTo(x, y);

            //draw distance of 20
            x += vecx * 20;
            y += vecy * 20;
        }
        //connect with the end point
        ctx.lineTo(endx, endy);
    }//dottedLine()

    //First, Draw bars and numbers to show Concurrency
    //Next, draw got nodes and loop through all outgoing edges, 
    //drawing them as well Also, check for targets and draw corresponding arcs
    function drawNodesAndEdges(sourceTurns, canvas, ctx, dotAlpha, glyphMap) {
        var i,
            conVats = {}, // storing last turn in proc order, [vat name] = sourceturns index
            conx, cony,   //stores previous draw position for turn
            src,          //source file from prev vat
            elementMap;   //map information for prev element

        if (canvas.getContext) {
            list(sourceTurns, function(turn) {
                var edge,         //stores edge
                    target,       //stores edge target node
                    targetGlyph,   //target information from map
                    nodeGlyph,     //stores node information from glyphMap
                    edgeGlyph,     //stores edge information from glyphMap
                    alphaFlag,    //used to count edge alphas 
                    endx, endy,   //end x and y values for arcs
                    sign,         //used to establish draw direction
                    str,          //string variable
                    diffbez,      //diff angle for bezier curves
                    sb, eb;       //holds bezier control pts

                nodeGlyph = glyphMap.get(turn.trnNode);

                //bar for concurrency
                ctx.fillStyle = TURNBAR_COLOR
                                + Math.max(1 - (2 * turn.trnConc.length / 10), 0) + ')';
                ctx.fillRect(nodeGlyph.x + 10, 10, 
                             turn.trnEdges.length * 10 + 20, 10);

                ctx.fillStyle = "black";
                ctx.font = "8pt Helvetica";
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.fillText('' + turn.trnConc.length, nodeGlyph.x, 9);

                //draw nodes
                ctx.beginPath();
                ctx.fillStyle = NODE_COLOR + nodeGlyph.alpha + ')';
                ctx.fillRect(nodeGlyph.x + 5, nodeGlyph.y + 5, 5, 5);

                //highlight picked nodes with halos
                if (nodeGlyph.hlight) {
                    ctx.fillStyle = EDGE_COLOR + '.2)';
                    ctx.fillRect(nodeGlyph.x, nodeGlyph.y, 15, 15);
                }

                //setting transparancy flag for turns, 
                //so not entire turn is opaque if not all edges are shown
                alphaFlag = 0;
                for (i = 0; i < turn.trnEdges.length; i += 1) {
                    if (glyphMap.get(turn.trnEdges[i]).alpha === 1) {
                        alphaFlag = i;
                    }
                }

                conx = nodeGlyph.x + 7.5;
                cony = nodeGlyph.y + 7.5;

                //used for bezier curves to leave and
                //enter nodes at various angle
                diffbez = 10;
                //drawing sent events
                for (i = 0; i < turn.trnEdges.length; i += 1) {
                    edge = turn.trnEdges[i];
                    edgeGlyph = glyphMap.get(edge);


                    //solid black lines between edge nodes within a turn
                    ctx.beginPath();
                    //opaque for process order
                    if (dotAlpha === 1 && edgeGlyph.alpha !== 1) {
                        ctx.strokeStyle = NODE_COLOR + '1)';
                    } else if (i < alphaFlag) {
                        ctx.strokeStyle = NODE_COLOR + nodeGlyph.alpha + ')';
                    } else {
                        ctx.strokeStyle = NODE_COLOR + edgeGlyph.alpha + ')';
                    }
                    ctx.moveTo(conx, cony);
                    ctx.lineTo(edgeGlyph.x + 7.5, edgeGlyph.y + 7.5);
                    ctx.stroke();

                    conx = edgeGlyph.x + 7.5;
                    cony = edgeGlyph.y + 7.5;

                    //draw edge nodes
                    ctx.beginPath();
                    ctx.fillStyle = EDGE_COLOR + edgeGlyph.alpha + ')';
                    ctx.fillRect(edgeGlyph.x + 5, edgeGlyph.y + 5, 5, 5);

                    // highlight picked edges with halo
                    if (edgeGlyph.hlight) {
                        ctx.fillStyle = EDGE_COLOR + '.2)';
                        ctx.fillRect(edgeGlyph.x, edgeGlyph.y, 15, 15);
                    }

                    target = edge.getTarget();

                    //connect sent edges with bezier curves or mark fulfilleds 
                    if (sourceTurns[target.name] !== undefined) {
                        targetGlyph = glyphMap.get(sourceTurns[target.name].trnNode);
  
                        endx = targetGlyph.x + 7.5;
                        endy = targetGlyph.y + 7.5;

                        sign = endy > (edgeGlyph.y + 7.5) ? 1 : -1;

                        //if fulfilled, mark the node
                        //str = new String();
                        str = '' + edge.traceRecord.class;
                        if (str.match("Fulfilled") !== null) {
                            ctx.fillStyle = FULFILLED_COLOR + edgeGlyph.alpha + ')';
                            //draw triangle
                            ctx.beginPath();
                            ctx.moveTo(endx - 2.5, edgeGlyph.y + 7.5);
                            ctx.lineTo(endx + 2.5, edgeGlyph.y + 7.5);
                            ctx.lineTo(endx, edgeGlyph.y + 7.5 + 20 * sign); //endy
                            ctx.closePath();
                            ctx.fill();
                            ctx.strokeStyle = FULFILLED_COLOR + edgeGlyph.alpha + ')';
                            //connect tip of triangle with node
                            ctx.moveTo(endx, edgeGlyph.y + 7.5 + 20 * sign);
                            ctx.lineTo(endx, endy);
                            ctx.stroke();
                        } else { // if sent, draw bezier
                            //help differentiate bezier curves
                            sb = edgeGlyph.y + 7.5 - sign * diffbez;
                            eb = endy + sign * diffbez;
                            ctx.moveTo(edgeGlyph.x + 7.5, edgeGlyph.y + 7.5);
                            ctx.bezierCurveTo(endx, sb, edgeGlyph.x + 7.5, eb, endx, endy);
                            ctx.strokeStyle = EDGE_COLOR + edgeGlyph.alpha + ')';
                            ctx.stroke();
                            diffbez += 5;
                        }
                    }

                }

                //line connecting nodes between vats, process order
                if (conVats[turn.name] === undefined) {
                    conVats[turn.name] = turn.trnNode.name;
                } else {
                    src = sourceTurns[conVats[turn.name]];
                    if (src.trnEdges.length > 0) {
                        elementMap = glyphMap.get(src.trnEdges[src.trnEdges.length - 1]);
                    } else {
                        elementMap = glyphMap.get(src.trnNode);
                    }

                    ctx.beginPath();
                    ctx.strokeStyle = NODE_COLOR + dotAlpha + ')';
                    dottedLine(ctx, elementMap.x + 7.5, elementMap.y + 7.5, 
                               nodeGlyph.x + 7.5, nodeGlyph.y + 7.5);
                    ctx.stroke();
                    //holds last known turn for specific vat
                    conVats[turn.name] = turn.trnNode.name; 
                }

            });

            //weird draw bug, wont go away unless I draw something irrelevant last
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(10, 0);
            ctx.stroke();

        }
    }//drawNodesAndEdges()

    function drawFiles(globFiles, canvas, ctx, maxX, glyphMap) {

        var SPACING = 20,      //vert spacing
            starty = 40,       //starting y value
            shadingy = starty; //y coord of file shading

        function drawOneFile(file) {
            var startx = 40;

            if (canvas.getContext) {
                //display files
                ctx.fillStyle = "black";
                ctx.font = "10pt Helvetica";
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.fillText(file.name, startx, starty);

                //draw file arrow for collapse   
                ctx.fillStyle = EDGE_COLOR + '.7)';
                ctx.beginPath();

                if (file.show) {
                    ctx.moveTo(startx - 19 + 2.5, starty + 2.5);
                    ctx.lineTo(startx - 19 + 15, starty + 2.5);
                    ctx.lineTo(startx - 19 + 8.75, starty + 15);
                } else {
                    ctx.moveTo(startx - 19 + 2.5, starty + 2.5);
                    ctx.lineTo(startx - 19 + 2.5, starty + 15);
                    ctx.lineTo(startx - 19 + 15, starty + 8.75);
                }
                ctx.closePath();
                ctx.fill();

                starty += SPACING;

                //if file collapsed, do not show
                if (!file.show) {
                    return;
                }

                file.lines.forEach(function (line) {
                    var str = line.span[0][0] + " " + line.message,
                        toHighlight = false;

                    line.textLen = ctx.measureText(str).width;
                    //display line numbers and messages
                    ctx.fillStyle = "black";
                    ctx.font = "8pt Helvetica";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "top";
                    ctx.fillText(str, startx + 20, starty+1);

                    //draw circles for active/hidden source lines
                    ctx.beginPath();
                    ctx.arc(startx + 10, starty + 7, 5, 0, 2 * Math.PI, 1);
                    ctx.closePath();

                    if (line.show) { 
                        ctx.fillStyle = EDGE_COLOR + '.7)';
                        ctx.fill();
                    } else {
                        ctx.strokeStyle = EDGE_COLOR + '1)';
                        ctx.stroke();
                    }

                    line.lnElements.forEach(function (element) {
                        //highlight line of text
                        if (glyphMap.get(element).hlight) { 
                            toHighlight = true;
                        }
                        //set y coordinates for got/sent events
                        glyphMap.get(element).y = starty;    
                    });
 
                    line.ycoord = starty;
                    if (toHighlight) {
                        ctx.strokeStyle = EDGE_COLOR + '.85)';
                        ctx.strokeRect(startx + 19, starty-1, line.textLen+2, 17);
                    }

                    starty += SPACING;
                });
            }
        }//drawOneFile()

        //looping through all files
        globFiles.forEach(function (file) {
            //individualy visualizing files
            file.ycoord = starty;
            drawOneFile(file, starty);

            //file shading
            ctx.beginPath();
            ctx.fillStyle = SHADE_COLOR;
            ctx.fillRect(20, shadingy, maxX, starty - shadingy);
  
            starty += SPACING;
            shadingy = starty;
        });
    }//drawFiles()

    // globFiles - Array of files
    // sourceTurns - array of turns holding got and sent information
    // canvas,ctx - canvas draw variables
    // maxX - max horizontal x value, used to bound background shading
    // glyphMap - mapping holding node/edge x,y,transparency,highlight information
    // dotAlpha - alpha for dotted lines for process order
    // nowipe - flag to limit canvas clearing
    return function (globFiles, sourceTurns, canvas, ctx, maxX, glyphMap, dotAlpha, noWipe) {

        if (noWipe === undefined) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        drawFiles(globFiles, canvas, ctx, maxX, glyphMap);
        drawNodesAndEdges(sourceTurns, canvas, ctx, dotAlpha, glyphMap);
    };

}()); 
