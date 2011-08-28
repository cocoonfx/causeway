// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http://www.opensource.org/licenses/mit-license.html ...............

var FlexMap;
var FlexSet;

(function(){
  "use strict";

  FlexMap = function FlexMap() {
    this.keys = {};
    this.vals = {};
  };

  function keyname(key) {
    if (key === Object(key)) {
      if (key.hash___) {
        return key.hash___;
      }
      return key.hash___ = 'hash_' + Math.random();
    } else if (typeof key === 'string') {
      return 'str_' + key;
    } else {
      return 'prim_' + key;
    }
  }

  FlexMap.prototype.set = function(key, value) {
    var i = keyname(key);
    var subKeys = this.keys[i] || [];
    var subVals = this.vals[i] || [];
    for (var j = 0, jlen = subKeys.length; j < jlen; j++) {
      if (subKeys[j] === key) {
        subVals[j] = value;
        return;
      }
    }
    subKeys.push(key);
    subVals.push(value);
    this.keys[i] = subKeys;
    this.vals[i] = subVals;
  };

  FlexMap.prototype.get = function(key) {
    var i = keyname(key);
    var subKeys = this.keys[i] || [];
    var subVals = this.vals[i] || [];
    for (var j = 0, jlen = subKeys.length; j < jlen; j++) {
      if (subKeys[j] === key) {
        return subVals[j];
      }
    }
    return undefined;
  };

  FlexMap.prototype.getKeys = function(opt_comparefn) {
    var result = [];
    for (var i in this.keys) {
      if (({}).hasOwnProperty.call(this.keys, i)) {
        var subKeys = this.keys[i];
        if (subKeys) {
          for (var j = 0, jlen = subKeys.length; j < jlen; j++) {
            result.push(subKeys[j]);
          }
        }
      }
    }
    if (opt_comparefn) {
      return result.sort(opt_comparefn);
    } else {
      return result;
    }
  };

  FlexSet = function FlexSet() {
    this.map = new FlexMap(
    );
  };

  FlexSet.prototype.addElement = function(key) {
    this.map.set(key, true);
  };

  FlexSet.prototype.contains = function(key) {
    return !!this.map.get(key);
  };
})();
