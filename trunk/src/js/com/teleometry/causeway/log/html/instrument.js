/*global self, sendLog, MessagePort, Node, Worker, XMLHttpRequest*/
/*jslint indent: 2 */
(function () {
  "use strict";

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
        source: /^[^?#]*/.exec(frame.getFileName())[0], // ^ OK on URL
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
      var loop = 'L' + Math.floor(Math.random() * Math.pow(2, 53)),
        turns = 0,
        messages = 0,
        conditions = 0;
      return {
        loop: loop,
        message: function () {
          messages += 1;
          return loop + '-M' + messages;
        },
        condition: function () {
          conditions += 1;
          return loop + '-C' + conditions;
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
    turn;

  // Hook Console API.
  (function () {
    if (!self.console) {
      self.console = {};
    }
    function override(name, classes) {
      var type = declarer(self.console, name) || self.console,
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

    var Console = declarer(self.console, 'exception') || self.console,
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
    type.setTimeout = function logTimeout(listener) {
      var argv = Array.prototype.slice.call(arguments),
        timeout = vat.message(),
        setTrace = traceHere(logTimeout);
      turn.sent(timeout, setTrace);

      // TODO: Use listener source position instead of setTimeout trace.
      setTrace.calls = setTrace.calls.slice(0, 1);
      if (setTrace.calls.length > 0) {
        setTrace.calls[0].span[0][1] += 'setTimeout('.length;
      }
      argv[0] = function stack_bottom() {
        turn = vat.got(timeout, setTrace);
        var problem;
        try {
          if ('function' === typeof listener) {
            listener.apply(this, arguments);
          } else {
            eval(listener);     // use of eval required to override setTimeout
          }
        } catch (e) {
          problem = e;
          self.console.exception(e);
        }
        turn.done();
        if (problem) {
          throw problem;
        }
      };
      return setTimeout.apply(this, argv);
    };
  }());

  // Hook setInterval().
  (function () {
    var type = declarer(self, 'setInterval'),
      setInterval = type.setInterval;
    type.setInterval = function logInterval(listener) {
      var argv = Array.prototype.slice.call(arguments),
        listenerId = vat.condition(),
        setTrace = traceHere(logInterval);
      turn.fulfilled(listenerId, setTrace);

      // TODO: Use listener source position instead of setInterval trace.
      setTrace.calls = setTrace.calls.slice(0, 1);
      if (setTrace.calls.length > 0) {
        setTrace.calls[0].span[0][1] += 'setInterval('.length;
      }
      argv[0] = function stack_bottom() {
        var interval = vat.message(),
          problem;
        turn = vat.got(vat.message());
        turn.sentIf(interval, listenerId);
        turn.done();
        turn = vat.got(interval, setTrace);
        try {
          if ('function' === typeof listener) {
            listener.apply(this, arguments);
          } else {
            eval(listener);     // use of eval required to override setInterval
          }
        } catch (e) {
          problem = e;
          self.console.exception(e);
        }
        turn.done();
        if (problem) {
          throw problem;
        }
      };
      return setInterval.apply(this, argv);
    };
  }());

  // Hook dispatchEvent().
  (function () {
    function override(type) {
      type = declarer(type, 'dispatchEvent');
      var dispatchEvent = type.dispatchEvent;
      type.dispatchEvent = function logDispatch(msg) {
        var dispatch = vat.message(),
          stitch = vat.message(),
          trace = traceHere(logDispatch),
          problem,
          answer;
        turn.sent(dispatch, trace);
        turn.sent(stitch, trace);
        turn.done();

        // The continuation trace starts on the first line after the call to
        // dispatchEvent(), but with no column number.
        trace.calls = trace.calls.slice(0, 1);
        if (trace.calls.length > 0) {
          trace.calls[0].span[0][0] += 1;
          trace.calls[0].span[0].pop();
        }

        if ('object' === typeof msg.data) {
          msg.data['---event-id'] = dispatch;
        } else {
          msg.data = {
            '---event-id': dispatch,
            '---event-data': msg.data
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

  // Hook addEventListener().
  (function () {

    // Hook postMessage().
    function overridePostMessage(type) {
      var postMessage = type.postMessage;
      type.postMessage = function logPost(data) {
        var argv = Array.prototype.slice.call(arguments),
          post = vat.message();
        turn.sent(post, traceHere(logPost));
        if ('object' === typeof data) {
          data['---event-id'] = post;
        } else {
          data = argv[0] = {
            '---event-id': post,
            '---event-data': data
          };
        }
        return postMessage.apply(this, argv);
      };
    }
    function subclassWindow(base) {
      function ShadowReadOnlyPostMessage() {}
      ShadowReadOnlyPostMessage.prototype = base;
      var sub = new ShadowReadOnlyPostMessage();
      overridePostMessage(sub);
      return sub;
    }
    overridePostMessage(declarer(MessagePort.prototype, 'postMessage'));
    overridePostMessage(declarer(Worker.prototype, 'postMessage'));
    (function () {
      // Watch for new frames to override their postMessage function.
      var addEventListener = Node.prototype.addEventListener;
      self.addEventListener('DOMNodeInserted', function (msg) {
        if ('IFRAME' === msg.target.tagName) {
          addEventListener.call(msg.target, 'load', function (msg) {
            var sub = subclassWindow(msg.target.contentWindow);
            delete msg.target.contentWindow;  // Delete to enable overwrite.
            msg.target.contentWindow = sub;
          }, false);
        }
      }, false);
    }());

    function wrapListener(listener, addListenerTrace) {
      var listenerId = vat.condition();
      turn.fulfilled(listenerId, addListenerTrace);

      // TODO: Use listener source position instead of addListener trace
      addListenerTrace.calls = addListenerTrace.calls.slice(0, 1);
      if (addListenerTrace.calls.length > 0) {
        addListenerTrace.calls[0].span[0][1] += 'addEventListener('.length;
      }
      return function stack_bottom(msg) {
        if (!contains(msg, '---stitching-turn')) {
          msg['---stitching-turn'] = vat.got((function () {
            var message;
            if (msg.data && contains(msg.data, '---event-id')) {
              message = msg.data['---event-id'];
              delete msg.data['---event-id'];
            } else {
              message = vat.message();
            }
            return message;
          }()));
        }

        // Add a SentIf for this listener invocation to the stitching turn.
        var argv = Array.prototype.slice.call(arguments),
          stitch = vat.message(),
          problem;
        msg['---stitching-turn'].sentIf(stitch, listenerId);
        turn = vat.got(stitch, addListenerTrace);
        try {
          if (msg.source) {
            (function () {
              var sub = subclassWindow(msg.source);
              delete msg.source;  // Delete to enable overwrite.
              msg.source = sub;
            }());
          }
          if (msg.data && contains(msg.data, '---event-data')) {
            msg = argv[0] = (function () {
              function ShadowReadOnlyEventData() {
                this.data = msg.data['---event-data'];
              }
              ShadowReadOnlyEventData.prototype = msg;
              return new ShadowReadOnlyEventData();
            }());
          }
          listener.apply(this, argv);
        } catch (e) {
          problem = e;
          self.console.exception(e);
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
      type.addEventListener = function logListener() {
        var argv = Array.prototype.slice.call(arguments);
        if (argv[1]) {
          argv[1] = wrapListener(argv[1], traceHere(logListener));
        }
        return addEventListener.apply(this, argv);
      };
    }
    override(self);
    override(XMLHttpRequest.prototype);
    override(MessagePort.prototype);
    override(Worker.prototype);
    override(Node.prototype);
  }());

  // Hook page load
  // TODO: coordinate message id with page that caused navigation
  turn = vat.got(vat.message(), {
    calls: [ {
      name: 'load',
      source: /^[^?#]*/.exec(self.location.href)[0],  // ^ OK on URL
      span: [ [ 1, 1 ] ]
    } ]
  });
}());
