var drawSourcilloscopeGrid = (function () {
    "use strict";

    function dottedLine(ctx, startx, starty, endx, endy) {

        ctx.moveTo(startx, starty);

        var distx, disty, distance, vecx, vecy, x, y;

        distx = endx - startx;
        disty = endy - starty;
        distance = Math.sqrt(distx * distx + disty * disty);

        //converting to vectors
        vecx = distx / distance;
        vecy = disty / distance;

        //begining dot from start point
        x = startx + vecx * 10;
        y = starty + vecy * 10;

        //loop drawing lines
        while (Math.sqrt((startx - x) * (startx - x) + (starty - y) * (starty - y)) < distance) {
            //space of 2.5
            ctx.lineTo(x, y);

            x += vecx * 2.5;
            y += vecy * 2.5;

            //draw for distance of 20
            ctx.moveTo(x, y);

            x += vecx * 20;
            y += vecy * 20;
        }
        ctx.lineTo(endx, endy);
    }

    //First, Draw bars and numbers to show Concurrency
    //Next, draw got nodes and loop through all outgoing edges, 
    //drawing them as well Also, check for targets and draw corresponding arcs
    function drawNodesAndEdges(sourceTurns, canvas, ctx, dotAlpha, map) {
        //storing connected vats, last turn in process order

        // key type: vat name, value type: sourceTurns index value
        var i,
            conVats = {}, // storing last turn in proc order, [vat name] = sourceturns index
            x,            //index into sourceTurns
            edge,         //stores edge
            target,       //stoers edge target node
            targetInfo,   //target information from map
            nodeInfo,     //stores node information from map
            edgeInfo,     //stores edge information from map
            alphaFlag,    //used to count edge alphas 
            conx, cony,   //stores previous draw position for turn
            endx, endy,   //end x and y values for arcs
            sign,         //used to establish draw direction
            str,          //string variable
            diffbez,      //diff angle for bezier curves
            sb, eb,       //holds bezier control pts
            src,          //source file from prev vat
            elementMap;   //map information for prev element

        if (canvas.getContext) {

            for (x in sourceTurns) {
                nodeInfo = map.get(sourceTurns[x].trnNode);

                //bar for concurrency
                ctx.fillStyle = "rgba(100,100,100," 
                                + Math.max(1 - (2 * sourceTurns[x].concurrent / 10), 0) + ")";
                ctx.fillRect(nodeInfo.x + 10, 10, 
                             sourceTurns[x].trnEdges.length * 10 + 20, 10);

                ctx.fillStyle = "rgb(0,0,0)";//"black";
                ctx.font = "8pt Helvetica";
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.fillText('' + sourceTurns[x].concurrent, nodeInfo.x, 9);

                //draw nodes
                ctx.beginPath();
                ctx.fillStyle = 'rgba(0,0,0,' + nodeInfo.alpha + ')';
                ctx.fillRect(nodeInfo.x + 5, nodeInfo.y + 5, 5, 5);

                //highlight picked nodes with halos
                if (nodeInfo.hlight === 1) {
                    ctx.fillStyle = "rgba(178,34,34,.2)";
                    ctx.fillRect(nodeInfo.x, nodeInfo.y, 15, 15);
                }


                //setting transparancy flag for turns, 
                //so not entire turn is opaque if not all edges are shown
                alphaFlag = 0;
                for (i = 0; i < sourceTurns[x].trnEdges.length; i += 1) {
                    if (map.get(sourceTurns[x].trnEdges[i]).alpha === 1) {
                        alphaFlag = i;
                    }
                }

                conx = nodeInfo.x + 7.5;
                cony = nodeInfo.y + 7.5;

                //used for bezier curves to leave and
                //enter nodes at various angle
                diffbez = 10;
                for (i = 0; i < sourceTurns[x].trnEdges.length; i += 1) {
                    edge = sourceTurns[x].trnEdges[i];
                    edgeInfo = map.get(edge);


                    //solid black lines between edge nodes within a turn
                    ctx.beginPath();
                    //opaque for process order
                    if (dotAlpha === 1 && edgeInfo.alpha !== 1) {
                        ctx.strokeStyle = 'rgba(0,0,0,1)';
                    } else if (i < alphaFlag) {
                        ctx.strokeStyle = 'rgba(0,0,0,' + nodeInfo.alpha + ')';
                    } else {
                        ctx.strokeStyle = 'rgba(0,0,0,' + edgeInfo.alpha + ')';
                    }
                    ctx.moveTo(conx, cony);
                    ctx.lineTo(edgeInfo.x + 7.5, edgeInfo.y + 7.5);
                    ctx.stroke();

                    conx = edgeInfo.x + 7.5;
                    cony = edgeInfo.y + 7.5;

                    //draw edge nodes
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(178,34,34,' + edgeInfo.alpha + ')';
                    ctx.fillRect(edgeInfo.x + 5, edgeInfo.y + 5, 5, 5);

                    // highlight picked edges with halo
                    if (edgeInfo.hlight === 1) {
                        ctx.fillStyle = "rgba(178,34,34,.2)";
                        ctx.fillRect(edgeInfo.x, edgeInfo.y, 15, 15);
                    }

                    target = edge.getTarget();

                    //connect sent edges with bezier curves or mark fulfilleds 
                    if (sourceTurns[target.name] !== undefined) {
                        targetInfo = map.get(sourceTurns[target.name].trnNode);
  
                        endx = targetInfo.x + 7.5;
                        endy = targetInfo.y + 7.5;

                        sign = endy > (edgeInfo.y + 7.5) ? 1 : -1;

                        //if fulfilled, mark the node
                        //str = new String();
                        str = '' + edge.traceRecord.class;
                        if (str.match("Fulfilled") !== null) {
                            ctx.fillStyle = 'rgba(61,89,171,' + edgeInfo.alpha + ')';
                            //draw triangle
                            ctx.beginPath();
                            ctx.moveTo(endx - 2.5, edgeInfo.y + 7.5);
                            ctx.lineTo(endx + 2.5, edgeInfo.y + 7.5);
                            ctx.lineTo(endx, edgeInfo.y + 7.5 + 20 * sign); //endy
                            ctx.closePath();
                            ctx.fill();
                            ctx.strokeStyle = 'rgba(61,89,171,' + edgeInfo.alpha + ')';
                            //connect tip of triangle with node
                            ctx.moveTo(endx, edgeInfo.y + 7.5 + 20 * sign);
                            ctx.lineTo(endx, endy);
                            ctx.stroke();
                        } else { // if sent, draw bezier
                            //help differentiate bezier curves
                            sb = edgeInfo.y + 7.5 - sign * diffbez;
                            eb = endy + sign * diffbez;
                            ctx.moveTo(edgeInfo.x + 7.5, edgeInfo.y + 7.5);
                            ctx.bezierCurveTo(endx, sb, edgeInfo.x + 7.5, eb, endx, endy);
                            ctx.strokeStyle = 'rgba(178,34,34,' + edgeInfo.alpha + ' )';
                            ctx.stroke();
                            diffbez += 5;
                        }
                    }

                }

                //line connecting nodes between vats, process order
                if (conVats[sourceTurns[x].name] === undefined) {
                    conVats[sourceTurns[x].name] = x;
                } else {
                    src = sourceTurns[conVats[sourceTurns[x].name]];
                    if (src.trnEdges.length > 0) {
                        elementMap = map.get(src.trnEdges[src.trnEdges.length - 1]);
                    } else {
                        elementMap = map.get(src.trnNode);
                    }

                    ctx.beginPath();
                    ctx.strokeStyle = "rgba(0,0,0," + dotAlpha + ")";//"black";
                    dottedLine(ctx, elementMap.x + 7.5, elementMap.y + 7.5, 
                               nodeInfo.x + 7.5, nodeInfo.y + 7.5);
                    ctx.stroke();
                    //holds last known turn for specific vat
                    conVats[sourceTurns[x].name] = x; 
                }

            }

            //weird draw bug, wont go away unless I draw something irrelevant last
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(10, 0);
            ctx.stroke();

        }
    }

    function drawFiles(globFiles, canvas, ctx, maxX, map) {

        var i,
            spacing = 20, //vert spacing
            starty = 40,  //starting y value
            shadingy,     //y coord of file shading
            element;      //element within line object

        function drawOneFile(file) {

            var i, j,
                startx = 40,
                nodey = starty,
                str,
                textLen, 
                toHighlight;

            if (canvas.getContext) {
                //display files
                ctx.fillStyle = "rgb(0,0,0)";//"black";
                ctx.font = "10pt Helvetica";
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.fillText(file.name, startx, starty);

                //draw file arrow for collapse   
                ctx.fillStyle = "rgba(178,34,34,.7)";
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

                starty += spacing;

                //if file collapsed, do not show
                if (!file.show) {
                    return;
                }

                for (i = 0; i < file.lines.length; i += 1) {
                    //display line numbers and messages
                    str = file.lines[i].span[0][0] + " " + file.lines[i].message;
                    textLen = ctx.measureText(str).width;
                    ctx.fillStyle = "rgb(0,0,0)";//"black";
                    ctx.font = "8pt Helvetica";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "top";
                    ctx.fillText(str, startx + 20, starty);

                    //draw circles for active/hidden source lines
                    ctx.beginPath();
                    ctx.arc(startx + 10, starty + 6, 5, 0, 2 * Math.PI, 1);
                    ctx.closePath();

                    if (file.lines[i].show === true) { 
                        ctx.fillStyle = "rgba(178,34,34,.7)";
                        ctx.fill();
                    } else {
                        ctx.strokeStyle = "rgba(178,34,34,1)";
                        ctx.stroke();
                    }

                    toHighlight = false;
                    for (j = 0; j < file.lines[i].lnElements.length; j += 1) {
                        element = file.lines[i].lnElements[j];

                        //highlight line of text
                        if (map.get(element).hlight === 1) { 
                            toHighlight = true;
                        }

                        map.get(element).y = starty;    
                    }
 
                    file.lines[i].ycoord = starty;
                    if (toHighlight) {
                        ctx.fillStyle = "rgba(178,34,34,.2)";
                        ctx.fillRect(startx + 20, starty, textLen, 15);
                    }

                    starty += spacing;
                }
            }
        }

        shadingy = starty;
        //looping through all files
        for (i = 0; i < globFiles.length; i += 1) {
            //individualy visualizing files
            globFiles[i].ycoord = starty;
            drawOneFile(globFiles[i], starty);

            //file shading
            ctx.beginPath();
            ctx.fillStyle = "rgba(200, 200, 200, 0.25)";
            ctx.fillRect(20, shadingy, maxX, starty - shadingy);
  
            starty += spacing;
            shadingy = starty;
        }
    }

    // globFiles - Array of files
    // sourceTurns - array of turns holding got and sent information
    // canvas,ctx - canvas draw variables
    // maxX - max horizontal x value, used to bound background shading
    // dotAlpha - alpha for dotted lines for process order
    // nowipe - flag to limit canvas clearing
    return function (globFiles, sourceTurns, canvas, ctx, maxX, map, dotAlpha, noWipe) {

        if (noWipe === undefined) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        drawFiles(globFiles, canvas, ctx, maxX, map);
        drawNodesAndEdges(sourceTurns, canvas, ctx, dotAlpha, map);
    };

}()); 
