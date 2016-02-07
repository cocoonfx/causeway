// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeMessageOrderView;

(function(){
  "use strict";
  
  var selectionObserver = void 0;
  
  makeMessageOrderView = function makeMessageOrderView(causewayModel,
                                                       vatMap,
                                                       graphWalker,
                                                       uiRoot,
                                                       selectionModel) {
    
    var modelToViewMap = new FlexMap();

    var seen = new FlexSet();

    function buildTreeFromEdge(uiParent, edge) {

      if (seen.contains(edge)) {
        return;
      }
      seen.addElement(edge);
     
      var label = graphWalker.getEntryLabel(edge, 0, vatMap);
      var uiElement = outline.add(uiParent, label);

      modelToViewMap.set(edge, uiElement);
      var span = uiElement.getSpanText();
      span.addEventListener('click', function(event) {
        selectionModel.setOptSelectedElement(selectionObserver, edge, 0);
      }, false);
      span.addEventListener('mousemove', function(event) {
        selectionModel.setOptEnteredElement(selectionObserver, edge, 0);
      }, false);

      var target = edge.target;

      buildTreeFromNode(uiElement, target, edge);
    }

    function buildTreeFromNode(uiParent, node, edge) {

      if (node.id.loop === 'bottom') {
        return;
      }

      var label = graphWalker.getEntryLabel(node, 0, vatMap);
      var uiElement = outline.add(uiParent, label);

      var doKids = true;

      // our data structure is mostly tree-like, but sometimes
      // events have multiple causes, i.e., multiple incoming arcs

      if (node.getIncomingCount() > 1) {
        var edgeList = [];
        node.ins(function(incoming, origin) {

          // optional filtering of SentIf events          
          // TODO(cocoonfx): do we still need this?
          // This case does not arise right now, because makeCauseway logger
          // is always in our filter list. Once we make this list configurable
          // we will need to decide.
          if (incoming.traceRecord.class[0] === 'org.ref_send.log.SentIf') {
            // debugger;
            // return;
          }
          

          edgeList.push(incoming);
        });

        if (edgeList.length > 1) {
          // TODO(cocoonfx): multiples icon image
          // show 'multiples' icon for this tree item
          if (edgeList[0] !== edge) {
            doKids = false;  // continue with children only if last cause
          }
        }
      }

      modelToViewMap.set(node, uiElement);
      var span = uiElement.getSpanText();
      span.addEventListener('click', function(event) {
        selectionModel.setOptSelectedElement(selectionObserver, node, 0);
      }, false);
      span.addEventListener('mousemove', function(event) {
        selectionModel.setOptEnteredElement(selectionObserver, node, 0);
      }, false);

      if (doKids) {
        node.outs(function(outgoing, target) { 
          buildTreeFromEdge(uiParent, outgoing);
        });
      }
    }

    var previousEnter = void 0;
    var previousSelection = void 0;

    function isGotNode(node) {
      // TODO(cocoonfx): Need a better test than this!
      return node.parentNode && !node.parentNode.previousSibling;
    }

    selectionObserver = {
      elementSelected: function(origin, optElement, optIndex) {

        if (previousSelection) {
          previousSelection.style.backgroundColor = '#f5f5f5';
          previousSelection = void 0;
        }

        if (previousEnter) {
          previousEnter.style.backgroundColor = '#f5f5f5';
          previousEnter = void 0;
        }
          
        if (optElement) {
          var view  = modelToViewMap.get(optElement);
          if (view) {

            var node = view;
            var span = node.getSpanText();
            if (span) {
              span.style.backgroundColor = 'rgba(178, 34, 34, 0.35)';
              previousSelection = span;
            }

            var parent;
            if (isGotNode(node)) {
              // For the remaining logic only, we want to treat
              // selecting a got as if its inflatable parent had been
              // selected instead.
              parent = node.getInflatableParent();
              if (parent) {
                node = parent;
                parent = node.getInflatableParent();
              }
            }

            var ancestors = node.getInflatableAncestors();
            ancestors.forEach(function(elder) {
              elder.inflate();
              var sibs = elder.getInflatableSiblings();
              sibs.forEach(function(sib) { sib.deflate(); });
            });

            node.inflate();
            var sibs = node.getInflatableSiblings();
            sibs.forEach(function(sib) { sib.deflate(); });

            var descendants = node.getInflatableDescendants();
            descendants.forEach(function(junior) {
              junior.inflate();
            });
          }
        }
      },
      elementEntered: function(origin, optElement, optIndex) {
        if (previousEnter) {
          previousEnter.style.backgroundColor = '#f5f5f5';
          previousEnter = null;
        }

        if (optElement) {
          var view  = modelToViewMap.get(optElement);
          if (view) {

            var node = view;

            var span = node.getSpanText();
            if (span) {
              if (span !== previousSelection) {
                span.style.backgroundColor = 'rgba(178, 34, 34, 0.15)';
                previousEnter = span;
              }
            }
          }
        }
      }
    };
    selectionModel.addObserver(selectionObserver);

    var top = causewayModel.getMessageGraph().top;
    var uiOutlineRoot = outline(uiRoot);
    top.outs(function(outgoing, target) {
      buildTreeFromNode(uiOutlineRoot, target, null);
    });

    var messageOrderView = {
      
      layout: function(ctx) {
        //return {w: totalWidth, h: totalHeight};
      },
      
      postToWdwMap: function(wdwMap, left, top) {
      },
      
      draw: function(ctx, wdwMap) {
      },
      
      redraw: function(ctx, wdwMap, selected) {
      }
    };
    
    return messageOrderView;
  };
})();