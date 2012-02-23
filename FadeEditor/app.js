var App, Compiler, ControlNode, Curve, CurveNode, DisectionNode, canvas, ctx, nodeColors, run,
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
    this.height = 2 * this.curveSpacing + numCurves * (this.curveSpacing + this.curveHeight);
    canvas.height = this.height;
    canvas.width = this.width;
    this.pan = v(0, 0);
    this.panSpeed = 3.0;
    this.zoom = 1.0;
    this.curves = [];
    this.maxPanX = 32;
    this.lastFlattern = null;
    this.timeMultiplier = 1;
    for (i = 0; 0 <= numCurves ? i < numCurves : i > numCurves; 0 <= numCurves ? i++ : i--) {
      this.curves.push(new Curve(this.curveSpacing + i * (this.curveSpacing + this.curveHeight), this.gridSize));
    }
    this.dragNode = null;
    this.dragControl = null;
    this.pushDrag = null;
    this.pushStart = null;
    this.pushMode = false;
    this.disectionNode = new DisectionNode();
    this.verticalPanEnabled = true;
    this.timeSnapEnabled = false;
  }

  App.prototype.updateColors = function() {
    var curve, i, _ref;
    for (i = 0, _ref = this.curves.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
      curve = this.curves[i];
      curve.color = $('#colorbox' + i).css('background-color');
    }
    return this.invalidate();
  };

  App.prototype.updateDragging = function(dt) {
    var curve, diff, globalY, mouse, snap, _i, _len, _ref;
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
      if (this.verticalPanEnabled) {
        globalY = core.screenMouse().y;
        this.scrollBox.scrollTop(this.scrollBox.scrollTop() - (globalY - this.scrollStart));
        this.scrollStart = globalY;
      }
      this.pan.y = 0;
      if (this.pan.x > this.maxPanX) this.pan.x = this.maxPanX;
      this.dragPan = v(mouse);
      return this.invalidate();
    } else if (this.dragNode) {
      mouse = v.sub(core.canvasMouse(), this.pan);
      this.disectionNode.coord = null;
      snap = core.input.down('snapX');
      if (this.timeSnapEnabled) snap = !snap;
      this.dragNode.moveTo(mouse, snap);
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

  App.prototype.setDeviation = function(channel, deviation) {
    console.log(deviation);
    return this.curves[channel].deviationThreshold = deviation;
  };

  App.prototype.createNode = function() {
    var coord, curve, _i, _len, _ref, _results;
    if (!this.disectionNode.coord) return;
    coord = v(this.disectionNode.coord);
    _ref = this.curves;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      curve = _ref[_i];
      if (curve.enabled && coord.y > curve.topOffset && coord.y < curve.topOffset + curve.height) {
        this.dragNode = curve.disectAt(coord);
        break;
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  App.prototype.setEnabled = function(index, enabled) {
    console.log(index, this.curves[index]);
    return this.curves[index].enabled = enabled;
  };

  App.prototype.toggleChannelRepeat = function(channel) {
    return this.curves[channel].repeats = !this.curves[channel].repeats;
  };

  App.prototype.setEndpointLock = function(channel, lock) {
    var curve, newEndpoint;
    curve = this.curves[channel];
    curve.endpointLock = lock;
    newEndpoint = v(curve.lastNode.x, curve.firstNode.y);
    curve.lastNode.moveTo(newEndpoint);
    return this.invalidate();
  };

  App.prototype.update = function(dt) {
    var $canvas, color, curve, intensity, led, ledData, ledIndex, menu, menuPos, mouse, node, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4;
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
    ledIndex = 0;
    _ref = this.curves;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      curve = _ref[_i];
      if (mouse.y >= curve.topOffset && mouse.y <= curve.topOffset + curve.height) {
        this.disectionNode.move(mouse.x, curve.firstNode);
        if (this.lastMouse && this.disectionNode.coord && !v.eq(mouse, this.lastMouse)) {
          led = $('#led' + ledIndex);
          ledData = led.data();
          if (ledData) {
            color = new RGBColor(led.data().color);
            intensity = 1 - (this.disectionNode.coord.y - curve.topOffset) / curve.height;
            color.r = Math.floor(color.r * intensity);
            color.g = Math.floor(color.g * intensity);
            color.b = Math.floor(color.b * intensity);
            led.css('background-color', color.toRGB());
          }
          this.invalidate();
        }
      }
      ledIndex += 1;
    }
    if (core.input.pressed('keyframe')) {
      this.showKeyframes = true;
      this.lastFlatten = [];
      _ref2 = this.curves;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        curve = _ref2[_j];
        this.lastFlatten.push(curve.outputNodes(255 * 8, 8));
      }
      this.invalidate();
    }
    if (core.input.released('keyframe')) {
      this.showKeyframes = false;
      this.invalidate();
    }
    if (core.input.down('pan-right')) {
      this.pan.x -= this.panSpeed;
      this.invalidate();
    } else if (core.input.down('pan-left')) {
      this.pan.x += this.panSpeed;
      if (this.pan.x > this.maxPanX) this.pan.x = this.maxPanX;
      this.invalidate();
    }
    if (core.input.down('pan-down')) {
      this.scrollBox.scrollTop(this.scrollBox.scrollTop() + this.panSpeed);
    } else if (core.input.down('pan-up')) {
      this.scrollBox.scrollTop(this.scrollBox.scrollTop() - this.panSpeed);
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
        _ref3 = this.curves;
        for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
          curve = _ref3[_k];
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
      _ref4 = this.curves;
      for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
        curve = _ref4[_l];
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

  App.prototype.timeAtBar = function(bar) {
    var highStr, highUnits, highValue, lowUnits, lowValue, value;
    value = bar * this.timeMultiplier;
    if (this.timeMultiplier < 0.5) {
      lowUnits = 'ms';
      highUnits = 'sec';
      highValue = Math.floor(value);
      lowValue = (value - highValue) * 1000;
    } else if (this.timeMultiplier >= 60) {
      lowUnits = 'min';
      highUnits = 'hours';
      value /= 60;
      highValue = Math.floor(value / 60);
      lowValue = value - (highValue * 60);
    } else {
      lowUnits = 'sec';
      highUnits = 'min';
      highValue = Math.floor(value / 60);
      lowValue = value - (highValue * 60);
    }
    highStr = '';
    if (highValue > 0) highStr = highValue.toString() + ' ' + highUnits + ' ';
    return highStr + lowValue + ' ' + lowUnits;
  };

  App.prototype.draw = function() {
    var bar, currY, curve, flattenedNodes, i, node, point, xPos, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
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
      if (!curve.enabled) {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(0, curve.topOffset, this.width, curve.height);
      }
    }
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, this.height - this.curveSpacing * 2, this.width, this.curveSpacing);
    ctx.restore();
    ctx.save();
    ctx.translate(this.pan.x, 0);
    for (bar = -4, _ref2 = 4 * this.width / this.barLength; -4 <= _ref2 ? bar < _ref2 : bar > _ref2; -4 <= _ref2 ? bar++ : bar--) {
      xPos = bar * this.barLength / 4 - (Math.floor(this.pan.x / this.barLength)) * this.barLength;
      if (bar % 4 === 0) {
        ctx.strokeStyle = "rgb(192,192,192)";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgb(196,196,196)";
        ctx.font = "10pt Arial";
        _ref3 = this.curves;
        for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
          curve = _ref3[_j];
          ctx.fillText(this.timeAtBar((bar / 4) - Math.floor(this.pan.x / this.barLength)), xPos + 10, curve.topOffset - this.curveSpacing / 2 + this.pan.y);
        }
      } else if (bar % 2 === 0) {
        ctx.strokeStyle = "rgb(128,128,128)";
      } else {
        ctx.strokeStyle = "rgb(64,64,64)";
      }
      ctx.beginPath();
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos, this.height);
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
    _ref4 = this.curves;
    for (_k = 0, _len3 = _ref4.length; _k < _len3; _k++) {
      curve = _ref4[_k];
      curve.drawSegments();
      if (curve.repeats) curve.drawRepeats(this.pan, this.width);
    }
    this.disectionNode.draw();
    if (this.showKeyframes) {
      i = 0;
      _ref5 = this.curves;
      for (_l = 0, _len4 = _ref5.length; _l < _len4; _l++) {
        curve = _ref5[_l];
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgb(196,196,196)";
        ctx.beginPath();
        ctx.moveTo(curve.firstNode.x, curve.firstNode.y);
        flattenedNodes = this.lastFlatten[i];
        for (_m = 0, _len5 = flattenedNodes.length; _m < _len5; _m++) {
          node = flattenedNodes[_m];
          ctx.lineTo(node.x, node.y + curve.topOffset);
        }
        ctx.stroke();
        for (_n = 0, _len6 = flattenedNodes.length; _n < _len6; _n++) {
          node = flattenedNodes[_n];
          ctx.fillStyle = "rgb(255,255,255)";
          ctx.strokeStyle = "rgb(0,0,0)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y + curve.topOffset, 3, 0, TAU);
          ctx.fill();
          ctx.stroke();
        }
        i += 1;
      }
    }
    _ref6 = this.curves;
    for (_o = 0, _len7 = _ref6.length; _o < _len7; _o++) {
      curve = _ref6[_o];
      if (!this.showKeyframes) curve.drawControlLines();
      curve.drawNodes();
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

  Compiler.prototype.toHexByte = function(num) {
    var hex;
    hex = num.toString(16);
    if (hex.length === 1) hex = '0' + hex;
    return hex;
  };

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
    return '// Placeholder for stuff at the start\n';
  };

  Compiler.prototype.generatePostlude = function() {
    return '\n// Placeholder for other stuff to do\n';
  };

  Compiler.prototype.generateGammaTableCode = function() {
    var outputCode;
    outputCode = '// Gamma Table\n';
    outputCode += (this.gammaTable.map(this.toHexByte)).join(' ');
    outputCode += '\n';
    return outputCode;
  };

  Compiler.prototype.generatePathCode = function() {
    var coord, offsetPath, outputCode, path, pathCode, pathID, prevX, _i, _j, _len, _len2, _ref;
    outputCode = '\n\n// Channels\n// Byte 1: Time Offset (since last)\n// Byte 2: Intensity value (raw)\n';
    pathID = 0;
    _ref = this.paths;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      path = _ref[_i];
      pathCode = '';
      outputCode += '// Channel ' + pathID + '\n';
      offsetPath = [];
      prevX = 0;
      for (_j = 0, _len2 = path.length; _j < _len2; _j++) {
        coord = path[_j];
        offsetPath.push(this.toHexByte(coord.x - prevX) + ' ' + this.toHexByte(coord.y));
        prevX = coord.x;
      }
      pathCode += offsetPath.join('\n');
      pathID += 1;
      outputCode += pathCode + '\n';
    }
    return outputCode;
  };

  Compiler.prototype.compile = function(curves) {
    var curve, curveHeight, height, maxOffset, outputCode, path, scaleNode, stepSize, _i, _len,
      _this = this;
    curveHeight = 256;
    stepSize = 8;
    maxOffset = this.maxValue * stepSize;
    scaleNode = function(node) {
      return v(Math.floor(node.x / stepSize), Math.round(_this.maxValue * node.y / curveHeight));
    };
    outputCode = this.generatePrelude();
    if (this.gamma > 1) {
      this.makeGammaTable();
      outputCode += this.generateGammaTableCode();
    }
    this.paths = [];
    for (_i = 0, _len = curves.length; _i < _len; _i++) {
      curve = curves[_i];
      height = curve.height;
      path = curve.outputNodes(maxOffset, stepSize);
      path = path.map(scaleNode);
      this.paths.push(path);
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
    var coord, curve, distance, newParentAngle, newUnitVect, newVect, newVectFromParent, otherNode, useFirst, useLast;
    coord = v(this);
    otherNode = this.parentNode.getControlNode(this.oppositeType());
    curve = this.parentNode.curve;
    useLast = curve.endpointLock && this.parentNode === curve.firstNode && otherNode === curve.lastNode.controlLeft;
    useFirst = curve.endpointLock && this.parentNode === curve.lastNode && otherNode === curve.firstNode.controlRight;
    if (useLast) {
      otherNode.x -= curve.lastNode.x;
    } else if (useFirst) {
      otherNode.x += curve.lastNode.x;
    }
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
      if (useLast) {
        return otherNode.moveTo(v(newVect.x + curve.lastNode.x, newVect.y));
      } else if (useFirst) {
        return otherNode.moveTo(v(newVect.x - curve.lastNode.x, newVect.y));
      } else {
        return otherNode.moveTo(newVect);
      }
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

  function Curve(topOffset, stepSize) {
    this.topOffset = topOffset;
    this.stepSize = stepSize;
    this.height = 256;
    this.color = "rgb(0,0,255)";
    this.firstNode = null;
    this.lastNode = null;
    this.addNode(v(0, this.height / 2 + this.topOffset), null, v(128, this.height / 2 + this.topOffset));
    this.addNode(v(this.height * 3, this.height / 2 + this.topOffset), v(this.height * 3 - 128, this.height / 2 + this.topOffset), null);
    this.debug = false;
    this.enabled = true;
    this.deviationThreshold = 4;
    this.repeats = false;
    this.endpointLock = false;
    this.disabledColor = 'rgb(64,64,64)';
    this.repeatColor = 'rgb(128,128,128)';
  }

  Curve.prototype.outputNodes = function(maxXOffset, stepSize) {
    var i, line, numExtraNodes, outX, outY, output, p0, p1, p2, p3, segment, segments, stepSnap, t, threshold, x, xOffset, y, _i, _len, _ref;
    if (maxXOffset == null) maxXOffset = 0;
    threshold = this.deviationThreshold;
    stepSnap = function(x) {
      return Math.round(x / stepSize) * stepSize;
    };
    segments = this.flatten(threshold, stepSize);
    output = [];
    maxXOffset = Math.floor(maxXOffset / stepSize) * stepSize;
    for (_i = 0, _len = segments.length; _i < _len; _i++) {
      segment = segments[_i];
      line = segment.line;
      _ref = segment.curve, t = _ref[0], p0 = _ref[1], p1 = _ref[2], p2 = _ref[3], p3 = _ref[4];
      output.push(v(stepSnap(line[0].x), Math.floor(line[0].y - this.topOffset)));
      if (maxXOffset > 0) {
        xOffset = Math.abs(line[0].x - line[1].x);
        if (xOffset > maxXOffset) {
          numExtraNodes = Math.floor(xOffset / maxXOffset);
          for (i = 1; 1 <= numExtraNodes ? i <= numExtraNodes : i >= numExtraNodes; 1 <= numExtraNodes ? i++ : i--) {
            x = stepSnap(line[0].x) + (i * maxXOffset);
            t = cubicBezierAtX(x, p0, p1, p2, p3);
            y = (cubicBezier(t, p0, p1, p2, p3)).y;
            outX = Math.floor(x);
            outY = Math.floor(y - this.topOffset);
            output.push(v(outX, outY));
          }
        }
      }
    }
    segment = segments[segments.length - 1];
    line = segment.line;
    output.push(v(stepSnap(line[1].x), Math.floor(line[1].y - this.topOffset)));
    return output;
  };

  Curve.prototype.flatten = function(threshold, stepSize) {
    var currNode, end, newSegments, segments, start;
    segments = [];
    currNode = this.firstNode;
    while (currNode !== null && currNode.next !== null) {
      start = currNode;
      end = currNode.next;
      newSegments = this.flattenBezier(start, start.controlRight, end.controlLeft, end, threshold, stepSize);
      segments = segments.concat(newSegments);
      currNode = currNode.next;
    }
    return segments;
  };

  Curve.prototype.flattenBezier = function(p0, p1, p2, p3, threshold, stepSize) {
    var coords, currCoord, lastSegment, lines, offPoints, startCoord, t, testLine, x;
    if (stepSize == null) stepSize = 8;
    if (!threshold) threshold = 2;
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
    startCoord = v(p0);
    coords = [];
    x = Math.floor(p0.x / stepSize) * stepSize;
    x += stepSize;
    while (x < p3.x) {
      t = cubicBezierAtX(x, p0, p1, p2, p3);
      currCoord = cubicBezier(t, p0, p1, p2, p3);
      currCoord.x = x;
      coords.push(currCoord);
      testLine = [startCoord, currCoord];
      if ((x % stepSize) === 0) {
        lastSegment = {
          line: [startCoord, currCoord],
          curve: [t, p0, p1, p2, p3]
        };
      }
      if ((offPoints(coords, testLine)) > threshold) {
        lines.push(lastSegment);
        startCoord = lastSegment.line[1];
        coords = [];
      }
      x += 1;
    }
    lastSegment = {
      line: [startCoord, v(p3)],
      curve: [t, p0, p1, p2, p3]
    };
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
        node = new CurveNode(this, disectionPoint, controls[0], controls[1], this.stepSize);
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
    node = new CurveNode(this, pos, leftCP, rightCP, this.stepSize);
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

  Curve.prototype.drawCurveSegment = function(start, end, xShift) {
    var c1, c2;
    if (xShift == null) xShift = 0;
    c1 = start.controlRight;
    c2 = end.controlLeft;
    ctx.lineWidth = 2;
    if (xShift !== 0) {
      ctx.strokeStyle = this.repeatColor;
    } else if (this.enabled) {
      ctx.strokeStyle = this.color;
    } else {
      ctx.strokeStyle = this.disabledColor;
    }
    ctx.beginPath();
    ctx.moveTo(start.x + xShift, start.y);
    ctx.bezierCurveTo(c1.x + xShift, c1.y, c2.x + xShift, c2.y, end.x + xShift, end.y);
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

  Curve.prototype.drawRepeats = function(pan, width) {
    var i, nodes, offset, _ref, _results;
    nodes = this.getNodes();
    offset = this.lastNode.x;
    _results = [];
    while ((offset + pan.x) < width) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.repeatColor;
      ctx.beginPath();
      ctx.moveTo(offset, this.lastNode.y);
      ctx.lineTo(this.firstNode.x + offset, this.firstNode.y);
      ctx.stroke();
      for (i = 0, _ref = nodes.length - 1; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        this.drawCurveSegment(nodes[i], nodes[i + 1], offset);
      }
      _results.push(offset += this.lastNode.x);
    }
    return _results;
  };

  Curve.prototype.drawControlLines = function() {
    var node, _i, _len, _ref, _results;
    _ref = this.getNodes();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      _results.push(this.drawControlPoints(node));
    }
    return _results;
  };

  Curve.prototype.drawNodes = function() {
    var node, _i, _len, _ref, _results;
    _ref = this.getNodes();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      _results.push(this.drawNode(node));
    }
    return _results;
  };

  Curve.prototype.controlAtMouse = function(pan) {
    var isUnderMouse, node, nodes, radius, _i, _len;
    if (!this.enabled) return null;
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
    if (!this.enabled) return null;
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

  function CurveNode(curve, coord, leftCP, rightCP, stepSize) {
    this.curve = curve;
    this.stepSize = stepSize;
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
    if (type === 'left') return this.getLeftCP();
    if (type === 'right') return this.getRightCP();
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

  CurveNode.prototype.getLeftCP = function() {
    if (this.curve.endpointLock && this === this.curve.firstNode) {
      return this.curve.lastNode.controlLeft;
    } else {
      return this.controlLeft;
    }
  };

  CurveNode.prototype.getRightCP = function() {
    if (this.curve.endpointLock && this === this.curve.lastNode) {
      return this.curve.firstNode.controlRight;
    } else {
      return this.controlRight;
    }
  };

  CurveNode.prototype.reset = function() {
    var ctrlLeft, ctrlRight;
    ctrlLeft = this.getLeftCP();
    ctrlRight = this.getRightCP();
    if (ctrlLeft) {
      ctrlLeft.moveTo(v(ctrlLeft.parentNode.x - 32, ctrlLeft.parentNode.y));
    }
    if (ctrlRight) {
      ctrlRight.moveTo(v(ctrlRight.parentNode.x + 32, ctrlRight.parentNode.y));
    }
    console.log(ctrlLeft.parentNode.x - 32, ctrlRight.parentNode.x + 32);
    if (this.style === 'smooth' || this.style === 'symmetric') {
      return this.smooth();
    } else if (this.style === 'flat') {
      return this.style = 'sharp';
    }
  };

  CurveNode.prototype.consolidateEndpoints = function() {
    if (this.curve.endpointLock) {
      if (this === this.curve.firstNode) {
        return this.curve.lastNode.style = this.style;
      } else if (this === this.curve.lastNode) {
        return this.curve.firstNode.style = this.style;
      }
    }
  };

  CurveNode.prototype.smooth = function() {
    var ctrlLeft, ctrlRight, distance, leftIsLastLeft, leftOffset, leftUnit, leftVect, rightIsFirstRight, rightOffset, rightUnit, rightVect;
    ctrlLeft = v(this.getLeftCP());
    ctrlRight = v(this.getRightCP());
    leftIsLastLeft = this === this.curve.firstNode && this.curve.endpointLock;
    rightIsFirstRight = this === this.curve.lastNode && this.curve.endpointLock;
    if (leftIsLastLeft) {
      ctrlLeft = v(ctrlLeft.x - this.curve.lastNode.x, ctrlLeft.y);
    }
    if (rightIsFirstRight) {
      ctrlRight = v(ctrlRight.x + this.curve.lastNode.x, ctrlRight.y);
    }
    if (ctrlLeft && v.eq(ctrlLeft, this)) this.reset();
    if (ctrlRight && v.eq(ctrlRight, this)) this.reset();
    if (ctrlLeft && ctrlRight) {
      leftOffset = v.sub(this, ctrlLeft);
      rightOffset = v.sub(this, ctrlRight);
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
      if (leftIsLastLeft) {
        this.curve.lastNode.controlLeft.moveTo(v(leftVect.x + this.curve.lastNode.x, leftVect.y));
      } else {
        this.controlLeft.moveTo(leftVect);
      }
      if (rightIsFirstRight) {
        return this.curve.firstNode.controlRight.moveTo(v(rightVect.x - this.curve.lastNode.x, rightVect.y));
      } else {
        return this.controlRight.moveTo(rightVect);
      }
    }
  };

  CurveNode.prototype.moveTo = function(coord, snap, bubble) {
    var constrained, newControlX, nodeMove, snapX,
      _this = this;
    if (snap == null) snap = false;
    if (bubble == null) bubble = true;
    snapX = function(x) {
      return Math.round(x / _this.stepSize) * _this.stepSize;
    };
    if (snap) {
      console.log(this.stepSize, coord.x, snapX(coord.x));
      coord.x = snapX(coord.x);
    }
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
    if (bubble && this.curve.endpointLock) {
      if (this === this.curve.firstNode) {
        this.curve.lastNode.moveTo(v(this.curve.lastNode.x, this.y), snap, false);
      }
      if (this === this.curve.lastNode) {
        this.curve.firstNode.moveTo(v(this.curve.firstNode.x, this.y), snap, false);
      }
    }
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

nodeColors = {
  smooth: "rgb(0,255,0)",
  sharp: "rgb(255,0,0)",
  flat: "rgb(255,255,0)",
  symmetric: "rgb(255,0,255)"
};

run = function() {
  var activeColorBox, activeSettingsChannel, app, colorbox, compiler, i, makeTitles, repeatButton, settingsButton, size;
  compiler = new Compiler;
  core.input.bind(core.key.LEFT_ARROW, 'pan-left');
  core.input.bind(core.key.RIGHT_ARROW, 'pan-right');
  core.input.bind(core.key.UP_ARROW, 'pan-up');
  core.input.bind(core.key.DOWN_ARROW, 'pan-down');
  core.input.bind(core.button.RIGHT, 'right-mouse');
  core.input.bind(core.button.LEFT, 'left-mouse');
  core.input.bind(core.key.K, 'keyframe');
  core.input.bind(core.key.SHIFT, 'push');
  core.input.bind(core.key.CTRL, 'precision');
  core.input.bind(core.key.X, 'snapX');
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
  makeTitles = function() {
    var colors, i, titles;
    titles = '';
    colors = ['#0000ff', '#00ff00', '#ff0000', '#00ffff', '#ff00ff', '#ffff00'];
    for (i = 0; i < 6; i++) {
      $('#led' + i).css('background-color', colors[i]);
      $("#led" + i).data({
        color: colors[i]
      });
      titles += "				<div class=\"curveTitle flexbox\" id=\"curve" + i + "\">					<div style=\"text-align:center\">						" + i + "						<div class=\"button-icon\" style=\"margin-top:10px\">							<div class=\"colorbox\" id=\"colorbox" + i + "\" style=\"background-color:" + colors[i] + "\"></div>						</div>						<div class=\"button-icon\" style=\"margin-top:10px\" id=\"settings-button" + i + "\">							<i class=\"icon-cog icon-white\"></i>						</div>						<div class=\"button-icon\" style=\"margin-top:10px\" id=\"repeat-button" + i + "\">							<i class=\"icon-repeat icon-white\" id=\"repeat-icon" + i + "\"></i>						</div>					</div>				</div>";
    }
    return titles;
  };
  $('.curveTitles').html(makeTitles());
  $('#colorchooser').modal({
    backdrop: false,
    show: false
  });
  $('#colorchooser').modal("hide");
  $('#channel-settings').modal({
    backdrop: false,
    show: false
  });
  $('#channel-settings').modal("hide");
  $('#settings').modal({
    backdrop: false,
    show: false
  });
  $('#settings').modal("hide");
  $('#lights').modal({
    backdrop: false,
    show: false
  });
  $('#lights').modal("hide");
  $('#setting-time-per-bar').change(function() {
    app.timeMultiplier = parseFloat($(this).val());
    app.invalidate();
    return true;
  });
  $('#setting-snap').click(function() {
    var enabled;
    enabled = $(this).prop('checked');
    app.timeSnapEnabled = enabled;
    return true;
  });
  $('#setting-vpan').click(function() {
    var enabled;
    enabled = $(this).prop('checked');
    app.verticalPanEnabled = enabled;
    return true;
  });
  activeColorBox = null;
  activeSettingsChannel = null;
  $('#farbtastic').farbtastic(function(color) {
    if (activeColorBox) {
      activeColorBox.css('background-color', color);
      $("#led" + activeColorBox.data().index).css('background-color', color);
      $("#led" + activeColorBox.data().index).data({
        color: color
      });
    }
    return app.updateColors();
  });
  $('#channel-enabled').click(function() {
    app.setEnabled(activeSettingsChannel, $(this).prop('checked'));
    app.invalidate();
    return true;
  });
  $('#channel-deviation').change(function() {
    app.setDeviation(activeSettingsChannel, parseFloat($(this).val()));
    app.invalidate();
    return true;
  });
  $('#channel-lock-endpoints').click(function() {
    app.setEndpointLock(activeSettingsChannel, $(this).prop('checked'));
    app.curves[activeSettingsChannel].firstNode.consolidateEndpoints();
    return true;
  });
  for (i = 0; i < 6; i++) {
    repeatButton = $('#repeat-button' + i);
    repeatButton.data({
      index: i
    });
    repeatButton.click(function() {
      var icon, index;
      index = $(this).data().index;
      icon = $('#repeat-icon' + index);
      icon.toggleClass("icon-white");
      $(this).toggleClass("button-selected");
      app.toggleChannelRepeat(index);
      app.invalidate();
      return true;
    });
    settingsButton = $('#settings-button' + i);
    settingsButton.data({
      index: i
    });
    settingsButton.click(function() {
      activeSettingsChannel = $(this).data().index;
      $('#channel-settings').modal("show");
      return true;
    });
    colorbox = $('#colorbox' + i);
    colorbox.data({
      index: i
    });
    colorbox.click(function() {
      activeColorBox = $(this);
      $.farbtastic('#farbtastic').setColor(new RGBColor(activeColorBox.css('background-color')).toHex());
      $('#colorchooser').modal("show");
      return true;
    });
  }
  app.updateColors();
  $('#item-smooth-node').click(function() {
    var data;
    data = $('.context-menu').data();
    if (data.node) {
      if (data.node.style === 'flat') data.node.reset();
      data.node.style = 'smooth';
      data.node.smooth();
      data.node.consolidateEndpoints();
    }
    $('.context-menu').fadeOut('fast');
    app.invalidate();
    return true;
  });
  $('#item-sharp-node').click(function() {
    var data;
    data = $('.context-menu').data();
    if (data.node) {
      if (data.node.style === 'flat') data.node.reset();
      data.node.style = 'sharp';
      data.node.consolidateEndpoints();
    }
    $('.context-menu').fadeOut('fast');
    app.invalidate();
    return true;
  });
  $('#item-flat-node').click(function() {
    var data;
    data = $('.context-menu').data();
    if (data.node) {
      data.node.style = 'flat';
      data.node.flatten();
      data.node.consolidateEndpoints();
    }
    $('.context-menu').fadeOut('fast');
    app.invalidate();
    return true;
  });
  $('#item-symmetric-node').click(function() {
    var data;
    data = $('.context-menu').data();
    if (data.node) {
      if (data.node.style === 'flat') data.node.reset();
      data.node.style = 'symmetric';
      data.node.smooth();
      data.node.consolidateEndpoints();
    }
    $('.context-menu').fadeOut('fast');
    app.invalidate();
    return true;
  });
  $('#item-remove-node').click(function() {
    var data;
    data = $('.context-menu').data();
    if (data.node) data.node.remove();
    $('.context-menu').fadeOut('fast');
    app.invalidate();
    return true;
  });
  $('#item-reset-node').click(function() {
    var data;
    data = $('.context-menu').data();
    if (data.node) data.node.reset();
    $('.context-menu').fadeOut('fast');
    app.invalidate();
    return true;
  });
  $('.dialogModal').draggable();
  return $('#compile-button').click(function() {
    $('#compile-output').val(compiler.compile(app.curves));
    return true;
  });
};
