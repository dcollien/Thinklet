var TAU, Vect, cube, lerp, rand, randInt, sq, v, vary;

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

v.dot = function(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y;
};

v.unit = function(v1) {
  var len;
  len = v1.len();
  return v(v1.x / len, v1.y / len);
};
