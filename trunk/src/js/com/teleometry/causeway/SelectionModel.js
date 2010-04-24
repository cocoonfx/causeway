
var SelectionModel = function() {
    this.observers = [];
};

SelectionModel.prototype.setOptPlace = function(optPlace) {
    for (var observer in observers) {
        if (observers.hasOwnProperty(observer)) {
            setTimeout(function(){ observer.placeSelected(optPlace); }, 0);
        }
    }
};

SelectionModel.prototype.setOptModel = function(optModel) {
    if (null === optModel) {
        this.setOptPlace(null);
    } else {
        this.setOptPlace({graphElement: optModel, stackIndex: 0});
    }
};

SelectionModel.prototype.addObserver(observer) {
    observers.push(observer);
};


