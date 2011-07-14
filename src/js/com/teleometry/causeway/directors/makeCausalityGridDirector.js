// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeCausalityGridDirector;

(function(){
  "use strict";

  makeCausalityGridDirector = function makeCausalityGridDirector(causewayModel,
                                                                 vatMap,
                                                                 graphWalker,
                                                                 gridCanvas,
                                                                 context) {
    var xOffset = 5.5;
    var yOffset = 5.5;

    var wdwMap = makeWdwMap();

    var gridView = makeCausalityGridView(causewayModel, vatMap, graphWalker);

    var area = gridView.layout(context);

    var displayArea = {w: area.w + xOffset *2,
                       h: area.h + yOffset *2};

    if (displayArea.w > gridCanvas.width) {
      gridCanvas.width = displayArea.w;
    }
    if (displayArea.h > gridCanvas.height) {
      gridCanvas.height = displayArea.h;
    }

    gridView.postToWdwMap(wdwMap, xOffset, yOffset);
    gridView.draw(context, wdwMap);

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

      gridView.redraw(context, wdwMap, wdwMap.whoIs(x, y));
    }

    gridCanvas.addEventListener("click", gridOnClick, false);

    var causalityGridDirector = {

      redraw: function() {
      }
    };

    return causalityGridDirector;
  };
})();