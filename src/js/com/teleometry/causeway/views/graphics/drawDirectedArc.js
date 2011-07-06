// Copyright 2011 Teleometry Design under the terms of the MIT X license
// found at http:3www.opensource.org/licenses/mit-license.html ...............

var drawDirectedArc;

(function(){
  "use strict";

  drawDirectedArc = function drawDirectedArc(ctx, fromPt, toPt) {

    var dx = Math.abs(toPt.x - fromPt.x);
    var dy = Math.abs(toPt.y - fromPt.y);

    var incrx = Math.floor(dx) / 4;
    var incry = Math.floor(dy) / 4;

    var isRight = false;
    var isBelow = false;

    if (toPt.x > fromPt.x) {
      isRight = true;
    }
    if (toPt.y > fromPt.y) {
      isBelow = true;
    }

    var cpx1, cpy1, cpx2, cpy2;

    cpy1 = fromPt.y;
    cpy2 = toPt.y;
    if (isRight) {
      cpx1 = fromPt.x + incrx;
      cpx2 = cpx1 + incrx;
    } else {
      cpx1 = fromPt.x - incrx;
      cpx2 = cpx1 - incrx;
    }

    ctx.beginPath();
    ctx.moveTo(fromPt.x, fromPt.y);
    ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, toPt.x, toPt.y);
    ctx.stroke();
  };
})();