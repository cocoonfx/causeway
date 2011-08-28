// Copyright (C) 2011 Google Inc. under the terms of the MIT X license
// found at http://www.opensource.org/licenses/mit-license.html ...............

var outline;

(function(){
   "use strict";

   function appendNew(parent, tagName) {
     var result = document.createElement(tagName);
     parent.appendChild(result);
     return result;
   }

   function prependNew(parent, tagName) {
     var result = document.createElement(tagName);
     parent.insertBefore(result, parent.firstChild);
     return result;
   }

   function appendText(parent, text) {
     var result = document.createTextNode(text);
     parent.appendChild(result);
     return result;
   }

   var NOFLATE = '[ ] ';
   var INFLATE = '[+] ';
   var DEFLATE = '[-] ';

   function deflate(parent, inflatable) {
     inflatable.inflate = function() {
       inflatable.style.removeProperty('display');
       iconTextNode.data = DEFLATE;
     };
     inflatable.deflate = function() {
       inflatable.style.display = 'none';
       iconTextNode.data = INFLATE;
     };
     var icon = prependNew(parent, 'tt');
     var iconTextNode = appendText(icon, NOFLATE);
     inflatable.style.display = 'none';
     icon.addEventListener('click', function(event) {
       if (iconTextNode.data === DEFLATE) {
         inflatable.deflate();
       } else {
         inflatable.inflate();
       }
     }, false);
     icon.style.cursor = 'pointer';
   }

   outline = function(parent) {
     var result = appendNew(parent, 'blockquote');
     deflate(parent, result);
     return result;
   };

   outline.add = function(parent, text) {
     var p = appendNew(parent, 'p');
     appendText(p, text);
     parent.deflate();
     return outline(p);
   };

})();