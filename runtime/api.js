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

/*global Observer getHiddenClass isIdentifier hasHiddenClass tagMember global mkAssignStmt escodegen add console mkIdentifier mkCallStmt */

Observer.prototype.beforeMemberWrite = function(pos, obj, prop, val) {
	var obj_klass = getHiddenClass(obj);
	tagMember(obj_klass, prop, val);
};

Observer.prototype.atFunctionReturn = function(pos, fn, ret) {
	// returning 'undefined' isn't interesting, forget about it
	if (ret === void(0))
		return;

	var fn_klass = getHiddenClass(fn),
		val_klass = getHiddenClass(ret);
	fn_klass.setPropClass('return', val_klass);
};


Observer.prototype.done = function() {
	var decls = [], globals = [];
	var global_class = getHiddenClass(global);
	
	for (var p in global_class.properties) {
		var prop = p.substring(2);
		globals.push(prop);
		decls.push(mkAssignStmt(mkIdentifier(prop), global_class.properties[p].generate_asg(decls)));
	}
	
	unfold_asgs(decls);
	decls = sort_decls(decls);
	
	var prog = {
		type: 'Program',
		body: [{
			type: 'VariableDeclaration',
			declarations: globals.map(function(global) {
				return {
					type: 'VariableDeclarator',
					id: mkIdentifier(global),
					init: null
				};
			}),
			kind: 'var'
		},
		mkCallStmt({
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
		}, [])]
	};
return escodegen.generate(prog);
};

function mkDecl(name, value) {
	return {
		type: 'VariableDeclaration',
		declarations: [
			{
				type: 'VariableDeclarator',
				id: {
					type: 'Identifier',
					name: name
				},
				init: value
			}
		],
		kind: 'var'
	};
}

function unfold_asgs(decls) {
	function recordDependency(root1, root2) {
		add(root1.deps || (root1.deps = []), root2);
	}
	
	function unfold(nd, parent, child_idx, root) {
		var i, n;
		
		// check whether this node has already been promoted to a declaration
		if(nd.global_decl) {
			recordDependency(root, nd.global_decl);
			parent[child_idx] = { type: 'Identifier', name: nd.global_decl.declarations[0].id.name };
		// otherwise check whether it needs to be promoted
		} else if(nd.parent) {
			decls.push(nd.global_decl = mkDecl(nd.temp_name, nd));
			unfold(nd, nd.parent, nd.child_idx, nd.root);
			unfold(nd, parent, child_idx, root);
		} else {
			nd.parent = parent;
			nd.child_idx = child_idx;
			nd.root = root;
			
			switch(nd.type) {
			case 'AssignmentExpression':
			case 'LogicalExpression':
				unfold(nd.left, nd, 'left', root);
				unfold(nd.right, nd, 'right', root);
				break;
			case 'BlockStatement':
				for(i=0,n=nd.body.length;i<n;++i)
					unfold(nd.body[i], nd.body, i, root);
				break;
			case 'CallExpression':
			case 'NewExpression':
				unfold(nd.callee, nd, 'callee', root);
				var args = nd['arguments'];
				for(i=0,n=args.length;i<n;++i)
					unfold(args[i], args, i, root);
				break;
			case 'ExpressionStatement':
				unfold(nd.expression, nd, 'expression', root);
				break;
			case 'FunctionExpression':
				unfold(nd.body, nd, 'body', root);
				break;
			case 'MemberExpression':
				unfold(nd.object, nd, 'object', root);
				if(nd.computed)
					unfold(nd.property, nd, 'property', root);
				break;
			case 'ObjectExpression':
				for(i=0,n=nd.properties.length;i<n;++i)
					unfold(nd.properties[i], nd.properties, i, root);
				break;
			case 'Property':
				unfold(nd.value, nd, 'value', root);
				break;
			case 'ReturnStatement':
			case 'UnaryExpression':
				if(nd.argument)
					unfold(nd.argument, nd, 'argument', root);
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
				if(nd.init)
					unfold(nd.init, nd, 'init', root);
				break;
			default:
				debugger;
				throw new Error("no idea how to handle " + nd.type);
			}
		}
	}
	
	for(var i=0,n=decls.length;i<n;++i)
		unfold(decls[i], decls, i, decls[i]);
}

function sort_decls(decls) {
	var res = [];
	
	function visit(root) {
		var deps = root.deps || [];
		root.visited = i;
		
		for(var j=0,n=deps.length;j<n;++j) {
			if(deps[j].visited == i) {
				if(deps[j] !== root)
					console.warn("circular dependency");
			} else if(typeof deps[j].visited === 'undefined') {
				visit(deps[j]);
			}
		}
		
		res.push(root);
	}
	
	for(var i=0,n=decls.length;i<n;++i)
		if(typeof decls[i].visited === 'undefined')
			visit(decls[i]);
		
	return res;
}