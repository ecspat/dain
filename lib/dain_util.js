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

/*global exports*/

var Object_defineProperty = Object.defineProperty,
    Object_prototype_hasOwnProperty = Object.prototype.hasOwnProperty,
    Function_prototype_apply = Function.prototype.apply,
    String_prototype_match = String.prototype.match,
    String_prototype_charCodeAt = String.prototype.charCodeAt,
    Array_prototype_join = Array.prototype.join;

// utility function for setting a non-enumerable, immutable property
var setHiddenProp = exports.setHiddenProp = function(obj, prop, val) {
	Object_defineProperty(obj, prop, { enumerable: false, writable: false, configurable: true, value: val });
	return val;
};

// substitute for Function.prototype.apply in case it gets monkey patched
var apply = exports.apply = function(fn, recv, args) {
	if(!fn) {
		// provoke exception
		fn();
	} else if(fn.apply === Function_prototype_apply) {
		return fn.apply(recv, args);
	} else {
		var app = "__apply__", i = 0;
		while(app in fn) {
			app = "__apply__" + (i++);
		}
		setHiddenProp(fn, app, Function_prototype_apply);
		try {
			return fn[app](recv, args);
		} finally {
			delete fn[app];
		}
	}
};

var hasOwnProperty = exports.hasOwnProperty = function(obj, prop) {
	return apply(Object_prototype_hasOwnProperty, obj, [prop]);
};

// checks whether obj has an own property prop; if so, returns it; otherwise, creates a hidden
// property prop with value deflt
exports.getOrCreateHiddenProp = function(obj, prop, deflt) {
	return hasOwnProperty(obj, prop) ? obj[prop] : setHiddenProp(obj, prop, deflt);
};
	
// utility function for adding element to array if it isn't in there yet
var add = exports.add = function(array, elt) {
	for(var i=0,n=array.length;i<n;++i)
		if(array[i] === elt)
			return;
	array[i] = elt;
};

exports.addAll = function(array1, array2) {
	for(var i=0,n=array2.length;i<n;++i) {
		add(array1, array2[i]);
	}
};

// utility function for doing 1-level comparison of arrays
exports.array_eq = function(a, b) {
	if(a.length !== b.length)
		return false;
	for(var i=0,n=a.length;i<n;++i)
		if(a[i] !== b[i])
			return false;
	return true;
};

// rough check whether a given string is a valid identifier
exports.isIdentifier = function(str) {
	return apply(String_prototype_match, str+"", [/^[a-zA-Z_$][0-9a-zA-Z_$]*$/]);
};

exports.forEach = function(obj, cb) {
	var res = {};
	for(var p in obj)
		res[p] = cb(p, obj[p]);
	return res;
};

exports.array_join = function(ary, str) {
	return apply(Array_prototype_join, ary, [str]);
};

// I feel stupid for not finding a library that implements this...
exports.escape = function(str) {
	var res = "";
	str = str + "";
	for(var i=0,n=str.length;i<n;++i) {
		var c = str[i];
		if(c === '"' || c === '\\') {
			res += '\\' + c;
		} else {
		    var cc = apply(String_prototype_charCodeAt, c, [0]);
			if(cc <= 0x1f) {
				var ccs = cc.toString(16);
				for(var j=ccs.length;j<4;++j) {
					ccs = "0" + ccs;
				}
				res += '\\u' + ccs;
			} else {
				res += c;
			}
		}
	}
	return res;
};