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
 
 var util = require('../util'),
     builtins = require('./builtins'),
     tags = require('./Tag'),
     Tag = tags.Tag,
     GLOBAL = tags.GLOBAL,
     UNDEFINED = tags.UNDEFINED,
     BOOLEAN = tags.BOOLEAN,
     NUMBER = tags.NUMBER,
     STRING = tags.STRING,
     NULL = tags.NULL,
     REGEXP = tags.REGEXP,
     UNKNOWN = tags.UNKNOWN;
     
/** The observer is notified by the dynamic instrumentation framework of events happening in the instrumented program. */
function Observer() {
	this.current_fn = [];
	this.prop_writes = [];
	this.returns = [];
	this.callbacks = [];
}

Observer.prototype.tagGlobal = function(global) {
	var tag = GLOBAL;
	util.setHiddenProp(global, '__tag', tag);
	builtins.tagBuiltins(global);
	return tag;
};

Observer.prototype.setGlobal = function(global) {
	this.global = global;
};

var tagLiteral = Observer.prototype.tagLiteral = function(pos, lit) {
	var tp = typeof lit, tag;
	switch(tp) {
	case 'undefined':
		return UNDEFINED;
	case 'boolean':
		return BOOLEAN;
	case 'number':
		return NUMBER;
	case 'string':
		return STRING;
	case 'object':
		if(!lit)
			return NULL;
		if(lit instanceof RegExp)
			return REGEXP;
		if(lit.hasOwnProperty('__tag')) {
			tag = lit.__tag;
		} else {
			tag = new Tag({ type: Array.isArray(lit) ? 'array' : 'object', pos: pos });
			util.setHiddenProp(lit, '__tag', tag);
		}
		return tag;
	case 'function':
		if(lit.hasOwnProperty('__tag')) {
			tag = lit.__tag;
		} else {
			tag = new Tag({ type: 'function', pos: pos });
			util.setHiddenProp(lit, '__tag', tag);
		}
		return tag;
	}
};

Observer.prototype.tagGetter = Observer.prototype.tagSetter = function(pos, acc) {
	return tagLiteral(null, acc);
};

Observer.prototype.defineGetter = function(obj, prop, getter) {
};

Observer.prototype.defineSetter = function(obj, prop, setter) {
};

Observer.prototype.tagForInVar = function() {
	return STRING;
};

Observer.prototype.tagNativeArgument = function(callee, arg, idx) {
	if(arg && arg.hasOwnProperty('__tag'))
		return arg.__tag;
		
	if (callee.hasOwnProperty('__tag')) {
		var tag = callee.__tag.mkClientObjTag(idx);
		if (Object(arg) === arg) {
			util.setHiddenProp(arg, '__tag', tag);
		}
		return tag;
	} else {
		return UNKNOWN;
	}
};

var tagNative =
Observer.prototype.tagNativeResult =
Observer.prototype.tagNewNativeInstance =
Observer.prototype.tagNativeException =
Observer.prototype.tagCallee = function(res) {
	// check whether it is an object
	if(Object(res) === res) {
		// maybe the object is already tagged?
		if(res.hasOwnProperty('__tag'))
			return res.__tag;
			
		// maybe it is an instance of a function we know?
		var proto = Object.getPrototypeOf(res);
		if(proto.hasOwnProperty('__tag') && proto.__tag.default_proto_of) {
			var fn = proto.__tag.default_proto_of;
			var tag = fn.mkNewTag();
			return util.setHiddenProp(res, '__tag', tag);
		}
		
		// nope, it's just some object
		return util.setHiddenProp(res, '__tag', UNKNOWN);
	} else {
		return tagLiteral(null, res);
	}
};

Observer.prototype.tagNativeProperty = function(obj, prop, val) {
	return tagNative(val);
};

Observer.prototype.tagNewInstance = function(res, callee, args) {
	return callee.getTag().mkNewTag();
};

Observer.prototype.tagDefaultPrototype = function(fn) {
	var tag = fn.getTag().mkProtoTag();
	return util.setHiddenProp(fn.getValue().prototype, '__tag', tag);
};

Observer.prototype.tagUnOpResult = function(res) {
	return tagLiteral(null, res);
};

Observer.prototype.tagBinOpResult = function(res) {
	return tagLiteral(null, res);
};

Observer.prototype.tagPropRead = function(val, obj, prop, stored_tag) {
	return stored_tag;
};

Observer.prototype.tagPropWrite = function(obj, prop, val) {
	this.prop_writes.push({ obj: obj.getTag(), prop: prop.getValue(), val: val.getTag() });
	return val.getTag();
};

Observer.prototype.enterFunction = function(pos, fn) {
	this.current_fn.push(fn);
};

Observer.prototype.leaveFunction = function() {
	this.current_fn.pop();
};

// record return value, unless it's undefined
Observer.prototype.returnFromFunction = function(retval) {
	if(retval.getValue() !== void(0)) {
		var fn = this.current_fn[this.current_fn.length-1];
		this.returns.push({ func: fn.getTag(), val: retval.getTag() });
	}
};

Observer.prototype.funcall = function(pos, callee, recv, args, kind) {
	kind = kind || 'function';
	if (callee.getTag().type === 'clientobj') {
		this.callbacks.push({
			callee: callee.getTag(),
			args: [recv && recv.getTag() || this.tagLiteral(null, recv)].concat(args.map(function(v) {
				return v.getTag();
			})),
			kind: kind
		});
	}
};

Observer.prototype.newexpr = function(pos, callee, args) {
	this.funcall(pos, callee, null, args, 'new');
};

// generate model
function filter_out_unknown(ary) {
	function contains_unknown(obj) {
		if(Object(obj) === obj) {
			if(obj === UNKNOWN) {
				return true;
			} else {
				for(var p in obj) {
					if(contains_unknown(obj[p])) {
						return true;
					}
				}
			}
		}
		return false;
	}
	return ary.filter(function(obj) { return !contains_unknown(obj); });
}

Observer.prototype.done = function() {
	return {
		prop_writes: filter_out_unknown(this.prop_writes),
		returns: filter_out_unknown(this.returns),
		callbacks: filter_out_unknown(this.callbacks)
	};
};

exports.Observer = Observer;