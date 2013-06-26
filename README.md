DAIN: Dynamic API Inferencer
============================

This is a tool for dynamically inferring API models for frameworks.

Use `instrument.js` to create an instrumented version of the framework, then exercise the instrumented version using some client (for instance, the framework's test suite).
At any point, you can invoke `__observer.done()` to obtain a pretty-printed model of every object and function created by the framework that is reachable from global scope.

Installation
------------

Run `npm install` in this directory to pull in dependencies.


Usage
-----

        node instrument.js [-l] file.js [test.js]

Instruments file.js to dynamically build models.

If the `-l` flag is not specified, the instrumented program is dumped to stdout. You would want to redirect stdout to a file, and then load that file into an HTML page that exercises its functionality.
After you have exercised it enough, invoke the global function `__observer.done()` (e.g., from the JavaScript console), which will yield a pretty-printed summary of the inferred API in the form of a JavaScript program.

If the `-l` flag is specified, the instrumented program is immediately loaded into Zombie.js with a trivial HTML page that does nothing except loading the JavaScript file, and then immediately invoking `__observer.done()`.
The pretty-printed model is then dumped to stdout.

If the `-l` flag is specified and file `test.js` is given, the instrumented program is loaded together with `test.js`, which may then proceed to exercise the instrumented code.
After one second, `__observer.done()` is invoked and the model is dumped as per usual.


Details
-------

Our language of models contains

  1. primitive types (`BOOLEAN`, `NUMBER`, `STRING`, `NULL`, `UNDEFINED`),
  2. function models representing all function objects arising from one single textual definition,
  3. object and array literal models representing all object/array literals arising from one single textual definition, and
  4. function instance models representing all objects created by using 'new' with a given function model.

We instrument the source program to observe all assignments and function returns.
Runtime objects are tagged with their model; whenever an assignment `x.f = e` is observed, we record the fact that the model of x may have a property `f` whose model is given by the model of `e`;
whenever a return statement `return e` is observed, we record the fact that the enclosing function may return an object modelled by the model of `e`.

We additionally track objects (including functions) passed in from client code and model callbacks from the library to client code, including information about the types of objects passed as arguments.