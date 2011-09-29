// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeVatMap;

(function(){
  "use strict";

  if (!('freeze' in Object) || !('getOwnPropertyNames' in Object)) {
    alert('This page requires a browser supporting more of EcmaScript 5.\n' +
          'This includes at least all browsers starting with\n' +
          '* Firefox 4\n' +
          '* Chrome 12\n' +
          '* Safari 5.0.6\n' +
          '* Internet Explorer 9\n' +
          '* Opera 12');
    return;
   }


  var vatColors = Object.freeze([
    {x11Color: "mediumblue",    hexColor: "#0000CD"},
    {x11Color: "forestgreen",   hexColor: "#228B22"},
    {x11Color: "indigo",        hexColor: "#4B0082"},
    {x11Color: "chocolate",     hexColor: "#D2691E"},
    {x11Color: "darkslateblue", hexColor: "#483D8B"},
    {x11Color: "saddle brown",  hexColor: "#8B4513"},
    {x11Color: "dark orange",   hexColor: "#FF8C00"},
    {x11Color: "navy",          hexColor: "#000080"},
    {x11Color: "indian red",    hexColor: "#CD5C5C"},
    {x11Color: "teal",          hexColor: "#008080"}
  ]);

  function getDisplayName(vatName) {
    var parts = vatName.split("/");
    var i = parts.length -1;
    while (i >= 0) {
      var part = parts[i];
      if (part !== "") {
        return part;
      }
      i -= 1;
    }
    return vatName;
  }

  makeVatMap = function makeVatMap(messageGraph) {

    var vatSet = {};

    messageGraph.top.deepOutsPre(function(edge, target) {
      var id = target.id;
      if (id.loop !== 'bottom') {
        vatSet[id.loop] = true;
      }
    });

    var vatNames = [];
    for (var vatName in vatSet) {
      if (vatSet.hasOwnProperty(vatName)) {
        vatNames.push(vatName);
      }
    }

    var vatMap = {};

    for (var i = 0, iLen = vatNames.length; i < iLen; i++) {
      vatMap[vatNames[i]] = {displayName: getDisplayName(vatNames[i]),
                             color: vatColors[i % vatColors.length]};
    }
    vatMap['top'] = {displayName: 'top',
                     color: {x11Color: "black",
                             hexColor: "#000000"}};
    vatMap['bottom'] = {displayName: 'bottom',
                        color: {x11Color: "black",
                                hexColor: "#000000"}};
    return vatMap;
  };
})();


