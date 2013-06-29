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

// utility function for setting a non-enumerable, writable property
exports.setHiddenProp = function(obj, prop, val) {
	Object.defineProperty(obj, prop, { enumerable: false, writable: true, value: val });
	return val;
};

// checks whether obj has an own property prop; if so, returns it; otherwise, creates a hidden
// property prop with value deflt
exports.getOrCreateHiddenProp = function(obj, prop, deflt) {
	return obj.hasOwnProperty(prop) ? obj[prop] : exports.setHiddenProp(obj, prop, deflt);
};
	
// utility function for adding element to array if it isn't in there yet
exports.add = function(array, elt) {
	for(var i=0;i<array.length;++i)
		if(array[i] === elt)
			return;
	array[i] = elt;
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
	return String(str).match(/^[a-zA-Z_$][0-9a-zA-Z_$]*$/);
};

exports.forEach = function(obj, cb) {
	var res = {};
	for(var p in obj)
		res[p] = cb(p, obj[p]);
	return res;
};

exports.isObject = function(x) {
	return x && (typeof x === 'function' || typeof x === 'object');
};