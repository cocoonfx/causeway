// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeCellGrid;

(function(){
  "use strict";

  makeCellGrid = function makeCellGrid(causewayModel) {
    
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

  };
})();
