self.addEventListener('message', function (msg) {
  self.postMessage('bought');
}, false);
