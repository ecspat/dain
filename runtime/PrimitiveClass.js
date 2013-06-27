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

/*global HiddenClass mkMemberExpression mkIdentifier */

/** Primitive classes correspond to JavaScript's primitive types. */
function PrimitiveClass(name) {
	HiddenClass.call(this);
	this.name = name;
}
PrimitiveClass.prototype = Object.create(HiddenClass.prototype);
	
PrimitiveClass.prototype.setPropClass = function() {};
	
var BOOLEAN = new PrimitiveClass("$BOOLEAN$"),
    NUMBER = new PrimitiveClass("$NUMBER$"),
    STRING = new PrimitiveClass("$STRING$"),
    UNDEFINED = new PrimitiveClass("void(0)"),
    NULL = new PrimitiveClass("null"),
    REGEXP = new PrimitiveClass("$REGEXP$");
    
PrimitiveClass.prototype.generate_asg = function(decls) {
    return this.asg;
};

/* Concrete definitions of the primitive classes:
 *
 *  NUMBER = Math.random()
 *  BOOLEAN = !NUMBER
 *  STRING = String(NUMBER)
 *  REGEXP = new RegExp(STRING)
 *  UNDEFINED = void(0)
 *  NULL = null */

NUMBER.asg = { type: 'CallExpression', callee: mkMemberExpression("Math", "random"), 'arguments': [], temp_name: '$NUMBER$' };
BOOLEAN.asg = { type: 'UnaryExpression', operator: '!', argument: NUMBER.asg, temp_name: '$BOOLEAN$' };
STRING.asg = { type: 'CallExpression', callee: mkIdentifier('String'), 'arguments': [NUMBER.asg], temp_name: '$STRING$' };
REGEXP.asg = { type: 'NewExpression', callee: mkIdentifier('RegExp'), 'arguments': [STRING.asg], temp_name: '$REGEXP$' };

UNDEFINED.generate_asg = function() {
	return { type: 'UnaryExpression', operator: 'void', argument: { type: 'Literal', value: 0, raw: "0" } };
};
NULL.generate_asg = function() {
	return { type: 'Literal', value: null, raw: 'null' };
};

// when unioning, simply elide UNDEFINED
UNDEFINED.unionWith = function(klass) {
	return klass;
};