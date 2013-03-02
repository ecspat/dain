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

// utility function for setting a non-enumerable, writable property
function setHiddenProp(obj, prop, val) {
	Object.defineProperty(obj, prop, { enumerable: false, writable: true, value: val });
	return val;
}
	
// utility function for adding element to array if it isn't in there yet
function add(array, elt) {
	for(var i=0;i<array.length;++i)
		if(array[i] === elt)
			return;
	array[i] = elt;
}
