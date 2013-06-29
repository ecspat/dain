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
    ArrayModel = require('./ArrayModel').ArrayModel,
    GlobalModel = require('./GlobalModel').GlobalModel,
    InstanceModel = require('./InstanceModel').InstanceModel,
    FunctionModel = require('./FunctionModel').FunctionModel,
    PrimitiveModel = require('./PrimitiveModel'),
    ClientObjModel = require('./ClientObjModel').ClientObjModel,
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

function getModel(obj) {
	var tp = typeof obj, type, property_models;
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
			type = getOrCreateHiddenProp(obj, '__origin', { start_line: -1, start_offset: -1, type: 'unknown' }).type;
			if(type === 'global') {
				setHiddenProp(obj, '__model', new GlobalModel(obj));
				property_models = forEach(getOrCreateHiddenProp(obj, '__properties', {}), function(prop, vals) {
					return Union.make(vals.map(getModel));
				});
				obj.__model.addPropertyModels(property_models);
				obj.__model.addCallbacks(getOrCreateHiddenProp(obj, '__callbacks', []).map(function(info) {
					return {
						callee: getModel(info.callee),
						args: getOrCreateHiddenProp(info.callee, '__parameters', []).map(function(vals) {
							return Union.make(vals.map(getModel));
						}),
						kind: info.kind
					};
				}));
			} else if(type === 'instance') {
				setHiddenProp(obj, '__model', getModel(obj.__origin.data).instance_model);
			} else if(type === 'client object') {
				setHiddenProp(obj, '__model', ClientObjModel.make(getModel(obj.__origin.data.fn), obj.__origin.data.index));
			} else {
				setHiddenProp(obj, '__model', type === 'arraylit' ? new ArrayModel() : new ObjModel());
				property_models = forEach(getOrCreateHiddenProp(obj, '__properties', {}), function(prop, vals) {
					return Union.make(vals.map(getModel));
				});
				obj.__model.addPropertyModels(property_models);
			}
		}
		return obj.__model;
	case 'function':
		if(!obj.hasOwnProperty('__model')) {
			type = getOrCreateHiddenProp(obj, '__origin', { start_line: -1, start_offset: -1, type: 'unknown' }).type;
			if(type === 'client object') {
				setHiddenProp(obj, '__model', ClientObjModel.make(getModel(obj.__origin.data.fn), obj.__origin.data.index));
			} else {
				setHiddenProp(obj, '__model', new FunctionModel());
			
				property_models = forEach(getOrCreateHiddenProp(obj, '__properties', {}), function(prop, vals) {
					return Union.make(vals.map(getModel));
				});
				obj.__model.addPropertyModels(property_models);
			
				getOrCreateHiddenProp(obj, '__instances', []).forEach(function(inst) { 
					var instance_property_models = forEach(getOrCreateHiddenProp(inst, '__properties', {}), function(prop, vals) {
						return Union.make(vals.map(getModel));
					});
					obj.__model.instance_model.addPropertyModels(instance_property_models);
				});
			
				obj.__model.return_model = Union.make(getOrCreateHiddenProp(obj, '__return', []).map(getModel));
			}
		}
		return obj.__model;
	}
}

exports.getModel = getModel;