// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeStackExplorerView;

(function(){
  "use strict";
  
  var selectionObserver = void 0;
  
  makeStackExplorerView = function makeStackExplorerView(causewayModel,
                                                         vatMap,
                                                         graphWalker,
                                                         uiRoot,
                                                         selectionModel) {
    var uiOutlineRoot = outline(uiRoot);

    // from a graph element to an array of views, one per stack index
    var modelToViewsMap = new FlexMap();
    var previousEnter = void 0;
    var previousSelection = void 0;

    var top = causewayModel.getMessageGraph().top;
    function getMainAncestor(node) {
      var ancestor = void 0;
      if (node.getIncomingCount() >= 1) {
        ancestor = node.nextIn;
        while ((ancestor.traceRecord["class"][0] == 
               'org.ref_send.log.Fulfilled') && 
               ancestor.nextIn !== node) {
          ancestor = ancestor.nextIn;
        }
      }
      if (ancestor.getOrigin() === top) { return void 0; }
      return ancestor;
    }
          
    selectionObserver = {
      elementSelected: function(origin, optElement, optIndex) {
        
        if (optElement && origin !== selectionObserver) {
          // Clear the entire display first
          while (uiOutlineRoot.firstChild) {
            uiOutlineRoot.removeChild(uiOutlineRoot.firstChild);
          }
          modelToViewsMap = new FlexMap();
          previousEnter = void 0;
          previousSelection = void 0;
          
          function buildTreeItem(parentUI, element, index) {
            var label = graphWalker.getEntryLabel(element, index, vatMap);
            var resultUI = outline.add(parentUI, label);
            modelToViewsMap.get(element).push(resultUI);
            var span = resultUI.getSpanText();
            if (span) {
              var id = element.traceRecord.anchor.turn;
              var attr = vatMap[id.loop];
                   
              span.style.color = attr.color.hexColor;
              
              span.addEventListener('click', function(event) {
                selectionModel.setOptSelectedElement(selectionObserver, 
                    element, index);
              }, false);
              span.addEventListener('mousemove', function(event) {
                selectionModel.setOptEnteredElement(selectionObserver, 
                    element, index);
              }, false);
            }
            return resultUI;
          }
          
          // Build the view
          var curElement = optElement;
          var outerUI;
          // TODO(cocoonfx): Add third level under inner ui level
          while (curElement) {
            modelToViewsMap.set(curElement, []);
            outerUI = buildTreeItem(uiOutlineRoot, curElement, 0);
            var stackSize = curElement.traceRecord.trace.calls.length;
            for (var i = 1; i < stackSize; i++) {
              buildTreeItem(outerUI, curElement, i);
            }
            var curOrigin = curElement.getOrigin();
            if (curOrigin !== curElement) {
              modelToViewsMap.set(curOrigin, []);
              buildTreeItem(outerUI, curOrigin, 0);
              var oStackSize = curOrigin.traceRecord.trace.calls.length;
              for (var j = 1; j < oStackSize; j++) {
                buildTreeItem(outerUI, curOrigin, j);
              }
            }
            outerUI.inflate();
            
            curElement = getMainAncestor(curOrigin);
          }
        } else {
          // if either we are the origin or nothing was selected,
          // leave the layout but start by clearing the previous selection.
          if (!!previousSelection) {
            previousSelection.style.border = '';
            previousSelection = void 0;
          }
  
          if (!!previousEnter) {
            previousEnter.style.backgroundColor = '#f5f5f5';
            previousEnter = void 0;
          }
        }
          
        if (optElement) {
          var views  = modelToViewsMap.get(optElement);
          if (views) {
            var node = views[optIndex];
            if (node) {
              var span = node.getSpanText();
              if (span) {
                span.style.border = 'thin solid #B22222';
                previousSelection = span;
              }
              var ancestors = node.getInflatableAncestors();
              ancestors.forEach(function(elder) {
                elder.inflate();
              });
            }
          }
        }
      },
      elementEntered: function(origin, optElement, optIndex) {
        if (!!previousEnter) {
          previousEnter.style.backgroundColor = '#f5f5f5';
          previousEnter = void 0;
        }

        if (optElement) {
          var views  = modelToViewsMap.get(optElement);
          if (views) {
            var node = views[optIndex];
            if (node) {
              var span = node.getSpanText();
              if (span && span !== previousSelection) {
                //span.style.backgroundColor = 'rgba(178, 34, 34, 0.15)';
                //{x11Color: "darkslateblue", hexColor: "#483D8B"},
                // slate blue 112, 128, 144
                
                span.style.backgroundColor = 'rgba(47, 79, 79, 0.15)';
                previousEnter = span;
              }
            }
          }
        }
      }
    };
    selectionModel.addObserver(selectionObserver);

    var stackExplorerView = {
      
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
    
    return stackExplorerView;
  };
})();