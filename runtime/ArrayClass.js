/*******************************************************************************
 * Copyright (c) 2013 Max Schaefer.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     Max Schaefer - initial API and implementation
 *******************************************************************************/

/*global HiddenClass*/

function ArrayClass(ary, line, offset) {
	HiddenClass.call(this);
	this.ary = ary;
	this.line = line;
	this.offset = offset;
}
ArrayClass.prototype = Object.create(HiddenClass.prototype);

ArrayClass.cache = {};
ArrayClass.make = function(ary, line, offset) {
	if(line !== -1 && offset !== -1) {
		var id = "arraylit_" + line + "_" + offset;
		var aryclass = ArrayClass.cache[id];
		if(!aryclass)
			ArrayClass.cache[id] = aryclass = new ArrayClass(ary, line, offset);
		return aryclass;
	} else {
		return new ArrayClass(ary, line, offset);
	}
};

ArrayClass.prototype.mkTempName = function() {
	return this.line === -1 || this.offset === -1 ? "arraylit_" + this.id : "arraylit_" + this.line + "_" + this.offset;
};