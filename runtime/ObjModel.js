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
     Union = require('./Union').Union,
     forEach = require('./util').forEach;

function ObjModel(property_models) {
	Model.call(this);
	this.property_models = property_models || {};
}
ObjModel.prototype = Object.create(Model.prototype);

ObjModel.prototype.addPropertyModels = function(property_models) {
	var self = this;
	forEach(property_models, function(prop, model) {
		if(prop in self.property_models) {
			self.property_models[prop] = Union.make(self.property_models[prop], model);
		} else {
			self.property_models[prop] = model;
		}
	});
};

exports.ObjModel = ObjModel;