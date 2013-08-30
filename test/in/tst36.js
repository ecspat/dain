try {
	throw "Hi!";
} catch(e) {
	if(typeof e !== "string") {
		throw e;
	}
}