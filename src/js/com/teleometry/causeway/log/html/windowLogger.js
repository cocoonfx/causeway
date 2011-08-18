// Setup the log record output stream.
var sendLog = (function () {
  var logOrigin = /^https?:$/.test(window.location.protocol) ?
        window.location.protocol + "//" + window.location.host : '*',
      logURL = 'dump.html',
      logRef = window.open(logURL, 'causeway'),
      postMessageToWindow = logRef.postMessage,
      buffer = [];
  function bufferLog(record) {
    buffer.push(JSON.stringify(record));
  }
  function postLogToWindow(record) {
    postMessageToWindow.call(logRef, JSON.stringify(record), logOrigin);
  }
  window.setTimeout(function () {
    for (var i = 0; i !== buffer.length; i += 1) {
      postMessageToWindow.call(logRef, buffer[i], logOrigin);
    }
    buffer = undefined;
    sendLog = postLogToWindow;
  }, 1000);
  return bufferLog;
}());
