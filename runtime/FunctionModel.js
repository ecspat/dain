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

/*global require exports*/

var ObjModel = require('./ObjModel').ObjModel,
    UNDEFINED = require('./PrimitiveModel').UNDEFINED;
 
function FunctionModel(property_models, instance_model, return_model) {
	ObjModel.call(this, property_models);
	this.instance_model = instance_model;
	this.return_model = return_model;
	this.used_params = [];
}
FunctionModel.prototype = Object.create(ObjModel.prototype);

FunctionModel.cache = {};

FunctionModel.signature = function(property_models, instance_model, return_model) {
	return ObjModel.signature(property_models) + "|" + instance_model.id + ":" + return_model.id;
};

FunctionModel.make = function(property_models, instance_model, return_model) {
	/*var sig = FunctionModel.signature(property_models, instance_model, return_model),
	    model = FunctionModel.cache[sig];
	
	if(!model) {
		FunctionModel.cache[sig] = model = new FunctionModel(property_models, instance_model, return_model);
	}
	
	return model;*/
	return new FunctionModel(property_models, instance_model, return_model);
};

FunctionModel.EMPTY = FunctionModel.make({}, ObjModel.EMPTY, UNDEFINED);

exports.FunctionModel = FunctionModel;