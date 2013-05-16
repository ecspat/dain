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
 
/*global BOOLEAN NUMBER STRING UNDEFINED NULL REGEXP ObjClass FunctionClass InstanceClass GlobalClass setHiddenProp*/

function getHiddenClass(obj) {
	switch(typeof obj) {
	case "boolean":
		return BOOLEAN;
	case "number":
		return NUMBER;
	case "string":
		return STRING;
	case "undefined":
		return UNDEFINED;
	case "object":
	case "function":
		if(!obj)
			return NULL;
		if(obj instanceof RegExp)
			return REGEXP;
		return obj.__class || (typeof obj === "object" ? tagObjLit(obj, -1, -1) : tagFn(obj, -1, -1));
	default:
		throw new Error("cannot determine hidden class");
	}
}

function hasHiddenClass(obj) {
	var tp = typeof obj;
	if(tp === 'object' || tp === 'function')
		return !obj || obj.__class;
	return true;
}

function tagGlobal(global) {
	if(!global.hasOwnProperty('__class'))
		setHiddenProp(global, '__class', new GlobalClass(global));
	return global.__class;
}
	
function tagNew(obj, fn) {
	if(!obj.hasOwnProperty('__class'))
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