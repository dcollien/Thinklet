var App, Compiler, ControlNode, Curve, CurveNode, DisectionNode, canvas, ctx, flattenBy, nodeColors, run,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

App = (function(_super) {

  __extends(App, _super);

  function App() {
    var i, numCurves;
    App.__super__.constructor.call(this);
    this.scrollBox = $('.centerbox');
    this.gridSize = 8;
    this.barLength = 256;
    this.curveHeight = 256;
    this.curveSpacing = 32;
    numCurves = 6;
    this.width = 800;
    this.height = this.curveSpacing + numCurves * (this.curveSpacing + this.curveHeight);
    canvas.height = this.height;
    canvas.width = this.width;
    this.pan = v(0, 0);
    this.panSpeed = 3.0;
    this.zoom = 1.0;
    this.curves = [];
    this.maxPanX = 64;
    for (i = 0; 0 <= numCurves ? i <= numCurves : i >= numCurves; 0 <= numCurves ? i++ : i--) {
      this.curves.push(new Curve(this.curveSpacing + i * (this.curveSpacing + this.curveHeight)));
    }
    this.dragNode = null;
    this.dragControl = null;
    this.pushDrag = null;
    this.pushStart = null;
    this.pushMode = false;
    this.disectionNode = new DisectionNode();
  }

  App.prototype.updateDragging = function(dt) {
    var curve, diff, globalY, mouse, _i, _len, _ref;
    if (this.pushDrag) {
      mouse = v.sub(core.canvasMouse(), this.pan);
      diff = v.sub(mouse, this.pushDrag);
      this.pushDrag = mouse;
      _ref = this.curves;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        curve = _ref[_i];
        if (core.input.down('precision')) {
          curve.stretch(mouse.x, diff.x);
        } else if (mouse.y > curve.topOffset && mouse.y < curve.topOffset + curve.height) {
          curve.stretch(mouse.x, diff.x);
          break;
        }
      }
      return this.invalidate();
    } else if (this.dragPan) {
      mouse = core.canvasMouse();
      diff = v.sub(mouse, this.dragPan);
      this.pan = v.add(diff, this.pan);
      globalY = core.screenMouse().y;
      this.scrollBox.scrollTop(this.scrollBox.scrollTop() - (globalY - this.scrollStart));
      this.scrollStart = globalY;
      this.pan.y = 0;
      if (this.pan.x > this.maxPanX) this.pan.x = this.maxPanX;
      this.dragPan = v(mouse);
      return this.invalidate();
    } else if (this.dragNode) {
      mouse = v.sub(core.canvasMouse(), this.pan);
      this.disectionNode.coord = null;
      this.dragNode.moveTo(mouse);
      return this.invalidate();
    } else if (this.dragControl) {
      mouse = v.sub(core.canvasMouse(), this.pan);
      this.disectionNode.coord = null;
      this.dragControl.moveTo(mouse);
      if (this.dragControl.parentNode.style === 'smooth' || this.dragControl.parentNode.style === 'symmetric') {
        this.dragControl.smooth();
      }
      return this.invalidate();
    }
  };

  App.prototype.resetDrag = function() {
    if (this.dragNode) this.dragNode.isSelected = false;
    if (this.dragControl) this.dragControl.isSelected = false;
    this.dragNode = null;
    this.dragControl = null;
    this.dragPan = null;
    this.pushDrag = null;
    this.pushStart = null;
    return this.scrollStart = null;
  };

  App.prototype.createNode = function() {
    var coord, curve, _i, _len, _ref, _results;
    if (!this.disectionNode.coord) return;
    coord = v(this.disectionNode.coord);
    _ref = this.curves;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      curve = _ref[_i];
      if (coord.y > curve.topOffset && coord.y < curve.topOffset + curve.height) {
        this.dragNode = curve.disectAt(coord);
        break;
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  App.prototype.update = function(dt) {
    var $canvas, curve, menu, menuPos, mouse, node, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
    mouse = v.sub(core.canvasMouse(), this.pan);
    if (core.input.pressed('push')) {
      $canvas = $(canvas);
      $canvas.css('cursor', 'ew-resize');
      this.pushMode = true;
    } else if (core.input.released('push')) {
      $(canvas).css('cursor', 'auto');
      this.pushMode = false;
    }
    if (!core.input.down('push')) this.prevPushCursor = null;
    if (core.input.pressed('precision')) {
      $canvas = $(canvas);
      $canvas.css('cursor', 'crosshair');
    } else if (core.input.released('precision')) {
      $(canvas).css('cursor', 'auto');
    }
    _ref = this.curves;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      curve = _ref[_i];
      if (mouse.y > curve.topOffset && mouse.y < curve.topOffset + curve.height) {
        this.disectionNode.move(mouse.x, curve.firstNode);
        if (this.lastMouse && this.disectionNode.coord && !v.eq(mouse, this.lastMouse)) {
          this.invalidate();
        }
      }
    }
    if (core.input.down('debug')) {
      this.debug = true;
      this.invalidate();
    }
    if (core.input.released('debug')) {
      this.debug = false;
      this.invalidate();
    }
    if (core.input.down('pan-left')) {
      this.pan.x -= this.panSpeed;
      this.invalidate();
    } else if (core.input.down('pan-right')) {
      this.pan.x += this.panSpeed;
      if (this.pan.x > this.maxPanX) this.pan.x = this.maxPanX;
      this.invalidate();
    }
    if (core.input.down('pan-up')) {
      this.scrollBox.scrollTop(this.scrollBox.scrollTop() - this.panSpeed);
    } else if (core.input.down('pan-down')) {
      this.scrollBox.scrollTop(this.scrollBox.scrollTop() + this.panSpeed);
    }
    if (core.input.pressed('left-mouse')) {
      $('.context-menu').fadeOut('fast');
      this.resetDrag();
      if (core.input.down('push')) {
        this.pushDrag = mouse;
        this.pushStart = mouse;
      } else if (core.input.down('precision')) {
        this.createNode();
      } else {
        _ref2 = this.curves;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          curve = _ref2[_j];
          this.dragNode = curve.nodeAtMouse(this.pan);
          if (this.dragNode) {
            this.dragNode.isSelected = true;
            break;
          }
          this.dragControl = curve.controlAtMouse(this.pan);
          if (this.dragControl) {
            this.dragControl.isSelected = true;
            break;
          }
        }
        if (!this.dragNode && !this.dragControl) {
          if (this.disectionNode.isUnderMouse(this.pan)) {
            this.createNode();
          } else {
            this.dragPan = v(core.canvasMouse());
            this.scrollStart = core.screenMouse().y;
          }
        }
      }
    }
    if (core.input.released('left-mouse')) this.resetDrag();
    if (core.input.pressed('right-mouse')) {
      _ref3 = this.curves;
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        curve = _ref3[_k];
        node = curve.nodeAtMouse(this.pan);
        if (node) break;
      }
      if (node) {
        menuPos = v.add(core.toGlobal(node), this.pan);
        menu = $('.context-menu');
        menu.data({
          node: node
        });
        menu.fadeIn('fast');
        menu.offset({
          top: menuPos.y,
          left: menuPos.x
        });
      }
    }
    this.updateDragging(dt);
    return this.lastMouse = mouse;
  };

  App.prototype.drawGrid = function() {
    var col, gridSize, maxCol, maxRow, maxX, maxY, minCol, minRow, minX, minY, row, x, y, _results;
    gridSize = this.gridSize;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(50,50,50)";
    minRow = -1;
    maxRow = 1 + Math.floor(this.height / gridSize);
    minCol = -1;
    maxCol = 1 + Math.floor(this.width / gridSize);
    for (row = minRow; minRow <= maxRow ? row <= maxRow : row >= maxRow; minRow <= maxRow ? row++ : row--) {
      minX = (minCol * gridSize) + this.pan.x % gridSize;
      maxX = (maxCol * gridSize) + this.pan.x % gridSize;
      y = row * gridSize + this.pan.y % gridSize;
      ctx.beginPath();
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
      ctx.stroke();
    }
    _results = [];
    for (col = minCol; minCol <= maxCol ? col <= maxCol : col >= maxCol; minCol <= maxCol ? col++ : col--) {
      minY = (minRow * gridSize) + this.pan.y % gridSize;
      maxY = (maxRow * gridSize) + this.pan.y % gridSize;
      x = col * gridSize + this.pan.x % gridSize;
      ctx.beginPath();
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
      _results.push(ctx.stroke());
    }
    return _results;
  };

  App.prototype.drawBackground = function() {
    ctx.fillStyle = "rgb(30,30,30)";
    return ctx.fillRect(0, 0, this.width, this.height);
  };

  App.prototype.draw = function() {
    var bar, currY, curve, line, point, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _m, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
    App.__super__.draw.call(this);
    this.drawBackground();
    this.drawGrid();
    ctx.save();
    ctx.translate(0, this.pan.y);
    ctx.strokeStyle = "rgb(192,192,192)";
    currY = 0;
    _ref = this.curves;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      curve = _ref[_i];
      ctx.fillStyle = "rgb(0,0,0)";
      ctx.fillRect(0, curve.topOffset - this.curveSpacing, this.width, this.curveSpacing);
      ctx.beginPath();
      ctx.moveTo(0, curve.topOffset);
      ctx.lineTo(this.width, curve.topOffset);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, curve.topOffset + curve.height);
      ctx.lineTo(this.width, curve.topOffset + curve.height);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.translate(this.pan.x, 0);
    for (bar = -4, _ref2 = 4 * this.width / this.barLength; -4 <= _ref2 ? bar < _ref2 : bar > _ref2; -4 <= _ref2 ? bar++ : bar--) {
      if (bar % 4 === 0) {
        ctx.strokeStyle = "rgb(192,192,192)";
      } else if (bar % 2 === 0) {
        ctx.strokeStyle = "rgb(128,128,128)";
      } else {
        ctx.strokeStyle = "rgb(64,64,64)";
      }
      ctx.beginPath();
      ctx.moveTo(bar * this.barLength / 4 - (Math.floor(this.pan.x / this.barLength)) * this.barLength, 0);
      ctx.lineTo(bar * this.barLength / 4 - (Math.floor(this.pan.x / this.barLength)) * this.barLength, this.height);
      ctx.stroke();
    }
    ctx.restore();
    if (this.pushMode) {
      point = core.canvasMouse();
      ctx.strokeStyle = "rgb(224,224,224)";
      ctx.fillStyle = "rgba(224,224,224,0.06)";
      if (this.pushStart) {
        ctx.beginPath();
        ctx.fillRect(this.width, 0, point.x - this.width, this.height);
      }
      ctx.beginPath();
      ctx.moveTo(point.x, 0);
      ctx.lineTo(point.x, this.height);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(this.pan.x, this.pan.y);
    _ref3 = this.curves;
    for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
      curve = _ref3[_j];
      curve.drawSegments();
    }
    this.disectionNode.draw();
    if (!this.debug) {
      _ref4 = this.curves;
      for (_k = 0, _len3 = _ref4.length; _k < _len3; _k++) {
        curve = _ref4[_k];
        curve.drawNodes();
      }
    }
    if (this.debug) {
      _ref5 = this.curves;
      for (_l = 0, _len4 = _ref5.length; _l < _len4; _l++) {
        curve = _ref5[_l];
        _ref6 = curve.flatten(flattenBy);
        for (_m = 0, _len5 = _ref6.length; _m < _len5; _m++) {
          line = _ref6[_m];
          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgb(255,255,255)";
          ctx.beginPath();
          ctx.moveTo(line[0].x, line[0].y);
          ctx.lineTo(line[1].x, line[1].y);
          ctx.stroke();
          ctx.fillStyle = "rgb(255,255,255)";
          ctx.beginPath();
          ctx.arc(line[0].x, line[0].y, 3, 0, TAU);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(line[1].x, line[1].y, 3, 0, TAU);
          ctx.fill();
        }
      }
    }
    return ctx.restore();
  };

  return App;

})(core.App);

Compiler = (function() {

  function Compiler() {
    this.maxValue = 255;
    this.threshold = 4;
    this.gamma = 2.5;
    this.gammaTableSize = 64;
  }

  Compiler.prototype.makeGammaTable = function() {
    var i, _ref, _results;
    this.gammaTable = [];
    _results = [];
    for (i = 0, _ref = this.gammaTableSize; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
      _results.push(this.gammaTable.push(Math.floor((Math.pow(i / (this.gammaTableSize - 1), this.gamma)) * this.maxValue)));
    }
    return _results;
  };

  Compiler.prototype.generatePrelude = function() {
    return '#include <avr/io.h>\n#include <util/delay.h>';
  };

  Compiler.prototype.generatePostlude = function() {
    return 'int main( void ) {\n	DDRB = 1;\n	PORTB = 0;\n	\n	// TODO: set up interrupts\n	// and write code\n	\n	return 0;\n}';
  };

  Compiler.prototype.generateGammaTableCode = function() {
    var outputCode;
    outputCode = 'uint8_t gamma[' + this.gammaTableSize + '] = {\n';
    outputCode += this.gammaTable.join(',\n');
    outputCode += '\n};\n';
    return outputCode;
  };

  Compiler.prototype.generatePathCode = function() {
    var coordCode, outputCode, path, pathCode, pathID, _i, _len, _ref;
    outputCode = 'typedef struct {\n	// 256 = 1 second\n	uint16_t t;\n	\n	// 255 = 100%\n	uint8_t dutyCycle;\n} pwmKeyframe_t;';
    coordCode = function(coord) {
      return '{' + (Math.floor(coord.x)) + ',' + (Math.floor(coord.y)) + '}';
    };
    pathID = 0;
    _ref = this.paths;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      path = _ref[_i];
      pathCode = 'pwmKeyframe_t path' + pathID + '[' + path.length + '] = {\n';
      pathCode += (path.map(coordCode)).join(',\n');
      pathCode += '};\n';
      pathID += 1;
      outputCode += pathCode;
    }
    return outputCode;
  };

  Compiler.prototype.compile = function(curves) {
    var curve, height, outputCode, _i, _len;
    outputCode = this.generatePrelude();
    if (this.gamma > 1) {
      this.makeGammaTable();
      outputCode += this.generateGammaTableCode();
    }
    this.paths = [];
    for (_i = 0, _len = curves.length; _i < _len; _i++) {
      curve = curves[_i];
      height = curve.height;
      this.paths.push(curve.outputNodes());
    }
    outputCode += this.generatePathCode();
    outputCode += this.generatePostlude();
    return outputCode;
  };

  return Compiler;

})();

ControlNode = (function() {

  function ControlNode(coord, parentNode, type) {
    this.parentNode = parentNode;
    this.type = type;
    this.moveTo(coord);
    this.isSelected = false;
  }

  ControlNode.prototype.oppositeType = function() {
    if (this.type === 'left') {
      return 'right';
    } else {
      return 'left';
    }
  };

  ControlNode.prototype.constrain = function(coord) {
    if (this.type === 'left') {
      if (coord.x > this.parentNode.x) coord.x = this.parentNode.x;
      if (this.parentNode.prev && coord.x < this.parentNode.prev.x) {
        coord.x = this.parentNode.prev.x;
      }
    } else {
      if (coord.x < this.parentNode.x) coord.x = this.parentNode.x;
      if (this.parentNode.next && coord.x > this.parentNode.next.x) {
        coord.x = this.parentNode.next.x;
      }
    }
    if (coord.y < this.parentNode.curve.topOffset) {
      coord.y = this.parentNode.curve.topOffset;
    } else if (coord.y > this.parentNode.curve.topOffset + this.parentNode.curve.height) {
      coord.y = this.parentNode.curve.topOffset + this.parentNode.curve.height;
    }
    return coord;
  };

  ControlNode.prototype.smooth = function() {
    var coord, distance, newParentAngle, newUnitVect, newVect, newVectFromParent, otherNode;
    coord = v(this);
    otherNode = this.parentNode.getControlNode(this.oppositeType());
    if (otherNode && (v.sub(this.parentNode, this)).len() > 0) {
      newParentAngle = (v.sub(this.parentNode, coord)).angle();
      if (this.parentNode.style === 'symmetric') {
        distance = (v.sub(this.parentNode, this)).len();
      } else {
        distance = (v.sub(this.parentNode, otherNode)).len();
      }
      newUnitVect = v.forAngle(newParentAngle);
      newVectFromParent = v.mul(newUnitVect, distance);
      newVect = v.add(this.parentNode, newVectFromParent);
      return otherNode.moveTo(newVect);
    }
  };

  ControlNode.prototype.moveTo = function(coord) {
    coord = this.constrain(coord);
    this.x = coord.x;
    return this.y = coord.y;
  };

  return ControlNode;

})();

Curve = (function() {

  function Curve(topOffset) {
    this.topOffset = topOffset;
    this.height = 256;
    this.color = "rgb(0,0,255)";
    this.firstNode = null;
    this.lastNode = null;
    this.addNode(v(0, this.height / 2 + this.topOffset), null, v(128, this.height / 2 + this.topOffset));
    this.addNode(v(this.height * 3, this.height / 2 + this.topOffset), v(this.height * 3 - 128, this.height / 2 + this.topOffset), null);
    this.debug = false;
  }

  Curve.prototype.outputNodes = function(threshold, steps) {
    var line, lines, output, _i, _len;
    lines = this.flatten(threshold, steps);
    output = [];
    for (_i = 0, _len = lines.length; _i < _len; _i++) {
      line = lines[_i];
      output.push(v(line[0].x, line[0].y - this.topOffset));
    }
    line = lines[lines.length - 1];
    output.push(v(line[1].x, line[1].y - this.topOffset));
    return output;
  };

  Curve.prototype.flatten = function(threshold, steps) {
    var currNode, end, lines, newLines, start;
    lines = [];
    currNode = this.firstNode;
    while (currNode !== null && currNode.next !== null) {
      start = currNode;
      end = currNode.next;
      newLines = this.flattenBezier(start, start.controlRight, end.controlLeft, end, threshold, steps);
      lines = lines.concat(newLines);
      currNode = currNode.next;
    }
    return lines;
  };

  Curve.prototype.flattenBezier = function(p0, p1, p2, p3, threshold, steps) {
    var coords, currCoord, lastSegment, lines, offPoints, startCoord, stepSize, t, testLine;
    if (!threshold) threshold = 2;
    if (!steps) steps = 128;
    offPoints = function(coords, line) {
      var coord, linearError, linearErrorX, linearErrorY, numPoints, _i, _len;
      numPoints = 0;
      for (_i = 0, _len = coords.length; _i < _len; _i++) {
        coord = coords[_i];
        linearErrorX = Math.abs((lineX(coord.y, line)) - coord.x);
        linearErrorY = Math.abs((lineY(coord.x, line)) - coord.y);
        linearError = Math.min(linearErrorX, linearErrorY);
        if (linearError >= threshold) numPoints += 1;
      }
      return numPoints;
    };
    lines = [];
    stepSize = 1 / steps;
    lastSegment = [v(p0, v(p1))];
    startCoord = v(p0);
    coords = [];
    t = stepSize;
    while (t < 1) {
      currCoord = cubicBezier(t, p0, p1, p2, p3);
      coords.push(currCoord);
      testLine = [startCoord, currCoord];
      if ((offPoints(coords, testLine)) > threshold) {
        lastSegment = [startCoord, currCoord];
        lines.push(lastSegment);
        startCoord = currCoord;
        coords = [];
      } else {
        lastSegment = testLine;
      }
      t += stepSize;
    }
    lastSegment = [startCoord, v(p3)];
    lines.push(lastSegment);
    return lines;
  };

  Curve.prototype.disectAt = function(disectionPoint) {
    var controls, currNode, node, t, x;
    x = disectionPoint.x;
    currNode = this.firstNode;
    while (currNode !== null && currNode.next !== null) {
      if (x > currNode.x && x < currNode.next.x) {
        t = cubicBezierAtX(x, currNode, currNode.controlRight, currNode.next.controlLeft, currNode.next);
        controls = cubicDeCasteljau(t, currNode, currNode.controlRight, currNode.next.controlLeft, currNode.next);
        node = new CurveNode(this, disectionPoint, controls[0], controls[1]);
        currNode.controlRight.moveTo(controls[2]);
        currNode.next.controlLeft.moveTo(controls[3]);
        node.prev = currNode;
        node.next = currNode.next;
        currNode.next.prev = node;
        currNode.next = node;
        return node;
      } else {
        currNode = currNode.next;
      }
    }
    return null;
  };

  Curve.prototype.addNode = function(pos, leftCP, rightCP) {
    var node;
    node = new CurveNode(this, pos, leftCP, rightCP);
    if (this.firstNode === null) {
      this.firstNode = node;
      this.lastNode = node;
    } else {
      node.prev = this.lastNode;
      this.lastNode.next = node;
      this.lastNode = node;
    }
    return node;
  };

  Curve.prototype.drawCurveSegment = function(start, end) {
    var c1, c2;
    c1 = start.controlRight;
    c2 = end.controlLeft;
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
    return ctx.stroke();
  };

  Curve.prototype.drawControlLine = function(from, to) {
    var offset;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(127,127,127)";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    offset = 3;
    if (to.isSelected) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgb(196,196,196)";
      ctx.fillStyle = "rgb(195,195,195)";
    } else {
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgb(63,63,63)";
      ctx.fillStyle = "rgb(195,195,195)";
    }
    ctx.beginPath();
    ctx.moveTo(to.x - offset, to.y);
    ctx.lineTo(to.x, to.y - offset);
    ctx.lineTo(to.x + offset, to.y);
    ctx.lineTo(to.x, to.y + offset);
    ctx.lineTo(to.x - offset, to.y);
    ctx.closePath();
    ctx.fill();
    return ctx.stroke();
  };

  Curve.prototype.drawControlPoints = function(node) {
    if (node.style !== "flat") {
      if (node.controlLeft) this.drawControlLine(node, node.controlLeft);
      if (node.controlRight) return this.drawControlLine(node, node.controlRight);
    }
  };

  Curve.prototype.drawNode = function(node) {
    var brightness, offset, radius, x, y;
    x = node.x;
    y = node.y;
    if (node.isSelected) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgb(128,128,128)";
      brightness = 1;
    } else {
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgb(63,63,63)";
      brightness = 0.5;
    }
    if (node.style === "sharp" || node.style === "flat") {
      offset = 2.7;
      ctx.fillStyle = nodeColors[node.style];
      ctx.beginPath();
      ctx.fillRect(x - offset, y - offset, offset * 2, offset * 2);
      return ctx.strokeRect(x - offset, y - offset, offset * 2, offset * 2);
    } else if (node.style === "smooth" || node.style === "symmetric") {
      radius = 3;
      ctx.fillStyle = nodeColors[node.style];
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.closePath();
      ctx.fill();
      return ctx.stroke();
    }
  };

  Curve.prototype.stretch = function(fromX, byX) {
    var node, _results;
    node = this.lastNode;
    _results = [];
    while (node !== null) {
      if (node.x >= fromX) {
        node.moveTo(v(node.x + byX, node.y));
      } else {
        break;
      }
      _results.push(node = node.prev);
    }
    return _results;
  };

  Curve.prototype.getNodes = function() {
    var currNode, nodes;
    nodes = [];
    currNode = this.firstNode;
    while (currNode !== null) {
      nodes.push(currNode);
      currNode = currNode.next;
    }
    return nodes;
  };

  Curve.prototype.drawSegments = function() {
    var i, nodes, _ref, _results;
    nodes = this.getNodes();
    _results = [];
    for (i = 0, _ref = nodes.length - 1; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
      _results.push(this.drawCurveSegment(nodes[i], nodes[i + 1]));
    }
    return _results;
  };

  Curve.prototype.drawNodes = function() {
    var node, nodes, _i, _j, _len, _len2, _results;
    nodes = this.getNodes();
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      node = nodes[_i];
      this.drawControlPoints(node);
    }
    _results = [];
    for (_j = 0, _len2 = nodes.length; _j < _len2; _j++) {
      node = nodes[_j];
      _results.push(this.drawNode(node));
    }
    return _results;
  };

  Curve.prototype.controlAtMouse = function(pan) {
    var isUnderMouse, node, nodes, radius, _i, _len;
    radius = 6;
    isUnderMouse = function(node) {
      var pannedNode;
      pannedNode = v.add(pan, node);
      return (v.sub(core.canvasMouse(), pannedNode)).len() < radius;
    };
    nodes = this.getNodes();
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      node = nodes[_i];
      if (node.controlLeft && (isUnderMouse(node.controlLeft))) {
        return node.controlLeft;
      }
      if (node.controlRight && (isUnderMouse(node.controlRight))) {
        return node.controlRight;
      }
    }
    return null;
  };

  Curve.prototype.nodeAtMouse = function(pan) {
    var dist, node, pannedNode, radius, _i, _len, _ref;
    radius = 6;
    _ref = this.getNodes();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      pannedNode = v.add(pan, node);
      dist = (v.sub(core.canvasMouse(), pannedNode)).len();
      if (dist < radius) return node;
    }
    return null;
  };

  return Curve;

})();

CurveNode = (function() {

  function CurveNode(curve, coord, leftCP, rightCP) {
    this.curve = curve;
    this.moveTo(coord);
    this.isSelected = false;
    if (leftCP) this.controlLeft = new ControlNode(leftCP, this, 'left');
    if (rightCP) this.controlRight = new ControlNode(rightCP, this, 'right');
    this.style = 'smooth';
    this.next = null;
    this.prev = null;
  }

  CurveNode.prototype.canRemove = function() {
    return this.prev !== null && this.next !== null;
  };

  CurveNode.prototype.remove = function() {
    var newControlPositions, t;
    if (!this.canRemove) return;
    t = approxBezierDisectionParameter(this.controlLeft, this, this.controlRight);
    newControlPositions = invertedCubicDeCasteljau(t, this.prev, this.prev.controlRight, this.next.controlLeft, this.next);
    if (this.prev.controlRight) {
      this.prev.controlRight.moveTo(newControlPositions[0]);
    }
    if (this.next.controlLeft) {
      this.next.controlLeft.moveTo(newControlPositions[1]);
    }
    this.next.prev = this.prev;
    return this.prev.next = this.next;
  };

  CurveNode.prototype.getControlNode = function(type) {
    if (type === 'left') return this.controlLeft;
    if (type === 'right') return this.controlRight;
  };

  CurveNode.prototype.flatten = function() {
    if (this.controlLeft) {
      this.controlLeft.x = this.x;
      this.controlLeft.y = this.y;
    }
    if (this.controlRight) {
      this.controlRight.x = this.x;
      return this.controlRight.y = this.y;
    }
  };

  CurveNode.prototype.reset = function() {
    this.controlLeft.moveTo(v(this.x - 32, this.y));
    this.controlRight.moveTo(v(this.x + 32, this.y));
    if (this.style === 'smooth' || this.style === 'symmetric') {
      return this.smooth();
    } else if (this.style !== 'flat') {
      return this.flatten();
    }
  };

  CurveNode.prototype.smooth = function() {
    var distance, leftOffset, leftUnit, leftVect, rightOffset, rightUnit, rightVect;
    if (this.controlLeft && v.eq(this.controlLeft, this)) this.reset();
    if (this.controlRight && v.eq(this.controlRight, this)) this.reset();
    if (this.controlLeft && this.controlRight) {
      leftOffset = v.sub(this, this.controlLeft);
      rightOffset = v.sub(this, this.controlRight);
      leftUnit = v.unit(leftOffset);
      rightUnit = v.unit(rightOffset);
      leftVect = v.unit(v.sub(rightUnit, leftUnit));
      rightVect = v.unit(v.sub(leftUnit, rightUnit));
      if (this.style === 'symmetric') {
        distance = (leftOffset.len() + rightOffset.len()) / 2;
        leftVect = v.mul(leftVect, distance);
        rightVect = v.mul(rightVect, distance);
      } else {
        leftVect = v.mul(leftVect, leftOffset.len());
        rightVect = v.mul(rightVect, rightOffset.len());
      }
      leftVect = v.add(this, leftVect);
      rightVect = v.add(this, rightVect);
      this.controlLeft.moveTo(leftVect);
      return this.controlRight.moveTo(rightVect);
    }
  };

  CurveNode.prototype.moveTo = function(coord) {
    var constrained, newControlX, nodeMove;
    nodeMove = v.sub(coord, this);
    constrained = false;
    if (this === this.curve.firstNode) coord.x = 0;
    if (this.controlRight) {
      newControlX = this.controlRight.x + nodeMove.x;
      if (this.next && newControlX > this.next.x) {
        coord.x = this.next.x - (newControlX - coord.x);
        constrained = true;
      }
      /*	
      			newControlY = (@controlRight.y + nodeMove.y)
      			if newControlY < @curve.topOffset
      				coord.y = @curve.topOffset - (newControlY - coord.y)
      */
    }
    if (this.controlLeft) {
      newControlX = this.controlLeft.x + nodeMove.x;
      if (this.prev && newControlX < this.prev.x) {
        coord.x = this.prev.x - (newControlX - coord.x);
        constrained = true;
      }
      /*	
      			newControlY = (@controlLeft.y + nodeMove.y)
      			if newControlY < @curve.topOffset
      				coord.y = @curve.topOffset - (newControlY - coord.y)
      */
    }
    if (this.next && coord.x > this.next.controlLeft.x) {
      coord.x = this.next.controlLeft.x;
      constrained = true;
    }
    if (this.prev && coord.x < this.prev.controlRight.x) {
      coord.x = this.prev.controlRight.x;
      constrained = true;
    }
    if (coord.y < this.curve.topOffset) {
      coord.y = this.curve.topOffset;
      constrained = true;
    } else if (coord.y > this.curve.topOffset + this.curve.height) {
      coord.y = this.curve.topOffset + this.curve.height;
      constrained = true;
    }
    nodeMove = v.sub(coord, this);
    this.x = coord.x;
    this.y = coord.y;
    if (this.controlLeft) {
      this.controlLeft.moveTo(v.add(this.controlLeft, nodeMove));
    }
    if (this.controlRight) {
      this.controlRight.moveTo(v.add(this.controlRight, nodeMove));
    }
    if ((this.style === 'smooth' || this.style === 'symmetric') && this.controlLeft && this.controlRight) {
      if (constrained) this.smooth();
      if (this.controlLeft.y <= this.curve.topOffset || this.controlLeft.y >= this.curve.topOffset + this.curve.height) {
        return this.smooth();
      } else if (this.controlRight.y <= this.curve.topOffset || this.controlRight.y >= this.curve.topOffset + this.curve.height) {
        return this.smooth();
      }
    }
  };

  return CurveNode;

})();

DisectionNode = (function() {

  function DisectionNode() {
    this.radius = 2;
    this.clickRadius = 8;
    this.coord = null;
    this.bezierParameter;
  }

  DisectionNode.prototype.draw = function() {
    var coord, offset;
    if (this.coord) {
      coord = this.coord;
      offset = this.radius;
      ctx.fillStyle = "rgba(255,255,255, 0.5)";
      ctx.strokeStyle = "rgb(0,0,0)";
      ctx.beginPath();
      ctx.arc(coord.x, coord.y, this.radius, 0, TAU);
      return ctx.fill();
    }
  };

  DisectionNode.prototype.move = function(x, firstNode) {
    var currNode, _results;
    currNode = firstNode;
    this.coord = null;
    _results = [];
    while (currNode !== null && currNode.next !== null) {
      if (x > currNode.x && x < currNode.next.x) {
        this.bezierParameter = cubicBezierAtX(x, currNode, currNode.controlRight, currNode.next.controlLeft, currNode.next);
        this.coord = cubicBezier(this.bezierParameter, currNode, currNode.controlRight, currNode.next.controlLeft, currNode.next);
        break;
      }
      _results.push(currNode = currNode.next);
    }
    return _results;
  };

  DisectionNode.prototype.isUnderMouse = function(pan) {
    var mouse;
    mouse = v.sub(core.canvasMouse(), pan);
    if (!this.coord) return false;
    return (v.sub(mouse, this.coord)).len() < this.clickRadius;
  };

  return DisectionNode;

})();

canvas = core.canvas;

ctx = core.ctx;

flattenBy = 4;

nodeColors = {
  smooth: "rgb(0,255,0)",
  sharp: "rgb(255,0,0)",
  flat: "rgb(255,255,0)",
  symmetric: "rgb(255,0,255)"
};

run = function() {
  var app, compiler, size;
  compiler = new Compiler;
  core.input.bind(core.key.LEFT_ARROW, 'pan-left');
  core.input.bind(core.key.RIGHT_ARROW, 'pan-right');
  core.input.bind(core.key.UP_ARROW, 'pan-up');
  core.input.bind(core.key.DOWN_ARROW, 'pan-down');
  core.input.bind(core.button.RIGHT, 'right-mouse');
  core.input.bind(core.button.LEFT, 'left-mouse');
  core.input.bind(core.key.D, 'debug');
  core.input.bind(core.key.SHIFT, 'push');
  core.input.bind(core.key.CTRL, 'precision');
  app = new App();
  app.run();
  window.onblur = function() {
    return app.stop();
  };
  window.onfocus = function() {
    return app.run();
  };
  size = function() {
    app.width = $('.canvasContainer').width() - $('.curveTitles').width();
    canvas.width = app.width;
    return app.invalidate();
  };
  $(window).resize(size);
  size();
  $('#item-smooth-node').click(function() {
    var data;
    data = $('.context-menu').data();
    if (data.node) {
      data.node.style = 'smooth';
      data.node.smooth();
    }
    $('.context-menu').fadeOut('fast');
    return app.invalidate();
  });
  $('#item-sharp-node').click(function() {
    var data;
    data = $('.context-menu').data();
    if (data.node) {
      if (data.node.style === 'flat') data.node.reset();
      data.node.style = 'sharp';
    }
    $('.context-menu').fadeOut('fast');
    return app.invalidate();
  });
  $('#item-flat-node').click(function() {
    var data;
    data = $('.context-menu').data();
    if (data.node) {
      data.node.style = 'flat';
      data.node.flatten();
    }
    $('.context-menu').fadeOut('fast');
    return app.invalidate();
  });
  $('#item-symmetric-node').click(function() {
    var data;
    data = $('.context-menu').data();
    if (data.node) {
      data.node.style = 'symmetric';
      data.node.smooth();
    }
    $('.context-menu').fadeOut('fast');
    return app.invalidate();
  });
  $('#item-remove-node').click(function() {
    var data;
    data = $('.context-menu').data();
    if (data.node) data.node.remove();
    $('.context-menu').fadeOut('fast');
    return app.invalidate();
  });
  $('#item-reset-node').click(function() {
    var data;
    data = $('.context-menu').data();
    if (data.node) data.node.reset();
    $('.context-menu').fadeOut('fast');
    return app.invalidate();
  });
  return $('#compile-button').click(function() {
    return $('#compile-output').val(compiler.compile(app.curves));
  });
};
