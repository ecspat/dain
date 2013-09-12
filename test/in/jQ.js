var $;
(function() {
	function jQ(elts) {
		for (var i = 0; i < elts.length; ++i)
		this[i] = elts[i];
		this.length = elts.length;
	}
	$ = function(n, cb) {
		var elts = document.getElementsByTagName(n);
		cb(new jQ(elts));
	};
	jQ.prototype = {
		extend: function extend(obj) {
			for (var p in obj) {
				this[p] = obj[p];
			}
		}
	};
	jQ.prototype.extend({
		isEmpty: function() {
			return this.length === 0;
		}
	});
	var props = ["Height", "Width"];
	props.forEach(function(prop) {
		jQ.prototype["set" + prop] = function() {
			// code to set property prop
		};
	});
})();
