DAIN: Dynamic API Inferencer
============================

This is a tool for dynamically inferring API models for frameworks.

Use `instrument.js` to create an instrumented version of the framework, then exercise the instrumented version using some client (for instance, the framework's test suite). At any point, you can invoke `__getModel()` to obtain a pretty-printed model of every object and function created by the framework that is reachable from global scope.

Installation
------------

Run `npm install` in this directory to pull in dependencies.


Usage
-----

        node instrument.js [-l] [-t] [--node] file.js [test.js]

Instruments file.js to dynamically build models.

If the `-l` flag is not specified, the instrumented program is dumped to stdout. You would want to redirect stdout to a file, and then load that file into an HTML page that exercises its functionality. After you have exercised it enough, invoke the function `__runtime.getModel()` (e.g., from the JavaScript console), which will yield a pretty-printed summary of the inferred API in the form of a JavaScript program.

If the `-l` flag is specified, the instrumented program is immediately loaded into Zombie.js with a trivial HTML page that does nothing except loading the JavaScript file, and then immediately invoking `__runtime.getModel()`. The pretty-printed model is then dumped to stdout.

If the `-l` flag is specified and file `test.js` is given, the instrumented program is loaded together with `test.js`, which may then proceed to exercise the instrumented code. After one second, `__runtime.getModel()` is invoked and the model is dumped as per usual.

If both the `-l` and the `-t` flag are specified, `__runtime.getEvents()` is invoked instead of `__runtime.getModel()`, yielding a JSON representation of all observed property writes, function returns, and callbacks. You can later use `build-model.js` to construct a model from one or more such JSON files.

If the '--node' flag is specified, instrumentation is performed in such a way that the resulting file can be run under node (but not necessarily in the browser).


		node build-model.js [--no-cb] [--no-merging] [--callback-merging] file1.json file2.json ...
		
Builds a model from the given JSON-encoded event traces. If the `--no-cb` flag is specified, the generated model does not model invocation of callbacks. If the `--no-merging` flag is specified, the generated model does not merge structurally equal object/function models.
This will lead to (much) larger models, but may improve precision for some clients. Finally, the `--callback-merging` flag leads to multiple callbacks to the same function being merged into a single call.


Details
-------

The model is built in two stages: first, we record a trace of all relevant events, where an event is a property write, a function return, or an invocation of a non-framework function; then, we process the trace to build the actual model.

The code implementing the first stage is in folder `lib/record`. We instrument the framework's source code using [eavesdropper](https://github.com/ecspat/eavesdropper) to associate a tag with every runtime value, recording its type and its provenance.
In particular, for object literals and functions we record the source position where they were created, and for non-framework objects we record which function they were first passed to as argument, and which parameter position they were passed in. Objects that
were not created in framework code and not passed into a framework function as a parameter (e.g., objects returned from native functions), are marked with the tag `UNKNOWN`.

For every property assignment `x[p] = e`, we record an event detailing the tags of `x` and `e`, and the value of `p`. If the tag of either `x` or `e` is `UNKNOWN`, no event is recorded. Similarly, for a return statement `return e`, we record the tag of `e` and
of the enclosing function; if either is `UNKNOWN`, no event is recorded. Finally, for a function call where the callee is tagged as a user object, we record the callee and the tags of all arguments.

Once the framework code has been exercised enough, the trace of events is dumped as a JSON file. This file is then read in by the model builder (`lib/build-model/ModelBuilder.js`) to construct a JavaScript model of the framework.

Our language of models contains

  1. primitive types `BOOLEAN`, `NUMBER`, `STRING`, `NULL`, `UNDEFINED` and `REGEXP` as defined in `lib/build-model/PrimitiveModel.js`,
  2. object and array models (`lib/build-model/ObjModel.js` and `lib/build-model/ArrayModel.js`) that keep track of their properties' models;
  3. function models (`lib/build-model/FunctionModel.js`) that keep track of property models (in particular their prototype) and their return value's models;
  4. function instance models (`lib/build-model/InstanceModel.js`), one per function model;
  5. a global model (`lib/build-model/GlobalModel.js`) keeping track of properties of the global object;
  6. union models (`lib/build-model/Union.js`) representing the union of two or more other models;
  7. builtin object models (`lib/build-model/BuiltinObjectModel.js`) representing well-known standard library or DOM objects;
  8. client object models (`lib/build-model/ClientObjModel.js`) representing values passed in from non-framework code (such as a test suite).

For every property write event, the model of the right hand side is added to the written property's model, and similar for function returns.
  
The goal now is to generate a JavaScript program such that if we analyse this program using a flow-insensitive analysis we get an over-approximation of the observed behaviour of the
program. To this end, models are represented as JavaScript expressions as follows:

  1. `NULL` and `UNDEFINED` are represented as `null` and `void(0)`; `NUMBER` is represented as `Math.random()`, and similar for other primitive types
     (see `lib/build-model/asg.js` for details);
  2. object models are represented as object literals, their properties are assigned the expressions corresponding to their property models (and similar for array models);
  3. function models are represented as function expressions returning their return value's model;
  4. function instance models are represented as `new` expressions of the corresponding function model;
  5. the global model is represented by the global object, i.e. `this` at the top level;
  6. union models are represented by disjunctions (this obviously only works for analyses that do not flow-sensitively reason about short circuiting behaviour);
  7. builtin object models are represented by their corresponding builtin objects;

Client object models need not be represented explicitly. Instead, for each client object first seen as argument *i* of function *fm*, we introduce a global variable *g*, and
in the body of the function expression representing *fm* we store its *i*th parameter into that global variable. Uses of the client object can then simply be translated into
uses of that global variable. We only generate such globals for client objects that were actually used in some way (see `lib/build-model/find_used_client_objects.js`).

Calls to functions originating from non-framework code are modelled as a series of global calls (one per call) that use the global variables representing the functions and
whose arguments are the expressions corresponding to the arguments observed at runtime.

The expressions for different models may, in general, refer to each other, so the resulting ASTs would, in fact, not be trees at all, but rather DAGs or even general graphs.
We solve this by first generating abstract syntax graphs (`lib/build-model/asg.js`), and then ``unfolding'' the ASGs into ASTs by introducing global temporary variables.

As a final twist, we try to avoid generating multiple syntactically identical models to save space. Hence we perform a hashconsing step on models (`lib/build-model/hashconsing.js`)
where, for instance, object models with the same property models are merged before generating ASGs.
