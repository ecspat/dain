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

/*global HiddenClass*/

function GlobalClass(global) {
    HiddenClass.call(this);
    this.obj = global;
}
GlobalClass.prototype = Object.create(HiddenClass.prototype);

GlobalClass.prototype.mkTempName = function() {
    return "global_" + this.id;
};