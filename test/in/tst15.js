var Deferred = function() {
		var cb, list;
		list = {
			add: function(fn) {
				cb = fn;
				return this;
			}
		};

		return {
			resolve: function(arg) {
				cb.call({
					done: list.add
				}, arg);
			},
			done: list.add
		};
	};