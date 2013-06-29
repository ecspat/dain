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
 
 var Model = require('./Model').Model;

function PrimitiveModel() {
	Model.call(this);
}

var UNDEFINED = exports.UNDEFINED = new PrimitiveModel(),
    NULL = exports.NULL = new PrimitiveModel(),
    NUMBER = exports.NUMBER = new PrimitiveModel(),
	BOOLEAN = exports.BOOLEAN = new PrimitiveModel(),
	STRING = exports.STRING = new PrimitiveModel(),
	REGEXP = exports.REGEXP = new PrimitiveModel();
	
exports.PrimitiveModel = PrimitiveModel;