// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeWdwMap;

(function(){
  "use strict";

  makeWdwMap = function makeWdwMap() {

    var lookup = new FlexMap();
    var xScale = 1.0;
    var yScale = 1.0;

    var wdwMap = {

      post: function(graphElement, where) {
        lookup.set(graphElement, where);
      },

      maps: function(graphElement) {
        return !(lookup.get(graphElement) === undefined);
      },

      scale: function(x, y) {
        xScale = x;
        yScale = y;
      },

      whereIs: function(graphElement) {
        return lookup.get(graphElement);
      },

      whoIs: function(x, y) {
        var tx = x / xScale;
        var ty = y / yScale;
        var graphElements = lookup.getKeys();
        for (var i = 0, iLen = graphElements.length; i < iLen; i++) {
          var where = lookup.get(graphElements[i]);
          if (tx >= where.x && tx < where.x + where.w &&
              ty >= where.y && ty < where.y + where.h) {
            return graphElements[i];
          }
        }
        return null;
      }
    };

    return wdwMap;
  };
})();