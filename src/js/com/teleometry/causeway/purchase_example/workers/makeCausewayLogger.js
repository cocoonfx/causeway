// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var makeCausewayLogger;

(function(){
  "use strict";

  var postpone;
  if (typeof process === 'undefined') {
    postpone = function(thunk) {
      setTimeout(thunk, 0);
    };
  } else {
    postpone = process.nextTick;
  }

  var span_spec = /\"span\":\s*\[\s*\[\s*(\d+)(?:,\s*(\d+))?\s*\]\s*(?:,\s*\[\s*(\d+)(?:,\s*(\d+))?\s*\]\s*)?\]/g;

  function replaceSpan(match, first, fo, last, lo) {
    var result = '"span": [ [ ' + first;
    if (fo) { result += ', ' + fo; }
    result += ' ]';
    if (last) {
      result += ', [ ' + last;
      if (lo) { result += ', ' + lo; }
      result += ' ]';
    }
    result += ' ]';
    return result;
  }

  function fixSpans(str) {
    return str.replace(span_spec, replaceSpan);
  }

  var inWorker;
  var origPostMessage;

  makeCausewayLogger = function makeCausewayLogger(vatName, wkRemote) {

    var TheAnchor = {
      number: 0,
      turn: {
        loop: vatName,
        number: 0
      }
    };

    var logBuffer = [];

    function logJson(json) {
      if (wkRemote && wkRemote.post && wkRemote.ref) {
        wkRemote.post(wkRemote.ref, 'apply', [json]);
      } else if (inWorker) {
        // worker does not have console-logging authority
        origPostMessage({'msg': 'log',
                         'json': json});
      } else {
        var s = JSON.stringify(json, undefined, ' ');
        var pretty = fixSpans(s);
        //console.log(pretty);
        //console.log(',');
        logBuffer.push(pretty, ',\n');
      }
    }

    function log(json, cwStack) {
      json.timestamp = Date.now();
      json.trace = cwStack;
      logJson(json);
    }

    function makeEvent() {
      return {
        "class": [ 'org.ref_send.log.Event' ],
        anchor: TheAnchor
      };
    }

    function makeComment(text) {
      var result = makeEvent();
      result['class'].unshift('org.ref_send.log.Comment');
      result.text = text;
      return result;
    }

    function makeProblem(reason, text) {
      var result = makeComment(text);
      result['class'].unshift('org.ref_send.log.Problem');
      result.reason = reason;
      return result;
    }

    function makeGot(msgId) {
      var result = makeEvent();
      result['class'].unshift('org.ref_send.log.Got');
      result.message = msgId;
      return result;
    }

    function makeResolved(condition) {
      var result = makeEvent();
      result['class'].unshift('org.ref_send.log.Resolved');
      result.condition = condition;
      return result;
    }

    function makeFulfilled(condition) {
      var result = makeResolved(condition);
      result['class'].unshift('org.ref_send.log.Fulfilled');
      return result;
    }

    function makeProgressed(condition) {
      var result = makeResolved(condition);
      result['class'].unshift('org.ref_send.log.Progressed');
      return result;
    }

    function makeRejected(reason, condition) {
      var result = makeResolved(condition);
      result['class'].unshift('org.ref_send.log.Rejected');
      result.reason = reason;
      return result;
    }

    function makeSent(msgId) {
      var result = makeEvent();
      result['class'].unshift('org.ref_send.log.Sent');
      result.message = msgId;
      return result;
    }

    function makeReturned(msgId) {
      var result = makeSent(msgId);
      result['class'].unshift('org.ref_send.log.Returned');
      return result;
    }

    // Causeway requires this property order
    function makeSentIf(condition, msgId) {
      var result = makeEvent();
      result['class'].unshift('org.ref_send.log.Sent');
      result['class'].unshift('org.ref_send.log.SentIf');
      result.condition = condition;
      result.message = msgId;
      return result;
    }

    function getCWStack() {
      return System.getCWStack(new Error('dummy'));
    }

    var logger = {

      logSentRecord: function(msgId) {
        TheAnchor.number++;
        log(makeSent(msgId), getCWStack());
      },

      logReturnedRecord: function(msgId) {
        TheAnchor.number++;
        log(makeReturned(msgId), getCWStack());
      },

      logGotRecord: function(msgId) {
        TheAnchor.turn.number++;
        TheAnchor.number = 0;
        log(makeGot(msgId), getCWStack());
      },

      logCommentRecord: function(text) {
        TheAnchor.number++;
        log(makeComment(text), getCWStack());
      },

      logSentIfRecord: function(condition, msgId) {
        TheAnchor.number++;
        log(makeSentIf(condition, msgId), getCWStack());
      },

      logResolvedRecord: function(condition) {
        TheAnchor.number++;
        log(makeResolved(condition), getCWStack());
      },

      logProgressedRecord: function(condition) {
        TheAnchor.number++;
        log(makeProgressed(condition), getCWStack());
      },

      logFulfilledRecord: function(condition) {
        TheAnchor.number++;
        log(makeFulfilled(condition), getCWStack());
      },

      logProblemRecord: function(reason, text) {
        TheAnchor.number++;
        log(makeProblem(reason, text), getCWStack());
      },

      logRejectedRecord: function(reason, condition) {
        TheAnchor.number++;
        log(makeRejected(reason, condition), getCWStack());
      },

      logJsonRecord: function(json) {
        logJson(json);
      },

      send: function(rcvr, verb, args) {
        var umid = 'umid:' + Math.random() + ':' + TheAnchor.turn.loop;
        logger.logSentRecord(umid);
        postpone(function() {
          logger.logGotRecord(umid);
          rcvr[verb].apply(rcvr, args);
        });
      },

      turnOn: function(where) {
        var messenger;

        if (where === 'inFrame') {
          messenger = Worker.prototype;
          inWorker = false;
        } else {
          messenger = self;  // workers have a 'special' self reference
          inWorker = true;
        }

        var hop = Object.prototype.hasOwnProperty;

        function getOwnBase(obj, name) {
          while (obj !== null) {
            try {
              if (hop.call(obj, name)) { return obj; }
            } catch (er) {
              // Weirdness seen on Safari: Without the try/catch the hop call
              // fails with 
              // TypeError: undefined is not an object
              //            (evaluating 'hop.call(obj, name)')
              // With the try/catch everything works without the catch clause
              // happening. If the following is logged to the console, we are
              // seeing a new symptom.
              console.error('Unexpected: ', er);
            }
            obj = Object.getPrototypeOf(obj);
          }
          return undefined;
        }

        var pmBase = getOwnBase(messenger, 'postMessage');
        origPostMessage = pmBase.postMessage;  // for bypassing logging
        
        pmBase.postMessage = function(json) {
          var umid = 'umid:' + Math.random() + ':' + TheAnchor.turn.loop;
          logger.logSentRecord(umid);
          if (typeof json === 'object') {
            json.umid = umid;
          }
          return origPostMessage.apply(this, arguments);
        };

        var aelBase = getOwnBase(messenger, 'addEventListener');
        var ael = aelBase.addEventListener;

        aelBase.addEventListener = function(type, callback) {
          var origCallback = callback;
          var ucid;
          function newCallback(event) {
            if (event && event.data && event.data.msg === 'log') {
              // skip logging
            } else {
              var umid = event && event.data && event.data.umid;
              if (umid) {
                logger.logGotRecord(umid);
                delete event.data.umid;
              }
              var umid2 = 'umid:' + Math.random() + ':' + TheAnchor.turn.loop;
              logger.logSentIfRecord(ucid, umid2);
              logger.logGotRecord(umid2);
            }
            return origCallback.apply(this, arguments);
          }
          if (type === 'message' && typeof callback === 'function') {
            ucid = 'ucid:' + Math.random() + ':' + TheAnchor.turn.loop;
            logger.logFulfilledRecord(ucid);
            return ael.call(this, type, newCallback);
          } else {
            return ael.apply(this, arguments);
          }
        };
      },

      turnOff: function() {
      },

      flush: function() {
        var log = logBuffer.join('');
        logBuffer = [];
        return log;
      }
    };

    return logger;
  };
})();
