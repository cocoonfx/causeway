// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

/**
 * A simple distributed procedure for handling new purchase orders.
 * This example program is implemented as communicating event loops built
 * on asynchronous postMessage() API.
 * 
 * Before an order is placed, certain conditions must be met: the item is in
 * stock and available, the customer's account is in good standing and the 
 * delivery options are up to date.
 * 
 * The main page loop, 'buyer', queries two remote workers, 'product'
 * and 'accounts'. The answers from the asynchronous queries
 * must be collected and examined to verify that all requirements
 * are satisfied before placing the order.
 *
 * Each loop makes an instance of CausewayLogger to log messaging events.
 * The Causeway viewer (a separate application) collects the set of JSON log
 * files and stitches the events into a causality graph. Causeway presents the
 * distributed  program as message flow between communicating event loops,
 * in this case, the messaging from main page to workers and back again.
 */
 
 var doWebWorkersTest;
 
 (function(){
   "use strict";
   
   doWebWorkersTest = function doWebWorkersTest() {

     var partNo = '123abc';
     var name = 'West Coast Buyers';
     var profile = 'West Coast Buyers Profile';
     
     // Make a logger instance to log messaging events for the main page.
     // This communicating event loop is named 'buyer'.
    
     var cwLogger = makeCausewayLogger('buyer');
     
     // Enable logging. 
     // The argument 'inFrame' tells the logger that the events are
     // coming from the main page loop rather than a worker loop.
     // The logger must know the client type since worker loops have 
     // less authority (e.g., they cannot log to the console).
     
     // Once logging is enabled, it happens automatically. 
     // Notice only two explicit calls to the logger:
     //     cwLogger.logCommentRecord() and
     //     cwLogger.logJsonRecord()
     // for logging comments (printf debugging) and 
     // for passing through worker log requests.
     
     cwLogger.turnOn('inFrame');
     
     // Use the logger's send function to log 
     // local one-way asynchronous messages (callbacks).
     
     var send = cwLogger.send;
     
     var product =
       new Worker('causeway/purchase_example/workers/wwProduct.js');
     var accounts =
       new Worker('causeway/purchase_example/workers/wwAccounts.js');

     var re = new RegExp('([<>"])', 'g');
     var entity = {
       '<': '&lt;',
       '>': '&gt;',
       '"': '&quot;'
     };
     function encode(entityChar) {
       return entity[entityChar];
     }
     function htmlEncode(str) {
       return str.replace(re, encode);
     }
     function captureLog() {
       var domElement = document.getElementById('logfile');
       domElement.innerHTML = [
         '<br></br><pre>',
         htmlEncode(cwLogger.flush()),
         '</pre><br></br>'
       ].join('');
     }
     
     var reporter = {
       run: function(answer) {
         if (answer) {
           cwLogger.logCommentRecord('Order placed for ' +
                                     name,
                                     new Error('dummy').stack);
         } else {
           cwLogger.logCommentRecord('Could not place order for ' +
                                     name,
                                     new Error('dummy').stack);
         }
         captureLog();
       }
     };
     
     var checkAnswers = {
       run: function(allOk) {
         if (allOk) {
           cwLogger.logCommentRecord('All queries answered true', 
                                     new Error('dummy').stack);
           product.postMessage({'msg': 'placeOrder',
                                'name': name,
                                'partNo': partNo});
         } else {
           cwLogger.logCommentRecord('Conditions were not met',
                                     new Error('dummy').stack);
           captureLog();
         }
       }
     };
     
     // teller expects 3 answers;
     // checkAnswers is invoked after 3 trues or the first false
     var teller = asyncAnd(3, checkAnswers, send);
     
     product.postMessage({'msg': 'isAvailable',
                          'partNo': partNo});
     accounts.postMessage({'msg': 'doCreditCheck',
                           'name': name});
     product.postMessage({'msg': 'canDeliver',
                          'profile': profile});
     
     product.addEventListener('message', function(e) {
       var data = e.data;
       switch (data.msg) {
       case 'isAvailable':
       case 'canDeliver':
         if ('answer' in data) {
           send(teller, 'run', [data.answer]);
         }
         break;
       case 'placeOrder':
         if ('answer' in data) {
           send(reporter, 'run', [data.answer]);
         }
         break; 
       case 'log':
         if ('json' in data) {
           cwLogger.logJsonRecord(data.json);
         }
         break;
       default:
         break;
       };
     }, false);
     
     accounts.addEventListener('message', function(e) {
       var data = e.data;
       switch (data.msg) {
       case 'doCreditCheck':
         if ('answer' in data) {
           send(teller, 'run', [data.answer]);
         }
         break;
       case 'log':
         if ('json' in data) {
           cwLogger.logJsonRecord(data.json);
         }
         break;
       default:
         break;
       };
     }, false);
   };
 })();    
 