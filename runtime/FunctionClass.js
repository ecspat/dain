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

/*global HiddenClass ObjClass getHiddenClass setHiddenProperty add*/

function FunctionClass(fn, line, offset) {
	HiddenClass.call(this);
	this.fn = fn;
	this.line = line;
	this.offset = offset;
	this.prototype_class = new ObjClass(fn.prototype, line, offset);
	this.setPropClass('$$prototype', this.prototype_class);
	this.client_obj_classes = [];
	this.used_params = [];
}
FunctionClass.prototype = Object.create(HiddenClass.prototype);

FunctionClass.cache = {};
FunctionClass.make = function(fn, line, offset) {
	if(line !== -1 && offset !== -1) {
		var id = "function_" + line + "_" + offset;
		var fnclass = FunctionClass.cache[id];
		if(!fnclass)
			FunctionClass.cache[id] = fnclass = new FunctionClass(fn, line, offset);
		return fnclass;
	} else {
		return new FunctionClass(fn, line, offset);
	}
};

FunctionClass.prototype.mkTempName = function() {
	return this.line === -1 || this.offset === -1 ? "function_" + this.id : "function_" + this.line + "_" + this.offset;
};