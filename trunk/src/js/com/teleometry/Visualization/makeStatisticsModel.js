
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
    var trnspcg = 30;
    var cnt = 0;
    for( i in cellGrid.cells )
    {


        var trn = new turnObject();
        trn.addNodeToTurn( cellGrid.cells[i].node );
        trn.trnNode.setX( startNdx );


        cellGrid.cells[i].node.outs( function( edge )
        {
            
//            document.write("origin "+edge.getOrigin().name+" target "+edge.getTarget().name+"<br/>");
            var stack = edge.traceRecord.trace.calls;

            var label = walker.getElementLabel(edge,vatMap);
            checkFile( globFiles, globCnt, stack[0].source, stack[0].span[0][0], label, edge );

            edge.setX( startNdx );
            trn.addEdgeToTurn( edge );
     
            startNdx += ndspcg;
        });


        if( trn.trnEdges.length == 0 )
        {
            trn.trnNode.setY( 50 );
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

    var counter = 0
    if( canvas.getContext )
    {
        
        for( x in sourceTurns )
        {
            //write names
            var namey;
            if( counter % 2  == 0 )
                namey = 5;
            else
                namey = 20;

            ctx.fillStyle = "black";
            ctx.font = "10pt Helvetica";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText( sourceTurns[x].trnNode.name, sourceTurns[x].trnNode.getX(), namey );

     
            if( sourceTurns[x].trnEdges.length == 0 )
            {
                var startNdx = sourceTurns[x].trnNode.getX()+5;
                var startNdy = sourceTurns[x].trnNode.getY()+5;
                //sourceTurns[x].trnNode.setY( startNdy );               

//document.write("name "+sourceTurns[x].trnNode.name+" x "+startNdx+"<br/>");
                //draw nodes
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(0,0,0,1)';
                ctx.moveTo( startNdx, startNdy );
                ctx.lineTo( startNdx+5, startNdy );
                ctx.lineTo( startNdx+5, startNdy+5 );
                ctx.lineTo( startNdx, startNdy+5 );
                ctx.closePath();
                ctx.fill();
            }

            var conx;
            var cony;

            var i;
            for( i = 0; i < sourceTurns[x].trnEdges.length; i++ )
            {
                var edge = sourceTurns[x].trnEdges[i];

                var startx = edge.getX()+5;
                var starty = edge.getY()+5;

                if( i > 0 )
                {
                    ctx.beginPath();
                    ctx.strokeStyle = "black";//'rbga(0,200,0,1)';
                    ctx.moveTo( conx, cony );
                    ctx.lineTo( startx, starty );
                    ctx.stroke();
                }


                //draw edge nodes
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(0,0,0,1)';
                ctx.moveTo( startx, starty );
                ctx.lineTo( startx+5, starty );
                ctx.lineTo( startx+5, starty+5 );
                ctx.lineTo( startx, starty+5 );
                ctx.closePath();
                ctx.fill();

                conx = startx+5;
                cony = starty+5;

                //begin drawing on right of box
                startx += 10;
                starty += 2.5;

                var target = edge.getTarget();
      
                if( sourceTurns[ target.name ] != undefined )
                {
                    var endx;
                    var endy;
                    if( sourceTurns[ target.name ].trnEdges.length > 0 )
                    {
                        endx = sourceTurns[ target.name ].trnEdges[0].getX();
                        endy = sourceTurns[ target.name ].trnEdges[0].getY();

                        ctx.beginPath();
                        //ctx.strokeStyle = 'rgba(200,0,0,1)';
                        ctx.moveTo( startx, starty );
                        ctx.lineTo( endx-10, starty );
                        ctx.lineTo( endx-10, endy+7.5 );
                        ctx.lineTo( endx, endy+7.5 );
                        ctx.strokeStyle = 'rgba(200,0,0,1)';
                        ctx.stroke();

                    } 
                    else
                    {
                        endx = sourceTurns[ target.name ].trnNode.getX();
                        endy = sourceTurns[ target.name ].trnNode.getY();
//document.write("name "+sourceTurns[ target.name ].trnNode.name+" y "+endy+"<br/>");

                        startx -= 7.5;
                        starty -= 10;

                        ctx.beginPath();
                        ctx.moveTo( startx, starty );
                        ctx.lineTo( startx, endy+7.5 );
                        ctx.lineTo( endx, endy+7.5 );
                        ctx.strokeStyle = 'rgba(200,0,0,1)';
                        ctx.stroke();
                    }
                }
                else
                    continue; 
                
            }
   
            counter++;
        }

    }


}

function drawFiles( globFiles, globCnt, nodes, canvas, ctx )
{

    var hspcg = 20;
 
    var i;
    var starty = 100;
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

    if( canvas.getContext )
    {

        //display files
        ctx.fillStyle = "black";
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
            ctx.fillStyle = "black";
            ctx.font = "8pt Helvetica";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText( str, startx+20, starty );


            var j;
            for( j = 0; j < file.lines[i].lnNodes.length; j++ )
            {
                var startxNd = file.lines[i].lnNodes[j].getX();

                file.lines[i].lnNodes[j].getOrigin().setY( starty );
                file.lines[i].lnNodes[j].setY( starty );

            }

            starty += hspcg;
        }
    }

    return starty;
}











