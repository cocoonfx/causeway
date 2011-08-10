
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


    //set up pseudo cells data structure for testing purposes
    messageGraph.top.deepOutsPre( function( edge, node )
    {

                        var origin = edge.getOrigin();
                if( origin.getVatName() == "buyer" )
                {
                    switch( origin.traceRecord.anchor.turn.number )
                    {
                        case 0:
                            addTurn( cells, 0, origin );
                            break;
                        case 1:
                            addTurn( cells, 4, origin );
                            break;
                        case 2:
                            addTurn( cells, 5, origin );
                            break;
                        case 3:
                            addTurn( cells, 6, origin );
                            break;
                        case 4:
                            addTurn( cells, 7, origin );
                            break;
                        case 5:
                            addTurn( cells, 8, origin );
                            break;
                        case 6:
                            addTurn( cells, 9, origin );
                            break;
                        case 7:
                            addTurn( cells, 10, origin );
                            break;
                        case 8:
                            addTurn( cells, 12, origin );
                            break;
                        case 9:
                            addTurn( cells, 13, origin );
                            break;
                    }
                }
                else if( origin.getVatName() == "product" )
                {
                    switch( origin.traceRecord.anchor.turn.number )
                    {
                        case 1:
                            addTurn( cells, 2, origin );
                            break;
                        case 2:
                            addTurn( cells, 3, origin );
                            break;
                        case 3:
                            addTurn( cells, 11, origin );
                            break;
                    }
                }
                else if( origin.getVatName() == "accounts" )
                {
                    addTurn( cells, 1, origin );
                }
    });
 


    var sourceTurns = new Array();

    var startNdx = 300;
    var ndspcg = 30;
    var cnt = 0;
    for( i in cells )
    {


        var trn = new turnObject();
        trn.addNodeToTurn( cells[i].trnNode );
        trn.trnNode.setX( startNdx );


        cells[i].trnNode.outs( function( edge )
        {
            
           
            var stack = edge.traceRecord.trace.calls;

            var label = walker.getElementLabel(edge,vatMap);
            checkFile( globFiles, globCnt, stack[0].source, stack[0].span[0][0], label, edge );

            edge.setX( startNdx );
            trn.addEdgeToTurn( edge );
     
            startNdx += ndspcg;
        });

//        document.write("node "+trn.name+"<br/>");
        var j;
        for( j = 0; j < trn.trnEdges.length; j++ )
        {
//            document.write("edge loc "+trn.trnEdges[j].getX()+"<br/>");
        }

        sourceTurns.push( trn );
        cnt++;
        startNdx += 20;
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
    visualize( globFiles, globCnt, nodes, canvas, ctx ); 


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

function visualize( globFiles, globCnt, nodes, canvas, ctx )
{

    var hspcg = 20;
 
    var i;
    var starty = 30;
    //looping through all files
    for( i = 0; i < globFiles.length; i++ )
    {
        //individualy visualizing files
        starty = visFiles( globFiles[i], starty, hspcg, canvas, ctx );
        starty += hspcg;

    }
    
}

function visFiles( file, starty, hspcg, canvas, ctx )
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

                //document.write("x loc "+file.lines[i].lnNodes[j].getX()+"<br/>");

                var ctx2 = canvas.getContext('2d');

                //ctx2.strokeStyle = "rgba( 0,200,0,1)";
                //draw nodes
                ctx2.moveTo( startxNd, starty );
                ctx2.lineTo( startxNd+10, starty );
                ctx2.lineTo( startxNd+10, starty+.75*hspcg );
                ctx2.lineTo( startxNd, starty+.75*hspcg );
                ctx2.closePath();
                ctx2.stroke();

            }
            starty += hspcg;
        }
    }

    return starty;
}











