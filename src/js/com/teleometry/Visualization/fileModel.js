
//line object.
//Holds line number and message send information
//Keeps an array of nodes corresponding to a message send
function lineObject()
{
    this.lineNum;
    this.message;
    this.lnNodes = new Array();
    this.ndCnt = 0;

    //adding a node to the line object
    this.addNodeToLine = function ( node )
    {
        this.lnNodes[ this.ndCnt ] = node; 
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
    this.setFile = function( name, line, message, node )
    {
        this.name = name;
        this.addLine( line, message, node );
    };

    //adds line to file
    this.addLine = function( line, message, node )
    {
        //does a binary search for insertion index
        var index = this.binSearch( line );

        //creates an instance of the line object
        var lobj = new lineObject();
        lobj.lineNum = line;
        lobj.message = message;
        lobj.addNodeToLine( node );

        //adds line instance to line object array
        if( this.lineCnt <= 1 ) // avoids binary search info
        {
            if( this.lineCnt > 0 && line < this.lines[0].lineNum )
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
                else
                {    
                    this.lines.unshift( lobj );
                    this.lineCnt++;
                }
            }
            else if( index == this.lines.length-1 )//insertion at the end
            {
                if( line < this.lines[ this.lines.length-1 ].lineNum )
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
                this.lines.splice( index, 0, lobj );
                this.lineCnt++;
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

            if( line == this.lines[ index ].lineNum )
                return null;


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
function addFile( files, fCnt, name, line, message, node )
{
    files[ fCnt[0] ] = new fileObject();
    files[ fCnt[0] ].setFile( name, line, message, node );
    fCnt[0] += 1;
}

//checking for a file, adding what is necessary 
function checkFile( files, fCnt, name, line, message, node )
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
                if( files[i].lines[j].lineNum == line )
                {
                    files[i].lines[j].addNodeToLine( node );
                    return;
                }
            }
            
            //line not found, add line to file
            files[i].addLine( line, message, node );
            found = 1;
            break;
        }
   
    }

    //file was not found, create new file object
    if( !found )
    {
        addFile( files, fCnt, name, line, message, node );
    }
}

