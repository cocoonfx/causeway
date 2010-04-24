
var FlexMap = function(len) {
    this.keys = Array(len || 100);
    this.vals = Array(len || 100);
};

FlexMap.prototype.set = function(key, value) {
    if (key !== Object(key)) {
        throw new Error('primitive keys not yet implemented: ' + key); 
    }
    var hash = key.hash;
    while (!hash) {
        hash = key.hash = Math.abs(Math.floor(10000 * Math.random()));
    }
    var i = hash % this.keys.length;
    var subKeys = this.keys[i] || [];
    var subVals = this.vals[i] || [];
    for (var j = 0; j < subKeys.length; j++) {
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
    if (key !== Object(key)) {
        throw new Error('primitive keys not yet implemented: ' + key); 
    }
    var hash = key.hash;
    if (!hash) { return undefined; }
    var i = hash % this.keys.length;
    var subKeys = this.keys[i] || [];
    var subVals = this.vals[i] || [];
    for (var j = 0; j < subKeys.length; j++) {
        if (subKeys[j] === key) {
            return subVals[j];
        }
    }
    return undefined;    
};

var FlexSet = function(len) {
    this.map = new FlexMap(len);
};

FlexSet.prototype.addElement = function(key) {
    this.map.set(key, true);
};

FlexSet.prototype.contains = function(key) {
    return !!this.map.get(key);
};
