
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


    var sourceTurns = {};

    var startNdx = 300;
    var ndspcg = 10;
    var trnspcg = 40;
    var cnt = 0;
    for( i in cellGrid.cells )
    {


        var trn = new turnObject();
        trn.addNodeToTurn( cellGrid.cells[i].node );
        trn.trnNode.setX( startNdx );
        startNdx += ndspcg;


        cellGrid.cells[i].node.outs( function( edge )
        {
            trn.name = edge.getOrigin().getVatName();
//            document.write("origin "+edge.getOrigin().name+" vatname "+edge.getOrigin().getVatName()+"<br/>");
            var stack = edge.traceRecord.trace.calls;
            if( stack.length > 0 )
            {
                if( !hiddenSrcPaths.contains( stack[0].source ) )
                {
                    var label = walker.getElementLabel(edge,vatMap);
                    checkFile( globFiles, globCnt, stack[0].source, stack[0].span[0][0], label, edge );

                    edge.setX( startNdx );
                    trn.addEdgeToTurn( edge );
     
                    startNdx += ndspcg;
                }
            }
        });

        //ether
        if( trn.trnEdges.length == 0 )
        {
            trn.trnNode.setY( 55 );
        }

        sourceTurns[ trn.trnNode.name ] = trn;
        cnt++;
        startNdx += trnspcg;
    }

    
    /*

        //statistics of files per stack
        if( bins[ locCnt[0] ] == undefined )
            bins[ locCnt[0] ] = 0;

        bins[ locCnt[0] ] += 1;

        //stacks with 2 source files and statistics on connections
        if( locCnt[0] == 2 )
        {
            var file1 = getFileIndex( globFiles, globCnt, locFiles[0].name );
            var file2 = getFileIndex( globFiles, globCnt, locFiles[1].name );

            globFiles[ file1 ].addConnectFile( file2 );
            globFiles[ file2 ].addConnectFile( file1 );
        }
    */


    //source grid visualization
    drawFiles( globFiles, globCnt, nodes, canvas, ctx ); 

    drawNodesAndEdges( sourceTurns, canvas, ctx );

    /*
    //print out the file information
    document.write("number of Files "+globCnt[0]+"<br/>");
    var i;
    for( i = 0; i < globCnt[0]; i++ )
    {
        document.write(globFiles[i].name+" lines per files: "+globFiles[i].lineCnt+"<br/>");
        
        var j;
        for( j = 0; j < globFiles[i].lines.length; j++ )
        {
            document.write("--- "+globFiles[i].lines[j].lineNum+" "+globFiles[i].lines[j].message+"<br/>");

          //if( globFiles[i].fileConnect[j] != undefined )
           //document.write("-----connects with "+globFiles[j].name+" "+globFiles[i].fileConnect[j]+" times <br/>");
        }
        document.write("<br/>");
        
    }
    */

    /*
    //print out bin information
    document.write("bins <br/>");

    for( i = 1; i < bins.length; i++ )
    {
        if( bins[i] == undefined )
            document.write("Turns with "+i+" different files: 0 <br/>");
        else
            document.write("Turns with "+i+" different files: "+bins[i]+"<br/>");
    }
    */

}

function drawNodesAndEdges( sourceTurns, canvas, ctx )
{

    var conVats = {};

    var counter = 0
    if( canvas.getContext )
    {
        var prevVatName;
        var prevX;
        var prevY;
        for( x in sourceTurns )
        {
            //write names
            var namey;
            if( counter % 2  == 0 )
                namey = 5;
            else
                namey = 20;

            // bar for continuous vats
            if( prevVatName != undefined )
            {
                if( prevVatName == sourceTurns[x].name )
                {
                    ctx.fillStyle = "rgba(200,200,200,.4)";
                    ctx.fillRect( prevX, 20, sourceTurns[x].trnNode.getX()-prevX, 20 ); 

                }
                else
                {
                    ctx.fillStyle = "rgba(200,200,200,.4)";
                    ctx.fillRect( prevX, 20, sourceTurns[x].trnNode.getX()-prevX-20, 20 );

                    //write names if diff from previous Vat
                    ctx.fillStyle = "rgb(0,0,0)";//"black";
                    ctx.font = "10pt Helvetica";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "top";
                    ctx.fillText( sourceTurns[x].trnNode.getVatName(), sourceTurns[x].trnNode.getX(), 5 );

                }
            }
            else
            {
                    //writing names for beginning
                    ctx.fillStyle = "rgb(0,0,0)";//"black";
                    ctx.font = "10pt Helvetica";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "top";
                    ctx.fillText( sourceTurns[x].trnNode.getVatName(), sourceTurns[x].trnNode.getX(), 5 );
            }

            //write numbers
            ctx.fillStyle = "rgb(0,0,0)";//"black";
            ctx.font = "10pt Helvetica";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText( sourceTurns[x].trnNode.traceRecord.anchor.turn.number, sourceTurns[x].trnNode.getX(), 22 );

            prevVatName = sourceTurns[x].name;//trnNode.getVatName();
            prevX = sourceTurns[x].trnNode.getX();
 
     
            var startNdx = sourceTurns[x].trnNode.getX()+5;
            var startNdy = sourceTurns[x].trnNode.getY()+5;

            //draw nodes
            ctx.beginPath();
            ctx.fillStyle = 'rgba(0,0,0,1)';
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

                var startx = edge.getX()+5;
                var starty = edge.getY()+5;

                if( i == 0 ) // line between node box and first edge box
                {
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(0,0,0,1)';
                    //ctx.lineWidth = 2;
                    ctx.moveTo( startNdx+2.5, startNdy+2.5 );
                    ctx.lineTo( startx+2.5, starty+2.5 );
                    ctx.stroke();
                    ctx.lineWidth = 1;
                    
                }
                else // line between edge boxes
                {
                    ctx.beginPath();
                    ctx.strokeStyle = "black";//'rbga(0,200,0,1)';
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
                    ctx.strokeStyle = 'rgba(200,0,0,1)';
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
                ctx.strokeStyle = "rgba(0,0,0,.8)";//"black";
//                ctx.moveTo( srx+7.5, sry+7.5 );
//                ctx.lineTo( edge.getX()+7.5, edge.getY()+7.5 );
                dottedLine( ctx, srx+7.5, sry+7.5, edge.getX()+7.5, edge.getY()+7.5 );
                ctx.stroke();

                conVats[ sourceTurns[x].name ] = x;
                
            }

   
            counter++;
        }

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

function drawFiles( globFiles, globCnt, nodes, canvas, ctx )
{

    var hspcg = 20;
 
    var i;
    var starty = 80;
    //looping through all files
    for( i = 0; i < globFiles.length; i++ )
    {
        //individualy visualizing files
        starty = drawOneFile( globFiles[i], starty, hspcg, canvas, ctx );
        starty += hspcg;

    }
    
}

function drawOneFile( file, starty, hspcg, canvas, ctx )
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


            var j;
            for( j = 0; j < file.lines[i].lnEdges.length; j++ )
            {
                var startxNd = file.lines[i].lnEdges[j].getX();

                file.lines[i].lnEdges[j].getOrigin().setY( nodey );
                file.lines[i].lnEdges[j].setY( starty );

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











