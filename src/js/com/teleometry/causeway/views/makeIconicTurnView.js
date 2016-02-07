// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeIconicTurnView;

(function(){
  "use strict";

  makeIconicTurnView = function makeIconicTurnView(turnNode, 
                                                   vatMap, 
                                                   graphWalker,
                                                   images) {

    // the receive event that starts this turn
    var topOfTurn = { 
      graphElement: turnNode,
      displayAttr: {active: images.totPopped,
                    inactive: images.totFlat,
                    enteredStyle: 'rgba(178, 34, 34, 0.15)',
                    selectionStyle: 'rgba(178, 34, 34, 0.3)'}};

    var turnEvents = [];

    // The subsequent events that occurred during this turn
    turnNode.outs(function(outgoing, target) {
      turnEvents.push({graphElement: outgoing,
                       displayAttr: { active: images.inturnPopped, 
                         inactive: images.inturnFlat,
                         enteredStyle: 'rgba(178, 34, 34, 0.15)',
                         selectionStyle: 'rgba(178, 34, 34, 0.3)'}});
    });

    var displayArea;
    
    var hoveredEvent = void 0;
    
    function drawTurnEvent(ctx, wdwMap, turnEvent, 
                           isSelected, isActive, isEntered) {
      var where = wdwMap.whereIs(turnEvent.graphElement);
      if (where) {
        ctx.clearRect(where.x, where.y, 
                      turnEvent.area.w, turnEvent.area.h);

        if (isSelected) {
          ctx.fillStyle = turnEvent.displayAttr.selectionStyle;
          ctx.fillRect(where.x - 4, where.y - 4,
                       turnEvent.area.w + 8, turnEvent.area.h + 8);
        } else if (isEntered) {
          ctx.fillStyle = turnEvent.displayAttr.enteredStyle;
          ctx.fillRect(where.x - 4, where.y - 4,
              turnEvent.area.w + 8, turnEvent.area.h + 8);

          // remember hovered event          
          hoveredEvent = {
            turnEvent: turnEvent,
            eventWhere: {
              x: where.x,
              y: where.y,
              w: turnEvent.area.w,
              h: turnEvent.area.h,
            },
            hoverWhere: {
              x: where.x - 4,
              y: where.y - 4,
              w: turnEvent.area.w + 8,
              h: turnEvent.area.h + 8,
            },
            isActive: isActive
          };
        }

        if (isActive) {
          ctx.drawImage(turnEvent.displayAttr.active,
                        where.x, where.y,
                        turnEvent.area.w, turnEvent.area.h);
        } else {
          ctx.drawImage(turnEvent.displayAttr.inactive,
                        where.x, where.y,
                        turnEvent.area.w, turnEvent.area.h);
        }
        
      } else {
        throw new Error('graphElement not found in wdwMap');
      }
    }

    var iconicTurnView = {
        
      hover: function(ctx, wdwMap, graphElement) {
        if (graphElement) {
          if (topOfTurn.graphElement === graphElement) {
            drawTurnEvent(ctx, wdwMap, topOfTurn, 
                          false, true, true);
          } else {
            for (var i = 0, iLen = turnEvents.length; i < iLen; i++) {
              if (turnEvents[i].graphElement === graphElement) {
                drawTurnEvent(ctx, wdwMap, turnEvents[i], 
                              false, true, true);
                break;
              }
            }
          }
        }
      },
        
      dehover: function(ctx, wdwMap, graphElement) {
        if (hoveredEvent) {
          var hw = hoveredEvent.hoverWhere;
          ctx.clearRect(hw.x, hw.y, hw.w, hw.h);
          var where = hoveredEvent.eventWhere;
          if (hoveredEvent.isActive) {
            ctx.drawImage(hoveredEvent.turnEvent.displayAttr.active,
                          where.x, where.y, where.w, where.h);
          } else {
            ctx.drawImage(turnEvent.displayAttr.inactive,
                          where.x, where.y, where.w, where.h);
          }
          hoveredEvent = void 0;
        }
      },
        
      layout: function(ctx) {
        // TODO(cocoonfx): Invalidate cache if ctx changes
        if (displayArea) { return displayArea; }

        var w = 8;
        var h = 8;
        var totalh = 0;

        topOfTurn.area = {w: w, h: h};
        totalh += h + 8;

        turnEvents.forEach(function(te) {
          te.area = {w: w, h: h};
          totalh += h + 8;
        });
        totalh -= 8;

        displayArea = {w: w, h: totalh};
        return displayArea;
      },

      // map from local coordinates to global window coordinates
      postToWdwMap: function(wdwMap, left, top) {
        var x = left;
        var y = top;
        var w = displayArea.w;  // fixed width

        wdwMap.post(topOfTurn.graphElement,
                    {x: x, y: y, w: w, h: topOfTurn.area.h});
        y += topOfTurn.area.h + 8;

        turnEvents.forEach(function(te) {
          var where = {x: x, y: y, w: w, h: te.area.h};
          wdwMap.post(te.graphElement, where);
          y += te.area.h + 8;
        });
      },

      // return the initial point of this graph element's outgoing arc
      whereIsHead: function(wdwMap, graphElement) {
        var where = wdwMap.whereIs(graphElement);
        if (where) {
          return {
            x: where.x + where.w,
            y: where.y + Math.floor(where.h /2)
          };
        } else {
          throw new Error('graphElement not found in wdwMap');
        }
      },

      // return the point at the tip of the arrow pointing to this graph element
      whereIsTail: function(wdwMap, graphElement) {
       var where = wdwMap.whereIs(graphElement);
       if (where) {
         return {
           x: where.x -1,
           y: where.y + Math.floor(where.h /2)
         };
        } else {
          throw new Error('graphElement not found in wdwMap');
        }
      },

      draw: function(ctx, wdwMap, graphElement, 
                     isSelected, isActive, isEntered) {
        if (graphElement) {
          if (topOfTurn.graphElement === graphElement) {
            drawTurnEvent(ctx, wdwMap, topOfTurn, 
                          isSelected, isActive, isEntered);
            return;
          } else {
            for (var i = 0, iLen = turnEvents.length; i < iLen; i++) {
              if (turnEvents[i].graphElement === graphElement) {
                drawTurnEvent(ctx, wdwMap, turnEvents[i], 
                              isSelected, isActive, isEntered);
                return;
              }
            }
            throw new Error('graphElement not found in turnEvents');
          }

        } else {
          var where = wdwMap.whereIs(topOfTurn.graphElement);
          var xCenter = where.x + Math.floor(where.w /2);
          var yTop = where.y + where.h - 1;
          var yBottom = where.y + displayArea.h - 1;
          ctx.strokeStyle = 'rgb(0, 0, 0)';  // black
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(xCenter, yTop);
          ctx.lineTo(xCenter, yBottom);
          ctx.stroke();

          drawTurnEvent(ctx, wdwMap, topOfTurn);
          turnEvents.forEach(function(te) {
            drawTurnEvent(ctx, wdwMap, te);
          });
          hoveredEvent = void 0;
        }
      }
    };

    return iconicTurnView;
  };
})();