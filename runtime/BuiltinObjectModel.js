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

/** A model of some well-known standard library or DOM object. */
function BuiltinObjectModel(full_name) {
	ObjModel.call(this);
	this.full_name = full_name;
}
BuiltinObjectModel.prototype = Object.create(ObjModel.prototype);

BuiltinObjectModel.cache = {};
BuiltinObjectModel.create = function(full_name) {
	var id = '$$' + full_name;
	return BuiltinObjectModel.cache[id] || (BuiltinObjectModel.cache[id] = new BuiltinObjectModel(full_name));
};

exports.BuiltinObjectModel = BuiltinObjectModel;