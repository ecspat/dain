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
 
var tag = require('./Tag'),
	sets = require('./sets'),
	jsesc = require('jsesc'),
	UNKNOWN = tag.UNKNOWN;
 
function PropWrite(obj, prop, val, kind) {
	this.obj = obj;
	this.prop = prop;
	this.val = val;
	this.kind = kind || 'value';
}
PropWrite.prototype.toString = function() {
	return '    { "obj": ' + this.obj + ',\n' +
		   '      "prop": ' + jsesc(this.prop, { json: true }) + ',\n' +
		   '      "val": ' + this.val + ',\n' +
		   '      "kind": "' + this.kind + '" }';
};

PropWrite.make = function(obj, prop, val, kind) {
	if(obj !== UNKNOWN && val !== UNKNOWN) {
		if(!obj._pw_cache) {
			obj._pw_cache = [];
		} else if(sets.contains(obj._pw_cache['$$' + prop], val._id)) {
			return null;
		}
		obj._pw_cache['$$' + prop] = sets.add(obj._pw_cache['$$' + prop], val._id);
		return new PropWrite(obj, prop, val, kind);
	}
};

function Return(func, val) {
	this.func = func;
	this.val = val;
}
Return.prototype.toString = function() {
	return '    { "func": ' + this.func + ',\n' +
		   '      "val": ' + this.val + ' }';
};

Return.make = function(func, val) {
	if(func !== UNKNOWN && val != UNKNOWN) {
		if(sets.contains(func._ret_cache, val._id)) {
			return null;
		} else {
			func._ret_cache = sets.add(func._ret_cache, val._id);
			return new Return(func, val);
		}
	}
};

function Callback(callee, args, kind) {
	this.callee = callee;
	this.args = args;
	this.kind = kind || 'function';
}
Callback.prototype.toString = function() {
	var args_str = "[ ";
	for(var i=0,n=this.args.length;i<n;++i) {
		args_str += (i ? ', ' : '') + this.args[i];
	}
	args_str += " ]";
	
	return '    { "callee": ' + this.callee + ',\n' +
		   '      "args": ' + args_str + ',\n' +
		   '      "kind": "' + this.kind + '" }';
};

Callback.make = function(callee, args, kind) {
	if(callee == UNKNOWN) {
		return;
	}
	for(var i=0,n=args.length;i<n;++i) {
		if(args[i] === UNKNOWN) {
			return;
		}
	}
	var signature = "";
	for(i=0;i<n;++i) {
		signature += args[i]._id + ",";
	}
	if(!callee._cb_cache) {
		callee._cb_cache = [];
	} else if(callee._cb_cache[signature]) {
		return null;
	}
	callee._cb_cache[signature] = true;
	return new Callback(callee, args, kind);
};

exports.PropWrite = PropWrite;
exports.Return = Return;
exports.Callback = Callback;