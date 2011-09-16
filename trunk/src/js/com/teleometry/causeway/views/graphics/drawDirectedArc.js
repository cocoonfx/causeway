// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var drawDirectedArc;
var drawJoin;

(function(){
  "use strict";

  drawJoin = function drawJoin(context, fromPt, toPt) {

    //var isBelow = (toPt.y > fromPt.y) ? true : false;

    context.lineWidth = 1;

    toPt.x -= 3;
    
    // a join is a horizontal line connecting to a vertical line
    // it's drawn with a subtle inset, suggesting a 'channel'
    // at a layer below

    // draw the dark lines
    context.strokeStyle = 'rgba(153, 153, 153, 0.5)';

    context.beginPath();
    context.moveTo(fromPt.x + 0.5, fromPt.y + 0.5);
    context.lineTo(toPt.x + 0.5, fromPt.y + 0.5);
    context.lineTo(toPt.x + 0.5, toPt.y + 0.5);
    context.stroke();

    // draw the white lines
    context.strokeStyle = 'rgb(255, 255, 255)';

    context.beginPath();
    context.moveTo(fromPt.x + 0.5, fromPt.y + 1.5);
    context.lineTo(toPt.x - 0.5, fromPt.y + 1.5);
    context.moveTo(toPt.x + 1.5, fromPt.y + 1.5);
    context.lineTo(toPt.x + 1.5, toPt.y + 0.5);
    context.stroke();
  };

  drawDirectedArc = function drawDirectedArc(context, fromPt, toPt) {
    fromPt.x += 0.5;
    fromPt.y += 0.5;
    toPt.x += 0.5;
    toPt.y += 0.5;

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

    context.lineWidth = 1;
    
    context.strokeStyle = 'rgba(0, 0, 51, 0.5)';

    // joins gray
    //context.strokeStyle = 'rgb(153, 153, 153)';

    // Alexy red
    //context.strokeStyle = 'rgb(178, 34, 34)';

    context.beginPath();
    context.moveTo(fromPt.x, fromPt.y);
    context.bezierCurveTo(fromPt.x, fromPt.y,
                          quarterX, fromPt.y,
                          midX, midY);
    context.bezierCurveTo(threeQuarterX, toPt.y, 
                          toPt.x, toPt.y, 
                          toPt.x, toPt.y);
    context.stroke();
  };
})();