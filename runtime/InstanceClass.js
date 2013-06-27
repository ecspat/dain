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

var HiddenClass = require('./HiddenClass').HiddenClass,
    setHiddenProp = require('./util').setHiddenProp;

/** An InstanceClass represents all objects created as instances of a function belonging
 * to fnclass. */
function InstanceClass(fnclass) {
	HiddenClass.call(this);
	this.fnclass = fnclass;
}
InstanceClass.prototype = Object.create(HiddenClass.prototype);
	
InstanceClass.from = function(fn) {
	var klass = fn.__instance_class;
	if(!klass)
		setHiddenProp(fn, '__instance_class', klass = new InstanceClass(fn.__class));
	return klass;
};

InstanceClass.prototype.mkTempName = function() {
	return "new_" + this.fnclass.mkTempName();
};

InstanceClass.prototype.generate_asg = function(decls) {
	if(this.asg)
		return this.asg;
		
	this.asg = { type: 'NewExpression',
				 callee: this.fnclass.generate_asg(decls),
				 'arguments': [],
				 temp_name: this.mkTempName() };
	
    return this.asg;
};

exports.InstanceClass = InstanceClass;