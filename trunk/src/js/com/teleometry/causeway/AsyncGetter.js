
var AsyncGetter = function(nExpected,
                           callback) {

    this.nExpected = nExpected;
    this.callback = callback;
    this.lookupTable = {};
    
    // skip nExpected < 1
};

AsyncGetter.prototype.addToLookupTable = function(surl, responseText) {

    if (this.callback !== null) {
    
        this.lookupTable[surl] = responseText;
        
        this.nExpected -= 1;
        if (this.nExpected <= 0) {
            this.callback(this.lookupTable);
            this.callback = null;
        }
    }
};