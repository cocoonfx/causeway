// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

(function(){
  "use strict";
  
  importScripts('makeCausewayLogger.js');
  
  var cwLogger = makeCausewayLogger('accounts');
  cwLogger.turnOn();
  var send = cwLogger.send;
  
  function doCreditCheck(name) {
    return true;
  }
  
  self.addEventListener('message', function(e) {
    var msg = e.data.msg;
    var data = e.data;
    switch (msg) {
    case 'doCreditCheck':
      self.postMessage({'msg': msg,
                        'answer': doCreditCheck(data.name)});
      break;
    default:
      break;
    };
  }, false);
})();
  