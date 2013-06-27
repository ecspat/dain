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
 
 /*global require exports escodegen */
 
 var ArrayClass = require('./ArrayClass').ArrayClass,
     asg = require('./asg'),
     ast = require('./ast'),
     ClientObjClass = require('./ClientObjClass').ClientObjClass,
     GlobalClass = require('./GlobalClass').GlobalClass,
     // TODO: browserifying the Node module for escodegen gives a result that Zombie doesn't like; strangely enough,
     //       the pre-browserified escodegen.browser.js module works fine...
     //escodegen = require('escodegen'),
     tagging = require('./tagging'),
     array_eq = require('./util').array_eq,
     setHiddenClass = tagging.setHiddenClass,
     hasHiddenClass = tagging.hasHiddenClass,
     tagFn = tagging.tagFn,
     tagMember = tagging.tagMember,
     tagNew = tagging.tagNew,
     tagObjLit = tagging.tagObjLit,
     getHiddenClass = tagging.getHiddenClass,
     mkAssignStmt = ast.mkAssignStmt,
     mkIdentifier = ast.mkIdentifier,
     mkCallStmt = ast.mkCallStmt,
     mkMemberExpression = ast.mkMemberExpression;

/** The observer is notified by the dynamic instrumentation framework of events happening in the instrumented program. */
function Observer() {}

// nothing special happens on these events
Observer.prototype.beforeMemberRead = function(){};
Observer.prototype.atFunctionExit = function(){};

// record class of value written into member
Observer.prototype.beforeMemberWrite = function(pos, obj, prop, val) {
	tagMember(getHiddenClass(obj), prop, val);
};

// record return value's class
Observer.prototype.atFunctionReturn = function(pos, fn, ret) {
	// returning 'undefined' isn't interesting, forget about it
	if (ret === void(0))
		return;

	var fn_klass = getHiddenClass(fn),
		val_klass = getHiddenClass(ret);
	fn_klass.setPropClass('return', val_klass);
};

// generate model
Observer.prototype.done = function() {
	var decls = [], globals = [];
	var global_class = GlobalClass.GLOBAL;
	
	// create definitions for all global variables
	for (var p in global_class.properties) {
		var prop = p.substring(2);
		globals.push(prop);
		decls.push(mkAssignStmt(mkIdentifier(prop), global_class.properties[p].generate_asg(decls)));
	}
	
	// create calls for all observed callback invocations
	for(var i=0,n=global_class.calls.length;i<n;++i) {
		var call = global_class.calls[i],
			callee = call.callee.generate_asg(decls),
			args = call.args.map(function(arg) { return arg.generate_asg(decls); });
		
		if(call.kind === 'function') {
			decls.push(mkCallStmt(callee, args));
		} else if(call.kind === 'method') {
			callee = mkMemberExpression(callee, 'call');
			args.unshift(call.recv.generate_asg(decls));
			decls.push(mkCallStmt(callee, args));
		} else if(call.kind === 'new') {
			decls.push(mkCallStmt(callee, args, true));
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

// tag newly created object and record its property classes
Observer.prototype.afterObjectExpression = function(pos, obj) {
	tagObjLit(obj, pos.start_line, pos.start_offset);
	var obj_klass = getHiddenClass(obj);
	for(var p in obj) {
		if(obj.hasOwnProperty(p)) {
			var desc = Object.getOwnPropertyDescriptor(obj, p);
			if(!desc.get && !desc.set)
				tagMember(obj_klass, p, obj[p]);
		}
	}
};

// tag newly created array and record its property classes
Observer.prototype.afterArrayExpression = function(pos, ary) {
	setHiddenClass(ary, ArrayClass.make(ary, pos.start_line, pos.start_offset));
	var klass = getHiddenClass(ary);
	for(var i=0,n=ary.length;i<n;++i)
		klass.setPropClass('$$' + i, getHiddenClass(ary[i]));
};

// tag newly created function object
Observer.prototype.afterFunctionExpression = function(pos, fn) {
	tagFn(fn, pos.start_line, pos.start_offset);
};

// tag receiver object (if invoked via 'new'), and any client objects passed as parameters
Observer.prototype.atFunctionEntry = function(pos, recv, args) {
	// TODO: replace with more robust test based on tracking function calls/returns
	if(recv instanceof args.callee)
		tagNew(recv, args.callee);
		
	// tag client objects when we first see them
	var fn_class = getHiddenClass(args.callee);
	for(var i=0,n=args.length;i<n;++i) {
		if(!hasHiddenClass(args[i])) {
			setHiddenClass(args[i], ClientObjClass.make(fn_class, i));
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
	if (typeof callee === 'function' && hasHiddenClass(callee)) {
		var callee_class = getHiddenClass(callee);
		if (callee_class instanceof ClientObjClass) {
			var arg_classes = Array.prototype.map.call(args, getHiddenClass);
			recv = kind === 'method' && getHiddenClass(recv);
			
			// record call, but only if there isn't already an equivalent call
			var global_class = GlobalClass.GLOBAL;
			for(var i=0,n=global_class.calls.length;i<n;++i) {
				var call = global_class.calls[i];
				if(call.callee === callee_class && array_eq(call.args, arg_classes) &&
				   call.kind === kind && call.recv === recv)
					return;
			}
			
			global_class.calls.push({
				callee: callee_class,
				recv: recv,
				args: arg_classes,
				kind: kind
			});
		}
	}
};

exports.Observer = Observer;