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

/*global getHiddenClass global console __write:true __return:true __done:true
         tagGlobal tagFn tagNew tagObjLit __tagGlobal:true __tagFn:true __tagNew:true __tagObjLit:true */

function write(obj, prop, val) {
    var obj_klass = getHiddenClass(obj),
        val_klass = getHiddenClass(val);
    if(!isValidIdentifier(""+prop))
	prop = "*";
    obj_klass.setPropClass('$$' + prop, val_klass);
}
	
function ret(fn, val) {
    // returning 'undefined' isn't interesting, forget about it
    if(val === undefined)
	return;
    
    var fn_klass = getHiddenClass(fn),
        val_klass = getHiddenClass(val);
    fn_klass.setPropClass('return', val_klass);
}

function done() {
    var decls = [];
    var global_class = getHiddenClass(global);
    global_class.markReachable();
    for(var p in global_class.properties) {
	var prop = p.substring(2);
	global_class.properties[p].pp(decls, "", prop);
    }
    return decls.join('');
}

// expose API 
__tagGlobal = tagGlobal;
__tagFn = tagFn;
__tagNew = tagNew;
__tagObjLit = tagObjLit;
__write = write;
__return = ret;
__done = done;