/*global self, open, setTimeout */
/*jslint indent: 2 */

// Setup the log record output stream.
var sendLog = (function () {
  "use strict";
  var logOrigin = /^https?:$/.test(self.location.protocol) ?
        self.location.protocol + "//" + self.location.host : '*',
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
    sendLog = postLogToWindow;
    buffer.forEach(function (data) {
      postMessageToWindow.call(logRef, data, logOrigin);
    });
    buffer = undefined;
  }, 1000);
  return bufferLog;
}());
