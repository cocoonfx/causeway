
//line object.
//Holds line number and message send information
//Keeps an array of nodes corresponding to a message send
function lineObject()
{
    this.lineNum;
    this.col; // column number
    this.isgot; //if is a got
    this.message;
 
    this.xcoord;
    this.ycoord;

    this.lnEdges = new Array();
    this.ndCnt = 0;

    //adding a node to the line object
    this.addEdgeToLine = function ( edge )
    {
        this.lnEdges[ this.ndCnt ] = edge;
        this.ndCnt++;
    }

}

//file object, keeps the file name and an array of line objects
function fileObject()
{
    //file name
    this.name;
      
    this.fileConnect = new Array();

    //array of line objects
    this.lines = new Array();
    this.lineCnt = 0;

    //sets file information
    this.setFile = function( name, line, col, message, edge, ifgot )
    {
        this.name = name;
        this.addLine( line, col, message, edge, ifgot );
    };

    //adds line to file
    this.addLine = function( line, col, message, edge, ifgot )
    {
        //does a binary search for insertion index
        var index = this.binSearch( line );

        //creates an instance of the line object
        var lobj = new lineObject();
        lobj.lineNum = line;
        lobj.col = col;
        lobj.isgot = ifgot;
        lobj.message = message;
        lobj.addEdgeToLine( edge );
 
        //adds line instance to line object array
        if( this.lines.length <= 1 ) // avoids binary search info
        {
            if( this.lineCnt > 0 && line < this.lines[0].lineNum && !ifgot )
            {
                this.lines.unshift( lobj );
                this.lineCnt++;
            }
            else
            { 
                this.lines[ this.lineCnt ] = lobj;
                this.lineCnt++;
            }
        }
        else if( index != null )
        {
            if( index == 0 )//if insertion is to happen at the beginning
            {
                if( line > this.lines[0].lineNum )
                {
                    this.lines.splice( 1, 0, lobj );
                    this.lineCnt++;
                }
                else if( ifgot && line == this.lines[0].lineNum )
                {
                    this.lines.splice( 1, 0, lobj );
                    this.lineCnt++;
                }
                else
                {    
                    this.lines.unshift( lobj );
                    this.lineCnt++;
                }
            }
            else if( index >= this.lines.length-1 )//insertion at the end
            {
                if( line < this.lines[ this.lines.length-1 ].lineNum )// && !ifgot )
                {
                    this.lines.splice( this.lines.length-1, 0, lobj );
                    this.lineCnt++;
                }
                else if( line == this.lines[ this.lines.length-1 ].lineNum  && !ifgot )
                {
                    this.lines.splice( this.lines.length-1, 0, lobj );
                    this.lineCnt++;
                }
                else
                {
                    this.lines.push( lobj );
                    this.lineCnt++;
                }
            }
            else //insertion in the middle
            {
                if( line == this.lines[ index ].lineNum && ifgot )
                {
                    this.lines.splice( index+1, 0, lobj );
                    this.lineCnt++;
                }
                else
                {
                    this.lines.splice( index, 0, lobj );
                    this.lineCnt++;
                }
               
            }
        }

    };

    //binary search that returns index for line insertion
    this.binSearch = function( line )
    {
        var low = 0;
        var high = this.lines.length - 1;
        var index;
        while( low <= high )
        {
            index = Math.floor( (low+high)/2 );

            if( low == index && index == high )
            {  
                if( index == 0 )
                {
                    if( line < this.lines[ index ].lineNum )
                        return 0;
                    else
                        return 1;
                }
                   
                if( line > this.lines[ index ].lineNum )
                    return index + 1;
            }

            if( line < this.lines[ index ].lineNum )
            {
                high = index - 1;
            }
            else if( line > this.lines[ index ].lineNum )
            {
                low = index + 1;
            }
            else
            {
                return index;
            }
        }
        return index;
    };

    //used for keeping track of connections between files
    this.addConnectFile = function( fileIndex )
    { 
        if( this.fileConnect[fileIndex] == undefined )
            this.fileConnect[fileIndex] = 0;

        this.fileConnect[fileIndex] += 1; 
    };

}

//returns a files index, used for statistics
function getFileIndex( files, fCnt, name )
{
    var i;
    for( i = 0; i < fCnt[0]; i++ )
    {
        if( name == files[i].name )
            return i;
    }

    return -1;

}

// adding a file
function addFile( files, fCnt, name, line, col, message, edge, ifgot )
{
    files[ fCnt[0] ] = new fileObject();
    files[ fCnt[0] ].setFile( name, line, col, message, edge, ifgot );
    fCnt[0] += 1;
}

//checking for a file, adding what is necessary 
function checkFile( files, fCnt, name, line, col, message, edge, ifgot )
{
    var i;
    var found = 0;
    for( i = 0; i < fCnt[0]; i++ )
    {
        
        if( files[i].name == name )
        {
            //check for line
            var j;
            for( j = 0; j < files[i].lineCnt; j++ )
            {
                if( files[i].lines[j].lineNum == line && files[i].lines[j].col == col)
                {
/*
                    for( var k = 0; k < files[i].lines[j].lnEdges.length; k++ )
                    {
                        var oldEdge = files[i].lines[j].lnEdges[k];
                        if( !ifgot && oldEdge.traceRecord.message == edge.traceRecord.message )
                            return;
                    }
*/
                    files[i].lines[j].addEdgeToLine( edge );
                    return;
                }
            }
            
            //line not found, add line to file
            files[i].addLine( line, col, message, edge, ifgot );
            found = 1;
            break;
        }
   
    }

    //file was not found, create new file object
    if( !found )
    {
        addFile( files, fCnt, name, line, col, message, edge, ifgot );
    }
}

