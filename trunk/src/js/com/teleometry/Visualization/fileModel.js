
// checking to see whether file or line should be added
var checkFile = ( function()
{
    function FileObject()
    {

        //line object.
        //Holds line number and message send information
        //Keeps an array of nodes corresponding to a message send
        function LineObject()
        {

            this.span;
            this.isgot; //if is a got
            this.message;

            this.ycoord;

            this.lnElements = [];

            //adding a node to the line object
            this.addElementToLine = function ( element )
            {
                this.lnElements.push( element );
            }

        };

        //file name
        this.name;
      
        //array of line objects
        this.lines = [];

        //sets file information
        this.setFile = function( name, span, message, element, ifgot )
        {
            this.name = name;
            this.addLine( span, message, element, ifgot );
        };

        //adds line to file
        this.addLine = function( span, message, element, ifgot )
        {

            //creates an instance of the line object
            var lobj = new LineObject();
            lobj.span = span;
            lobj.isgot = ifgot;
            lobj.message = message;
            lobj.addElementToLine( element );

            if ( this.lines.length == 0 )
            {
                this.lines.push( lobj );
                return;
            }
            else
            { 
                var i;
                for( i = 0; i < this.lines.length; i++ )
                {
                    if ( span[0][0] < this.lines[i].span[0][0] )
                    {
                        this.lines.splice( i, 0, lobj );
                        return;
                    }
                }
                this.lines.push( lobj );
            }

            //this.lines.push( lobj );
        };

    };

    function addFile( files, name, span, message, element, ifgot )
    {
        fobj = new FileObject();
        fobj.setFile( name, span, message, element, ifgot );
        files.push( fobj );
    }

    return function( files, name, span, message, element, ifgot )
    {

        var i;
        for ( i = 0; i < files.length; i++ )
        {
            if ( files[i].name == name )
            {
                //check for line
                var j;
                for ( j = 0; j < files[i].lines.length; j++ )
                {
                    if ( files[i].lines[j].span[0][0] == span[0][0] && files[i].lines[j].span[0][1] == span[0][1])
                    {
                        files[i].lines[j].addElementToLine( element );
                        return;
                    }
                }
            
                //line not found, add line to file
                files[i].addLine( span, message, element, ifgot );
                return;
            }
   
        }//for i

        //file was not found, create new file object
        addFile( files, name, span, message, element, ifgot );

    };


}() );


