// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeIconicTurnView;

(function(){
  "use strict";

  var hoveredEvent = void 0;
  
  var enteredStyle = 'rgba(47, 79, 79, 0.25)';
  var selectionStyle = 'rgba(178, 34, 34, 1.0)';
  var clearStyle = 'rgba(255, 255, 255, 1.0)';
  
  makeIconicTurnView = function makeIconicTurnView(turnNode, 
                                                   vatMap, 
                                                   graphWalker,
                                                   images,
                                                   modelToViewMap) {
    function makeEventView(graphElement) {
      var isTop = graphElement === turnNode;
      var self = void 0;
      var id = graphElement.traceRecord.anchor.turn;
      self = {
          isTop: isTop,
          graphElement: graphElement,
          vatColor: vatMap[id.loop].color.hexColor,
          isActive: false,
          isSelected: false,
          isEntered: false,
          where: void 0,  // gets filled in below

          draw: function(ctx) {
            var where = self.where;
            if (where) {
              ctx.fillStyle = clearStyle;
              ctx.fillRect(where.x - 4, where.y - 4, 
                           where.w + 8, where.h + 8);
              if (self.isSelected) {
                ctx.fillStyle = selectionStyle;
                ctx.fillRect(where.x - 3, where.y - 3, 
                             where.w + 6, where.h + 6);
                ctx.fillStyle = clearStyle;
                ctx.fillRect(where.x - 2, where.y - 2, 
                             where.w + 4, where.h + 4);
              } else if (self.isEntered) {
                ctx.fillStyle = enteredStyle;
                ctx.fillRect(where.x - 3, where.y - 3, 
                             where.w + 6, where.h + 6);
              }
              if (self.isEntered) {
                if (hoveredEvent && self !== hoveredEvent) {
                  hoveredEvent.isEntered = false;
                  hoveredEvent.draw(ctx);
                }
                hoveredEvent = self;
              }
              ctx.save();
              ctx.globalAlpha = self.isActive ? 1.0 : 0.33;
              ctx.fillStyle = self.vatColor;
              ctx.fillRect(where.x, where.y, where.w, where.h);
              ctx.restore();
            } else {
              throw new Error('turnEvent.where not set');
            }
          }
      };
      modelToViewMap.set(graphElement, self);
      return self;
    }
    
    // the receive event that starts this turn
    var topOfTurn = makeEventView(turnNode);

    var turnEvents = [];

    // The subsequent events that occurred during this turn
    turnNode.outs(function(outgoing, target) {
      turnEvents.push(makeEventView(outgoing));
    });

    var displayArea;
    
    function drawTurnEvent(ctx, wdwMap, turnEvent, 
                           isSelected, isActive, isEntered) {
      turnEvent.isSelected = isSelected;
      turnEvent.isActive = isActive;
      turnEvent.isEntered = isEntered;

      turnEvent.draw(ctx);
    }

    var iconicTurnView = {
        
      hover: function(ctx, wdwMap, graphElement) {
        if (graphElement) {
          var view = modelToViewMap.get(graphElement);
          if (view) {
            view.isEntered = true;
            view.draw(ctx);
          }
        }
      },
        
      dehover: function(ctx, wdwMap, graphElement) {
        if (hoveredEvent) {
          hoveredEvent.isEntered = false;
          hoveredEvent.draw(ctx);
          hoveredEvent = void 0;
        }
      },
        
      layout: function(ctx) {
        // TODO(cocoonfx): Invalidate cache if ctx changes
        if (displayArea) { return displayArea; }

        var w = 8;
        var h = 8;
        var totalh = 0;

        totalh += h + 8;

        turnEvents.forEach(function(te) {
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
        var h = 8;

        var where = {x: x, y: y, w: w, h: h};
        wdwMap.post(topOfTurn.graphElement, where);
        topOfTurn.where = where;
        y += h + 8;

        turnEvents.forEach(function(te) {
          var where = {x: x, y: y, w: w, h: h};
          wdwMap.post(te.graphElement, where);
          te.where = where;
          y += h + 8;
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
          var view = modelToViewMap.get(graphElement);
          drawTurnEvent(ctx, wdwMap, view, isSelected, isActive, isEntered);

        } else {
          drawTurnEvent(ctx, wdwMap, topOfTurn, false, false, false);
          turnEvents.forEach(function(te) {
            drawTurnEvent(ctx, wdwMap, te, false, false, false);
          });
          hoveredEvent = void 0;
        }
      }
    };

    return iconicTurnView;
  };
})();