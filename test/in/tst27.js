function f(g, x) {
	g.call(x, 23);
	g.call(x, 'hello');
}