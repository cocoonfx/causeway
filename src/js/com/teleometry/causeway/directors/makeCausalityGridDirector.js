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

    var xOffset = 5.5;
    var yOffset = 5.5;

    var wdwMap = makeWdwMap();    
    var prevSelection = void 0;
    var prevEntered = void 0;

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
        // redraw with new selection
        gridView.redraw(context, wdwMap, optElement);
      },
      
      elementEntered: function(origin, optElement, optIndex) {
        //context.clearRect(0, 0, displayArea.w, displayArea.h);
        //gridView.redraw(context, wdwMap, prevSelection, optElement);
        if (optElement) {
          if (prevSelection) {
            if (prevEntered) {
              if (optElement === prevSelection) {  // hovered over selection
                // ignore hover over selection, but check for hover change
                //if (hoverChanged(prevEntered, optElement)) {
                if (optElement !== prevEntered) {
                  gridView.dehover(context, wdwMap, prevEntered);
                  prevEntered = optElement;
                }
              } else {  // not hovered over selection
                //if (hoverChanged(prevEntered, optElement)) {
                if (optElement !== prevEntered) {
                  // update hover
                  gridView.dehover(context, wdwMap, prevEntered);
                  gridView.hover(context, wdwMap, optElement);
                  prevEntered = optElement;
                }
              }
            } else {  // !prevEntered
              if (optElement !== prevSelection) {  // not hovered over selection
                gridView.hover(context, wdwMap, optElement);
                prevEntered = optElement;
              }
            }
          } else { // !prevSelection
            if (prevEntered) {
              //if (hoverChanged(prevEntered, optElement)) {
              if (optElement !== prevEntered) {
                // update hover
                gridView.dehover(context, wdwMap, prevEntered);
                gridView.hover(context, wdwMap, optElement);
                prevEntered = optElement;
              }
            } else {  // !prevEntered
              gridView.hover(context, wdwMap, optElement);
              prevEntered = optElement;
            }
          }
        } else {  // !optElement
          if (prevEntered) {
            // update hover
            gridView.dehover(context, wdwMap, prevEntered);
            prevEntered = optElement;
          }
        }
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
      // notify observers that selection changed. 
      // If !who, no selection.
      selectionModel.setOptSelectedElement(selectionObserver, who, 0);
    }
    gridCanvas.addEventListener('click', gridOnClick, false);

    function gridOnMouseMove(event) {  // handle hover
      var who = elementAtEvent(event); 
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