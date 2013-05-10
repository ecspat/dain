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

function PrimitiveClass(name) {
	HiddenClass.call(this);
	this.name = name;
}
PrimitiveClass.prototype = Object.create(HiddenClass.prototype);
	
PrimitiveClass.prototype.setPropClass = function() {};
	
var BOOLEAN = new PrimitiveClass("$$BOOLEAN$$"),
    NUMBER = new PrimitiveClass("$$NUMBER$$"),
    STRING = new PrimitiveClass("$$STRING$$"),
    UNDEFINED = new PrimitiveClass("void(0)"),
    NULL = new PrimitiveClass("null"),
    REGEXP = new PrimitiveClass("$$REGEXP$$");