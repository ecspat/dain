DAIN: Dynamic API Inferencer
============================

This is a tool for dynamically inferring API models for frameworks.

Use `instrument.js` to create an instrumented version of the framework, then exercise the instrumented version using some client (for instance, the framework's test suite). At any point, you can invoke `__done` to obtain a model of every object and function created by the framework that is reachable from global scope.

Installation
------------

Run `npm install` in this directory to pull in dependencies.


Usage
-----

        node instrument.js [-l] file.js

Instruments file.js to dynamically build models.

If the -l flag is not given, the instrumented program is dumped to stdout. You would want to redirect stdout to a file, and then load that file into an HTML page that exercises its functionality. After you have exercised it enough, invoke the global function `__done` (e.g., from the JavaScript console), which will yield a pretty-printed summary of the inferred API in the form of a JavaScript program.

If the -l flag is passed, the instrumented program is immediately loaded into Zombie.js with a trivial HTML page that does nothing except loading the JavaScript file, and then immediately invoking `__done`; the type information is dumped to stdout in this case.


Details
-------

Our language of models contains primitive types (`BOOLEAN`, `NUMBER`, `STRING`, `NULL`, `UNDEFINED`), function models representing all function objects arising from one single textual definition, object literal models representing all object literals arising from one single textual definition, and function instance models representing all objects created by using 'new' with a given function model.

We instrument the source program to observe all assignments and function returns. Runtime objects are tagged with their model; whenever an assignment `x.f = e` is observed, we record the fact that the model of x may have a property `f` whose model is given by the model of `e`; whenever a return statement `return e` is observed, we record the fact that the enclosing function may return an object modelled by the model of `e`.