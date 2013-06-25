var cbs = [];

function register(cb) {
	cbs.push(cb);
}

function invoke() {
	for(var i=0,n=cbs.length;i<n;++i) {
		var cb = cbs[i];
		cb();
	}
}