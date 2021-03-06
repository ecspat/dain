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

/*global require module process console*/ 

var Observer = require('./record/Observer').Observer,
	ModelBuilder = require('./build-model/ModelBuilder'),
    Runtime = require('eavesdropper/runtime');
    
var runtime = module.exports = new Runtime(new Observer());

runtime.getEvents = function() {
	return runtime.observer.done().toString();
};

runtime.getModel = function() {
	return ModelBuilder.buildModel(runtime.observer.done());
};