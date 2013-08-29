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
     util = require('../util'),
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

exports.buildModel = function(events) {
	var decls = [], globals = [];

	// process all events
	events.prop_writes.forEach(function(prop_write) {
		var obj_model = getModel(prop_write.obj);
		if (obj_model instanceof ObjModel) {
			var val_model = getModel(prop_write.val);
			obj_model.addPropertyModel(prop_write.prop, val_model);
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