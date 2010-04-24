
var buildTreeFromNode = function (yuiParent,
                                  node,
                                  vatMap,
                                  graphWalker,
                                  skipKids,
                                  watcher) {
                                  
    if (node.traceRecord.anchor.turn.loop === "bottom") {
        return;
    }
    var label = graphWalker.getElementLabel(node, vatMap);
    var yuiGotItem = new YAHOO.widget.TextNode(label, yuiParent, true);
    
    // skip graphWalker.labelItem(vatMap, node, 0, swtGotItem)
    
    if (node.getIncomingCount() > 1) {
        // skip multiples image
        if (skipKids) {
            return;
        }
    }
    
    node.outs(function(edge, target) {
        buildTreeFromEdge(yuiParent,
                          edge,
                          vatMap,
                          graphWalker,
                          watcher);
    });
};

var buildTreeFromEdge = function(yuiParent,
                                 edge,
                                 vatMap,
                                 graphWalker,
                                 watcher) {
                                 
    if (watcher.contains(edge)) {
        return;
    }
    watcher.addElement(edge);
    
    var label = graphWalker.getElementLabel(edge, vatMap);
    var yuiItem = new YAHOO.widget.TextNode(label, yuiParent, true);
    
    var target = edge.target;
    buildTreeFromNode(yuiItem,
                      target,
                      vatMap,
                      graphWalker,
                      target.nextIn !== edge,
                      watcher);
};

var dbgMOTree = null;

var MessageOrderView = function(yuiParent,
                                model,
                                vatMap,
                                graphWalker) {
    this.yuiParent = yuiParent;
    this.model = model;
    this.vatMap = vatMap;
    this.graphWalker = graphWalker;
    
    this.yuiTree = new YAHOO.widget.TreeView(yuiParent);
    dbgMOTree = this.yuiTree;
    
    this.yuiTree.subscribe("clickEvent", function(oArgs) {
        //oArgs.node.toggleHighlight();
        return false;
    });
    //this.yuiTree.subscribe("clickEvent", this.yuiTree.onEventToggleHighlight);
    
    var watcher = new FlexSet();
    
    buildTreeFromNode(this.yuiTree.getRoot(),
                      model.getTop(), 
                      vatMap,
                      graphWalker,
                      false, 
                      watcher);
                      
    this.yuiTree.render();
};
