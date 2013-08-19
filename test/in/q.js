function Q() {
	return {
		foo: "bar"
    };
}
Q.foo = function() {
    Q();
	Q.bar = true;
};