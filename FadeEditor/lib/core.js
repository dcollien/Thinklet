var App, ascii, c, core, requestAnimationFrame, _base, _ref, _ref2,
  __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

if ((_base = Function.prototype).bind == null) {
  _base.bind = function(new_this) {
    var _this = this;
    return function() {
      return _this.apply(new_this, arguments);
    };
  };
}

window.core = core = {};

core.input = {
  _bindings: {},
  _down: {},
  _pressed: {},
  _released: [],
  mouse: {
    x: 0,
    y: 0
  },
  bind: function(key, action) {
    return this._bindings[key] = action;
  },
  onkeydown: function(e) {
    var action;
    action = this._bindings[core.eventCode(e)];
    if (!action) return;
    if (!this._down[action]) this._pressed[action] = true;
    this._down[action] = true;
    e.stopPropagation();
    return e.preventDefault();
  },
  onkeyup: function(e) {
    var action;
    action = this._bindings[core.eventCode(e)];
    if (!action) return;
    this._released.push(action);
    e.stopPropagation();
    return e.preventDefault();
  },
  clearPressed: function() {
    var action, _i, _len, _ref;
    _ref = this._released;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      action = _ref[_i];
      this._down[action] = false;
    }
    this._released = [];
    return this._pressed = {};
  },
  pressed: function(action) {
    return this._pressed[action];
  },
  down: function(action) {
    return this._down[action];
  },
  released: function(action) {
    return __indexOf.call(this._released, action) >= 0;
  },
  onmousemove: function(e) {
    this.mouse.x = e.pageX - core.canvas.offsetLeft;
    return this.mouse.y = e.pageY - core.canvas.offsetTop;
  },
  onmousedown: function(e) {
    return this.onkeydown(e);
  },
  onmouseup: function(e) {
    return this.onkeyup(e);
  },
  onmousewheel: function(e) {
    this.onkeydown(e);
    return this.onkeyup(e);
  },
  oncontextmenu: function(e) {
    if (this._bindings[core.button.RIGHT]) {
      e.stopPropagation();
      return e.preventDefault();
    }
  }
};

core.update = function() {
  var deadIdxs, i, idx, _i, _len, _ref, _results;
  deadIdxs = [];
  if (core.apps) {
    for (i = 0, _ref = core.apps.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
      if (core.apps[i]) {
        core.apps[i].step();
      } else {
        deadIdxs.push(i);
      }
    }
    _results = [];
    for (_i = 0, _len = deadIdxs.length; _i < _len; _i++) {
      idx = deadIdxs[_i];
      _results.push(core.apps.splice(idx, 1));
    }
    return _results;
  }
};

core.apps = [];

core.registerApp = function(app) {
  return core.apps.push(app);
};

core.screenMouse = function() {
  return core.toGlobal(core.input.mouse);
};

core.toGlobal = function(coord) {
  return {
    x: core.canvas.offsetLeft + coord.x,
    y: core.canvas.offsetTop + coord.y
  };
};

core.canvasMouse = function() {
  return core.input.mouse;
};

/*
	'keydown',
	'keyup',
	'mousedown',
	'mouseup',
	'mousewheel',
	'mousemove',
	'contextmenu'
*/

core.button = {
  LEFT: -1,
  MIDDLE: -2,
  RIGHT: -3,
  WHEELDOWN: -4,
  WHEELUP: -5
};

core.key = {
  TAB: 9,
  ENTER: 13,
  ESC: 27,
  SPACE: 32,
  LEFT_ARROW: 37,
  UP_ARROW: 38,
  RIGHT_ARROW: 39,
  DOWN_ARROW: 40
};

ascii = function(c) {
  return c.charCodeAt(0);
};

for (c = _ref = ascii('A'), _ref2 = ascii('Z'); _ref <= _ref2 ? c <= _ref2 : c >= _ref2; _ref <= _ref2 ? c++ : c--) {
  core.key[String.fromCharCode(c)] = c;
}

core.eventCode = function(e) {
  if (e.type === 'keydown' || e.type === 'keyup') {
    return e.keyCode;
  } else if (e.type === 'mousedown' || e.type === 'mouseup') {
    switch (e.button) {
      case 0:
        return core.button.LEFT;
      case 1:
        return core.button.MIDDLE;
      case 2:
        return core.button.RIGHT;
    }
  } else if (e.type === 'mousewheel') {
    if (e.wheel > 0) {
      return core.button.WHEELUP;
    } else {
      return core.button.WHEELDOWN;
    }
  }
};

core.canvas = document.getElementsByTagName('canvas')[0];

core.ctx = core.canvas.getContext('2d');

core.canvas.onmousemove = core.input.onmousemove.bind(core.input);

core.canvas.onmousedown = core.input.onmousedown.bind(core.input);

core.canvas.onmouseup = core.input.onmouseup.bind(core.input);

core.canvas.onmousewheel = core.input.onmousewheel.bind(core.input);

core.canvas.oncontextmenu = core.input.oncontextmenu.bind(core.input);

document.onkeydown = core.input.onkeydown.bind(core.input);

document.onkeyup = core.input.onkeyup.bind(core.input);

document.onmouseup = core.input.onmouseup.bind(core.input);

requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
  return window.setTimeout(callback, 1000 / 60);
};

App = (function() {

  function App() {
    this.fps = 30;
    this.time = 0;
    this.invalidated = true;
  }

  App.prototype.update = function(dt) {};

  App.prototype.invalidate = function() {
    return this.invalidated = true;
  };

  App.prototype.draw = function() {
    return this.invalidated = false;
  };

  App.prototype.run = function() {
    var s, self;
    this.running = true;
    self = this;
    s = function() {
      self.step();
      if (self.running) return requestAnimationFrame(s);
    };
    this.last_step = Date.now();
    return s();
  };

  App.prototype.stop = function() {
    return this.running = false;
  };

  App.prototype.step = function() {
    var dt, now;
    now = Date.now();
    dt = (now - this.last_step) / 1000;
    this.last_step = now;
    this.time += dt;
    this.update(dt);
    if (this.invalidated) this.draw();
    return core.input.clearPressed();
  };

  return App;

})();

core.App = App;
