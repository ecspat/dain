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

/*global Observer getHiddenClass isIdentifier hasHiddenClass tagMember global mkAssignStmt escodegen add console mkIdentifier mkCallStmt mkMemberExpression */

/**
 * Helper functions for creating AST nodes.
 */

function mkDecl(name, value) {
	return {
		type: 'VariableDeclaration',
		declarations: [
			{
				type: 'VariableDeclarator',
				id: mkIdentifier(name),
				init: value
			}
		],
		kind: 'var'
	};
}

function mkAssignStmt(lhs, rhs) {
	return {
		type: 'ExpressionStatement',
		expression: {
			type: 'AssignmentExpression',
			operator: '=',
			left: lhs,
			right: rhs
		}
	};
}

function mkCallStmt(callee, args, isNew) {
	return {
		type: 'ExpressionStatement',
		expression: {
			type: isNew ? 'NewExpression' : 'CallExpression',
			callee: callee,
			'arguments': args
		}
	};
}

function mkMemberExpression(obj, prop) {
	if(typeof obj === 'string')
		obj = mkIdentifier(obj);
		
	if (isIdentifier(prop))
	    return {
			type: 'MemberExpression',
			computed: false,
			object: obj,
			property: mkIdentifier(prop)
	    };
	else
	    return {
			type: 'MemberExpression',
			computed: true,
			object: obj,
			property: {
				type: 'Literal',
				value: prop,
				raw: prop
			}
	    };
}

function mkProperty(name, value) {
	if(isIdentifier(name))
		return {
			type: 'Property',
			key: mkIdentifier(name),
			value: value,
			kind: 'init'
		};
	else
		return {
			type: 'Property',
			key: {
				type: 'Literal',
				value: name,
				raw: name
			},
			value: value,
			kind: 'init'
		};
}

function mkThis() {
	return { type: 'ThisExpression' };
}

function mkIdentifier(x) {
	return {
		type: 'Identifier',
		name: x
	};
}

function mkReturn(expr) {
	return {
		type: 'ReturnStatement',
		argument: expr
	};
}

function mkOr(left, right) {
	return {
		type: 'LogicalExpression',
		operator: '||',
		left: left,
		right: right
	};
}

function isEmptyObjectLiteral(obj) {
	return obj.type === 'ObjectExpression' &&
		   obj.properties.length === 0;
}