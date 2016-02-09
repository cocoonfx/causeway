// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

(function(){
  "use strict";
  
  importScripts('debug.js');
  importScripts('makeCausewayLogger.js');
  
  var cwLogger = makeCausewayLogger('accounts');
  cwLogger.turnOn();
  
  function doCreditCheck(name, msg) {
    self.postMessage({'msg': msg, 'answer': true});
  }
  
  self.addEventListener('message', function accountsRequest(e) {
    var msg = e.data.msg;
    var data = e.data;
    switch (msg) {
    case 'doCreditCheck':
      doCreditCheck(data.name, msg);
      break;
    default:
      break;
    };
  }, false);
})();
