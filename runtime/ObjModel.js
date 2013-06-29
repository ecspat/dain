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
     util = require('./util'),
     forEach = util.forEach,
     add = util.add,
     isIdentifier = util.isIdentifier;

function ObjModel() {
	Model.call(this);
	this.property_models = {};
}
ObjModel.prototype = Object.create(Model.prototype);

ObjModel.prototype.addPropertyModels = function(property_models) {
	var self = this;
	forEach(property_models, function(prop, model) {
		prop = '$$' + self.normalisePropName(prop.substring(2));
		if(prop in self.property_models) {
			self.property_models[prop] = Union.make([self.property_models[prop], model]);
		} else {
			self.property_models[prop] = model;
		}
	});
};

ObjModel.prototype.normalisePropName = function(prop) {
	// merge non-identifier properties
	return isIdentifier(prop) ? prop : '*';
};

ObjModel.prototype.getChildren = function() {
	var children = [];
	forEach(this.property_models, function(_, model) {
		add(children, model);
	});
	return children;
};

exports.ObjModel = ObjModel;