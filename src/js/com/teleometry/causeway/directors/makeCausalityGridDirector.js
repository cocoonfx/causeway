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
    var flowWdwMap;

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
        if(optElement) {
          gridView.redraw(context, wdwMap, optElement);
        }
      },
      elementEntered: function(optElement) {
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

      context.clearRect(0, 0, displayArea.w, displayArea.h);

      var who = wdwMap.whoIs(x, y);

      flowWdwMap = null;
      if (who) {
        flowWdwMap = makeWdwMap();
        flowWdwMap.scale(xScale, yScale);
      }

      gridView.redraw(context, wdwMap, who, flowWdwMap);
      selectionModel.setOptSelectedElement(selectionObserver, who);
    }
    gridCanvas.addEventListener("click", gridOnClick, false);

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

      //var who = flowWdwMap.whoIs(x, y);
      var who = wdwMap.whoIs(x, y);
      if (who) {
        selectionModel.setOptEnteredElement(selectionObserver, who)
      }
    }
    gridCanvas.addEventListener("mousemove", gridOnMouseMove, false);

    var causalityGridDirector = {

      redraw: function() {
      }
    };

    return causalityGridDirector;
  };
})();