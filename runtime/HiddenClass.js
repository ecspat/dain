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

/*global BOOLEAN NUMBER STRING UNDEFINED NULL REGEXP tagObjLit tagFn UnionClass */

/** Superclass of all hidden classes. */
function HiddenClass() {
	this.properties = {};
	this.unions = [];
	this.id = HiddenClass.nextId++;
}
HiddenClass.nextId = 0;
	
HiddenClass.prototype.setPropClass = function(prop, klass) {
	if(!this.properties[prop])
		this.properties[prop] = klass;
	else
		this.properties[prop] = this.properties[prop].unionWith(klass);
};

HiddenClass.prototype.unionWith = function(that) {
	if(this.id === that.id)
		return this;
		
	// avoid creating nested union classes
	if(that instanceof UnionClass) {
		var res = this;
		that.members.forEach(function(member) {
			res = res.unionWith(member);
		});
		return res;
	} else {
		return new UnionClass(this, that);
	}
};

// determine hidden class of obj
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
		if(obj.hasOwnProperty('__class'))
			return obj.__class;
		return typeof obj === "object" ? tagObjLit(obj, -1, -1) : tagFn(obj, -1, -1);
	default:
		throw new Error("cannot determine hidden class");
	}
}

function hasHiddenClass(obj) {
	var tp = typeof obj;
	if(tp === 'object' || tp === 'function')
		return !obj || obj.hasOwnProperty('__class');
	return true;
}
