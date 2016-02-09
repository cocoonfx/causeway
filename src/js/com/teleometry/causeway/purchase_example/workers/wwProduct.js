// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

(function(){
  "use strict";
  
  importScripts('debug.js');
  importScripts('makeCausewayLogger.js');
  
  var cwLogger = makeCausewayLogger('product');
  cwLogger.turnOn();
  
  function isAvailable(partNo, msg) {
    self.postMessage({'msg': msg, 'answer': true});
  }
  
  function canDeliver(profile, msg) {
    self.postMessage({'msg': msg, 'answer': true});
  }
  
  function placeOrder(buyer, partNo, msg) {
    self.postMessage({'msg': msg, 'answer': true});
  }
  
  self.addEventListener('message', function productRequest(e) {
    var msg = e.data.msg;
    var data = e.data;
    switch (msg) {
    case 'isAvailable':
      isAvailable(data.partNo, msg);
      break;
    case 'canDeliver':
      canDeliver(data.profile, msg);
      break;
    case 'placeOrder':
      placeOrder(data.name, data.partNo, msg);
      break;
    default:
      break;
    };
  }, false);
})();
  
