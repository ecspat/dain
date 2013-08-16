function f(g) {
    try {
	debugger;
	return g();
    } catch(e) {
	return e;
    }
}