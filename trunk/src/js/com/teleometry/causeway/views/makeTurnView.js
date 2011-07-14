// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeTurnView;

(function(){
  "use strict";

  makeTurnView = function makeTurnView(turnNode, vatMap, graphWalker) {
    var turnEvents = [];

    // the receive event that starts this turn
    turnEvents.push({graphElement: turnNode,
                     displayName: graphWalker.getElementLabel(turnNode,
                                                              vatMap)});

    // The subsequent events that occurred during this turn
    turnNode.outs(function(outgoing, target) {
      turnEvents.push({graphElement: outgoing,
                       displayName: graphWalker.getElementLabel(outgoing,
                                                                vatMap)});
    });

    var displayAttr = {
      font: '12px sans-serif',
      textBaseline: 'top',
      textFill: vatMap[turnNode.id.loop].color.hexColor,
      selectionFill: "#B0C4DE"  // lightsteelblue
    };

    var displayArea;

    function drawTurnEvent(ctx, wdwMap, turnEvent, isSelected) {
      var where = wdwMap.whereIs(turnEvent.graphElement);
      if (where) {
        ctx.clearRect(where.x, where.y, 
                      turnEvent.area.w, turnEvent.area.h);
        if (isSelected) {
          ctx.fillStyle = displayAttr.selectionFill;
          ctx.fillRect(where.x -1, where.y -1,
                       turnEvent.area.w +2, turnEvent.area.h +2);
        }
        ctx.font = displayAttr.font;
        ctx.textBaseline = displayAttr.textBaseline;
        ctx.fillStyle = displayAttr.textFill;
        ctx.fillText(turnEvent.displayName, where.x, where.y);
      } else {
        throw new Error('graphElement not found in wdwMap');
      }
    }

    var turnView = {

      layout: function(ctx) {
        // TODO(cocoonfx): Invalidate cache if ctx changes
        if (displayArea) { return displayArea; }

        ctx.font = displayAttr.font;
        ctx.textBaseline = displayAttr.textBaseline;
        var maxw = 0;
        var totalh = 0;
        var h = 15; // TODO(cocoonfx): implement metrics.height

        turnEvents.forEach(function(te) {
          var metrics = ctx.measureText(te.displayName);
          var w = metrics.width;
          te.area = {w: w, h: h};
          maxw = Math.max(maxw, w);
          totalh += h;
        });

        displayArea = {w: maxw, h: totalh};
        return displayArea;
      },

      // map from local coordinates to global window coordinates
      postToWdwMap: function(wdwMap, left, top) {
        var x = left;
        var y = top;
        var w = displayArea.w;  // fixed width

        turnEvents.forEach(function(te) {
          var where = {x: x, y: y, w: w, h: te.area.h};
          wdwMap.post(te.graphElement, where);
          y += te.area.h;
        });
      },

      // return the initial point of this graph element's outgoing arc
      whereIsHead: function(wdwMap, graphElement) {
        var where = wdwMap.whereIs(graphElement);
        if (where) {
          for (var i = 0, iLen = turnEvents.length; i < iLen; i++) {
            if (turnEvents[i].graphElement === graphElement) {
              var area = turnEvents[i].area;
              // return point in global screen coordinates
              return {
                x: where.x + area.w + 3,
                y: where.y + Math.floor(area.h /2)
              };
            }
          }
        } else {
          throw new Error('graphElement not found in wdwMap');
        }
        throw new Error('graphElement not found in turnEvents');
      },

      // return the point at the tip of the arrow pointing to this graph element
      whereIsTail: function(wdwMap, graphElement) {
       var where = wdwMap.whereIs(graphElement);
        if (where) {
          for (var i = 0, iLen = turnEvents.length; i < iLen; i++) {
            if (turnEvents[i].graphElement === graphElement) {
              var area = turnEvents[i].area;
              // return point in global screen coordinates
              return {
                x: where.x - 3,
                y: where.y + Math.floor(area.h /2)
              };
            }
          }
        } else {
          throw new Error('graphElement not found in wdwMap');
        }
        throw new Error('graphElement not found in turnEvents');
      },

      draw: function(ctx, wdwMap, graphElement, isSelected) {
        if (graphElement) {
          for (var i = 0, iLen = turnEvents.length; i < iLen; i++) {
            if (turnEvents[i].graphElement === graphElement) {
              drawTurnEvent(ctx, wdwMap, turnEvents[i], isSelected);
              return;
            }
          }
          throw new Error('graphElement not found in turnEvents');
        } else {
          turnEvents.forEach(function(te) {
            drawTurnEvent(ctx, wdwMap, te);
          });
        }
      }
    };

    return turnView;
  };
})();