function A() {}
A.prototype.foo = 23;
var a = Object.create(A.prototype);