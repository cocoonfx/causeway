
if (typeof Object.beget !== 'function') {
    Object.beget = function(o) {
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

var by = function(name) {
    return function(thisOne, thatOne) {
        var a, b;
            
        a = access(thisOne, name.split('.'));
        b = access(thatOne, name.split('.'));
        if (a === b) {
            return 0;
        }
        if (typeof a === typeof b) {
            return a < b ? -1 : 1;
        }
        return typeof a < typeof b ? -1 : 1;
    };
};
