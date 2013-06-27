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
 
/*global GlobalClass InstanceClass FunctionClass ObjClass setHiddenClass getHiddenClass setHiddenProp isIdentifier*/

function tagGlobal(global) {
	if(!global.hasOwnProperty('__class'))
		setHiddenProp(global, '__class', new GlobalClass(global));
	return global.__class;
}
	
function tagNew(obj, fn) {
	if(!obj.hasOwnProperty('__class') && fn.hasOwnProperty('__class'))
		setHiddenProp(obj, '__class', InstanceClass.from(fn));
	return obj.__class;
}
	
function tagFn(fn, line, offset) {
	if(!fn.hasOwnProperty('__class')) {
		var fnclass = FunctionClass.make(fn, line, offset);
	    setHiddenProp(fn, '__class', fnclass);
	    if(fn.prototype)
		    setHiddenProp(fn.prototype, '__class', fnclass.prototype_class);
	}
	return fn.__class;
}
	
function tagObjLit(obj, line, offset) {
	if(!obj.hasOwnProperty('__class'))
		setHiddenProp(obj, '__class', ObjClass.make(obj, line, offset));
	return obj.__class;
}

function tagMember(obj_klass, prop, val) {
	var val_klass = getHiddenClass(val);
	if (!isIdentifier("" + prop))
		prop = "*";
	obj_klass.setPropClass('$$' + prop, val_klass);
}