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

/*global getHiddenClass global console __write:true __return:true __done:true add mkAssignStmt escodegen
         isIdentifier tagGlobal tagFn tagNew tagObjLit __tagGlobal:true __tagFn:true __tagNew:true __tagObjLit:true */

function write(obj, prop, val) {
	var obj_klass = getHiddenClass(obj),
		val_klass = getHiddenClass(val);
	if (!isIdentifier("" + prop))
		prop = "*";
	obj_klass.setPropClass('$$' + prop, val_klass);
}

function ret(fn, val) {
	// returning 'undefined' isn't interesting, forget about it
	if (val === void(0))
		return;

	var fn_klass = getHiddenClass(fn),
		val_klass = getHiddenClass(val);
	fn_klass.setPropClass('return', val_klass);
}

function done() {
	var decls = [];
	var global_class = getHiddenClass(global);
	
	for (var p in global_class.properties) {
		var prop = p.substring(2);
		decls.push(mkAssignStmt({ type: 'Identifier', name: prop }, global_class.properties[p].generate_asg(decls)));
	}
	
	unfold_asgs(decls);
	decls = sort_decls(decls);
	
	return decls.map(escodegen.generate).join('\n');
}

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
				for(var i=0,n=nd.body.length;i<n;++i)
					unfold(nd.body[i], nd.body, i, root);
				break;
			case 'CallExpression':
			case 'NewExpression':
				unfold(nd.callee, nd, 'callee', root);
				var args = nd['arguments'];
				for(var i=0,n=args.length;i<n;++i)
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
				for(var i=0,n=nd.properties.length;i<n;++i)
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
			default:
				if(typeof nd.type === 'undefined')
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

// expose API 
__tagGlobal = tagGlobal;
__tagFn = tagFn;
__tagNew = tagNew;
__tagObjLit = tagObjLit;
__write = write;
__return = ret;
__done = done;