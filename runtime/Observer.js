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
 
 var asg = require('./asg'),
     ast = require('./ast'),
     escodegen = require('escodegen'),
     models = require('./models'),
     util = require('./util'),
     add = util.add,
     isObject = util.isObject,
     getOrCreateHiddenProp = util.getOrCreateHiddenProp,
     setHiddenProp = util.setHiddenProp,
     mkAssignStmt = ast.mkAssignStmt,
     mkIdentifier = ast.mkIdentifier,
     mkMemberExpression = ast.mkMemberExpression,
     mkCallStmt = ast.mkCallStmt,
     getModel = models.getModel;
     
require('./circularity');
require('./hashconsing');
require('./find_used_client_objects');

/** The observer is notified by the dynamic instrumentation framework of events happening in the instrumented program. */
function Observer() {
	this.current_fn = [];
}

function mkTag(type, pos) {
	return {
		origin: pos || { start_line: -1, start_offset: -1 },
		type: type,
		props: {}
	};
}

Observer.prototype.tagGlobal = function(global) {
	var global_tag = mkTag('global');
	global_tag.callbacks = [];
	return global_tag;
};

Observer.prototype.setGlobal = function(global) {
	this.global = global;
};

Observer.prototype.tagLiteral = function(lit) {
	var tp = typeof lit;
	switch(tp) {
	case 'undefined':
	case 'boolean':
	case 'number':
	case 'string':
		return mkTag(tp);
	case 'object':
		if(!lit)
			return mkTag('null');
		if(lit instanceof RegExp)
			return mkTag('regexp');		
		return Array.isArray(lit) ? mkTag('arraylit') : mkTag('objlit');
	case 'function':
		var tag = mkTag('function');
		tag.parms = [];
		tag.instances = [];
		tag.ret = [];
		return tag;
	}
};

Observer.prototype.tagForInVar = function() {
	return mkTag('string');
};

Observer.prototype.tagNativeException = function() {
	return mkTag('unknown');
};

Observer.prototype.tagNativeArgument = function(callee, arg, idx) {
	var tag = mkTag('client object');
	tag.fn = callee;
	tag.index = idx;
	return tag;
};

Observer.prototype.tagNativeResult = function(res, callee, recv, args) {
	return mkTag('unknown');
};

Observer.prototype.tagNewInstance = function(res, callee, args) {
	var tag = mkTag('instance');
	tag.fn = callee;
	callee.getTag().instances.push(tag);
	return tag;
};

Observer.prototype.tagNewNativeInstance = function() {
	return mkTag('unknown');
};

Observer.prototype.tagDefaultPrototype = function() {
	return mkTag('objlit');
};

Observer.prototype.tagUnOpResult = function(res) {
	return mkTag(typeof res);
};

Observer.prototype.tagBinOpResult = function(res) {
	return mkTag(typeof res);
};

Observer.prototype.tagPropRead = function(val, obj, prop, stored_tag) {
	return stored_tag || mkTag('unknown');
};

function getPropertyCache(obj, prop) {
	var tag = obj.getTag ? obj.getTag() : obj;
	var prop_cache = tag.props;
	return prop_cache['$$' + prop] || (prop_cache['$$' + prop] = []);
}

function getParameterCache(fn, i) {
	var parm_cache = fn.getTag().parms;
	return parm_cache[i] || (parm_cache[i] = []);
}

Observer.prototype.tagPropWrite = function(obj, prop, val, stored_tag) {
	add(getPropertyCache(obj, prop.getValue()), val.getTag());
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
		add(fn.getTag().ret, retval.getTag());
	}
};

Observer.prototype.funcall = function(pos, callee, recv, args) {
	// flatten out reflective calls
	switch(callee.getValue()) {
	case Function.prototype.call:
		return this.funcall(pos, recv, args[0], Array.prototype.slice.call(args, 1));
	case Function.prototype.apply:
		return this.funcall(pos, recv, args[0], args[1]);
	default:
		if(callee.getTag().type === 'client object') {
			add(this.global.getTag().callbacks, { callee: callee, kind: 'funcall' });
		}
	}
};

Observer.prototype.newexpr = function(pos, callee, args) {
	this.funcall(pos, callee, null, args);
};

// generate model
Observer.prototype.done = function() {
	var decls = [], globals = [];
	
	// recursively compute models for all objects reachable from the global one
	var global_model = getModel(this.global);
	
	// hashcons non-circular models
	global_model.checkCircularity();
	global_model.findUsedClientObjects();
	global_model.hashcons();
	
	// create definitions for all global variables
	for (var p in global_model.property_models) {
		var prop = p.substring(2);
		globals.push(prop);
		decls.push(mkAssignStmt(mkIdentifier(prop), global_model.property_models[p].generate_asg(decls)));
	}
	
	// create calls for all observed callback invocations
	global_model.callbacks.forEach(function(callback) {
		var callee = callback.callee,
			args = callback.args;
			
		if(callback.kind === 'function' || callback.kind === 'new') {
			decls.push(mkCallStmt(callee.generate_asg(decls),
								  args.slice(1).map(function(arg) { return arg.generate_asg(decls); }),
								  callback.kind === 'new'));
		} else {
			decls.push(mkCallStmt(mkMemberExpression(callee.generate_asg(decls), 'call'),
								  args.map(function(arg) { return arg.generate_asg(decls); })));
		}
	});

	// untangle declarations
	asg.unfold_asgs(decls);
	decls = asg.sort_decls(decls);
	
	// wrap everything into a module
	var body = [mkCallStmt({
		type: 'FunctionExpression',
		id: null,
		params: [],
		defaults: [],
		body: {
			type: 'BlockStatement',
			body: decls
		},
		rest: null,
		generator: false,
		expression: false
	}, [])];
	
	if (globals.length > 0) {
		body.unshift({
			type: 'VariableDeclaration',
			declarations: globals.map(function(global) {
				return {
					type: 'VariableDeclarator',
					id: mkIdentifier(global),
					init: null
				};
			}),
			kind: 'var'
		});
	}
	
	var prog = {
		type: 'Program',
		body: body
	};
	
	// and return it
	return escodegen.generate(prog);
};

exports.Observer = Observer;