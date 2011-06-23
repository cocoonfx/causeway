// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

/**
 * This function is an asynchronous adaptation of the conjunctive and operator,
 * familiar from seqential programming. It reports true to its callback
 * function only if every expected answer is true. It promptly reports false
 * if an expected answer is false, thus short-circuiting the logic.
 *
 * If expected is zero, it reports true and returns an object that ignores
 * subsequent answers.
 */
 
 function asyncAnd(expected, tellAreAllTrue, send) {
   "use strict";
   
   if (expected === 0) {
     send(tellAreAllTrue, 'run', [true]);
     return {run: function(answer) {}};
   }
   
   var teller = {
     run: function(answer) {
       if (answer) {
         expected--;
         if (expected === 0) {
           if (tellAreAllTrue) {
             send(tellAreAllTrue, 'run', [true]);
             tellAreAllTrue = null;
           }
         }
       } else {
         if (tellAreAllTrue) {
           send(tellAreAllTrue, 'run', [false]);
           tellAreAllTrue = null;
         }
       }
     }
   };
   return teller;
 }
 