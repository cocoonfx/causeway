// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeCausalityGridDirector;

(function(){
  "use strict";

  makeCausalityGridDirector = function makeCausalityGridDirector(causewayModel,
                                                                 vatMap,
                                                                 graphWalker,
                                                                 moOutline,
                                                                 seOutline,
                                                                 gridCanvas,
                                                                 context, 
                                                                 images) {

    // for synchronized selection between views
    var selectionModel = makeSelectionModel();

    var messageOrderView = makeMessageOrderView(causewayModel, 
                                                vatMap, 
                                                graphWalker, 
                                                moOutline, 
                                                selectionModel);
    var stackExplorerView = makeStackExplorerView(causewayModel,
                                                  vatMap, 
                                                  graphWalker, 
                                                  seOutline, 
                                                  selectionModel);

    //var xOffset = 5.5;
    //var yOffset = 5.5;
    var xOffset = 5.0;
    var yOffset = 5.0;

    var wdwMap = makeWdwMap();    
    var prevSelection = null;

    var gridView = makeCausalityGridView(causewayModel, 
                                         vatMap, 
                                         graphWalker, 
                                         images);

    var area = gridView.layout(context);

    var displayArea = {w: area.w + xOffset *2,
                       h: area.h + yOffset *2};

    var xScale = 1.0;
    var yScale = 1.0;

    if (displayArea.w > gridCanvas.width) {
      //xScale = gridCanvas.width / displayArea.w;
      gridCanvas.width = displayArea.w;
    }
    if (displayArea.h > gridCanvas.height) {
      //yScale = gridCanvas.height / displayArea.h;
      gridCanvas.height = displayArea.h;
    }

    context.scale(xScale, yScale);
    wdwMap.scale(xScale, yScale);

    gridView.postToWdwMap(wdwMap, xOffset, yOffset);
    gridView.draw(context, wdwMap);

    var selectionObserver = {
      elementSelected: function(origin, optElement, optIndex) {
        context.clearRect(0, 0, displayArea.w, displayArea.h);
        prevSelection = optElement;  // remember for 'elementEntered'
        // redraw with current selection, clear hover
        gridView.redraw(context, wdwMap, optElement, void 0);
      },
      
      elementEntered: function(origin, optElement, optIndex) {
        context.clearRect(0, 0, displayArea.w, displayArea.h);
        gridView.redraw(context, wdwMap, prevSelection, optElement);
      }
    };
    selectionModel.addObserver(selectionObserver);

    function elementAtEvent(event) {
      var x;
      var y;
      // get document-relative coordinates
      if (event.pageX !== void 0 && event.pageY !== void 0) {
        x = event.pageX;
        y = event.pageY;
      } else {
        x = event.clientX + document.body.scrollLeft +
          document.documentElement.scrollLeft;
        y = event.clientY + document.body.scrollTop +
          document.documentElement.scrollTop;
      }
      // get canvas-relative coordinates
      x -= gridCanvas.offsetLeft;
      y -= gridCanvas.offsetTop;

      return wdwMap.whoIs(x, y);
    }
    
    function gridOnClick(event) {  // handle 'hard' click
      var who = elementAtEvent(event);
      // notify observers that selection changed. If !who, deselect.
      selectionModel.setOptSelectedElement(selectionObserver, who, 0);
    }
    gridCanvas.addEventListener('click', gridOnClick, false);

    function gridOnMouseMove(event) {  // handle hover
      var who = elementAtEvent(event); 
      // notify observers that hover changed.
      // If !who, not hovering over anything.
      selectionModel.setOptEnteredElement(selectionObserver, who, 0);
    }
    gridCanvas.addEventListener('mousemove', gridOnMouseMove, false);

    var causalityGridDirector = {

      redraw: function() {
      }
    };

    return causalityGridDirector;
  };
})();