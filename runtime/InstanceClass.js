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

/*global HiddenClass setHiddenProp*/

function InstanceClass(fnclass) {
	HiddenClass.call(this);
	if(!fnclass)
		debugger;
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