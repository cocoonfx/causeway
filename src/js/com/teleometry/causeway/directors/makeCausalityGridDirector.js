// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeCausalityGridDirector;

(function(){
  "use strict";

  makeCausalityGridDirector = function makeCausalityGridDirector(causewayModel,
                                                                 vatMap,
                                                                 graphWalker,
                                                                 moOutline,
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
    var xOffset = 5.5;
    var yOffset = 5.5;

    var wdwMap = makeWdwMap();
    var flowWdwMap = null;
    
    var currentSelection = null;

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
      elementSelected: function(optElement) {
        context.clearRect(0, 0, displayArea.w, displayArea.h);
        flowWdwMap = null;
        currentSelection = optElement;  // remember for elementEntered
        if (optElement) {  // causal flow map depends on selection
          flowWdwMap = makeWdwMap();
          flowWdwMap.scale(xScale, yScale);
        }
        gridView.redraw(context, wdwMap, optElement, void 0, flowWdwMap);
      },
      
      elementEntered: function(optElement) {
        context.clearRect(0, 0, displayArea.w, displayArea.h);
        gridView.redraw(context, wdwMap, currentSelection, optElement, flowWdwMap);
      }
    };
    selectionModel.addObserver(selectionObserver);

    function gridOnClick(e) {
      var x;
      var y;
      // get document-relative coordinates
      if (e.pageX !== undefined && e.pageY !== undefined) {
        x = e.pageX;
        y = e.pageY;
      } else {
        x = e.clientX + document.body.scrollLeft +
          document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop +
          document.documentElement.scrollTop;
      }
      // get canvas-relative coordinates
      x -= gridCanvas.offsetLeft;
      y -= gridCanvas.offsetTop;

      var who = wdwMap.whoIs(x, y);

      selectionModel.setOptSelectedElement(void 0, who);
    }
    gridCanvas.addEventListener('click', gridOnClick, false);

    function gridOnMouseMove(e) {
      //if (!flowWdwMap) { return; }
      var x;
      var y;
      // get document-relative coordinates
      if (e.pageX !== undefined && e.pageY !== undefined) {
        x = e.pageX;
        y = e.pageY;
      } else {
        x = e.clientX + document.body.scrollLeft +
          document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop +
          document.documentElement.scrollTop;
      }
      // get canvas-relative coordinates
      x -= gridCanvas.offsetLeft;
      y -= gridCanvas.offsetTop;
      
      var who = wdwMap.whoIs(x, y);
      
      selectionModel.setOptEnteredElement(void 0, who);
    }
    gridCanvas.addEventListener('mousemove', gridOnMouseMove, false);

    var causalityGridDirector = {

      redraw: function() {
      }
    };

    return causalityGridDirector;
  };
})();