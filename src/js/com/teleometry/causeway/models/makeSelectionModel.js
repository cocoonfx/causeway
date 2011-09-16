// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeSelectionModel;

(function(){
  "use strict";

  makeSelectionModel = function makeSelectionModel() {
    var observers = [];

    var selectionModel = {

      setOptSelectedElement: function(observer, optElement) {
        observers.forEach(function(o) {
          if (o !== observer) {
            o.elementSelected(optElement);
          }
        });
      },

      setOptEnteredElement: function(observer, optElement) {
        observers.forEach(function(o) {
          if (o !== observer) {
            o.elementEntered(optElement);
          }
        });
      },

      addObserver: function(observer) {
        observers.push(observer);
      }
    };

    return selectionModel;
  };
})();