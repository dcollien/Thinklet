TAU = Math.PI*2

vary = (amt) -> 2 * amt * (Math.random() - 0.5)
rand = (amt) -> amt * Math.random()
randInt = (amt) -> Math.floor rand(amt)

lerp = (t, from, to) -> t * to + (1-t) * from

sq = (x) -> x * x
cube = (x) -> x * x * x


# Bezier helpers
cubicBezier = (t, p0, p1, p2, p3) ->
	q0 = v.mul p0, (cube (1-t))
	q1 = v.mul p1, (3 * (sq (1-t)) * t)
	q2 = v.mul p2, (3 * (1-t) * (sq t))
	q3 = v.mul p3, (cube t)
	
	return v.add (v.add (v.add q0, q1), q2), q3
	
cubicBezierAtX = (x, p0, p1, p2, p3, tolerance) ->
	tolerance = 0.1 if not tolerance
	
	t = 0.5
	lower = 0.0
	upper = 1.0
	result = cubicBezier t, p0, p1, p2, p3
	while (Math.abs (result.x - x)) > tolerance
		if result.x < x
			lower = t
			t = lerp 0.5, t, upper
		else
			upper = t
			t = lerp 0.5, t, lower
		result = cubicBezier t, p0, p1, p2, p3
	return t

cubicDeCasteljau = (t, p0, p1, p2, p3) ->
	q0 = v.lerp t, p0, p1
	q1 = v.lerp t, p1, p2
	q2 = v.lerp t, p2, p3
	r0 = v.lerp t, q0, q1
	r1 = v.lerp t, q1, q2
	return [r0, r1, q0, q2]
	

	
# Immutable type
Vect = (@x, @y) ->
Vect::len = -> Math.sqrt (sq(@x) + sq(@y))
Vect::angle = -> Math.atan2 @y, @x

# vector functions
v = (x,y) ->
	if y is undefined
		new Vect x.x, x.y
	else
		new Vect x, y
	
v.rotate = (v1, v2) -> v(v1.x*v2.x - v1.y*v2.y, v1.x*v2.y + v1.y*v2.x)
v.forAngle = (a) ->	v(Math.cos(a), Math.sin(a))
v.add = (v1, v2) -> v(v1.x+v2.x, v1.y+v2.y)
v.sub = (v1, v2) -> v(v1.x-v2.x, v1.y-v2.y)
v.mul = (v1, s) -> v(v1.x*s, v1.y*s)
v.dot = (v1, v2) -> v1.x*v2.x + v1.y*v2.y
v.unit = (v1) ->
	len = v1.len( )
	v(v1.x/len, v1.y/len)
v.lerp = (t, v1, v2) -> v( (lerp t, v1.x, v2.x), (lerp t, v1.y, v2.y) )
v.eq = (v1, v2) -> v1.x == v2.x and v1.y == v2.y

