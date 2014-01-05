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
     util = require('../dain_util'),
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
     BuiltinObjectModel = require('./BuiltinObjectModel').BuiltinObjectModel;
     
require('./circularity');
require('./hashconsing');
require('./find_used_client_objects');

var global_model = new GlobalModel();

function getModel(tag) {
	switch (tag.type) {
	case 'undefined':
		return PrimitiveModel.UNDEFINED;
	case 'null':
		return PrimitiveModel.NULL;
	case 'number':
		return PrimitiveModel.NUMBER;
	case 'boolean':
		return PrimitiveModel.BOOLEAN;
	case 'string':
		return PrimitiveModel.STRING;
	case 'regexp':
		return PrimitiveModel.REGEXP;
	case 'global':
		return global_model;
	case 'array':
		return ArrayModel.make(tag.pos);
	case 'object':
		return ObjModel.make(tag.pos);
	case 'function':
		return FunctionModel.make(tag.pos);
	case 'new':
		var fn_model = getModel(tag.func);
		return (fn_model.instance_model || (fn_model.instance_model = new InstanceModel(fn_model)));
	case 'proto':
		return getModel(tag.default_proto_of).default_proto_model;
	case 'clientobj':
		return ClientObjModel.make(getModel(tag.func), tag.idx);
	case 'builtin':
		return BuiltinObjectModel.create(tag.name);
	default:
		throw new Error("Unrecognised tag type " + tag.type);
	}
}

function merge_callbacks(global_model) {
	global_model.callbacks.forEach(function(callback, i) {
		var callee = callback.callee,
			args = callback.args,
			kind = callback.kind;
		
		if(callee.seen) {
			callback = callee.seen;
			delete global_model.callbacks[i];
		} else {
			callee.seen = callback;
		}
		
		if(kind === 'new') {
			callback.calledAsNew = true;
		} else {
			callback.calledAsFun = true;
		}
		
		args.forEach(function(arg, i) {
			callback.args[i] = Union.make([callback.args[i] || PrimitiveModel.UNDEFINED, args[i]]);
		});
	});
}

exports.buildModel = function(events, no_model_merging, callback_merging) {
	var decls = [], globals = [];
	
	decls.source_positions = {};

	// process all events
	events.prop_writes.forEach(function(prop_write) {
		var obj_model = getModel(prop_write.obj);
		if (obj_model instanceof ObjModel) {
			var val_model = getModel(prop_write.val);
			if(prop_write.kind === 'getter') {
				obj_model.defineGetter(prop_write.prop, val_model);
			} else if(prop_write.kind === 'setter') {
				obj_model.defineSetter(prop_write.prop, val_model);
			} else {
				obj_model.addPropertyModel(prop_write.prop, val_model);
			}
		}
	});
	events.returns.forEach(function(ret) {
		getModel(ret.func).addReturnModel(getModel(ret.val));
	});
	events.callbacks.forEach(function(callback) {
		global_model.callbacks.push({
			callee: getModel(callback.callee),
			args: callback.args.map(getModel),
			kind: callback.kind
		});
	});
	
	// hashcons non-circular models
	global_model.checkCircularity();
	global_model.findUsedClientObjects();
	if(!no_model_merging) {
		global_model.hashcons();
	}
	
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
	
	// generate ASGs for all builtin objects to catch possible monkey patching
	for (p in BuiltinObjectModel.cache) {
		BuiltinObjectModel.cache[p].generate_asg(decls);
	}
	
	// create calls for all observed callback invocations
	if(callback_merging) {
		merge_callbacks(global_model);
	} else {
		global_model.callbacks.forEach(function(callback) {
			if(callback.kind === 'new') {
				callback.calledAsNew = true;
			} else {
				callback.calledAsFun = true;
			}
		});
	}
	
	global_model.callbacks.forEach(function(callback) {
		var callee = callback.callee,
			args = callback.args;
			
		var callee_asg = callee.generate_asg(decls),
			args_asgs = args.map(function(arg, i) {
				if(i === 0) {
					return arg && arg !== global_model && arg.generate_asg(decls);
				} else {
					return arg ? arg.generate_asg(decls) : PrimitiveModel.UNDEFINED;
				}
			});
			
		if(callback.calledAsNew) {
			decls.push(mkCallStmt(callee_asg, args_asgs.slice(1), true));
		} else if(callback.calledAsFun) {
			if(args[0] && args[0] !== global_model) {
				decls.push(mkCallStmt(mkMemberExpression(callee_asg, 'call'), args_asgs));
			} else {
				decls.push(mkCallStmt(callee_asg, args_asgs.slice(1)));
			}
		}
	});

	// untangle declarations
	asg.unfold_asgs(decls);
	decls = asg.sort_decls(decls);

	// pull all variable declarations to the top
	var single_decl = {
		type: 'VariableDeclaration',
		declarations: [],
		kind: 'var'
	};
	decls.forEach(function(decl, i) {
		if(decl.type === 'VariableDeclaration') {
			var assignments = [],
				stmt = {
					type: 'ExpressionStatement',
					expression: {
						type: 'SequenceExpression',
						expressions: assignments
					}
				};
			decl.declarations.forEach(function(d) {
				single_decl.declarations.push({
					type: 'VariableDeclarator',
					id: d.id,
					init: null
				});
				if(d.init)
					assignments.push({
						type: 'AssignmentExpression',
						operator: '=',
						left: mkIdentifier(d.id.name),
						right: d.init
					});
			});
			decls[i] = stmt;
		}
	});
	decls.unshift(single_decl);
	
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
	return escodegen.generate(prog) + "\n/*" + JSON.stringify(decls.source_positions) + "*/";
};
