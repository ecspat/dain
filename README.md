DAIN: Dynamic API Inferencer
============================

This is a tool for dynamically inferring API models for frameworks.

Use `instrument.js` to create an instrumented version of the framework, then exercise the instrumented version using some client (for instance, the framework's test suite). At any point, you can invoke `__runtime.observer.done()` to obtain a pretty-printed model of every object and function created by the framework that is reachable from global scope.

Installation
------------

Run `npm install` in this directory to pull in dependencies.


Usage
-----

        node instrument.js [-l] [-t] file.js [test.js]

Instruments file.js to dynamically build models.

If the `-l` flag is not specified, the instrumented program is dumped to stdout. You would want to redirect stdout to a file, and then load that file into an HTML page that exercises its functionality. After you have exercised it enough, invoke the global function `__getModel()` (e.g., from the JavaScript console), which will yield a pretty-printed summary of the inferred API in the form of a JavaScript program.

If the `-l` flag is specified, the instrumented program is immediately loaded into Zombie.js with a trivial HTML page that does nothing except loading the JavaScript file, and then immediately invoking `__getModel()`. The pretty-printed model is then dumped to stdout.

If the `-l` flag is specified and file `test.js` is given, the instrumented program is loaded together with `test.js`, which may then proceed to exercise the instrumented code. After one second, `__getModel()` is invoked and the model is dumped as per usual.

If both the `-l` and the `-t` flag are specified, `__getEvents()` is invoked instead of `__getModel()`, yielding a JSON representation of all observed property writes, function returns, and callbacks.


Details
-------

Our language of models contains

  1. primitive types `BOOLEAN`, `NUMBER`, `STRING`, `NULL`, `UNDEFINED` and `REGEXP` as defined in `runtime/PrimitiveModel.js`,
  2. object and array models (`runtime/ObjModel.js` and `runtime/ArrayModel.js`) that keep track of their properties' models;
  3. function models (`runtime/FunctionModel.js`) that keep track of property models (in particular their prototype) and their return value's models;
  4. function instance models (`runtime/InstanceModel.js`), one per function model;
  5. a global model (`runtime/GlobalModel.js`) keeping track of properties of the global object;
  6. union models (`runtime/Union.js`) representing the union of two or more other models;
  7. builtin object models (`runtime/BuiltinObjectModel.js`) representing well-known standard library or DOM objects;
  8. client object models (`runtime/ClientObjModel.js`) representing values passed in from non-framework code (such as a test suite).
  
We instrument the framework's source code using [eavesdropper](https://github.com/ecspat/eavesdropper) to associate a model with every runtime value: primitive values are associated with
primitive types (except if they originate from non-framework code, for which see below); builtin objects are associated with their corresponding builtin model;
all objects, arrays and functions arising from a single textual definition are associated with one and the same object/array/function model.

Whenever an assignment `x.f = e` is observed, the model of `e` is added to the (union) model for property `f` of the model of `x`.
Whenever a return statement `return e` is observed, the model of `e` is added to the model for the return value of the enclosing function.

Objects passed in from uninstrumented code are tagged with a client object model when they are first observed. In particular, if such an object is first observed as the *i*th
argument of some function with model *fm*, then the client object records information about *i* and *fm*. Later on, whenever we see a call to a function that is associated with
a client object model, we make a note of the callee, its receiver model and its argument models.

The goal now is to generate a JavaScript program such that if we analyse this program using a flow-insensitive analysis we get an over-approximation of the observed behaviour of the
program. To this end, models are represented as JavaScript expressions as follows:

  1. `NULL` and `UNDEFINED` are represented as `null` and `void(0)`; `NUMBER` is represented as `Math.random()`, and similar for other primitive types
     (see `runtime/asg.js` for details);
  2. object models are represented as object literals, their properties are assigned the expressions corresponding to their property models (and similar for array models);
  3. function models are represented as function expressions returning their return value's model;
  4. function instance models are represented as `new` expressions of the corresponding function model;
  5. the global model is represented by the global object, i.e. `this` at the top level;
  6. union models are represented by disjunctions;
  7. builtin object models are represented by their corresponding builtin objects;

Client object models need not be represented explicitly. Instead, for each client object first seen as argument *i* of function *fm*, we introduce a global variable *g*, and
in the body of the function expression representing *fm* we store its *i*th parameter into that global variable. Uses of the client object can then simply be translated into
uses of that global variable. We only generate such globals for client objects that were actually used in some way (see `runtime/find_used_client_objects.js`).

Calls to functions originating from non-framework code are modelled as a series of global calls (one per call) that use the global variables representing the functions and
whose arguments are the expressions corresponding to the arguments observed at runtime.

The expressions for different models may, in general, refer to each other, so the resulting ASTs would, in fact, not be trees at all, but rather DAGs or even general graphs.
We solve this by first generating abstract syntax graphs (`runtime/asg.js`), and then ``unfolding'' the ASGs into ASTs by introducing global temporary variables.

As a final twist, we try to avoid generating multiple syntactically identical models to save space. Hence we perform a hashconsing step on models (`runtime/hashconsing.js`)
where, for instance, object models with the same property models are merged before generating ASGs.