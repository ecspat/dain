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
 
 var ObjModel = require('./ObjModel').ObjModel;

function GlobalModel(property_models) {
	if(GlobalModel.GLOBAL)
		throw new Error("Cannot have more than one global model.");
	GlobalModel.GLOBAL = this;
	ObjModel.call(this, property_models);
}
GlobalModel.prototype = Object.create(ObjModel.prototype);

exports.GlobalModel = GlobalModel;