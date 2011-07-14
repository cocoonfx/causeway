// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeCausalityGridView;

(function(){
  "use strict";

  function getCellGrid(causewayModel) {

    var messageGraph = causewayModel.getMessageGraph();
    var vatTurns = causewayModel.getVatTurns();

    var maxHzMemo = new FlexMap();

    var hzPacker = {
      earlier: function(node) {
        var result = [];
        var vatName = node.getVatName();

        if (vatName !== 'top' && vatName !== 'bottom') {
          var turns = vatTurns[vatName];
          if (turns) {
            var i = turns.indexOf(node);
            if (i >= 1) {
              result.push(turns[i-1]);
            }
          }
        }
        node.ins(function(incoming, origin) {
          result.push(origin);
        });
        return result;
      },
      localMax: function(node) {
        return 0;
      }
    };

    var vm = new FlexMap();
    var h2v = [];

    var maxVertMemo = {
      get: function(node) {
        return vm.get(node);
      },
      set: function(node, v) {
        vm.set(node, v);
        var hz = maxHzMemo.get(node);
        if (v !== 'in progress') {
          h2v[hz] = Math.max(h2v[hz] || 0, v);
        }
      }
    };

    var vertPacker = {
      earlier: function(node) {
        var result = [];
        node.ins(function(incoming, origin) {
          result.push(origin);
        });
        return result;
      },
      localMax: function(node) {
        var hz = maxHzMemo.get(node);
        var max = h2v[hz] || 0;
        if (max > 0) {
          return max + 1;
        }
        return 0;
      }
    };

    var storeMax = function(bottom, packer, maxMemo) {
      var getMax = function(node) {
        var p = maxMemo.get(node);
        if (p === 'in progress') {
          throw new Error('getMax sees in progress');
        }
        if (p) { return p; }
        maxMemo.set(node, 'in progress');
        var earlier = packer.earlier(node);

        p = earlier.reduce(function(i, e) {
          return Math.max(i, 1 + getMax(e));
        }, 0);
        p = Math.max(p, packer.localMax(node));
        maxMemo.set(node, p);
        return p;
      };
      getMax(bottom);
    };

    messageGraph.getLeaves().forEach(function(leaf) {
      storeMax(leaf, hzPacker, maxHzMemo);
    });
    messageGraph.getLeaves().forEach(function(leaf) {
      storeMax(leaf, vertPacker, maxVertMemo);
    });

    var cells = [];
    Object.keys(vatTurns).forEach(function(vatName) {
      var turns = vatTurns[vatName];
      turns.forEach(function(node) {
        var hz = maxHzMemo.get(node) || -1;
        var vert = maxVertMemo.get(node) || -1;

        if (hz >= 0 && vert >= 0) {
          cells.push({
            col: hz,
            row: vert,
            node: node
          });
        }
      });
    });

    cells.sort(by('col', by('row')));

    var byRows = [];
    var byCols = [];
    cells.forEach(function(gridCell) {
      var row = byRows[gridCell.row] || (byRows[gridCell.row] = []);
      row[gridCell.col] = gridCell;
      var col = byCols[gridCell.col] || (byCols[gridCell.col] = []);
      col[gridCell.row] = gridCell;
    });

    return {
      cells: cells,
      byRows: byRows,
      byCols: byCols
    };
  }

  makeCausalityGridView = function makeCausalityGridView(causewayModel,
                                                         vatMap,
                                                         graphWalker) {
    var cellGrid = getCellGrid(causewayModel);
    var cellToViewMap = new FlexMap();

    cellGrid.cells.forEach(function(cell) {
      var turnNode = cell.node;
      var turnView = makeTurnView(turnNode, vatMap, graphWalker);
      cellToViewMap.set(turnNode, turnView);
    });

    var colSpacing = 25;
    var rowSpacing = 10;
    var colWidths;
    var rowHeights;

    var causalityGridView = {

      layout: function(ctx) {
        ctx.font = '12px sans-serif';
        ctx.textBaseline = 'top';

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
        ctx.strokeStyle = "#C0C0C0";  // silver for arcs
        ctx.fillStyle = "#C0C0C0";
        ctx.lineStyle = "#C0C0C0";
        ctx.lineWidth = 1;
        cellGrid.cells.forEach(function(cell) {
          var originNode = cell.node;
          originNode.outs(function(outgoing, target) {
            if (wdwMap.whereIs(target) !== undefined) {
              var originView = cellToViewMap.get(originNode);
              var targetView = cellToViewMap.get(target);
              var head = originView.whereIsHead(wdwMap, outgoing);
              var tail = targetView.whereIsTail(wdwMap, target);
              drawDirectedArc(ctx, head, tail);
            }
          });
        });

        ctx.font = '12px sans-serif';
        ctx.textBaseline = 'top';

        cellGrid.cells.forEach(function(cell) {
          var node = cell.node;
          var color = vatMap[node.id.loop].color.hexColor;
          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          var view = cellToViewMap.get(node);
          view.draw(ctx, wdwMap);
        });
      }
    };

    return causalityGridView;
  };
})();
