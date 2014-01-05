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

/*global require exports console*/

var estraverse = require('estraverse'),
    add = require('../dain_util').add,
	ast = require('./ast'),
	PrimitiveModel = require('./PrimitiveModel'),
	InstanceModel = require('./InstanceModel').InstanceModel,
	ObjModel = require('./ObjModel').ObjModel,
	ArrayModel = require('./ArrayModel').ArrayModel,
	ClientObjModel = require('./ClientObjModel').ClientObjModel,
	BuiltinObjectModel = require('./BuiltinObjectModel').BuiltinObjectModel,
	Union = require('./Union').Union,
	UNDEFINED = PrimitiveModel.UNDEFINED,
	NULL = PrimitiveModel.NULL,
	BOOLEAN = PrimitiveModel.BOOLEAN,
	NUMBER = PrimitiveModel.NUMBER,
	STRING = PrimitiveModel.STRING,
	REGEXP = PrimitiveModel.REGEXP,
	mkDecl = ast.mkDecl,
	mkIdentifier = ast.mkIdentifier,
	FunctionModel = require('./FunctionModel').FunctionModel,
	GlobalModel = require('./GlobalModel').GlobalModel,
	mkAssignStmt = ast.mkAssignStmt,
	mkMemberExpression = ast.mkMemberExpression,
	mkThis = ast.mkThis,
	mkOr = ast.mkOr,
	mkReturn = ast.mkReturn,
	mkProperty = ast.mkProperty,
	replaceChild = ast.replaceChild;

function isEmptyObjectLiteral(obj) {
	return obj.__proto__ === ObjModel.prototype &&
	       obj.getChildren().length === 0;
}

/**
 * Our model is at first represented as an ASG (abstract syntax graph), i.e., an AST where
 * some subtrees occur in more than one place.
 */

/* methods for constructing ASGs */
FunctionModel.prototype.generate_asg = function(decls) {
	if (this.asg) {
		return this.asg;
	}

	var body = [],
		params = [];
	this.asg = {
		type: 'FunctionExpression',
		id: mkIdentifier('function_' + this.pp_id),
		params: params,
		defaults: [],
		body: {
			type: 'BlockStatement',
			body: body
		},
		rest: null,
		generator: false,
		expression: false,
		temp_name: "function_" + this.pp_id
	};
	this.instance_asg = {
		type: 'NewExpression',
		callee: this.asg,
		'arguments': [],
		temp_name: 'new_' + this.pp_id
	};
	
	// set up parameter list
	if (this.setter) {
		params.push(mkIdentifier('x1'));
	} else if (!this.getter) {
		// handle used parameters
		if (this.used_params[0]) {
			body.push(mkAssignStmt(mkIdentifier('function_' + this.pp_id + '_0'),
			mkThis()));
		}
		for (var i = 1, n = this.used_params.length; i < n; ++i) {
			params.push(mkIdentifier('x' + i));
			if (i in this.used_params) {
				body.push(mkAssignStmt(mkIdentifier('function_' + this.pp_id + '_' + i),
				mkIdentifier('x' + i)));
			}
		}
	}
	
	// 'prototype' property gets special treatment: if it is an empty object literal, don't record it;
	// if it is a union, throw out any empty member
	var proto = this.property_models.$$prototype;
	if(proto && !isEmptyObjectLiteral(proto)) {
		if(proto instanceof Union) {
			var self = this;
			proto = proto.without(isEmptyObjectLiteral);
		}
		if(proto !== UNDEFINED) {
			decls.push(mkAssignStmt(mkMemberExpression(this.asg, 'prototype'), proto.generate_asg(decls)));
		}
	}

	// handle function properties
	for (var p in this.property_models) {
		if (p !== '$$prototype' && p.substring(0, 2) === '$$') {
			var prop_name = p.substring(2),
				prop_asg = this.property_models[p].generate_asg(decls);
			decls.push(mkAssignStmt(mkMemberExpression(this.asg, prop_name), prop_asg));
		}
	}

	// handle instance properties
	for (p in this.instance_model.property_models) {
		if (p.substring(0, 2) === '$$') {
			body.push(mkAssignStmt(mkMemberExpression(mkThis(), p.substring(2)), this.instance_model.property_models[p].generate_asg(decls)));
		}
	}

	// handle return type
	if (this.return_model !== UNDEFINED) {
		body.push(mkReturn(this.return_model.generate_asg(decls)));
	}
	
	// information about source positions
	decls.source_positions[this.pp_id] = this.source_positions;

	return this.asg;
};

GlobalModel.prototype.generate_asg = function(decls) {
	var name = 'global';
	if (!this.asg) {
		this.asg = mkIdentifier(name);
		decls.push(mkDecl(name, mkThis()));
	}
	return mkIdentifier(name);
};

InstanceModel.prototype.generate_asg = function(decls) {
	this.fn_model.generate_asg(decls);
	return this.fn_model.instance_asg;
};

ObjModel.prototype.generate_asg = function(decls) {
	if (this.asg) { return this.asg; }

	var props = [];
	this.asg = {
		type: 'ObjectExpression',
		properties: props,
		temp_name: "obj_" + this.pp_id
	};

	for (var p in this.property_models) {
		if (p.substring(0, 2) === '$$') {
			props.push(mkProperty(p.substring(2), this.property_models[p].generate_asg(decls)));
		} else if(p.substring(0, 4) === 'get ') {
			var getter_asg = this.property_models[p].generate_asg(decls);
			props.push({ type: 'Property', key: mkIdentifier(p.substring(4)), value: getter_asg, kind: 'get' });
		} else if(p.substring(0, 4) === 'set ') {
			var setter_asg = this.property_models[p].generate_asg(decls);
			props.push({ type: 'Property', key: mkIdentifier(p.substring(4)), value: setter_asg, kind: 'set' });
		}
	}

	return this.asg;
};

ArrayModel.prototype.generate_asg = function(decls) {
	if(this.asg) {
		return this.asg;
	}
	
	var elements = [];
	this.asg = {
		type: 'ArrayExpression',
		elements: elements,
		temp_name: 'array_' + this.pp_id
	};

	for(var p in this.property_models) {
		if(p.substring(0, 2) === '$$') {
			var pn = p.substring(2);
			if(Number(pn) >= 0) {
				elements[Number(pn)] = this.property_models[p].generate_asg(decls);
			} else if(pn === 'length' && this.property_models[p] === NUMBER) {
				// this property is implicit; skip it
			} else {
				// found a non-index property, so just treat the whole thing as an object
				delete this.asg;
				return ObjModel.prototype.generate_asg.call(this, decls);
			}
		}
	}
	
	return this.asg;
};

BuiltinObjectModel.prototype.generate_asg = function(decls) {
	if(this.decls_generated)
		return this.generate_name_expr();
	this.decls_generated = true;
		
	// Some builtin objects are, in fact, functions, so they need an instance_asg.
	// TODO: This suggests that we should have a separate BuiltinFunction type.
	this.instance_asg = {
		type: 'NewExpression',
		callee: this.generate_name_expr(),
		'arguments': [],
		temp_name: 'new_' + this.full_name.replace(/\./g, '_')
	};

	// If the builtin object model has properties, then someone monkey patched the standard library
	// (I'm looking at you, MooTools!). In this case, we add some global property writes to our model
	// to reflect these properties.
	for (var p in this.property_models) {
		if (p.substring(0, 2) === '$$') {
			var lhs = mkMemberExpression(this.generate_name_expr(), p.substring(2));
			var prop_model = this.property_models[p],
			    prop_asg = prop_model.generate_asg(decls);
			if(!(prop_model instanceof BuiltinObjectModel && prop_model.full_name === this.full_name + '.' + p.substring(2))) {
				decls.push(mkAssignStmt(lhs, prop_asg));
			}
		}
	}
	
	return this.generate_name_expr();
};

/** Generate an AST corresponding to the fully qualified name of this builtin object model. */
BuiltinObjectModel.prototype.generate_name_expr = function() {	
	var components = this.full_name.split('.'), asg;
	asg = mkIdentifier(components[0]);
	for(var i=1;i<components.length;++i)
		asg = mkMemberExpression(asg, components[i]);
	return asg;
};

/** Primitive models have fixed ASGs. */
PrimitiveModel.PrimitiveModel.prototype.generate_asg = function() {
	return this.asg;
};

/** NUMBER is represented as Math.random() */
NUMBER.asg = {
	type: 'CallExpression',
	callee: mkMemberExpression("Math", "random"),
	'arguments': [],
	temp_name: '$NUMBER$'
};

/** BOOLEAN is represented as !NUMBER */
BOOLEAN.asg = {
	type: 'UnaryExpression',
	operator: '!',
	argument: NUMBER.asg,
	temp_name: '$BOOLEAN$'
};

/** STRING is represented as String(NUMBER) */
STRING.asg = {
	type: 'CallExpression',
	callee: mkIdentifier('String'),
	'arguments': [NUMBER.asg],
	temp_name: '$STRING$'
};

/** REGEXP is represented as new RegExp(STRING) */
REGEXP.asg = {
	type: 'NewExpression',
	callee: mkIdentifier('RegExp'),
	'arguments': [STRING.asg],
	temp_name: '$REGEXP$'
};

/** UNDEFINED is just void(0) */
UNDEFINED.generate_asg = function() {
	return {
		type: 'UnaryExpression',
		operator: 'void',
		argument: {
			type: 'Literal',
			value: 0,
			raw: "0"
		}
	};
};

/** NULL is (wait for it) null */
NULL.generate_asg = function() {
	return {
		type: 'Literal',
		value: null,
		raw: 'null'
	};
};

/** Union models are encoded as disjunctions. */
Union.prototype.generate_asg = function(decls) {
	if(this.asg)
		return this.asg;
		
	// first weed out easy special cases
	if(this.members.length === 0) {
		return this.asg = UNDEFINED.generate_asg(decls);
	} else if(this.members.length === 1) {
		return this.asg = this.members[0].generate_asg(decls);
	} else {
		var n = this.members.length;
		this.asg = mkOr(this.members[0].generate_asg(decls), this.members[n-1].generate_asg(decls));
		for(var i=1;i<n-1;++i) {
			this.asg.left = mkOr(this.asg.left, this.members[i].generate_asg(decls));
		}
		this.asg.temp_name = "tmp_" + this.id;
	}

    return this.asg;
};

/** A client object model corresponds to a global variable into which the function model
  * stores its respective argument. */
ClientObjModel.prototype.generate_asg = function(decls) {
	if(this.asg)
		return mkIdentifier(this.asg);
		
	// create global declaration for this variable
	this.asg = "function_" + this.fn_model.pp_id + "_" + this.idx;
	if(!decls[0] || decls[0].type !== 'VariableDeclaration') {
		decls.unshift({
			type: 'VariableDeclaration',
			kind: 'var',
			declarations: []
		});
	}
	decls[0].declarations.push({
		type: 'VariableDeclarator',
		id: mkIdentifier(this.asg),
		init: null
	});
	
	return mkIdentifier(this.asg);
};

/** Function for unfolding a list of ASGs into a list of ASTs, with multiply
  * occurring subtrees hoisted into global declarations.
  */
function unfold_asgs(decls) {
	// create an identifier node referring to the declaration
	function mkRef(decl) {
		var ref = mkIdentifier(decl.declarations[0].id.name);
		ref.refers_to = decl;
		return ref;
	}

	// traverse a given subtree and perform hoisting
	function unfold(root) {
		estraverse.replace(root, {
			enter: function(node, parent) {
				if (node.global_decl) {
					// node has already been promoted
					return mkRef(node.global_decl);
				} else if (node.parent) {
					// node needs to be promoted now
					decls.push(node.global_decl = mkDecl(node.temp_name, node));
					replaceChild(node.parent, node, mkRef(node.global_decl));
					return mkRef(node.global_decl);
				} else {
					node.parent = parent;
				}
			}
		});
	}
	
	// record all dependencies this subtree has on hoisted declarations
	function recordDependencies(root) {
		root.deps = [];
		estraverse.traverse(root, {
			enter: function(node) {
				if(node.refers_to) {
					add(root.deps, node.refers_to);
				}
			}
		});
	}

	// unfold all subtrees
	for (var i=0, n=decls.length;i<n;++i) {
		unfold(decls[i]);
	}
	
	// record all dependencies
	for (i=0,n=decls.length;i<n;++i) {
		recordDependencies(decls[i]);
	}
}

// perform topsort of given declarations so that references come after declarations
function sort_decls(decls) {
	var res = [];

	function visit(root) {
		var deps = root.deps || [];
		root.visited = i;

		for (var j = 0, n = deps.length; j < n; ++j) {
			if (deps[j].visited == i) {
				if (deps[j] !== root && typeof console.warn === 'function') {
					//console.warn("circular dependency");
				}
			} else if (typeof deps[j].visited === 'undefined') {
				visit(deps[j]);
			}
		}

		res.push(root);
	}

	for (var i = 0, n = decls.length; i < n; ++i) {
		if (typeof decls[i].visited === 'undefined') {
			visit(decls[i]);
		}
	}

	res.source_positions = decls.source_positions;
	return res;
}

exports.unfold_asgs = unfold_asgs;
exports.sort_decls = sort_decls;
