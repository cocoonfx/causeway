
var buildEventNode = function (yuiParent,
                               graphElement,
                               vatMap,
                               graphWalker) {
                               
    var label = graphWalker.getElementLabel(graphElement, vatMap);
    var yuiNode = new YAHOO.widget.TextNode(label, yuiParent, true);
    
    return yuiNode;
};

var buildEventSubtree = function (yuiParent,
                                  poList,
                                  vatMap,
                                  graphWalker) {
    
    for (var i = 0; i < poList.length; i++) {
    
        var turnNode = poList[i];
        
        var yuiNode = buildEventNode(yuiParent,
                                     turnNode,
                                     vatMap,
                                     graphWalker);
                                    
        turnNode.outs(function(edge, target) {
            buildEventNode(yuiNode,
                           edge,
                           vatMap,
                           graphWalker);
        });
    }
};


var ProcessOrderView = function(yuiParent,
                                poModel,
                                vatMap,
                                graphWalker) {
    this.yuiParent = yuiParent;
    this.poModel = poModel;
    this.vatMap = vatMap;
    this.graphWalker = graphWalker;
    
    this.yuiTree = new YAHOO.widget.TreeView(yuiParent);
    var yuiRoot = this.yuiTree.getRoot();
    
    for (var vatName in poModel) {
        if (poModel.hasOwnProperty(vatName) &&
            vatName !== "top" && vatName !== "bottom") {
            
            var dn = vatMap[vatName].displayName;
            
            var yuiNode = new YAHOO.widget.TextNode(dn, yuiRoot, true);

            buildEventSubtree(yuiNode,
                              poModel[vatName],
                              vatMap,
                              graphWalker);
        }
    }
    this.yuiTree.render();
};
        
