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

function InstanceModel(fn_model) {
	ObjModel.call(this);
	this.fn_model = fn_model;
}
InstanceModel.prototype = Object.create(ObjModel.prototype);

exports.InstanceModel = InstanceModel;