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

var util = require('./util'),
    Union = require('./Union').Union,
    ObjModel = require('./ObjModel').ObjModel,
    GlobalModel = require('./GlobalModel').GlobalModel,
    InstanceModel = require('./InstanceModel').InstanceModel,
    FunctionModel = require('./FunctionModel').FunctionModel,
    PrimitiveModel = require('./PrimitiveModel'),
    UNDEFINED = PrimitiveModel.UNDEFINED,
	NULL = PrimitiveModel.NULL,
	BOOLEAN = PrimitiveModel.BOOLEAN,
	NUMBER = PrimitiveModel.NUMBER,
	STRING = PrimitiveModel.STRING,
	REGEXP = PrimitiveModel.REGEXP,
    add = util.add,
    forEach = util.forEach,
    getOrCreateHiddenProp = util.getOrCreateHiddenProp,
    setHiddenProp = util.setHiddenProp;

function merge(prop_maps) {
	var res = {};
	prop_maps.forEach(function(prop_map) {
		forEach(prop_map, function(k, v) {
			if(!(k in res)) {
				res[k] = [v];
			} else {
				add(res[k], v);
			}
		});
	});
	return forEach(res, function(k, vs) {
		return Union.make(vs);
	});
}

function getModel(obj) {
	var tp = typeof obj, property_models;
	switch(typeof obj) {
	case 'undefined':
		return UNDEFINED;
	case 'boolean':
		return BOOLEAN;
	case 'number':
		return NUMBER;
	case 'string':
		return STRING;
	case 'object':
		if(!obj) {
			return NULL;
		} else if(obj instanceof RegExp) {
			return REGEXP;
		} else if (!obj.hasOwnProperty('__model')) {
			var type = getOrCreateHiddenProp(obj, '__origin', { start_line: -1, start_offset: -1, type: 'unknown' }).type;
			if(type === 'global') {
				setHiddenProp(obj, '__model', new GlobalModel());
				property_models = forEach(getOrCreateHiddenProp(obj, '__properties', {}), function(prop, vals) {
					return Union.make(vals.map(getModel));
				});
				obj.__model.addPropertyModels(property_models);
			} else if(type === 'instance') {
				setHiddenProp(obj, '__model', getModel(obj.__origin.data).instance_model);
			} else {
				setHiddenProp(obj, '__model', new ObjModel());
				property_models = forEach(getOrCreateHiddenProp(obj, '__properties', {}), function(prop, vals) {
					return Union.make(vals.map(getModel));
				});
				obj.__model.addPropertyModels(property_models);
			}
		}
		return obj.__model;
	case 'function':
		if(!obj.hasOwnProperty('__model')) {
			setHiddenProp(obj, '__model', FunctionModel.EMPTY);
			
			property_models = forEach(getOrCreateHiddenProp(obj, '__properties', {}), function(prop, vals) {
				return Union.make(vals.map(getModel));
			});
			var instance_properties = merge(getOrCreateHiddenProp(obj, '__instances', []).map(function(inst) { 
				return forEach(getOrCreateHiddenProp(inst, '__properties', {}), function(prop, vals) {
					return Union.make(vals.map(getModel));
				});
			}));
			var instance_model = new InstanceModel(obj, instance_properties);
			var return_model = Union.make(getOrCreateHiddenProp(obj, '__return', []).map(getModel));
			
			setHiddenProp(obj, '__model', FunctionModel.make(property_models, instance_model, return_model));
		}
		return obj.__model;
	}
}

exports.getModel = getModel;