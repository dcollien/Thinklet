TAU = Math.PI*2

vary = (amt) -> 2 * amt * (Math.random() - 0.5)
rand = (amt) -> amt * Math.random()
randInt = (amt) -> Math.floor rand(amt)

lerp = (t, from, to) -> t * to + (1-t) * from

sq = (x) -> x * x
cube = (x) -> x * x * x

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


