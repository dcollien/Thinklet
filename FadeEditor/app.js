var App, ControlNode, Curve, CurveNode, app, canvas, ctx,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

canvas = core.canvas;

ctx = core.ctx;

ControlNode = (function() {

  function ControlNode(coord, parentNode, type) {
    this.parentNode = parentNode;
    this.type = type;
    this.moveTo(coord);
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

  function CurveNode(coord, leftCP, rightCP) {
    this.moveTo(coord);
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
      this.controlRight.moveTo(rightVect);
      return this.controlRight.smooth();
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
    }
    if (this.controlLeft) {
      newControlX = this.controlLeft.x + nodeMove.x;
      if (this.prev && newControlX < this.prev.x) {
        coord.x = this.prev.x - (newControlX - coord.x);
      }
    }
    nodeMove = v.sub(coord, this);
    if (this.controlLeft) {
      this.controlLeft.moveTo(v.add(this.controlLeft, nodeMove));
    }
    if (this.controlRight) {
      this.controlRight.moveTo(v.add(this.controlRight, nodeMove));
    }
    this.x = coord.x;
    return this.y = coord.y;
  };

  return CurveNode;

})();

Curve = (function() {

  function Curve() {
    this.color = "rgb(0,0,255)";
    this.firstNode = null;
    this.lastNode = null;
    this.addNode(v(10, 200), null, v(60, 100));
    this.addNode(v(300, 200), v(250, 300), v(300, 300));
    this.addNode(v(500, 200), v(450, 300), null);
    this.firstNode.next.style = "sharp";
  }

  Curve.prototype.addNode = function(pos, leftCP, rightCP) {
    var node;
    node = new CurveNode(pos, leftCP, rightCP);
    if (this.firstNode === null) {
      this.firstNode = node;
      return this.lastNode = node;
    } else {
      node.prev = this.lastNode;
      this.lastNode.next = node;
      return this.lastNode = node;
    }
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
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgb(63,63,63)";
    ctx.fillStyle = "rgb(195,195,195)";
    ctx.beginPath();
    ctx.moveTo(to.x - offset, to.y);
    ctx.lineTo(to.x, to.y - offset);
    ctx.lineTo(to.x + offset, to.y);
    ctx.lineTo(to.x, to.y + offset);
    ctx.lineTo(to.x - offset, to.y);
    ctx.closePath();
    ctx.stroke();
    return ctx.fill();
  };

  Curve.prototype.drawControlPoints = function(node) {
    if (node.controlLeft) this.drawControlLine(node, node.controlLeft);
    if (node.controlRight) return this.drawControlLine(node, node.controlRight);
  };

  Curve.prototype.drawNode = function(node) {
    var offset, radius, x, y;
    x = node.x;
    y = node.y;
    if (node.style === "sharp") {
      offset = 2.7;
      ctx.lineWidth = 2;
      ctx.fillStyle = "rgb(255,0,0)";
      ctx.strokeStyle = "rgb(63,63,63)";
      ctx.beginPath();
      ctx.strokeRect(x - offset, y - offset, offset * 2, offset * 2);
      return ctx.fillRect(x - offset, y - offset, offset * 2, offset * 2);
    } else {
      radius = 3;
      ctx.lineWidth = 2;
      ctx.fillStyle = "rgb(0,255,0)";
      ctx.strokeStyle = "rgb(63,63,63)";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.closePath();
      ctx.stroke();
      return ctx.fill();
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

  Curve.prototype.draw = function() {
    var i, node, nodes, _i, _j, _len, _len2, _ref, _results;
    nodes = this.getNodes();
    for (i = 0, _ref = nodes.length - 1; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
      this.drawCurveSegment(nodes[i], nodes[i + 1]);
    }
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
    this.curve = new Curve;
    this.dragNode = null;
    this.dragControl = null;
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
      this.dragNode.moveTo(mouse);
      return this.invalidate();
    } else if (this.dragControl) {
      mouse = v.sub(core.canvasMouse(), this.pan);
      this.dragControl.moveTo(mouse);
      if (this.dragControl.parentNode.style === 'smooth') {
        this.dragControl.smooth();
      }
      return this.invalidate();
    }
  };

  App.prototype.update = function(dt) {
    var menu, menuPos, node;
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
      this.dragNode = this.curve.nodeAtMouse(this.pan);
      this.dragControl = this.curve.controlAtMouse(this.pan);
      if (!this.dragNode && !this.dragControl) {
        this.dragPan = v(core.canvasMouse());
      }
    }
    if (core.input.released('left-mouse')) {
      this.dragNode = null;
      this.dragControl = null;
      this.dragPan = null;
    }
    if (core.input.pressed('right-mouse')) {
      node = this.curve.nodeAtMouse(this.pan);
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
    gridSize = 10;
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
    App.__super__.draw.call(this);
    this.drawBackground();
    this.drawGrid();
    ctx.save();
    ctx.translate(this.pan.x, this.pan.y);
    this.curve.draw();
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
