// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeSelectionModel;

(function(){
  "use strict";

  makeSelectionModel = function makeSelectionModel() {
    var observers = [];

    var selectionModel = {

      setOptSelectedElement: function(origin, optElement, optIndex) {
        observers.forEach(function(o) {
          o.elementSelected(origin, optElement, optIndex);
        });
      },

      setOptEnteredElement: function(origin, optElement, optIndex) {
        observers.forEach(function(o) {
          o.elementEntered(origin, optElement, optIndex);
        });
      },

      addObserver: function(observer) {
        observers.push(observer);
      }
    };

    return selectionModel;
  };
})();