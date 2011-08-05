
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
    var turns = new Array();
 
    
    //traverse the message graph
    messageGraph.top.deepOutsPre( function( edge, node )
    {
        
        var stack = edge.traceRecord.trace.calls;

        //files per stack 
        var locFiles = new Array();
        var locCnt = new Array();
        locCnt[0] = 0;


        for( var i = 0; i < stack.length; i++ )
        {
            if( !hiddenSrcPaths.contains( stack[i].source ) )
            {

                //origin, target, send message
                var name = walker.getElementLabel(edge.origin,vatMap);
                var target = walker.getElementLabel(node,vatMap);
                var label = walker.getElementLabel(edge,vatMap);

                //add node to node data structure
                var nodeName = addNode( nodes, nCnt, name, "red", label, target, turns );                

                //add file to file data structure
                //checkFile( locFiles, locCnt, stack[i].source, stack[i].span[0][0], label, nodes[nodeName] );
                //checkFile( globFiles, globCnt, stack[i].source, stack[i].span[0][0], label, nodes[nodeName] );
                checkFile( locFiles, locCnt, stack[0].source, stack[0].span[0][0], label, nodes[nodeName] );
                checkFile( globFiles, globCnt, stack[0].source, stack[0].span[0][0], label, nodes[nodeName] );


            }
        }

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

    });

    /*

    //manually set turns for purchase example
    for( x in nodes )
    {

        if( nodes[x].name == "buyer,0")
            nodes[x].turn = 0;
        if( nodes[x].name == "accounts,1")
            nodes[x].turn = 1;
        if( nodes[x].name == "product,1")
            nodes[x].turn = 2;
        if( nodes[x].name == "product,2")
            nodes[x].turn = 3;
        if( nodes[x].name == "buyer,1")
            nodes[x].turn = 4;
        if( nodes[x].name == "buyer,2")
            nodes[x].turn = 5;
        if( nodes[x].name == "buyer,3")
            nodes[x].turn = 6;
        if( nodes[x].name == "buyer,4")
            nodes[x].turn = 7;
        if( nodes[x].name == "buyer,5")
            nodes[x].turn = 8;
        if( nodes[x].name == "buyer,6")
            nodes[x].turn = 9;
        if( nodes[x].name == "buyer,7")
            nodes[x].turn = 10;
        if( nodes[x].name == "product,3")
            nodes[x].turn = 11;
        if( nodes[x].name == "buyer,8")
            nodes[x].turn = 12;
        if( nodes[x].name == "buyer,9")
            nodes[x].turn = 13;
        if( nodes[x].name == "bottom,0")
            nodes[x].turn = 14;

    }
    */


    /*
    //print out turns
    var i;
    for( i = 0; i < turns.length; i++ )
    {
        if( turns[i] != undefined )
        {
            document.write("turn "+i+" count "+turns[i].counter+"<br/>");
            var j; 
            for( j = 0; j < turns[i].trnNodes.length; j++ )
                document.write("node "+turns[i].trnNodes[j].name+"<br/>");
        }
        

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
                var startxNd = startx + 300 + 30 * file.lines[i].lnNodes[j].turn;

                var ctx2 = canvas.getContext('2d');

                //ctx2.strokeStyle = "rgba( 0,200,0,1)";
                //draw nodes
                ctx2.moveTo( startxNd, starty );
                ctx2.lineTo( startxNd+10, starty );
                ctx2.lineTo( startxNd+10, starty+.75*hspcg );
                ctx2.lineTo( startxNd, starty+.75*hspcg );
                ctx2.closePath();
                ctx2.stroke();

                //write names
                if( !file.lines[i].lnNodes[j].drawnName )
                {
                    var startyName = 0;
                    if( file.lines[i].lnNodes[j].turn % 2 == 0 )
                        startyName = 5;
                    else
                        startyName = 25;

                    //ctx.moveTo( startxNd, startyName );
                    ctx.fillStyle = "black";
                    ctx.font = "8pt Helvetica";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "top";
                    ctx.fillText( file.lines[i].lnNodes[j].name, startxNd, startyName );
   /*
                    ctx.strokeStyle = "rgba( 255, 0, 0, 0.2 )";
                    ctx.moveTo( startxNd, startyName + 10 );
                    ctx.lineTo( startxNd, 1000 );
                    ctx.stroke();

                    file.lines[i].lnNodes[j].drawnName = 1;
*/
                }

            }
            starty += hspcg;
        }
    }

    return starty;
}











