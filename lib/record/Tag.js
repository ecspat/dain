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
 
 /*global exports */

function Tag(props) {
	for(var p in props)
		this[p] = props[p];
}

Tag.prototype.mkClientObjTag = function(idx) {
	return new Tag({
		type: 'clientobj',
		func: this,
		idx: idx
	});
};

Tag.prototype.mkNewTag = function() {
	return new Tag({ type: 'new', func: this });
};

Tag.prototype.mkProtoTag = function() {
	return new Tag({ type: 'proto', default_proto_of: this });
};

exports.Tag = Tag;
exports.GLOBAL = new Tag({ type: 'global' }),
exports.UNDEFINED = new Tag({ type: 'undefined' }),
exports.BOOLEAN = new Tag({ type: 'boolean' }),
exports.NUMBER = new Tag({ type: 'number' }),
exports.STRING = new Tag({ type: 'string' }),
exports.NULL = new Tag({ type: 'null' }),
exports.REGEXP = new Tag({ type: 'regexp' }),
exports.UNKNOWN = new Tag({ type: 'unknown' });
    
exports.UNKNOWN.mkClientObjTag = function() { return this; };
exports.UNKNOWN.mkNewTag = function() { return this; };
exports.UNKNOWN.mkProtoTag = function() { return this; };