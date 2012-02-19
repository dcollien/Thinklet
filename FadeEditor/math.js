var TAU, Vect, approxBezierDisectionParameter, cube, cubicBezier, cubicBezierAtX, cubicDeCasteljau, invertedCubicDeCasteljau, lerp, lineX, lineY, rand, randInt, sq, v, vary;

TAU = Math.PI * 2;

vary = function(amt) {
  return 2 * amt * (Math.random() - 0.5);
};

rand = function(amt) {
  return amt * Math.random();
};

randInt = function(amt) {
  return Math.floor(rand(amt));
};

lerp = function(t, from, to) {
  return t * to + (1 - t) * from;
};

sq = function(x) {
  return x * x;
};

cube = function(x) {
  return x * x * x;
};

cubicBezier = function(t, p0, p1, p2, p3) {
  var q0, q1, q2, q3;
  q0 = v.mul(p0, cube(1 - t));
  q1 = v.mul(p1, 3 * (sq(1 - t)) * t);
  q2 = v.mul(p2, 3 * (1 - t) * (sq(t)));
  q3 = v.mul(p3, cube(t));
  return v.add(v.add(v.add(q0, q1), q2), q3);
};

cubicBezierAtX = function(x, p0, p1, p2, p3, tolerance) {
  var lower, result, t, upper;
  if (!tolerance) tolerance = 0.05;
  t = 0.5;
  lower = 0.0;
  upper = 1.0;
  result = cubicBezier(t, p0, p1, p2, p3);
  while ((Math.abs(result.x - x)) > tolerance) {
    if (result.x < x) {
      lower = t;
      t = lerp(0.5, t, upper);
    } else {
      upper = t;
      t = lerp(0.5, t, lower);
    }
    result = cubicBezier(t, p0, p1, p2, p3);
  }
  return t;
};

cubicDeCasteljau = function(t, p0, p1, p2, p3) {
  var q0, q1, q2, r0, r1;
  q0 = v.lerp(t, p0, p1);
  q1 = v.lerp(t, p1, p2);
  q2 = v.lerp(t, p2, p3);
  r0 = v.lerp(t, q0, q1);
  r1 = v.lerp(t, q1, q2);
  return [r0, r1, q0, q2];
};

approxBezierDisectionParameter = function(p2, q0, q1) {
  var t, tX, tY, xDenom, yDenom;
  tX = 0.5;
  tY = 0.5;
  yDenom = q1.y - p2.y;
  xDenom = q1.x - p2.x;
  if (yDenom !== 0) tY = (q0.y - p2.y) / yDenom;
  if (xDenom !== 0) tX = (q0.x - p2.x) / xDenom;
  if (yDenom === 0) {
    t = tX;
  } else if (xDenom === 0) {
    t = tY;
  } else {
    t = (tX + tY) * 0.5;
  }
  return t;
};

invertedCubicDeCasteljau = function(t, p0, p1, q2, q3) {
  var r1, r2;
  r1 = v.div(v.sub(p1, v.mul(p0, 1 - t)), t);
  r2 = v.div(v.sub(q2, v.mul(q3, t)), 1 - t);
  return [r1, r2];
};

Vect = function(x, y) {
  this.x = x;
  this.y = y;
};

Vect.prototype.len = function() {
  return Math.sqrt(sq(this.x) + sq(this.y));
};

Vect.prototype.angle = function() {
  return Math.atan2(this.y, this.x);
};

v = function(x, y) {
  if (y === void 0) {
    return new Vect(x.x, x.y);
  } else {
    return new Vect(x, y);
  }
};

v.rotate = function(v1, v2) {
  return v(v1.x * v2.x - v1.y * v2.y, v1.x * v2.y + v1.y * v2.x);
};

v.forAngle = function(a) {
  return v(Math.cos(a), Math.sin(a));
};

v.add = function(v1, v2) {
  return v(v1.x + v2.x, v1.y + v2.y);
};

v.sub = function(v1, v2) {
  return v(v1.x - v2.x, v1.y - v2.y);
};

v.mul = function(v1, s) {
  return v(v1.x * s, v1.y * s);
};

v.div = function(v1, s) {
  return v(v1.x / s, v1.y / s);
};

v.dot = function(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y;
};

v.unit = function(v1) {
  var len;
  len = v1.len();
  return v(v1.x / len, v1.y / len);
};

v.lerp = function(t, v1, v2) {
  return v(lerp(t, v1.x, v2.x), lerp(t, v1.y, v2.y));
};

v.eq = function(v1, v2) {
  return v1.x === v2.x && v1.y === v2.y;
};

v.map = function(f, v1) {
  return v(f(v1.x), f(v1.y));
};

lineX = function(y, line) {
  var dx, dy, p0, p1;
  p0 = line[0];
  p1 = line[1];
  dy = p1.y - p0.y;
  dx = p1.x - p0.x;
  return (dx / dy) * (y - p0.y) + p0.x;
};

lineY = function(x, line) {
  var dx, dy, p0, p1;
  p0 = line[0];
  p1 = line[1];
  dy = p1.y - p0.y;
  dx = p1.x - p0.x;
  return (dy / dx) * (x - p0.x) + p0.y;
};
