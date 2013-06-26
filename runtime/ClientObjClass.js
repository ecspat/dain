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
 
 /*global HiddenClass*/

/** a class representing a client object passed in as a function argument */
function ClientObjClass(fn, i) {
	HiddenClass.call(this);
	this.fn = fn;
	this.index = i;
}
ClientObjClass.prototype = Object.create(HiddenClass.prototype);

ClientObjClass.make = function(fn, i) {
	return fn.client_obj_classes[i] || (fn.client_obj_classes[i] = new ClientObjClass(fn, i));
};

ClientObjClass.prototype.mkTempName = function() {
	return this.fn.mkTempName() + "_" + this.index;
};