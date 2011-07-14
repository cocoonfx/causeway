var minH = 30; 
var maxH = 100;
var minW = 100;
var maxW = 300;


function levelObj()
{
    this.level;
    this.width = 150;
    this.height = 150;
    this.nCnt = 0;

    this.nodes = new Array();//[30];

}

function addToLevel( node )
{
    var lvl = node.findDeepestParentLevel();


    //create root level
    if( lvl === -1 )
    {
        levels[0] = new levelObj();
        levels[0].nodes[ levels[0].nCnt ] = node;
        levels[0].nCnt++;
        node.level = 0;

        return;
    }    
   
    lvl += 1;

    //check if new level needs to be created
    if( levels[lvl] == undefined )
    {
          levels[lvl] = new levelObj();
    }
    
    //add node to level
    levels[lvl].nodes[ levels[lvl].nCnt ] = node;
    levels[lvl].nCnt++;
    node.level = lvl;

    if( lvl >= lvlCnt )
        lvlCnt = lvl+1;
    
}

function moveToLevel( node, lvl )
{
    //remove from current level
    var curlvl = node.level;
    for( i = 0; i < levels[curlvl].nodes.length; i++ )
    {
        if( levels[curlvl].nodes[i] === node )
        {
            delete levels[curlvl].nodes[i];
            levels[curlvl].nodes.splice(i,1);
            levels[curlvl].nCnt--;
        }
        break;
    }

    //add to new or different level
    if( levels[lvl] == undefined )
    {
        levels[lvl] = new levelObj();
    }
    
    levels[lvl].nodes[ levels[lvl].nCnt ] = node;
    levels[lvl].nCnt++;
    node.level = lvl;
}

function locateLevelIndex( node )
{
    lvl = node.level;

    var i;
    for( i = 0; i < levels[lvl].nodes.length; i++ )
    {
        if( node.name === levels[lvl].nodes[i].name )
            break;
    }
    return i;
}

function resizeLevel( lvl )
{
    

}
