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

/** The superclass of all models. */
function Model() {
	/** Every model has a unique ID. */
	this.id = Model.next_model_id++;
}
Model.next_model_id = 0;

/** Models know about their child models. We need this when traversing the
  * model graph. */
Model.prototype.getChildren = function() {
	return [];
};

exports.Model = Model;