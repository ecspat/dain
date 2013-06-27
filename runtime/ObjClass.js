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

/*global require exports */

var HiddenClass = require('./HiddenClass').HiddenClass,
    mkProperty = require('./ast').mkProperty;

/** An ObjClass represents all objects arising from a textual object literal. */
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

ObjClass.prototype.generate_asg = function(decls) {
	if(this.asg)
		return this.asg;
		
	var props = [];
	this.asg = { type: 'ObjectExpression',
				 properties: props,
				 temp_name: this.mkTempName() };
		
	for(var p in this.properties)
		if(p.substring(0, 2) === '$$') {
			props.push(mkProperty(p.substring(2), this.properties[p].generate_asg(decls)));
		}

	return this.asg;
};

ObjClass.prototype.isEmpty = function() {
	for(var p in this.properties)
		if(p.substring(0, 2) === '$$')
			return false;
	return true;
};

exports.ObjClass = ObjClass;