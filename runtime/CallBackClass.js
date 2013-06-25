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

function CallBackClass(fn, i) {
	HiddenClass.call(this);
	this.fn = fn;
	this.index = i;
}
CallBackClass.prototype = Object.create(HiddenClass.prototype);

CallBackClass.make = function(fn, i) {
	return fn.callback_classes[i] || (fn.callback_classes[i] = new CallBackClass(fn, i));
};

CallBackClass.prototype.mkTempName = function() {
	return this.fn.mkTempName() + "_" + this.index;
};