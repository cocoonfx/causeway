/*global console, self, sendLog, MessagePort, Node, Worker, XMLHttpRequest*/
/*jslint indent: 2 */
(function () {
  "not strict"; // Can't use strict mode when overriding read-only built-ins

  function iterate(list, predicate) {
    var i = 0, end = list.length, found;
    for (; i < end && undefined === found; i += 1) {
      found = predicate(list[i], i);
    }
    return found;
  }
  function contains(map, name) {
    return Object.prototype.hasOwnProperty.call(map, name);
  }
  function list(map, predicate) {
    var name;
    for (name in map) {
      if (Object.prototype.hasOwnProperty.call(map, name)) {
        predicate(name);
      }
    }
  }
  function declarer(type, name) {
    while (type && !contains(type, name)) {
      type = Object.getPrototypeOf(type);
    }
    return type;
  }
  Error.prepareStackTrace = function (e, stack) { return stack; };
  function trace(stack) {
    var calls = [];
    iterate(stack, function (frame) {
      if ('stack_bottom' === frame.getFunctionName()) { return null; }
      calls.push({
        name: frame.getFunctionName() ||
              (frame.getTypeName() + '.' + (frame.getMethodName() || '')),
        source: frame.getFileName(),
        span: [ [ frame.getLineNumber(), frame.getColumnNumber() ] ]
      });
    });
    return {
      calls: calls
    };
  }
  function traceHere(upto) {
    var e = {};
    Error.captureStackTrace(e, upto);
    return trace(e.stack);
  }

  var vat = (function () {
      var loop = Math.floor(Math.random() * Math.pow(2, 53)),
        turns = 0,
        messages = 0,
        conditions = 0;
      return {
        message: function () {
          messages += 1;
          return loop + '!' + messages;
        },
        condition: function () {
          conditions += 1;
          return loop + '@' + conditions;
        },
        got: function (message, trace) {
          turns += 1;
          var anchor = {
            number: 1,
            turn: {
              loop: loop,
              number: turns
            }
          };
          sendLog({
            'class': [ 'org.ref_send.log.Got', 'org.ref_send.log.Event' ],
            anchor: anchor,
            timestamp: Date.now(),
            message: message,
            trace: trace
          });
          anchor.number += 1;
          return {
            done: function () {
              sendLog({
                'class': [ 'org.ref_send.log.Done', 'org.ref_send.log.Event' ],
                anchor: anchor,
                timestamp: Date.now()
              });
              anchor.number += 1;
            },
            comment: function (classes, text, trace) {
              sendLog({
                'class': classes,
                anchor: anchor,
                timestamp: Date.now(),
                trace: trace,
                text: text
              });
              anchor.number += 1;
            },
            problem: function (text, reason, trace) {
              sendLog({
                'class': [ 'org.ref_send.log.Problem',
                           'org.ref_send.log.Comment',
                           'org.ref_send.log.Event' ],
                anchor: anchor,
                timestamp: Date.now(),
                trace: trace,
                text: text,
                reason: reason
              });
              anchor.number += 1;
            },
            sent: function (message, trace) {
              sendLog({
                'class': [ 'org.ref_send.log.Sent',
                           'org.ref_send.log.Event' ],
                anchor: anchor,
                timestamp: Date.now(),
                trace: trace,
                message: message
              });
              anchor.number += 1;
            },
            sentIf: function (message, condition, trace) {
              sendLog({
                'class': [ 'org.ref_send.log.SentIf',
                           'org.ref_send.log.Sent',
                           'org.ref_send.log.Event' ],
                anchor: anchor,
                timestamp: Date.now(),
                trace: trace,
                message: message,
                condition: condition
              });
              anchor.number += 1;
            },
            fulfilled: function (condition, trace) {
              sendLog({
                'class': [ 'org.ref_send.log.Fulfilled',
                           'org.ref_send.log.Resolved',
                           'org.ref_send.log.Event' ],
                anchor: anchor,
                timestamp: Date.now(),
                trace: trace,
                condition: condition
              });
              anchor.number += 1;
            }
          };
        }
      };
    }()),
    turn = vat.got(vat.message());        // TODO: coordinate message id with
                                          // page that caused load

  // Hook Console API.
  (function () {
    function override(name, classes) {
      var type = declarer(console, name) || console,
        log = type[name];
      classes.push('org.ref_send.log.Comment');
      classes.push('org.ref_send.log.Event');
      type[name] = function logComment(text) {
        // TODO: apply argument formatting
        turn.comment(classes, text, traceHere(logComment));
        if (log) {
          return log.apply(this, arguments);
        }
      };
    }
    override('log',             [ ]);
    override('debug',           [ 'org.ref_send.log.Debug' ]);
    override('info',            [ 'org.ref_send.log.Info' ]);
    override('warn',            [ 'org.ref_send.log.Warn' ]);
    override('error',           [ 'org.ref_send.log.Error' ]);
    override('time',            [ 'org.ref_send.log.StartTimer' ]);
    override('timeEnd',         [ 'org.ref_send.log.StopTimer' ]);
    override('group',           [ 'org.ref_send.log.StartGroup' ]);
    override('groupCollapsed',  [ 'org.ref_send.log.StartGroupCollapsed',
                                  'org.ref_send.log.StartGroup' ]);
    override('groupEnd',        [ 'org.ref_send.log.StopGroup' ]);

    var Console = declarer(console, 'exception') || console,
      exception = Console.exception;
    Console.exception = function logProblem(e) {
      var reason = {
        'class': [ e.constructor.name ]
      };
      list(e, function (name) {
        if ("message" !== name && "stack" !== name) {
          reason[name] = e[name];
        }
      });
      turn.problem(e.message, reason, trace(e.stack));
      if (exception) {
        return exception.apply(this, arguments);
      }
    };
  }());

  // Hook setTimeout().
  (function () {
    var type = declarer(self, 'setTimeout'),
      setTimeout = type.setTimeout;
    type.setTimeout = function logTimeout(arg_0) {
      var listener = arg_0,
        timeout = vat.message(),
        setTrace = traceHere(logTimeout);
      turn.sent(timeout, setTrace);
      setTrace.calls = setTrace.calls.slice(0, 1);
      arg_0 = function stack_bottom() {
        turn = vat.got(timeout, setTrace);  // TODO: Use listener location
                                            // instead of setTimeout trace.
        var problem;
        try {
          if ('function' === typeof listener) {
            listener.apply(this, arguments);
          } else {
            eval(listener);     // use of eval required to override setTimeout
          }
        } catch (e) {
          problem = e;
          console.exception(e);
        }
        turn.done();
        if (problem) {
          throw problem;
        }
      };
      return setTimeout.apply(this, arguments);
    };
  }());

  // Hook setInterval().
  (function () {
    var type = declarer(self, 'setInterval'),
      setInterval = type.setInterval;
    type.setInterval = function logInterval(arg_0) {
      var listener = arg_0,
        listenerId = vat.condition(),
        setTrace = traceHere(logInterval);
      turn.fulfilled(listenerId, setTrace);
      setTrace.calls = setTrace.calls.slice(0, 1);
      arg_0 = function stack_bottom() {
        var interval = vat.message(),
          problem;
        turn = vat.got(interval, setTrace);  // TODO: Use listener location
                                             // instead of setInterval trace.
        turn.sentIf(interval, listenerId, setTrace);
        try {
          if ('function' === typeof listener) {
            listener.apply(this, arguments);
          } else {
            eval(listener);     // use of eval required to override setInterval
          }
        } catch (e) {
          problem = e;
          console.exception(e);
        }
        turn.done();
        if (problem) {
          throw problem;
        }
      };
      return setInterval.apply(this, arguments);
    };
  }());

  // Hook addEventListener().
  (function () {
    function wrapListener(listener, addListenerTrace) {
      var listenerId = vat.condition();
      turn.fulfilled(listenerId, addListenerTrace);
      addListenerTrace.calls = addListenerTrace.calls.slice(0, 1);
      return function stack_bottom(msg) {
        if (!contains(msg, '---stitching-turn')) {
          msg['---stitching-turn'] = vat.got((function () {
            var message;
            if (msg.data && contains(msg.data, '---event-id')) {
              message = msg.data['---event-id'];
              if (contains(msg.data, '=')) {
                msg.data = msg.data['='];
              } else {
                delete msg.data['---event-id'];
              }
            } else {
              message = vat.message();
            }
            return message;
          }()));
        }

        // Add a SentIf for this listener invocation to the stitching turn.
        var stitch = vat.message(),
          problem;
        msg['---stitching-turn'].sentIf(stitch, listenerId);
        turn = vat.got(stitch, addListenerTrace); // TODO: Use listener location
                                                  // instead of addListener call
        try {
          listener.apply(this, arguments);
        } catch (e) {
          problem = e;
          console.exception(e);
        }
        turn.done();
        if (problem) {
          throw problem;
        }
      };
    }
    function override(type) {
      type = declarer(type, 'addEventListener');
      var addEventListener = type.addEventListener;
      type.addEventListener = function logListener(arg_0, arg_1) {
        if (arg_1) {
          arg_1 = wrapListener(arg_1, traceHere(logListener));
        }
        return addEventListener.apply(this, arguments);
      };
    }
    override(self);
    override(XMLHttpRequest.prototype);
    override(MessagePort.prototype);
    override(Worker.prototype);
    override(Node.prototype);
  }());

  // Hook postMessage().
  (function () {
    function override(type) {
      type = declarer(type, 'postMessage');
      var postMessage = type.postMessage;
      type.postMessage = function logPost(arg_0) {
        var post = vat.message();
        turn.sent(post, traceHere(logPost));
        if ('object' === typeof arg_0) {
          arg_0['---event-id'] = post;
        } else {
          arg_0 = {
            '---event-id': post,
            '=': arg_0
          };
        }
        return postMessage.apply(this, arguments);
      };
    }
    override(self);
    override(MessagePort.prototype);
    override(Worker.prototype);
  }());

  // Hook dispatchEvent().
  (function () {
    function override(type) {
      type = declarer(type, 'dispatchEvent');
      var dispatchEvent = type.dispatchEvent;
      type.dispatchEvent = function logDispatch(arg_0) {
        var dispatch = vat.message(),
          stitch = vat.message(),
          trace = traceHere(logDispatch),
          problem,
          answer;
        turn.sent(dispatch, trace);
        turn.sent(stitch, trace);
        turn.done();
        trace.calls = trace.calls.slice(0, 1);
        if ('object' === typeof arg_0.data) {
          arg_0.data['---event-id'] = dispatch;
        } else {
          arg_0.data = {
            '---event-id': dispatch,
            '=': arg_0.data
          };
        }
        try {
          answer = dispatchEvent.apply(this, arguments);
        } catch (e) {
          problem = e;
        }
        turn = vat.got(stitch, trace);
        if (problem) {
          throw problem;
        }
        return answer;
      };
    }
    override(self);
    override(Node.prototype);
  }());
}());
