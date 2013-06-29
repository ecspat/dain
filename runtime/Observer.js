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
     isIdentifier = util.isIdentifier,
     mkAssignStmt = ast.mkAssignStmt,
     mkIdentifier = ast.mkIdentifier,
     mkMemberExpression = ast.mkMemberExpression,
     mkCallStmt = ast.mkCallStmt,
     getModel = models.getModel;
     
require('./circularity');
require('./hashconsing');

/** The observer is notified by the dynamic instrumentation framework of events happening in the instrumented program. */
function Observer(global) {
	this.global = global;
	setOrigin(global, { start_line: -1, start_offset: -1 }, 'global');
}

// nothing special happens on these events
Observer.prototype.beforeMemberRead = function(){};
Observer.prototype.atFunctionExit = function(){};

function getPropertyCache(obj, prop) {
	var prop_caches = getOrCreateHiddenProp(obj, '__properties', {});
	if(!isIdentifier(prop))
		prop = '*';
	return prop_caches['$$' + prop] || (prop_caches['$$' + prop] = []);
}

function getParameterCache(fn, i) {
	var parm_caches = getOrCreateHiddenProp(fn, '__parameters', []);
	return parm_caches[i] || (parm_caches[i] = []);
}

function hasOrigin(obj) {
	return obj.hasOwnProperty(obj);
}

function setOrigin(obj, pos, type, data) {
	var origin = {
		start_line: pos.start_line,
		start_offset: pos.start_offset,
		type: type,
		data: data
	};
	setHiddenProp(obj, '__origin', origin);
}

function getOrigin(obj) {
	if(!hasOrigin(obj)) {
		setOrigin(obj, { start_line: -1, start_offset: -1, type: 'unknown' });
	}
	return obj.__origin;
}

// record value written into property
Observer.prototype.beforeMemberWrite = function(pos, obj, prop, val) {
	add(getPropertyCache(obj, prop), val);
};

// record return value, unless it's undefined
Observer.prototype.atFunctionReturn = function(pos, fn, ret) {
	// returning 'undefined' isn't interesting, forget about it
	if (ret !== void(0))
		add(getOrCreateHiddenProp(fn, '__return', []), ret);	
};

// tag newly created object and record its properties
Observer.prototype.afterObjectExpression = function(pos, obj) {
	setOrigin(obj, pos, 'objlit');
	for(var p in obj) {
		if(obj.hasOwnProperty(p)) {
			var desc = Object.getOwnPropertyDescriptor(obj, p);
			if(!desc.get && !desc.set) {
				this.beforeMemberWrite(pos, obj, p, obj[p]);
			}
		}
	}
};

// tag newly created array and record its property classes
Observer.prototype.afterArrayExpression = function(pos, ary) {
	setOrigin(ary, pos, 'arraylit');
	for(var i=0,n=ary.length;i<n;++i) {
		this.beforeMemberWrite(pos, ary, i, ary[i]);
	}
};

// tag newly created function object and its .prototype
Observer.prototype.afterFunctionExpression = function(pos, fn) {
	setOrigin(fn, pos, 'function');
	
	var proto = fn.prototype;
	setOrigin(proto, pos, 'default proto');
	this.beforeMemberWrite(pos, fn, 'prototype', fn.prototype);
	//this.beforeMemberWrite(pos, fn.prototype, 'constructor', fn);
};

// tag receiver object (if invoked via 'new'), and any client objects passed as parameters
Observer.prototype.atFunctionEntry = function(pos, recv, args) {
	// TODO: replace with more robust test based on tracking function calls/returns
	if(recv instanceof args.callee) {
		setOrigin(recv, pos, 'instance', args.callee);
		getOrCreateHiddenProp(args.callee, '__instances', []).push(recv);
	}
		
	// tag client objects when we first see them
	for(var i=0,n=args.length;i<n;++i) {
		if(isObject(args[i]) && !hasOrigin(args[i])) {
			setOrigin(args[i], pos, 'client object', { fn: args.callee, index: i });
		}
	}
};

// simplify handling of function/method/new calls by introducing common method beforeCall
Observer.prototype.beforeFunctionCall = function(pos, callee, args) {
	this.beforeCall(pos, null, callee, args, 'function');
};

Observer.prototype.beforeMethodCall = function(pos, obj, prop, _, args) {
	if(obj) {
		var callee = obj[prop];
		// flatten out reflective calls
		if(callee === Function.prototype.call)
			this.beforeCall(pos, args[0], obj, Array.prototype.slice.call(args, 1), 'method');
		else if(callee === Function.prototype.apply)
			this.beforeCall(pos, args[0], obj, args[1], 'method');
		else
			this.beforeCall(pos, obj, callee, args, 'method');
	}
};

Observer.prototype.beforeNewExpression = function(pos, callee, args) {
	this.beforeCall(pos, null, callee, args, 'new');
};

// record invocations of client callbacks
Observer.prototype.beforeCall = function(pos, recv, callee, args, kind) {
	if (typeof callee === 'function') {
		// record receiver and arguments
		if(recv)
			add(getParameterCache(callee, 0), recv);
		for(var i=0,n=args.length;i<n;++i) {
			add(getParameterCache(callee, i+1), args[i]);
		}
		
		// record invocation of client callback
		if(getOrigin(callee).type === 'client object') {
			add(getOrCreateHiddenProp(this.global, '__callbacks', []), callee);
		}
	}
};

// generate model
Observer.prototype.done = function() {
	var decls = [], globals = [];
	
	// recursively compute models for all objects reachable from the global one
	var global_model = getModel(this.global);
	
	// hashcons non-circular models
	global_model.checkCircularity();
	global_model.hashcons();
	
	// create definitions for all global variables
	for (var p in global_model.property_models) {
		var prop = p.substring(2);
		globals.push(prop);
		decls.push(mkAssignStmt(mkIdentifier(prop), global_model.property_models[p].generate_asg(decls)));
	}
	
	// create calls for all observed callback invocations
	var callees = getOrCreateHiddenProp(this.global, '__callbacks', []);
	for(var i=0,n=callees.length;i<n;++i) {
		var callee = callees[i],
		    parms = getOrCreateHiddenProp(callee, '__parameters', []),
		    parm_models = parms.map(getModel);
		    
		 if(parms[0]) {
			decls.push(mkCallStmt(getModel(callee).generate_asg(decls),
								  parm_models.slice(1).map(function(parm) { return parm.generate_asg(decls); })));
		 } else {
			decls.push(mkCallStmt(mkMemberExpression(getModel(callee).generate_asg(decls), 'call'),
								  parm_models.map(function(parm) { return parm.generate_asg(decls); })));
		 }
	}

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