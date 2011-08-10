

function nodeObj()
{
    this.name; 
    this.label;
    this.color;
    this.turn;
    this.index;

    this.drawnName = 0;

    this.isSet = 0;
    //this.fileName;
    //this.fileLine;

    //nodes in and nodes out
    this.ndIn;
    this.ndOut;
 
    //previous node in process order
    this.prevNode;

    //sets node information
    this.setNode = function( name, color, label, index )
    {
        this.name = name;
        this.color = color;
        this.label = label;
        this.index = index; // used for nodes in a turn   

        this.isSet = 1; // used to avoid duplicates while traversing graph   
    };

    //adds the origin node from which message was sent
    this.addInNode = function( node )
    {
        this.ndIn = node;
    };

    //adds target node to which message was sent
    this.addOutNode = function( node )
    {
        this.ndOut = node;
    };   

    this.setPrevNode = function ()
    {
        var str;
        str = this.name.substring(0,this.name.length-1) + (this.name.charAt(this.name.length-1)-1+'') +"0";
   
        this.prevNode = str;
    }

    //sets the turn for the node
    this.setTurn = function( turn )
    {
        if( this.ndIn != undefined )
        {
            //checks for turn of "parent" node along message graph
            if( this.ndIn.turn >= turn )
                this.turn = this.ndIn.turn + 1;
            else
                this.turn = turn;
        }
        else
            this.turn = turn;

    }; 


}

//adds the node into the data structure.  Nodes are hashed according to 
//their name.  A turn will have multiple nodes with the same "name" and
//to distinguish, a index value is appended to the hash tag
function addNode( nodes, nodeCnt, name, color, label, target, turns )
{
    var oindex = 1; //origin index append
    var tindex = 1; //target index append
    var found = 0;

    var hppn = parseInt( name.slice( name.length-1 ) ); //used for turn

    //origin node
    var ostr;
    while( !found )
    {
        ostr = name + oindex; //appending tag

        
        if( nodes[ ostr ] == undefined ) //if node not found
        {
            //creating new node object
            nodes[ ostr ] = new nodeObj();
            nodes[ ostr ].setNode( name, color, label, oindex );
            nodes[ ostr ].setPrevNode();   

            //setting the turn
            if( !nodes[ ostr ].turn )
            {
                nodes[ ostr ].setTurn( hppn );
                addTurn( turns, nodes[ostr].turn, nodes[ostr] );
            }

            found = 1;
        }
        else if( !nodes[ ostr ].isSet ) //if node was found but not completely set
        {
            nodes[ ostr ].setNode( name, color, label, hppn, oindex );
            nodes[ ostr ].setPrevNode();

            //setting the turn
            if( !nodes[ ostr ].turn )
            {
                nodes[ ostr ].setTurn( hppn );
                addTurn( turns, nodes[ostr].turn, nodes[ostr] );
            }

            found = 1;
        }
        else
        {
            oindex++; //increasing the index counter
        }


    }

    found = 0;

    //target node
    var tstr;
    while( !found )
    {
        tstr = target + tindex; //appending tag

        if( nodes[ tstr ] == undefined ) // if node not found
        {
            //created and SOME information set
            nodes[ tstr ] = new nodeObj();
            nodes[ tstr ].ndIn = nodes[ostr];
            nodes[ tstr ].name = target;
            nodes[ tstr ].index = tindex;
            nodes[ tstr ].setPrevNode();

            if( !nodes[ tstr ].turn )
            {
                nodes[ tstr ].setTurn( parseInt( target.slice( target.length-1 )) );
                addTurn( turns, nodes[tstr].turn, nodes[tstr] );
            }
            found = 1;
        }
        else
        {
            tindex++; //increasing the index counter
        }
    }

    //setting the out node for the origin
    nodes[ ostr ].ndOut = nodes[tstr];

    return ostr;

}


