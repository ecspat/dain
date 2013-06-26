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

function ObjClass(obj, line, offset) {
	HiddenClass.call(this);
	this.obj = obj;
	this.line = line;
	this.offset = offset;
}
ObjClass.prototype = Object.create(HiddenClass.prototype);

ObjClass.cache = {};
ObjClass.make = function(obj, line, offset) {
	if(line !== -1 && offset !== -1) {
		var id = "objlit_" + line + "_" + offset;
		var objclass = ObjClass.cache[id];
		if(!objclass)
			ObjClass.cache[id] = objclass = new ObjClass(obj, line, offset);
		return objclass;
	} else {
		return new ObjClass(obj, line, offset);
	}
};

ObjClass.prototype.mkTempName = function() {
	return this.line === -1 || this.offset === -1 ? "objlit_" + this.id : "objlit_" + this.line + "_" + this.offset;
};