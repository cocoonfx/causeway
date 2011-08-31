

var drawSourcilloscopeGrid = (function () {

    function drawNodesAndEdges(sourceTurns, canvas, ctx, dotAlpha, map) {
        //storing connected vats
        var conVats = {};

	if (canvas.getContext) {
	    for (x in sourceTurns) {
                var node = sourceTurns[x].trnNode;

                //bar for concurrency
                ctx.fillStyle = "rgba(100,100,100,"+Math.max(1-(2*sourceTurns[x].concurrent/10),0)+")";
                ctx.fillRect(map.get(node).x+10, 10, sourceTurns[x].trnEdges.length*10+20, 10);

                var str = ""+sourceTurns[x].concurrent+"";
                ctx.fillStyle = "rgb(0,0,0)";//"black";
                ctx.font = "8pt Helvetica";
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.fillText(str, map.get(node).x , 9);

   
                var startNdx = map.get(node).x+5;
                var startNdy = map.get(node).y+5;

                //draw nodes
                ctx.beginPath();
                ctx.fillStyle = 'rgba(0,0,0,'+map.get(node).alpha+')';
                ctx.moveTo(startNdx, startNdy);
                ctx.lineTo(startNdx+5, startNdy);
                ctx.lineTo(startNdx+5, startNdy+5);
                ctx.lineTo(startNdx, startNdy+5);
                ctx.closePath();
                ctx.fill();

                //highlight picked nodes
                if (map.get(node).hlight === 1) {
                    ctx.fillStyle = "rgba(178,34,34,.2)";
                    ctx.fillRect(map.get(node).x, map.get(node).y, 15, 15);
                }

                var conx;
                var cony;

                //setting transparancy flag for turns, so not entire turn is opaque if not all edges are shown
                var alphaFlag = 0;
                for (i = 0; i < sourceTurns[x].trnEdges.length; i += 1) {
                    if ( map.get( sourceTurns[x].trnEdges[i] ).alpha === 1)
                        alphaFlag = i;
                }

                var diffbez = 10;
                for (var i = 0; i < sourceTurns[x].trnEdges.length; i += 1) {
                    var edge = sourceTurns[x].trnEdges[i];
                    var startx = map.get(edge).x+5;
                    var starty = map.get(edge).y+5;

                    if (i === 0) {
                        conx = startNdx+2.5;
                        cony = startNdy+2.5;
                    }

                    //solid black lines between edge nodes within a turn
                    ctx.beginPath();
                    if (dotAlpha === 1 && map.get(edge).alpha !== 1) //opaque for process order
                        ctx.strokeStyle = 'rgba(0,0,0,1)';
                    else if (alphaFlag === 0) // when user clicks turn for concurrency
                        ctx.strokeStyle = 'rgba(0,0,0,'+map.get(edge).alpha+')';
                    else if (i < alphaFlag)
                        ctx.strokeStyle = 'rgba(0,0,0,'+map.get(node).alpha+')'; // opaque until last opaque edge
                    else
                        ctx.strokeStyle = 'rgba(0,0,0,'+map.get(edge).alpha+')';

                    ctx.moveTo(conx, cony);
                    ctx.lineTo(startx+2.5, starty+2.5);
                    ctx.stroke();

                    conx = startx+2.5;
                    cony = starty+2.5;

                    //draw edge nodes
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(178,34,34,'+map.get(edge).alpha+')';
                    ctx.moveTo(startx, starty);
                    ctx.lineTo(startx+5, starty);
                    ctx.lineTo(startx+5, starty+5);
                    ctx.lineTo(startx, starty+5);
                    ctx.closePath();
                    ctx.fill();

                    // highlight picked edges
                    if (map.get(edge).hlight === 1) {
                        ctx.fillStyle = "rgba(178,34,34,.2)";
                        ctx.fillRect(map.get(edge).x, map.get(edge).y, 15, 15);
                    }

                    //begin drawing on right of box
                    startx += 2.5;
                    starty += 2.5;

                    var target = edge.getTarget();

                    //connect sent edges with bezier curves or mark fulfilleds 
                    if (sourceTurns[target.name] !== undefined) {
                        var endx;
                        var endy;

                        endx = map.get(sourceTurns[target.name].trnNode).x+7.5;
                        endy = map.get(sourceTurns[target.name].trnNode).y+7.5;

                        //help differentiate bezier curves
                        var eb;
                        var sb;
                        if (starty < endy) {
                            sb = starty - diffbez;
                            eb = endy + diffbez;
                        }
                        else {
                            sb = starty + diffbez;
                            eb = endy - diffbez;
                        }

                        ctx.beginPath();
                        ctx.moveTo(startx, starty);

                        //if fulfilled, mark the node
                        var str = new String( edge.traceRecord.class );
                        if (str.match("Fulfilled") !== null) {
                            var sign = (endy-starty)/(Math.abs(endy-starty));
                            ctx.fillStyle = 'rgba(61,89,171,'+map.get( edge ).alpha+')';
                            ctx.moveTo( endx-2.5, starty );
                            ctx.lineTo( endx+2.5, starty );
                            ctx.lineTo( endx, starty+20*sign ); //endy
                            ctx.closePath();
                            ctx.fill();
                            ctx.strokeStyle = 'rgba(61,89,171,'+map.get( edge ).alpha+')';
                            ctx.moveTo( endx, starty+20*sign );
                            ctx.lineTo( endx, endy );
                            //dottedLine( ctx, endx, starty+20*sign, endx, endy );
                            ctx.stroke();
                        }
                        else { // if sent, draw bezier
                            //help differentiate bezier curves
                            var eb,sb;
                            if (starty < endy) {
                                sb = starty - diffbez;
                                eb = endy + diffbez;
                            }
                            else {
                                sb = starty + diffbez;
                                eb = endy - diffbez;
                            }

                            ctx.bezierCurveTo(startx+(endx-startx), sb, endx-(endx-startx), eb, endx, endy);
                            ctx.strokeStyle = 'rgba(178,34,34,'+map.get(edge).alpha+' )';
                            ctx.stroke();
                            diffbez+=5;
                        }
                    }

                }

                //line connecting nodes between vats, process order
                if (conVats[ sourceTurns[x].name] === undefined ) {
                    conVats[ sourceTurns[x].name ] = x;
                }
                else {
                    var src = sourceTurns[conVats[sourceTurns[x].name]];
                    var ending;
                    if (src.trnEdges.length > 0)
                        ending = src.trnEdges[src.trnEdges.length-1];
                    else
                        ending = src.trnNode;

                    var srx = map.get(ending).x;
                    var sry = map.get(ending).y;

                    var edge = sourceTurns[x].trnNode;
                    ctx.beginPath();
                    ctx.strokeStyle = "rgba(0,0,0,"+dotAlpha+")";//"black";
                    dottedLine(ctx, srx+7.5, sry+7.5, map.get(edge).x+7.5, map.get(edge).y+7.5);
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
        var curx = vecx*10;
        var cury = vecy*10;

        //loop drawing lines
        while (Math.sqrt((startx-startx+curx)*(startx-startx+curx) + (starty-starty+cury)*(starty-starty+cury)) < distance) {
            //space of 2.5
            ctx.lineTo(startx+curx, starty+cury);

            curx += vecx*2.5;
            cury += vecy*2.5;

            //draw for distance of 20
            ctx.moveTo(startx+curx, starty+cury);

            curx += vecx*20;
            cury += vecy*20;
        }
        ctx.lineTo(endx, endy);

    }

    function drawFiles(globFiles, canvas, ctx, maxX, map) {

        function drawOneFile(file, starty, hspcg, canvas, ctx, maxX, map) {

            var startx = 20;
            var nodey = starty;

            if (canvas.getContext) {
                //display files
                ctx.fillStyle = "rgb(0,0,0)";//"black";
                ctx.font = "10pt Helvetica";
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.fillText(file.name, startx, starty);

                //draw marks on top of file boxes, aesthetics only
                ctx.strokeStyle = "rgba(178,34,34,1)";
                ctx.moveTo(startx, starty);
                ctx.lineTo(startx+50, starty);
                ctx.stroke();

                starty += hspcg;

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

                    if (file.lines[i].show > 0) { 
                        ctx.fillStyle = "rgba(178,34,34,.7)";
                        ctx.fill();
                    }
                    else {
                        ctx.strokeStyle = "rgba(178,34,34,1)";
                        ctx.stroke();
                    }

                    var toHighlight = true;
                    for (var j = 0; j < file.lines[i].lnElements.length; j += 1) {
                        var startxNd = map.get( file.lines[i].lnElements[j] ).x;
                        var edge = file.lines[i].lnElements[j];

                        //highlight line of text
                        if (map.get(edge).hlight === 1 && toHighlight) {
                            ctx.fillStyle = "rgba(178,34,34,.2)";
                            ctx.fillRect(startx+20, starty, textLen, 15);
                            toHighlight = false; //no double highlighting for multiple elements on a line
                        }

                        map.get(edge).y = starty;    
                        file.lines[i].ycoord = starty;
                    }
                    starty += hspcg;
                }

            }

            //file shading
            ctx.beginPath()
            ctx.fillStyle = "rgba(200, 200, 200, 0.25)";
            ctx.fillRect(startx, nodey, maxX, starty-nodey);

            return starty;
        };


        var hspcg = 20;
        var starty = 40;
        //looping through all files
        for (var i = 0; i < globFiles.length; i += 1) {
            //individualy visualizing files
            starty = drawOneFile(globFiles[i], starty, hspcg, canvas, ctx, maxX, map);
            starty += hspcg;
        }
   
    };


    return function (globFiles, sourceTurns, canvas, ctx, maxX, map, dotAlpha, noWipe) {

        if (noWipe === undefined)
            ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawFiles(globFiles, canvas, ctx, maxX, map);
        drawNodesAndEdges(sourceTurns, canvas, ctx, dotAlpha, map);

    };
    


}()); 
