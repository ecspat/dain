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

/** Traversal method for finding client objects that are used somewhere. */

/** Default implementation: just iterate over children with an additional
  * visited flag to prevent infinite loops. */
Model.prototype.findUsedClientObjects = function() {
	if(!this.visited_fuco) {
		// TODO: when is it safe to clear this flag?
		this.visited_fuco = true;
		this.getChildren().forEach(function(child) {
			child.findUsedClientObjects();
		});
	}
};

/** Record actual use of client object. */
ClientObjModel.prototype.findUsedClientObjects = function() {
	this.fn_model.used_params[this.idx] = true;
};
