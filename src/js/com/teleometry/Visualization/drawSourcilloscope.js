

var drawSourcilloscopeGrid = (function () {

    function drawNodesAndEdges(sourceTurns, canvas, ctx, dotAlpha, map) {
        //storing connected vats
        var conVats = {}; // key type: vat name, value type: sourceTurns index value

	if (canvas.getContext) {

	    for (x in sourceTurns) {
                var nodeMap = map.get(sourceTurns[x].trnNode);

                //bar for concurrency
                ctx.fillStyle = "rgba(100,100,100,"+Math.max(1-(2*sourceTurns[x].concurrent/10),0)+")";
                ctx.fillRect(nodeMap.x+10, 10, sourceTurns[x].trnEdges.length*10+20, 10);

                ctx.fillStyle = "rgb(0,0,0)";//"black";
                ctx.font = "8pt Helvetica";
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.fillText(""+sourceTurns[x].concurrent, nodeMap.x , 9);

                //draw nodes
                ctx.beginPath();
                ctx.fillStyle = 'rgba(0,0,0,'+nodeMap.alpha+')';
                ctx.fillRect(nodeMap.x+5, nodeMap.y+5, 5, 5);

                //highlight picked nodes with halos
                if (nodeMap.hlight === 1) {
                    ctx.fillStyle = "rgba(178,34,34,.2)";
                    ctx.fillRect(nodeMap.x, nodeMap.y, 15, 15);
                }


                //setting transparancy flag for turns, so not entire turn is opaque if not all edges are shown
                var alphaFlag = 0;
                for (i = 0; i < sourceTurns[x].trnEdges.length; i += 1) {
                    if ( map.get( sourceTurns[x].trnEdges[i] ).alpha === 1)
                        alphaFlag = i;
                }

                var conx = nodeMap.x+7.5;
                var cony = nodeMap.y+7.5;

                var diffbez = 10; //used for bezier curves to leave and enter nodes at various angles
                for (var i = 0; i < sourceTurns[x].trnEdges.length; i += 1) {
                    var edge = sourceTurns[x].trnEdges[i];
                    var edgeMap = map.get(edge);

//                    var startx = edgeMap.x+5;
//                    var starty = edgeMap.y+5;

                    //solid black lines between edge nodes within a turn
                    ctx.beginPath();
                    if (dotAlpha === 1 && edgeMap.alpha !== 1) //opaque for process order
                        ctx.strokeStyle = 'rgba(0,0,0,1)';
                    else if (i < alphaFlag)
                        ctx.strokeStyle = 'rgba(0,0,0,'+nodeMap.alpha+')'; // opaque until last opaque edge
                    else
                        ctx.strokeStyle = 'rgba(0,0,0,'+edgeMap.alpha+')';

                    ctx.moveTo(conx, cony);
                    ctx.lineTo(edgeMap.x+7.5, edgeMap.y+7.5);
                    ctx.stroke();

                    conx = edgeMap.x+7.5;
                    cony = edgeMap.y+7.5;

                    //draw edge nodes
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(178,34,34,'+edgeMap.alpha+')';
                    ctx.fillRect(edgeMap.x+5, edgeMap.y+5, 5, 5);

                    // highlight picked edges with halo
                    if (edgeMap.hlight === 1) {
                        ctx.fillStyle = "rgba(178,34,34,.2)";
                        ctx.fillRect(edgeMap.x, edgeMap.y, 15, 15);
                    }

                    //begin drawing on right of box
//                    startx += 2.5;
//                    starty += 2.5;

                    var target = edge.getTarget();

                    //connect sent edges with bezier curves or mark fulfilleds 
                    if (sourceTurns[target.name] !== undefined) {

                        var endx = map.get(sourceTurns[target.name].trnNode).x+7.5;
                        var endy = map.get(sourceTurns[target.name].trnNode).y+7.5;

                        ctx.beginPath();
                        ctx.moveTo(edgeMap.x+7.5, edgeMap.y+7.5);

                        //if fulfilled, mark the node
                        var str = new String( edge.traceRecord.class );
                        if (str.match("Fulfilled") !== null) {
                            var sign = (endy-edgeMap.y+7.5)/(Math.abs(endy-edgeMap.y+7.5));
                            ctx.fillStyle = 'rgba(61,89,171,'+edgeMap.alpha+')';
                            ctx.moveTo( endx-2.5, edgeMap.y+7.5 );
                            ctx.lineTo( endx+2.5, edgeMap.y+7.5 );
                            ctx.lineTo( endx, edgeMap.y+7.5+20*sign ); //endy
                            ctx.closePath();
                            ctx.fill();
                            ctx.strokeStyle = 'rgba(61,89,171,'+edgeMap.alpha+')';
                            ctx.moveTo( endx, edgeMap.y+7.5+20*sign );
                            ctx.lineTo( endx, endy );
                            ctx.stroke();
                        }
                        else { // if sent, draw bezier
                            //help differentiate bezier curves
                            var eb,sb;
                            if (edgeMap.y+7.5 < endy) {
                                sb = edgeMap.y+7.5 - diffbez;
                                eb = endy + diffbez;
                            }
                            else {
                                sb = edgeMap.y+7.5 + diffbez;
                                eb = endy - diffbez;
                            }

                            ctx.bezierCurveTo(edgeMap.x+7.5+(endx-edgeMap.x+7.5), sb, endx-(endx-edgeMap.x+7.5), eb, endx, endy);
                            ctx.strokeStyle = 'rgba(178,34,34,'+edgeMap.alpha+' )';
                            ctx.stroke();
                            diffbez+=5;
                        }
                    }

                }

                //line connecting nodes between vats, process order
                if (conVats[sourceTurns[x].name] === undefined) {
                    conVats[sourceTurns[x].name] = x;
                }
                else {
                    var src = sourceTurns[conVats[sourceTurns[x].name]];
                    var ending;
                    if (src.trnEdges.length > 0)
                        elementMap = map.get(src.trnEdges[src.trnEdges.length-1]);
                    else
                        elementMap = map.get(src.trnNode);

                    ctx.beginPath();
                    ctx.strokeStyle = "rgba(0,0,0,"+dotAlpha+")";//"black";
                    dottedLine(ctx, elementMap.x+7.5, elementMap.y+7.5, nodeMap.x+7.5, nodeMap.y+7.5);
                    ctx.stroke();

                    conVats[sourceTurns[x].name] = x; //holds last known turn for specific vat

                }

            }

            //weird draw bug, wont go away unless I draw something irrelevant last
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(10,0);
            ctx.stroke();

        }


    };

    function dottedLine(ctx, startx, starty, endx, endy) {

        ctx.moveTo(startx, starty);

        var distx = endx - startx;
        var disty = endy - starty;
        var distance = Math.sqrt(distx*distx + disty*disty);

        //converting to vectors
        var vecx = distx/distance;
        var vecy = disty/distance;

        //begining dot from start point
        var x = startx+vecx*10;
        var y = starty+vecy*10;


        //loop drawing lines
        while (Math.sqrt((startx-x)*(startx-x) + (starty-y)*(starty-y)) < distance) {
            //space of 2.5
            ctx.lineTo(x, y);

            x += vecx*2.5;
            y += vecy*2.5;

            //draw for distance of 20
            ctx.moveTo(x, y);

            x += vecx*20;
            y += vecy*20;
        }
        ctx.lineTo(endx, endy);

    }

    function drawFiles(globFiles, canvas, ctx, maxX, map) {

        var spacing = 20;

        function drawOneFile(file, starty) {

            var startx = 40;
            var nodey = starty;

            if (canvas.getContext) {
                //display files
                ctx.fillStyle = "rgb(0,0,0)";//"black";
                ctx.font = "10pt Helvetica";
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.fillText(file.name, startx, starty);

                
                ctx.fillStyle = "rgba(178,34,34,.7)";
                ctx.beginPath()

                if( file.show ) {
                    ctx.moveTo( startx-19+2.5, starty+2.5 );
                    ctx.lineTo( startx-19+15, starty+2.5 );
                    ctx.lineTo( startx-19+8.75, starty+15 );
                }
                else {
                    ctx.moveTo( startx-19+2.5, starty+2.5 );
                    ctx.lineTo( startx-19+2.5, starty+15 );
                    ctx.lineTo( startx-19+15, starty+8.75 );
                }
                ctx.closePath();
                ctx.fill();

                starty += spacing;

                if( !file.show )
                    return starty;

                for (var i = 0; i < file.lines.length; i += 1) {
                    //display line numbers and messages
                    var str = file.lines[i].span[0][0] + " " + file.lines[i].message;
                    var textLen = ctx.measureText( str ).width;
                    ctx.fillStyle = "rgb(0,0,0)";//"black";
                    ctx.font = "8pt Helvetica";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "top";
                    ctx.fillText(str, startx+20, starty);

                    //draw circles for active/hidden source lines
                    ctx.beginPath();
                    ctx.arc(startx+10, starty+6, 5, 0, 2*Math.PI, 1);
                    ctx.closePath();

                    if (file.lines[i].show === true) { 
                        ctx.fillStyle = "rgba(178,34,34,.7)";
                        ctx.fill();
                    }
                    else {
                        ctx.strokeStyle = "rgba(178,34,34,1)";
                        ctx.stroke();
                    }

                    var toHighlight = false;
                    for (var j = 0; j < file.lines[i].lnElements.length; j += 1) {
                        var edge = file.lines[i].lnElements[j];

                        //highlight line of text
                        if (map.get(edge).hlight === 1 ) { 
                            toHighlight = true;
                        }

                        map.get(edge).y = starty;    
                        file.lines[i].ycoord = starty;
                    }
 
                    if( toHighlight ) {
                        ctx.fillStyle = "rgba(178,34,34,.2)";
                        ctx.fillRect(startx+20, starty, textLen, 15);
                    }

                    starty += spacing;
                }

            }

            return starty;
        }

        var starty = 40;
        var shadingy = starty;
        //looping through all files
        for (var i = 0; i < globFiles.length; i += 1) {
            //individualy visualizing files
            globFiles[i].ycoord = starty;
            starty = drawOneFile(globFiles[i], starty);

            //file shading
            ctx.beginPath()
            ctx.fillStyle = "rgba(200, 200, 200, 0.25)";
            ctx.fillRect(20, shadingy, maxX, starty-shadingy);
  
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

        if (noWipe === undefined)
            ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawFiles(globFiles, canvas, ctx, maxX, map);
        drawNodesAndEdges(sourceTurns, canvas, ctx, dotAlpha, map);

    };
    


}()); 
