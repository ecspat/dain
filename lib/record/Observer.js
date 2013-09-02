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
     events = require('./Event'),
     Tag = tags.Tag,
     PropWrite = events.PropWrite,
     Return = events.Return,
     Callback = events.Callback,
     GLOBAL = tags.GLOBAL,
     UNDEFINED = tags.UNDEFINED,
     BOOLEAN = tags.BOOLEAN,
     NUMBER = tags.NUMBER,
     STRING = tags.STRING,
     NULL = tags.NULL,
     REGEXP = tags.REGEXP,
     UNKNOWN = tags.UNKNOWN;
     
var array_join = Array.prototype.join;
     
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
		} else if(!pos) {
			return UNKNOWN;
		} else {
			tag = Tag.make({ type: Array.isArray(lit) ? 'array' : 'object', pos: pos});
			util.setHiddenProp(lit, '__tag', tag);
		}
		return tag;
	case 'function':
		if(lit.hasOwnProperty('__tag')) {
			tag = lit.__tag;
		} else if(!pos) {
			return UNKNOWN;
		} else {
			tag = Tag.make({ type: 'function', pos: pos });
			util.setHiddenProp(lit, '__tag', tag);
		}
		return tag;
	}
};

Observer.prototype.tagGetter = Observer.prototype.tagSetter = function(pos, acc, acc_pos) {
	return tagLiteral(acc_pos, acc);
};

Observer.prototype.defineGetter = function(obj, prop, getter) {
	var pw = PropWrite.make(obj, prop, getter, 'getter');
	if(pw) {
		this.prop_writes.push(pw);
	}
};

Observer.prototype.defineSetter = function(obj, prop, setter) {
	var pw = PropWrite.make(obj, prop, setter, 'setter');
	if(pw) {
		this.prop_writes.push(pw);
	}
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
		if(proto && proto.hasOwnProperty('__tag') && proto.__tag.default_proto_of) {
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
	var pw = PropWrite.make(obj.getTag(), prop.getValue(), val.getTag());
	if(pw) {
		this.prop_writes.push(pw);
	}
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
		var ret = Return.make(fn.getTag(), retval.getTag());
		if(ret) {
			this.returns.push(ret);
		}
	}
};

Observer.prototype.funcall = function(pos, callee, recv, args, kind) {
	if (callee.getTag().type === 'clientobj') {
		var evt_args = [];
		evt_args[0] = recv && recv.getTag() || UNDEFINED;
		for(var i=0,n=args.length;i<n;++i) {
			evt_args[i+1] = args[i].getTag();
		}
		var cb = Callback.make(callee.getTag(), evt_args, kind);
		if(cb) {
			this.callbacks.push(cb);
		}
	}
};

Observer.prototype.newexpr = function(pos, callee, args) {
	this.funcall(pos, callee, null, args, 'new');
};

function contains(ary, elt) {
	for(var i=0,n=ary.length;i<n;++i) {
		if(ary[i] === elt) {
			return true;
		}
	}
	return false;
}

// generate model
Observer.prototype.done = function() {
	var res = {
		prop_writes: this.prop_writes,
		returns: this.returns,
		callbacks: this.callbacks,
		toString: function() {
			return '{\n' +
				   '  "prop_writes": [\n' + array_join.call(this.prop_writes, ',\n') + '\n  ],\n' +
				   '  "returns": [\n' + array_join.call(this.returns, ',\n') + '\n  ],\n' +
				   '  "callbacks": [\n' + array_join.call(this.callbacks, ',\n') + '\n  ]\n' +
				   '}';
		}
	};
	return res;
};

exports.Observer = Observer;