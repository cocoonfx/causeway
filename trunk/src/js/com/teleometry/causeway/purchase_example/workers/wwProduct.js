// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

(function(){
  "use strict";
  
  importScripts('makeCausewayLogger.js');
  
  var cwLogger = makeCausewayLogger('product');
  cwLogger.turnOn();
  var send = cwLogger.send;
  
  function isAvailable(partNo) {
    return true;
  }
  
  function placeOrder(buyer, partNo) {
    return true;
  }
  
  function canDeliver(profile) {
    return true;
  }
  
  self.addEventListener('message', function(e) {
    var msg = e.data.msg;
    var data = e.data;
    switch (msg) {
    case 'isAvailable':
      self.postMessage({'msg': msg,
                        'answer': isAvailable(data.partNo)});
      break;
    case 'canDeliver':
      self.postMessage({'msg': msg,
                        'answer': canDeliver(data.profile)});
      break;
    case 'placeOrder':
      self.postMessage({'msg': msg,
                        'answer': placeOrder(data.name, data.partNo)});
      break;
    default:
      break;
    };
  }, false);
})();
  