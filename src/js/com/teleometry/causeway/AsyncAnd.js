
var AsyncAnd = function(nExpected,
                        callback) {

    this.nExpected = nExpected;
    this.callback = callback;
    this.chunks = [];
    
    // skip nExpected < 1
};

AsyncAnd.prototype.parse = function(responseText) {

    if (this.callback !== null) {
    
        var pt = JSON.parse(responseText);
        this.chunks = this.chunks.concat(pt);
        
        this.nExpected -= 1;
        if (this.nExpected <= 0) {
            this.callback(this.chunks);
            this.callback = null;
        }
    }
};