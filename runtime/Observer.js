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
     util = require('./util'),
     add = util.add,
     isObject = util.isObject,
     setHiddenProp = util.setHiddenProp,
     mkAssignStmt = ast.mkAssignStmt,
     mkIdentifier = ast.mkIdentifier,
     mkMemberExpression = ast.mkMemberExpression,
     mkCallStmt = ast.mkCallStmt,
     Union = require('./Union').Union,
     ObjModel = require('./ObjModel').ObjModel,
     ArrayModel = require('./ArrayModel').ArrayModel,
     GlobalModel = require('./GlobalModel').GlobalModel,
     InstanceModel = require('./InstanceModel').InstanceModel,
     FunctionModel = require('./FunctionModel').FunctionModel,
     PrimitiveModel = require('./PrimitiveModel'),
     ClientObjModel = require('./ClientObjModel').ClientObjModel,
     BuiltinObjectModel = require('./BuiltinObjectModel').BuiltinObjectModel,
     builtins = require('./builtins');
     
require('./circularity');
require('./hashconsing');
require('./find_used_client_objects');

/** The observer is notified by the dynamic instrumentation framework of events happening in the instrumented program. */
function Observer() {
	this.current_fn = [];
}

Observer.prototype.tagGlobal = function(global) {
	var tag = new GlobalModel(global);
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
		return PrimitiveModel.UNDEFINED;
	case 'boolean':
		return PrimitiveModel.BOOLEAN;
	case 'number':
		return PrimitiveModel.NUMBER;
	case 'string':
		return PrimitiveModel.STRING;
	case 'object':
		if(!lit)
			return PrimitiveModel.NULL;
		if(lit instanceof RegExp)
			return PrimitiveModel.REGEXP;
		if(lit.hasOwnProperty('__tag')) {
			tag = lit.__tag;
		} else {
			tag = Array.isArray(lit) ? ArrayModel.make(pos) : ObjModel.make(pos);
			Object.defineProperty(lit, "__tag", { enumerable: false, writable: true, value: tag });
		}
		return tag;
	case 'function':
		if(lit.hasOwnProperty('__tag')) {
			tag = lit.__tag;
		} else {
			tag = FunctionModel.make(pos);
			Object.defineProperty(lit, "__tag", { enumerable: false, writable: true, value: tag });
		}
		return tag;
	}
};

Observer.prototype.tagGetter = Observer.prototype.tagSetter = function(pos, acc) {
	return tagLiteral(null, acc);
};

Observer.prototype.defineGetter = function(obj, prop, getter) {
	if(obj instanceof ObjModel)
		obj.defineGetter(prop, getter);
};

Observer.prototype.defineSetter = function(obj, prop, setter) {
	if(obj instanceof ObjModel)
		obj.defineSetter(prop, setter);
};

Observer.prototype.tagForInVar = function() {
	return PrimitiveModel.STRING;
};

Observer.prototype.tagNativeArgument = function(callee, arg, idx) {
	if(arg && arg.hasOwnProperty('__tag'))
		return arg.__tag;
		
	if(callee.hasOwnProperty('__tag')) {
		var tag = ClientObjModel.make(callee.__tag, idx);
		if(Object(arg) === arg) {
			Object.defineProperty(arg, "__tag", { enumerable: false, writable: true, value: tag });
		}
		return tag;
	} else {
		return new ObjModel();
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
			
		// no; check whether it is a function
		if(typeof res === 'function') {
			return util.setHiddenProp(res, '__tag', new FunctionModel());
		}
			
		// or maybe it is an instance of a function we know?
		var proto = Object.getPrototypeOf(res);
		if(proto.hasOwnProperty('__tag') && proto.__tag.default_proto_of) {
			var fn = proto.__tag.default_proto_of;
			var instance_model = fn.instance_model || (fn.instance_model = new InstanceModel(fn));
			return util.setHiddenProp(res, '__tag', instance_model);
		}
		
		// nope, it's just some object
		return util.setHiddenProp(res, '__tag', new ObjModel());
	} else {
		return this.tagLiteral(null, res);
	}
};

Observer.prototype.tagNativeProperty = function(obj, prop, val) {
	if(Object(val) === val) {
		return val.hasOwnProperty('__tag') && val.__tag || new ObjModel();
	} else {
		return this.tagLiteral(null, val);
	}
};

Observer.prototype.tagNewInstance = function(res, callee, args) {
	return callee.getTag().instance_model;
};

Observer.prototype.tagDefaultPrototype = function(fn) {
	var tag = fn.getTag().default_proto_model;
	Object.defineProperty(fn.getValue().prototype, "__tag", { enumerable: false, writable: true, value: tag });
	return tag;
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
	if(obj.getTag() instanceof ObjModel) {
		obj.getTag().addPropertyModel(prop.getValue(), val.getTag());
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
		fn.getTag().addReturnModel(retval.getTag());
	}
};

Observer.prototype.funcall = function(pos, callee, recv, args, kind) {
	kind = kind || 'function';
	if (callee.getTag() instanceof ClientObjModel) {
		this.global.getTag().callbacks.push({
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
Observer.prototype.done = function() {
	var decls = [], globals = [];
	
	var global_model = this.global.getTag();
	
	// hashcons non-circular models
	global_model.checkCircularity();
	global_model.findUsedClientObjects();
	global_model.hashcons();
	
	// create definitions for all global variables
	for (var p in global_model.property_models) {
		var prop = p.substring(2),
		    model = global_model.property_models[p],
		    model_asg = model.generate_asg(decls);
		if(model instanceof BuiltinObjectModel && model.full_name === prop) {
			continue;
		}
		globals.push(prop);
		decls.push(mkAssignStmt(mkIdentifier(prop), model_asg));
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