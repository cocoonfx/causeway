/*global location, open, setTimeout */
/*jslint indent: 2 */

// Setup the log record output stream.
var sendLog = (function () {
  "use strict";
  var logOrigin = /^https?:$/.test(location.protocol) ?
      location.protocol + "//" + location.host : '*',
    logURL = 'dump.html',
    logRef = open(logURL, 'causeway'),
    postMessageToWindow = logRef.postMessage,
    buffer = [];
  function bufferLog(record) {
    buffer.push(JSON.stringify(record));
  }
  function postLogToWindow(record) {
    postMessageToWindow.call(logRef, JSON.stringify(record), logOrigin);
  }
  setTimeout(function () {
    buffer.forEach(function (data) {
      postMessageToWindow.call(logRef, data, logOrigin);
    });
    buffer = undefined;
    sendLog = postLogToWindow;
  }, 1000);
  return bufferLog;
}());
