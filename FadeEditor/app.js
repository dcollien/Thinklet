var App, ControlNode, Curve, CurveNode, DisectionNode, app, canvas, ctx,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

canvas = core.canvas;

ctx = core.ctx;

DisectionNode = (function() {

  function DisectionNode() {
    this.radius = 2;
    this.clickRadius = 4;
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
      distance = (v.sub(this.parentNode, otherNode)).len();
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

  CurveNode.prototype.getControlNode = function(type) {
    if (type === 'left') return this.controlLeft;
    if (type === 'right') return this.controlRight;
  };

  CurveNode.prototype.smooth = function() {
    var leftOffset, leftUnit, leftVect, rightOffset, rightUnit, rightVect;
    if (this.controlLeft && this.controlRight) {
      leftOffset = v.sub(this, this.controlLeft);
      rightOffset = v.sub(this, this.controlRight);
      leftUnit = v.unit(leftOffset);
      rightUnit = v.unit(rightOffset);
      leftVect = v.unit(v.sub(rightUnit, leftUnit));
      rightVect = v.unit(v.sub(leftUnit, rightUnit));
      leftVect = v.mul(leftVect, leftOffset.len());
      rightVect = v.mul(rightVect, rightOffset.len());
      leftVect = v.add(this, leftVect);
      rightVect = v.add(this, rightVect);
      this.controlLeft.moveTo(leftVect);
      return this.controlRight.moveTo(rightVect);
    }
  };

  CurveNode.prototype.moveTo = function(coord) {
    var newControlX, nodeMove;
    nodeMove = v.sub(coord, this);
    if (this.controlRight) {
      newControlX = this.controlRight.x + nodeMove.x;
      if (this.next && newControlX > this.next.x) {
        coord.x = this.next.x - (newControlX - coord.x);
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
      }
      /*	
      			newControlY = (@controlLeft.y + nodeMove.y)
      			if newControlY < @curve.topOffset
      				coord.y = @curve.topOffset - (newControlY - coord.y)
      */
    }
    if (coord.y < this.curve.topOffset) {
      coord.y = this.curve.topOffset;
    } else if (coord.y > this.curve.topOffset + this.curve.height) {
      coord.y = this.curve.topOffset + this.curve.height;
    }
    nodeMove = v.sub(coord, this);
    if (this.controlLeft) {
      this.controlLeft.moveTo(v.add(this.controlLeft, nodeMove));
    }
    if (this.controlRight) {
      this.controlRight.moveTo(v.add(this.controlRight, nodeMove));
    }
    if (this.style === 'smooth' && this.controlLeft && this.controlRight) {
      if (this.controlLeft.y <= this.curve.topOffset || this.controlLeft.y >= this.curve.topOffset + this.curve.height) {
        this.controlLeft.smooth();
      }
      if (this.controlRight.y <= this.curve.topOffset || this.controlRight.y >= this.curve.topOffset + this.curve.height) {
        this.controlRight.smooth();
      }
    }
    this.x = coord.x;
    return this.y = coord.y;
  };

  return CurveNode;

})();

Curve = (function() {

  function Curve(topOffset) {
    this.topOffset = topOffset;
    this.height = 256;
    this.color = "rgb(0,0,255)";
    this.firstNode = null;
    this.lastNode = null;
    this.addNode(v(10, 200), null, v(60, 100));
    this.addNode(v(300, 200), v(250, 300), v(300, 300));
    this.addNode(v(500, 200), v(450, 300), null);
    this.firstNode.next.style = "sharp";
  }

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
    if (node.controlLeft) this.drawControlLine(node, node.controlLeft);
    if (node.controlRight) return this.drawControlLine(node, node.controlRight);
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
    if (node.style === "sharp") {
      offset = 2.7;
      ctx.fillStyle = "rgb(255,0,0)";
      ctx.beginPath();
      ctx.fillRect(x - offset, y - offset, offset * 2, offset * 2);
      return ctx.strokeRect(x - offset, y - offset, offset * 2, offset * 2);
    } else {
      radius = 3;
      ctx.fillStyle = "rgb(0,255,0)";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.closePath();
      ctx.fill();
      return ctx.stroke();
    }
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

App = (function(_super) {

  __extends(App, _super);

  function App() {
    App.__super__.constructor.call(this);
    this.width = 800;
    this.height = 600;
    canvas.width = this.width;
    canvas.height = this.height;
    this.pan = v(0, 0);
    this.panSpeed = 3.0;
    this.zoom = 1.0;
    this.gridSize = 8;
    this.curves = [new Curve(32)];
    this.dragNode = null;
    this.dragControl = null;
    this.disectionNode = new DisectionNode();
  }

  App.prototype.updateDragging = function(dt) {
    var diff, mouse;
    if (this.dragPan) {
      mouse = core.canvasMouse();
      diff = v.sub(mouse, this.dragPan);
      this.pan = v.add(diff, this.pan);
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
      if (this.dragControl.parentNode.style === 'smooth') {
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
    return this.dragPan = null;
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
    var curve, menu, menuPos, mouse, node, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
    mouse = v.sub(core.canvasMouse(), this.pan);
    _ref = this.curves;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      curve = _ref[_i];
      if (mouse.y > curve.topOffset && mouse.y < curve.topOffset + curve.height) {
        this.disectionNode.move(mouse.x, curve.firstNode);
      }
    }
    if (this.disectionNode.coord) this.invalidate();
    if (core.input.down('pan-left')) {
      this.pan.x -= this.panSpeed;
      this.invalidate();
    } else if (core.input.down('pan-right')) {
      this.pan.x += this.panSpeed;
      this.invalidate();
    }
    if (core.input.down('pan-up')) {
      this.pan.y -= this.panSpeed;
      this.invalidate();
    } else if (core.input.down('pan-down')) {
      this.pan.y += this.panSpeed;
      this.invalidate();
    }
    if (core.input.pressed('left-mouse')) {
      $('.context-menu').fadeOut('fast');
      this.resetDrag();
      _ref2 = this.curves;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        curve = _ref2[_j];
        this.dragNode = curve.nodeAtMouse(this.pan);
        if (this.dragNode) this.dragNode.isSelected = true;
        if (!this.dragNode) {
          this.dragControl = curve.controlAtMouse(this.pan);
          if (this.dragControl) this.dragControl.isSelected = true;
        }
      }
      if (!this.dragNode && !this.dragControl) {
        if (this.disectionNode.isUnderMouse(this.pan)) {
          this.createNode();
        } else {
          this.dragPan = v(core.canvasMouse());
        }
      }
    }
    if (core.input.released('left-mouse')) this.resetDrag();
    if (core.input.pressed('right-mouse')) {
      _ref3 = this.curves;
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        curve = _ref3[_k];
        node = curve.nodeAtMouse(this.pan);
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
    return this.updateDragging(dt);
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
    var currY, curve, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
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
    ctx.translate(this.pan.x, this.pan.y);
    _ref2 = this.curves;
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      curve = _ref2[_j];
      curve.drawSegments();
    }
    this.disectionNode.draw();
    _ref3 = this.curves;
    for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
      curve = _ref3[_k];
      curve.drawNodes();
    }
    return ctx.restore();
  };

  return App;

})(core.App);

core.input.bind(core.key.LEFT_ARROW, 'pan-left');

core.input.bind(core.key.RIGHT_ARROW, 'pan-right');

core.input.bind(core.key.UP_ARROW, 'pan-up');

core.input.bind(core.key.DOWN_ARROW, 'pan-down');

core.input.bind(core.button.RIGHT, 'right-mouse');

core.input.bind(core.button.LEFT, 'left-mouse');

app = new App();

app.run();

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
  if (data.node) data.node.style = 'sharp';
  $('.context-menu').fadeOut('fast');
  return app.invalidate();
});
