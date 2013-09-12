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
	escape = require('../util').escape,
	UNKNOWN = tag.UNKNOWN;
 
function PropWrite(obj, prop, val, kind) {
	this.obj = obj;
	this.prop = prop;
	this.val = val;
	this.kind = kind || 'value';
}
PropWrite.prototype.toString = function() {
	return '    { "obj": ' + this.obj + ',\n' +
		   '      "prop": "' + escape(this.prop) + '",\n' +
		   '      "val": ' + this.val + ',\n' +
		   '      "kind": "' + this.kind + '" }';
};

PropWrite.cache = {};
PropWrite.make = function(obj, prop, val, kind) {
	if(obj !== UNKNOWN && val !== UNKNOWN) {
		var signature = obj._id + ':' + '$$' + prop + ':' + val._id;
		if(PropWrite.cache[signature]) {
			return null;
		} else {
			return PropWrite.cache[signature] = new PropWrite(obj, prop, val, kind);
		}
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

Return.cache = {};
Return.make = function(func, val) {
	if(func !== UNKNOWN && val != UNKNOWN) {
		var signature = func._id + ':' + val._id;
		if(Return.cache[signature]) {
			return null;
		} else {
			return Return.cache[signature] = new Return(func, val);
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