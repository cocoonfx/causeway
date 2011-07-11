// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var drawDirectedArc;

(function(){
  "use strict";

  drawDirectedArc = function drawDirectedArc(context, fromPt, toPt) {

    var isRight = (toPt.x > fromPt.x) ? true : false;
    var isBelow = (toPt.y > fromPt.y) ? true : false;

    var distX = Math.abs(toPt.x - fromPt.x);
    var distY = Math.abs(toPt.y - fromPt.y);

    var quarterX = (isRight) ? 
      (fromPt.x + Math.floor(distX /4)) :
      (fromPt.x - Math.floor(distX /4));

    var midX = (isRight) ? 
      (fromPt.x + Math.floor(distX /2)) :
      (fromPt.x - Math.floor(distX /2));

    var threeQuarterX = (isRight) ? 
      (fromPt.x + Math.floor(distX *3/4)) :
      (fromPt.x - Math.floor(distX *3/4));

    var midY = (isBelow) ?
      (fromPt.y + Math.floor(distY /2)) :
      (fromPt.y - Math.floor(distY /2));

    context.beginPath();
    context.moveTo(fromPt.x, fromPt.y);
    context.bezierCurveTo(fromPt.x, fromPt.y,
                          quarterX, fromPt.y,
                          midX, midY);
    context.bezierCurveTo(threeQuarterX, toPt.y, 
                          toPt.x -5, toPt.y, 
                          toPt.x -5, toPt.y);
    context.stroke();

    // draw 5x3 arrow tip (points right)
    var x = toPt.x;
    var y = toPt.y;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x -5, y -3);
    context.lineTo(x -5, y +3);
    context.closePath();
    context.fill();
  };
})();