// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeCausalityGridView;

(function(){
  "use strict";
  
  makeCausalityGridView = function makeCausalityGridView(causewayModel,
                                                         vatMap,
                                                         graphWalker,
                                                         images) {
    var cellGrid = makeCellGrid(causewayModel);
    var cellToViewMap = new FlexMap();
    
    cellGrid.cells.forEach(function(cell) {
      var turnNode = cell.node;
      var turnView = makeIconicTurnView(turnNode, vatMap, graphWalker, images);
      cellToViewMap.set(turnNode, turnView);
    });
    
    var colSpacing = 20;
    var rowSpacing = 20;
    var colWidths;
    var rowHeights;
    
    var nodesInFlow;
    var edgesInFlow;
    
    function causalFlowIn(wdwMap, target) {
      target.deepInsPre(function(incoming, origin) {
        if (wdwMap.maps(incoming) && wdwMap.maps(origin)) {
          nodesInFlow.push(origin);
          edgesInFlow.push(incoming);
        }
      });
    }
    
    function causalFlowOut(wdwMap, origin) {
      origin.deepOutsPre(function(outgoing, target) {
        if (wdwMap.maps(outgoing) && wdwMap.maps(target)) {
          nodesInFlow.push(target);
          edgesInFlow.push(outgoing);
        }
      });
    }
    
    var causalityGridView = {
      
      layout: function(ctx) {
        
        // map rows to row heights
        rowHeights = cellGrid.byRows.map(function(row) {
          // each reduce step does a view layout
          // and accumulates the max height seen so far
          return row.reduce(function(maxH, cell) {
            var view = cellToViewMap.get(cell.node);
            var area = view.layout(ctx);
            return Math.max(maxH, area.h);
          }, 0);
        });
        // maps columns to column widths
        colWidths = cellGrid.byCols.map(function(col) {
          // each reduce step does a view layout
          // and accumulates the max width seen so far
          return col.reduce(function(maxW, cell) {
            var view = cellToViewMap.get(cell.node);
            var area = view.layout(ctx);
            return Math.max(maxW, area.w);
          }, 0);
        });
        
        var totalWidth = colWidths.reduce(function(sum, width) {
          return sum + width + colSpacing;
        }, -colSpacing);
        
        var totalHeight = rowHeights.reduce(function(sum, height) {
          return sum + height + rowSpacing;
        }, -rowSpacing);
        
        return {w: totalWidth, h: totalHeight};
      },
      
      postToWdwMap: function(wdwMap, left, top) {
        
        var xOrigins = [];
        var x = left;
        colWidths.forEach(function(width, col) {
          xOrigins[col] = x;
          x += width + colSpacing;
        });
        
        var yOrigins = [];
        var y = top;
        rowHeights.forEach(function(height, row) {
          yOrigins[row] = y;
          y += height + rowSpacing;
        });
        
        cellGrid.cells.forEach(function(cell) {
          var view = cellToViewMap.get(cell.node);
          view.postToWdwMap(wdwMap, xOrigins[cell.col], yOrigins[cell.row]);
        });
      },
      
      draw: function(ctx, wdwMap) {
        cellGrid.cells.forEach(function(cell) {
          var view = cellToViewMap.get(cell.node);
          view.draw(ctx, wdwMap);
        });
      },
      
      redraw: function(ctx, wdwMap, selected, flowWdwMap) {
        if (!selected) {
          this.draw(ctx, wdwMap);
        } else {

          // draw dimmed nodes, no arcs, if selected
          ctx.save();
          ctx.globalAlpha = 0.33;
          this.draw(ctx, wdwMap);
          ctx.restore();
          
          nodesInFlow = [];
          edgesInFlow = [];
          
          if (selected.isNode()) {
            causalFlowIn(wdwMap, selected);
            nodesInFlow.push(selected);
            causalFlowOut(wdwMap, selected);

          } else {
            causalFlowIn(wdwMap, selected.getOrigin());
            nodesInFlow.push(selected.getOrigin());
            edgesInFlow.push(selected);
            nodesInFlow.push(selected.target);
            causalFlowOut(wdwMap, selected.target);
          }

          // TODO(cocoonfx): figure out canvas support for z-layer
          // draw the Fulfilled insets, then arcs, then nodes
          edgesInFlow.forEach(function(edge) {
            var originView = cellToViewMap.get(edge.getOrigin());
            var targetView = cellToViewMap.get(edge.target);
            if (originView && targetView) {
              var head = originView.whereIsHead(wdwMap, edge);
              var tail = targetView.whereIsTail(wdwMap, edge.target);
              if (edge.traceRecord["class"][0] === 
                    'org.ref_send.log.Fulfilled') {
                drawJoin(ctx, head, tail);
              }
            }
          });

          edgesInFlow.forEach(function(edge) {
            var originView = cellToViewMap.get(edge.getOrigin());
            var targetView = cellToViewMap.get(edge.target);
            if (originView && targetView) {
              var head = originView.whereIsHead(wdwMap, edge);
              var tail = targetView.whereIsTail(wdwMap, edge.target);
              if (edge.traceRecord["class"][0] !== 
                    'org.ref_send.log.Fulfilled') {
                drawDirectedArc(ctx, head, tail);
              }
            }
          });
          
          nodesInFlow.forEach(function(node) {
            var view = cellToViewMap.get(node);
            if (view) {
              view.draw(ctx, wdwMap, node, node === selected, true);
              flowWdwMap.post(node, wdwMap.whereIs(node));
            }
          });
          edgesInFlow.forEach(function(edge) {
            var view = cellToViewMap.get(edge.getOrigin());
            if (view) {
              view.draw(ctx, wdwMap, edge, edge === selected, true);
              flowWdwMap.post(edge, wdwMap.whereIs(edge));
            }
          });
        }
      }
    };
    
    return causalityGridView;
  };
})();