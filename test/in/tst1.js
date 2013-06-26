function A(x, y) {
    this.x = x;
    this[0] = y;
}
A.z = {
    "the value\r of 'z'\n": 42,
    "\\": 56
};
A.prototype.m = function() {};
var a = new A(23, 'hello');
