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

var FunctionClass = require('./FunctionClass').FunctionClass,
    GlobalClass = require('./GlobalClass').GlobalClass,
    InstanceClass = require('./InstanceClass').InstanceClass,
    ObjClass = require('./ObjClass').ObjClass,
    PrimitiveClass = require('./PrimitiveClass').PrimitiveClass,
    util = require('./util'),
    isIdentifier = util.isIdentifier,
    setHiddenProp = util.setHiddenProp;

// determine hidden class of obj
function getHiddenClass(obj) {
	switch(typeof obj) {
	case "boolean":
		return PrimitiveClass.BOOLEAN;
	case "number":
		return PrimitiveClass.NUMBER;
	case "string":
		return PrimitiveClass.STRING;
	case "undefined":
		return PrimitiveClass.UNDEFINED;
	case "object":
	case "function":
		if(!obj)
			return PrimitiveClass.NULL;
		if(obj instanceof RegExp)
			return PrimitiveClass.REGEXP;
		if(hasHiddenClass(obj))
			return obj.__class;
		return typeof obj === "object" ? tagObjLit(obj, -1, -1) : tagFn(obj, -1, -1);
	default:
		throw new Error("cannot determine hidden class");
	}
}

function setHiddenClass(obj, klass) {
	setHiddenProp(obj, '__class', klass);
}

function hasHiddenClass(obj) {
	var tp = typeof obj;
	if(tp === 'object' || tp === 'function')
		return !obj || obj.hasOwnProperty('__class');
	return true;
}

function tagGlobal(global) {
	if(!global.hasOwnProperty('__class'))
		setHiddenProp(global, '__class', new GlobalClass(global));
	return global.__class;
}
	
function tagNew(obj, fn) {
	if(!obj.hasOwnProperty('__class') && fn.hasOwnProperty('__class'))
		setHiddenProp(obj, '__class', InstanceClass.from(fn));
	return obj.__class;
}
	
function tagFn(fn, line, offset) {
	if(!fn.hasOwnProperty('__class')) {
		var fnclass = FunctionClass.make(fn, line, offset);
	    setHiddenProp(fn, '__class', fnclass);
	    if(fn.prototype)
		    setHiddenProp(fn.prototype, '__class', fnclass.prototype_class);
	}
	return fn.__class;
}
	
function tagObjLit(obj, line, offset) {
	if(!obj.hasOwnProperty('__class'))
		setHiddenProp(obj, '__class', ObjClass.make(obj, line, offset));
	return obj.__class;
}

function tagMember(obj_klass, prop, val) {
	var val_klass = getHiddenClass(val);
	if (!isIdentifier("" + prop))
		prop = "*";
	obj_klass.setPropClass('$$' + prop, val_klass);
}

exports.getHiddenClass = getHiddenClass;
exports.setHiddenClass = setHiddenClass;
exports.hasHiddenClass = hasHiddenClass;
exports.tagGlobal = tagGlobal;
exports.tagNew = tagNew;
exports.tagFn = tagFn;
exports.tagObjLit = tagObjLit;
exports.tagMember = tagMember;