// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http://www.opensource.org/licenses/mit-license.html ...............

var by;

(function(){
  "use strict";

  if (typeof Object.create !== 'function') {
    Object.create = function(o) {
      var F = function() {};
      F.prototype = o;
      return new F();
    };
  }

  var access = function(obj, path) {
    for (var i = 0; i < path.length; i++) {
      if (typeof obj !== 'object' || obj === null) {
        throw new Error("not an object: " + obj);
      }
      obj = obj[path[i]];
    }
    return obj;
  }

  by = function by(name, opt_minor) {
    var minor = opt_minor || function(x, y) { return 0; };
    return function(thisOne, thatOne) {
      var a, b;

      a = access(thisOne, name.split('.'));
      b = access(thatOne, name.split('.'));
      if (a === b) {
        if (a !== 0) {
          return minor(thisOne, thatOne);
        }
        // Ensure that -0 compares as earlier than 0
        a = 1/a;
        b = 1/b;
        if (a === b) {
          return minor(thisOne, thatOne);
        }
      }
      if (typeof a === typeof b) {
        if (a !== a) {
          // a is a NaN
          if (b !== b) {
            // b is a NaN
            return 0;
          } else {
            // NaNs come before all other numbers
            return -1;
          }
        } else {
          if (b !== b) {
            // All other numbers come after NaNs
            return 1;
          } else {
            return a < b ? -1 : 1;
          }
        }
      }
      return typeof a < typeof b ? -1 : 1;
    };
  };
})();
