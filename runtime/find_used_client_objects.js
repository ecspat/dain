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
 
 /*global require */
 
var Model = require('./Model').Model,
    ClientObjModel = require('./ClientObjModel').ClientObjModel;

/* traversal function for finding client objects that are used somewhere */
Model.prototype.findUsedClientObjects = function() {
	if(!this.visited) {
		this.visited = true;
		this.getChildren().forEach(function(child) {
			child.findUsedClientObjects();
		});
		delete this.visited;
	}
};

ClientObjModel.prototype.findUsedClientObjects = function() {
	this.fn_model.used_params[this.idx] = true;
};
