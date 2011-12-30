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

   //var NOFLATE = '[ ] ';
   //var INFLATE = '[+] ';
   //var DEFLATE = '[-] ';

  var NOFLATE = 'images/causalityGrid/no-tip.gif';
  var INFLATE = 'images/causalityGrid/tip-right.gif';
  var DEFLATE = 'images/causalityGrid/tip-down.gif';

   function deflate(parent, inflatable) {

     var icon = prependNew(parent, 'img');
     icon.src = NOFLATE;
     icon.style.verticalAlign = 'text-top';

     inflatable.style.display = 'none';
     icon.addEventListener('click', function(event) {
       if (icon.src === DEFLATE) {
         inflatable.deflate();
       } else {
         inflatable.inflate();
       }
     }, false);
     icon.style.cursor = 'pointer';

     // Inflatable methods and properties.

     inflatable.inflate = function() {
       inflatable.style.removeProperty('display');
       icon.src = inflatable.firstChild ? DEFLATE : NOFLATE;
     };

     inflatable.deflate = function() {
       inflatable.style.display = 'none';
       icon.src = inflatable.firstChild ? INFLATE : NOFLATE;
     };

     inflatable.isInflatable = true;

     inflatable.getInflatableParent = function() {
       var parent = inflatable.parentNode;
       while (parent) {
         if (parent.isInflatable) { return parent; }
         parent = parent.parentNode;
       }
       return null;
     };

     inflatable.getInflatableAncestors = function() {
       var ancestors = [];
       var ancestor = inflatable.getInflatableParent();
       while (ancestor) {
         ancestors.push(ancestor);
         ancestor = ancestor.getInflatableParent();
       }
       return ancestors;
     };

     inflatable.getInflatableChildren = function() {
       var inflatableChildren = [];
       function addInflatableChildren(node) {
         var children = node.childNodes;
         for (var i = 0, len = children.length; i < len; i++) {
           var child = children[i];
           if (child.isInflatable) {
             inflatableChildren.push(child);
           } else {
             addInflatableChildren(child);
           }
         }
       }
       addInflatableChildren(inflatable);
       return inflatableChildren;
     };

     /**
      * My inflatable siblings are the inflatable children of my
      * inflatable parent other than me. Note that if I have no
      * inflatable parent, then I have no inflatable siblings by this
      * definition, even if I do have DOM-tree siblings that happen to
      * be inflatable.
      */
     inflatable.getInflatableSiblings = function() {
       var parent = inflatable.getInflatableParent();
       if (!parent) { return []; }
       var litter = parent.getInflatableChildren();
       return litter.filter(function(sib) { return sib !== inflatable; });
     };

     inflatable.getInflatableDescendants = function() {
       var descendants = [];
       function addInflatableDescendants(node) {
         var children = node.getInflatableChildren();
         children.forEach(function(child) {
           descendants.push(child);
           addInflatableDescendants(child);
         });
       }
       addInflatableDescendants(inflatable);
       return descendants;
     };
   }

////////////////////////

  outline = function(parent) {
    var result = appendNew(parent, 'blockquote');
    deflate(parent, result);
    return result;
   };

   outline.add = function(parent, text) {
     var p = appendNew(parent, 'p');
     var span = appendNew(p, 'span');
     appendText(span, text);
     parent.deflate();
     return outline(p);
   };

})();