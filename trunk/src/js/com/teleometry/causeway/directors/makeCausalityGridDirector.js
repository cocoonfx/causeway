// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeCausalityGridDirector;

(function(){
  "use strict";

  makeCausalityGridDirector = function makeCausalityGridDirector(causewayModel,
                                                                 vatMap,
                                                                 graphWalker,
                                                                 canvas,
                                                                 context) {
    var xOffset =10;
    var yOffset = 10;

    var wdwMap = makeWdwMap();

    var gridView = makeCausalityGridView(causewayModel, vatMap, graphWalker);

    var area = gridView.layout(context);

    var displayArea = {w: area.w + xOffset * 2,
                       h: area.h + yOffset * 2};

    if (displayArea.w > canvas.width) {
      canvas.width = displayArea.w;
    }
    if (displayArea.h > canvas.height) {
      canvas.height = displayArea.h;
    }

    gridView.postToWdwMap(wdwMap, xOffset, yOffset);
    gridView.draw(context, wdwMap);

    var causalityGridDirector = {

      redraw: function() {
      }
    };

    return causalityGridDirector;
  };
})();