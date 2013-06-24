function Observer() {}

Observer.prototype.beforeMemberRead = function(){};
Observer.prototype.beforeFunctionCall = function(){};
Observer.prototype.atFunctionExit = function(){};
Observer.prototype.afterArrayExpression = function(){};
Observer.prototype.beforeMethodCall = function(){};
Observer.prototype.beforeNewExpression = function(){};
Observer.prototype.afterNewExpression = function(){};