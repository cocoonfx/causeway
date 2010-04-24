
var CLIP = 0;
var SKIP = 1;
var KEEP = 2;

var tagToColor = function(tag, normal) {

    if (tag === CLIP) {
        return "firebrick";
    } else if (tag === SKIP) {
        return "goldenrod";
    } else if (tag === KEEP) {
        return normal;
    }
};

var newHTML = [];

var walkDots = function(edge,
                        //textWriter,
                        vatMap,
                        watcher) {
                        
    if (watcher.contains(edge)) {
        return;
    }
    watcher.addElement(edge);
    
    var oid = edge.origin.traceRecord.anchor.turn;
    var tid = edge.target.traceRecord.anchor.turn;
    
    var oattr = vatMap[oid.loop];
    var tattr = vatMap[tid.loop];
    
    var oname = oattr.displayName;
    var tname = tattr.displayName;
    
    var oturn = oid.number;
    var tturn = tid.number;
    
    var ocolor = tagToColor(edge.origin.tag, oattr.color);
    var tcolor = tagToColor(edge.target.tag, tattr.color);
    
    var ospec = "[" + oname + ", " + oturn + "]";
    
    var tspec = "[" + tname + ", " + tturn + "]";
    
    var ocspec = "[color=" + ocolor + " " + "fontcolor=" + ocolor + "]";
    
    var tcspec = "[color=" + tcolor + " " + "fontcolor=" + tcolor + "]";
    
    newHTML.push("\"" + ospec + "\"" + " " + ocspec + ";" + " </br>");
    newHTML.push("\"" + tspec + "\"" + " " + tcspec + ";" + " </br>");
    
    // textWriter.println(`"[$oname, $oturn]" [color=$ocolor fontcolor=$ocolor];`)
    // textWriter.println(`"[$tname, $tturn]" [color=$tcolor fontcolor=$tcolor];`)
    
    var ep = getElementLabel(edge, vatMap) || "[]";
    
    var ecolor = tagToColor(edge.tag, "black");
    
    var espec = "[color=" + ecolor + " " + "label=" + "\"" + ep + "\"" + "]";
    
    newHTML.push("\"" + ospec + "\"" + " -> " + "\"" + tspec + "\"" + " " + espec + ";" + " </br>");
    
    // textWriter.println(`"[$oname, $oturn]" -> "[$tname, $tturn]" [color=$ecolor label="$ep"];`)
    
    edge.target.outs(function(deepEdge, deepTarget) {
        walkDots(deepEdge,
                 //textWriter,
                 vatMap,
                 watcher);
    });
};

var MessageGraph = function() {
    this.dag = new DirectedGraph();
};

MessageGraph.prototype.addTurnNode = function(node) {
    this.dag.addNode(node);
};

MessageGraph.prototype.removeTurnNode = function(node) {
    this.dag.removeNode(node);
};

MessageGraph.prototype.makeTurnNode = function(id) {
    return new TurnNode(id);
};

MessageGraph.prototype.makeEventArc = function(origin, target) {
    return new EventArc(origin, target);
};

MessageGraph.prototype.get = function(node) {
    return this.dag.get(node);
};

MessageGraph.prototype.getRoots = function() {
    return this.dag.getRoots();
};

MessageGraph.prototype.getLeaves = function() {
    return this.dag.getLeaves();
};

MessageGraph.prototype.connectTheDots = function(root,
                                                 //dotFile,
                                                 vatMap) {
                                                 
    // skip textWriter
    // skip try-finally
    
    // println("digraph messageGraph {");
    
    newHTML.push("digraph messageGraph { </br>");
    
    var watcher = new FlexSet();
    
    root.outs(function(edge, target) {
        walkDots(edge,
                 //textWriter,
                 vatMap,
                 watcher);
    });
    
    newHTML.push("} </br>");
    newHTML.push("</br>");
    
    document.getElementById('dotfile').innerHTML = newHTML.join('');

    // println("}");
    // println("");
};