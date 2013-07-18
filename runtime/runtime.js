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

/*global require global*/ 

if(!global.__observer) {
	var Observer = require('./Observer').Observer,
	    Runtime = require('eavesdropper/runtime');

	global.__runtime = new Runtime(new Observer());
}