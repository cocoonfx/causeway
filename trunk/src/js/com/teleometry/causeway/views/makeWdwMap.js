// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeWdwMap;

(function(){
  "use strict";

  makeWdwMap = function makeWdwMap() {

    var lookup = new FlexMap();

    var wdwMap = {

      post: function(graphElement, where) {
        lookup.set(graphElement, where);
      },

      maps: function(graphElement) {
        return !(lookup.get(graphElement) === undefined);
      },

      whereIs: function(graphElement) {
        return lookup.get(graphElement);
      },

      whoIs: function(x, y) {
        var graphElements = lookup.getKeys();
        for (var i = 0, iLen = graphElements.length; i < iLen; i++) {
          var where = lookup.get(graphElements[i]);
          if (x >= where.x && x < where.x + where.w &&
              y >= where.y && y < where.y + where.h) {
            return graphElements[i];
          }
        }
        return null;
      }
    };

    return wdwMap;
  };
})();