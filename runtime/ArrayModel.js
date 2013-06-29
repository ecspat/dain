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
 
 var Model = require('./Model').Model,
     ObjModel = require('./ObjModel').ObjModel,
     isIdentifier = require('./util').isIdentifier;

function ArrayModel(property_models) {
	Model.call(this);
	this.property_models = {};
}
ArrayModel.prototype = Object.create(ObjModel.prototype);

ArrayModel.prototype.normalisePropName = function(prop) {
	// merge non-identifier, non-index properties
	return isIdentifier(prop) || Number(prop) >= 0 ? prop : '*';
};

exports.ArrayModel = ArrayModel;