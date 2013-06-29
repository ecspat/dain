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

ObjModel.cache = {};

ObjModel.signature = function(property_models) {
	return Object.keys(property_models).sort().map(function(p) {
		return p.substring(2) + ":" + property_models[p].id;
	}).join(',');
};

ObjModel.make = function(property_models) {
	/*var sig = ObjModel.signature(property_models),
	    model = ObjModel.cache[sig];
	
	if(!model) {
		ObjModel.cache[sig] = model = new ObjModel(property_models);
	}
	
	return model;*/
	return new ObjModel(property_models);
};

ObjModel.EMPTY = ObjModel.make({});

exports.ObjModel = ObjModel;