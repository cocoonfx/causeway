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

      whereIs: function(graphElement) {
        return lookup.get(graphElement);
      }
    };

    return wdwMap;
  };
})();