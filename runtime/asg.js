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

var add = require('./util').add,
	ast = require('./ast'),
	PrimitiveModel = require('./PrimitiveModel'),
	InstanceModel = require('./InstanceModel').InstanceModel,
	ObjModel = require('./ObjModel').ObjModel,
	ArrayModel = require('./ArrayModel').ArrayModel,
	ClientObjModel = require('./ClientObjModel').ClientObjModel,
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
	isEmptyObjectLiteral = ast.isEmptyObjectLiteral,
	mkAssignStmt = ast.mkAssignStmt,
	mkMemberExpression = ast.mkMemberExpression,
	mkThis = ast.mkThis,
	mkOr = ast.mkOr,
	mkReturn = ast.mkReturn,
	mkProperty = ast.mkProperty,
	getModel = require('./models').getModel;


/**
 * Our model is at first represented as an ASG (abstract syntax graph), i.e., an AST where
 * some subtrees occur in more than one place.
 */

/* methods for constructing ASGs */
FunctionModel.prototype.generate_asg = function(decls) {
	if (this.asg) return this.asg;

	var body = [],
		params = [];
	this.asg = {
		type: 'FunctionExpression',
		id: null,
		params: params,
		defaults: [],
		body: {
			type: 'BlockStatement',
			body: body
		},
		rest: null,
		generator: false,
		expression: false,
		temp_name: "function_" + this.id
	};
	
	// handle used parameters
	if(this.used_params[0]) {
		body.push(mkAssignStmt(mkIdentifier('function_' + this.id + '_0'),
							   mkThis()));
	}
	for(var i=1,n=this.used_params.length;i<n;++i) {
		params.push(mkIdentifier('x' + i));
		if(i in this.used_params) {
			body.push(mkAssignStmt(mkIdentifier('function_' + this.id + '_' + i),
								   mkIdentifier('x' + i)));
		}
	}

	// handle function properties
	for (var p in this.property_models) {
		if (p.substring(0, 2) === '$$') {
			var prop_name = p.substring(2);
			var prop_asg = this.property_models[p].generate_asg(decls);

			// don't include trivial function prototypes
			if (prop_name !== 'prototype' || !isEmptyObjectLiteral(prop_asg)) {
				decls.push(mkAssignStmt(mkMemberExpression(this.asg, prop_name), prop_asg));
			}
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

	return this.asg;
};

GlobalModel.prototype.generate_asg = function(decls) {
	if (!this.asg) {
		var name = 'global_' + this.id;
		this.asg = mkIdentifier(name);
		decls.push(mkDecl(name, mkThis()));
	}
	return this.asg;
};

InstanceModel.prototype.generate_asg = function(decls) {
	var fn_asg = this.fn_model.generate_asg(decls);
	return {
		type: 'NewExpression',
		callee: fn_asg,
		'arguments': [],
		temp_name: 'new_' + fn_asg
	};
};

ObjModel.prototype.generate_asg = function(decls) {
	if (this.asg) { return this.asg; }

	var props = [];
	this.asg = {
		type: 'ObjectExpression',
		properties: props,
		temp_name: "obj" + this.id
	};

	for (var p in this.property_models) {
		if (p.substring(0, 2) === '$$') {
			props.push(mkProperty(p.substring(2), this.property_models[p].generate_asg(decls)));
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
		temp_name: 'array' + this.id
	};

	for(var p in this.property_models) {
		if(p.substring(0, 2) === '$$') {
			var pn = p.substring(2);
			if(Number(pn) >= 0) {
				elements[Number(pn)] = this.property_models[p].generate_asg(decls);
			} else {
				// found a non-index property, so just treat the whole thing as an object
				delete this.asg;
				return ObjModel.prototype.generate_asg.call(this, decls);
			}
		}
	}
	
	return this.asg;
};

PrimitiveModel.PrimitiveModel.prototype.generate_asg = function() {
	return this.asg;
};

NUMBER.asg = {
	type: 'CallExpression',
	callee: mkMemberExpression("Math", "random"),
	'arguments': [],
	temp_name: '$NUMBER$'
};

BOOLEAN.asg = {
	type: 'UnaryExpression',
	operator: '!',
	argument: NUMBER.asg,
	temp_name: '$BOOLEAN$'
};

STRING.asg = {
	type: 'CallExpression',
	callee: mkIdentifier('String'),
	'arguments': [NUMBER.asg],
	temp_name: '$STRING$'
};

REGEXP.asg = {
	type: 'NewExpression',
	callee: mkIdentifier('RegExp'),
	'arguments': [STRING.asg],
	temp_name: '$REGEXP$'
};

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

NULL.generate_asg = function() {
	return {
		type: 'Literal',
		value: null,
		raw: 'null'
	};
};

Union.prototype.generate_asg = function(decls) {
	if(this.asg)
		return this.asg;
		
	if(this.members.length === 0) {
		return this.asg = UNDEFINED.generate_asg(decls);
	} else if(this.members.length === 1) {
		return this.asg = this.members[0].generate_asg(decls);
	} else {
		var n = this.members.length;
		this.asg = mkOr(this.members[0].generate_asg(decls), this.members[1].generate_asg(decls));
		for(var i=2;i<n;++i) {
			this.asg = mkOr(this.asg, this.members[i].generate_asg(decls));
		}
		this.asg.temp_name = "tmp_" + this.id;
	}

    return this.asg;
};

ClientObjModel.prototype.generate_asg = function(decls) {
	if(this.asg)
		return mkIdentifier(this.asg);
		
	this.asg = "function_" + this.fn_model.id + "_" + this.idx;
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
	function recordDependency(root1, root2) {
		add(root1.deps || (root1.deps = []), root2);
	}

	function unfold(nd, parent, child_idx, root) {
		var i, n;

		// check whether this node has already been promoted to a declaration
		if (nd.global_decl) {
			recordDependency(root, nd.global_decl);
			parent[child_idx] = mkIdentifier(nd.global_decl.declarations[0].id.name);
			// otherwise check whether it needs to be promoted
		} else if (nd.parent) {
			decls.push(nd.global_decl = mkDecl(nd.temp_name, nd));
			unfold(nd, nd.parent, nd.child_idx, nd.root);
			unfold(nd, parent, child_idx, root);
			// OK, first time we visit this node
		} else {
			// record parent and child index in case we encounter this node again
			nd.parent = parent;
			nd.child_idx = child_idx;
			nd.root = root;

			// handle children
			switch (nd.type) {
			case 'AssignmentExpression':
			case 'LogicalExpression':
				unfold(nd.left, nd, 'left', root);
				unfold(nd.right, nd, 'right', root);
				break;
			case 'BlockStatement':
				for (i = 0, n = nd.body.length; i < n; ++i) {
					unfold(nd.body[i], nd.body, i, root);
				}
				break;
			case 'CallExpression':
			case 'NewExpression':
				unfold(nd.callee, nd, 'callee', root);
				var args = nd['arguments'];
				for (i = 0, n = args.length; i < n; ++i) {
					unfold(args[i], args, i, root);
				}
				break;
			case 'ExpressionStatement':
				unfold(nd.expression, nd, 'expression', root);
				break;
			case 'FunctionExpression':
				unfold(nd.body, nd, 'body', root);
				break;
			case 'MemberExpression':
				unfold(nd.object, nd, 'object', root);
				if (nd.computed) {
					unfold(nd.property, nd, 'property', root);
				}
				break;
			case 'ObjectExpression':
				for (i = 0, n = nd.properties.length; i < n; ++i) {
					unfold(nd.properties[i], nd.properties, i, root);
				}
				break;
			case 'ArrayExpression':
				for (i = 0, n = nd.elements.length; i < n; ++i) {
					unfold(nd.elements[i], nd.elements, i, root);
				}
				break;
			case 'Property':
				unfold(nd.value, nd, 'value', root);
				break;
			case 'ReturnStatement':
			case 'UnaryExpression':
				if (nd.argument) {
					unfold(nd.argument, nd, 'argument', root);
				}
				break;
			case 'Literal':
			case 'Identifier':
			case 'ThisExpression':
				break;
			case 'VariableDeclaration':
				nd.declarations.forEach(function(decl, i) {
					unfold(decl, nd.declarations, i, root);
				});
				break;
			case 'VariableDeclarator':
				if (nd.init) {
					unfold(nd.init, nd, 'init', root);
				}
				break;
			default:
				throw new Error("no idea how to handle " + nd.type);
			}
		}
	}

	for (var i = 0, n = decls.length; i < n; ++i)
	unfold(decls[i], decls, i, decls[i]);
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
					console.warn("circular dependency");
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

	return res;
}

exports.unfold_asgs = unfold_asgs;
exports.sort_decls = sort_decls;