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

function HiddenClass() {
	this.properties = {};
	this.unions = [];
	this.id = HiddenClass.nextId++;
}
HiddenClass.nextId = 0;
	
HiddenClass.prototype.setPropClass = function(prop, klass) {
	if(!this.properties[prop])
		this.properties[prop] = klass;
	else
		this.properties[prop] = this.properties[prop].unionWith(klass);
};