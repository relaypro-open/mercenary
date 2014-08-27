'use strict';

var _ = require('lodash'),

    //-----------------
    //    Constants
    //-----------------

    undef = void 0,
    nil = null,
    nan = NaN,
    inf = Infinity,

    //------------------
    //    Prototypes
    //------------------

    arrayProto = Array.prototype,
    dateProto = Date.prototype,
    functionProto = Function.prototype,
    numberProto = Number.prototype,
    regexProto = RegExp.prototype,
    objectProto = Object.prototype,
    stringProto = String.prototype,

    //------------
    //    Core
    //------------

    identity = _.identity,
    noop = _.noop,
    constant = _.constant,
    bind = _.bind,
    partial = _.partial,
    compose = _.compose,
    once = _.once,
    times = _.times,

    // Return a function that binds the given method name to its object.
    bound = function(object, method) {
        return bind(object[method], object);
    },

    // Unbind a method so that its first argument will assign its this context.
    unbind = function(fn) {
        return bind(functionProto.call, fn);
    },

    // Call a function with the given this context and arguments.
    call = unbind(functionProto.call),

    // Apply a function with the given this context and arguments. Any number of arguments may
    // be passed, but the last argument must be an array, a la CommonLisp (apply) semantics.
    baseApply = unbind(functionProto.apply),
    apply = function(fn, context) {
        var args = slice(arguments, 2);

        return (
            baseApply(
                fn, context,
                len(args) > 1 ?
                    concat(slice(args, 0, -1), last(args)) :
                    last(args) || []));
    },

    // Call a function with a null this context and the given arguments.
    hail = function(fn) {
        return baseApply(fn, undef, slice(arguments, 1));
    },

    // Apply a function with a null this context and the given arguments. Any number of arguments
    // may be passed, but the last argument must be an array, a la CommonLisp (apply) semantics.
    invoke = function(fn) {
        var args = slice(arguments, 1);

        return (
            baseApply(
                fn, undef,
                len(args) > 1 ?
                    concat(slice(args, 0, -1), last(args)) :
                    last(args) || []));
    },

    // Destructure an array or object and apply it to a function. For an object, the second
    // argument should be an array specifying the keys to select for destructuring.
    destructure = function(value, keysOrFn, fnOrContext, optContext) {
        return (
            isArray(keysOrFn) ?
                apply(fnOrContext, optContext, select(value, keysOrFn)) :
                apply(keysOrFn, fnOrContext, isArray(value) ? value : values(value)));
    },

    // Returns a function that will destructure an array or object and apply it to a function. For
    // an object, the first argument should be an array specifying the keys to select for
    // for destructuring.
    destructured = function(keysOrFn, fnOrContext, optContext) {
        return function(value) {
            return destructure(value, keysOrFn, fnOrContext, optContext);
        };
    },

    //-----------------------------------
    //    Arrays, Strings and Objects
    //-----------------------------------

    each = _.each,
    all = _.all,
    any = _.any,
    map = _.map,
    reduce = _.reduce,
    rreduce = _.reduceRight,
    filter = _.filter,
    find = _.find,
    len = _.size,

    //--------------------------
    //    Arrays and Strings
    //--------------------------

    index = _.indexOf,
    rindex = _.lastIndexOf,

    // Slices an array or string with optional negative indexing.
    arrayProtoSlice = arrayProto.slice,
    slice = function(value, begin, end) {
        return (
            value.slice ?
                value.slice(begin, end) :
                arrayProtoSlice.call(value, begin, end));
    },

    //-----------------
    //    Functions
    //-----------------

    // Return a function that returns the boolean opposite of the given function.
    complement = function(fn, context) {
        return function() {
            return !apply(fn, context || this, arguments);
        };
    },

    // Return a function that applies the given function to a sliced number
    // of arguments.
    sliceargs = function(fn, index, context) {
        return function() {
            return apply(fn, context || this, slice(arguments, 0, index || 0));
        };
    },

    //--------------
    //    Arrays
    //--------------

    first = _.first,
    butfirst = _.rest,
    last = _.last,
    butlast = _.initial,
    contains = _.contains,
    unique = _.unique,
    flatten = _.flatten,
    zip = _.zip,
    object = _.object,
    push = unbind(arrayProto.push),
    pop = unbind(arrayProto.pop),
    shift = unbind(arrayProto.shift),
    unshift = unbind(arrayProto.unshift),
    splice = unbind(arrayProto.splice),
    concat = unbind(arrayProto.concat),
    join = unbind(arrayProto.join),
    sort = unbind(arrayProto.sort),
    reverse = unbind(arrayProto.reverse),

    // Get the top item in a stack.
    top = function(array) {
        return array && array[array.length - 1];
    },

    // Returns a sorted copy of an array, using an optional ordering predicate.
    sorted = function(array, by) {
        array = slice(array);
        if (by) {
            sort(array, by);
        } else {
            sort(array);
        }
        return array;
    },

    // Returns a reversed copy of an array.
    reversed = function(array) {
        array = slice(array);
        reverse(array);
        return array;
    },

    // Transposes rectangular data.
    transposed = function(array) {
        return invoke(zip, array);
    },

    //---------------
    //    Objects
    //---------------

    has = _.has,
    extend = _.extend,
    merge = _.merge,
    keys = _.keys,
    values = _.values,
    items = _.pairs,
    pick = _.pick,
    pluck = _.pluck,

    // Return an array containing the values for the given keys from the object.
    select = function(object, keys) {
        return map(keys, function(key) {
            return object[key];
        });
    },

    // Safely retrieve a nested property from an object by following each argument into the
    // given object.
    get = function(object) {
        var value = object,
            keys = slice(arguments, 1);

        if (len(keys) && !isAbsent(value)) {
            all(keys, function(key) {
                value = value[key];
                return !isAbsent(value);
            });
            return value;
        }
    },

    // Set a nested property on an object by following each argument into the given object
    // and setting the final argument as the value. For any missing property, a new object will be
    // created. Returns the original object, falling back to a newly created object when the
    // original was absent.
    set = function(object) {
        var value = len(arguments) > 1 ? last(arguments) : undef,
            keys = slice(arguments, 1, -1),
            final = len(keys) - 1,
            target = object || {};

        object = target;
        each(keys, function(key, i) {
            if (i === final) {
                target[key] = value;
            } else {
                target = target[key] || (target[key] = {});
            }
        });
        return object;
    },

    //---------------
    //    Strings
    //---------------

    char = unbind(stringProto.charAt),
    upper = unbind(stringProto.toLocaleUpperCase || stringProto.toUpperCase),
    lower = unbind(stringProto.toLocaleLowerCase || stringProto.toLowerCase),
    split = unbind(stringProto.split),
    replace = unbind(stringProto.replace),

    // Returns the character for the given unicode code point.
    charFrom = String.fromCharCode,

    // Returns the unicode code point for the given character.
    charCode = function(character) {
        return character.charCodeAt(0);
    },

    // Trim a string of extraneous whitespace.
    regexTrim = /^\s*|\s*$/g,
    trim = function(string) {
        return replace(string, regexTrim, '');
    },

    //---------------
    //    Numbers
    //---------------

    math = Math,
    abs = math.abs,
    floor = math.floor,
    ceil = math.ceil,
    round = math.round,
    min = math.min,
    max = math.max,
    log = math.log,
    exp = math.exp,
    pow = math.pow,
    sqrt = math.sqrt,
    random = math.random,

    // Return a string representation of the number with a fixed numbed number of
    // floating-point digits.
    fixed = unbind(numberProto.toFixed),

    // Return a string representation of the number with a fixed number of significant digits.
    precise = unbind(numberProto.toPrecision),

    // Sum an array of numbers.
    sum = function(numbers) {
        return reduce(
            numbers,
            function(addend, augend) {
                return addend + augend;
            },
            0);
    },

    // Multiply an array of numbers.
    product = function(numbers) {
        return reduce(
            numbers,
            function(multiplicand, multiplier) {
                return multiplicand * multiplier;
            },
            1);
    },

    //-------------
    //    Dates
    //-------------

    now = _.now,

    // Create a Date the specified number of seconds in the future
    // (use a negative value for the past).
    later = function(seconds) {
        return new Date(now() + round(1000 * (seconds || 0)));
    },

    // Convert a Date to a UTC string.
    utc = unbind(dateProto.toUTCString),

    //---------------------------
    //    Regular Expressions
    //---------------------------

    test = unbind(regexProto.test),

    // RegExp.exec() is renamed to match(), following
    // Python's (better) naming conventions.
    match = unbind(regexProto.exec),

    // Invokes the callback for each result of RegExp.exec(),
    // usually used with the global RegExp flag.
    matchEach = function(regex, string, fn, context) {
        var result = match(regex, string);

        while (result) {
            call(fn, context || this, result);
            result = match(regex, string);
        }
    },

    //------------
    //    JSON
    //------------

    jsonencode = JSON.stringify,
    jsondecode = JSON.parse,

    //-------------
    //    Types
    //-------------

    // Declare a class with single inheritance. The new class will inherit from parent
    // (defaulting to Object). The constructor function should initialize an instance.
    // The proto object should define the class' protoype, and the cls object should define
    // any static properties.
    declare = function(parent, constructor, proto, cls) {
        return (
            extend(
                constructor,
                {
                    prototype: (
                        _.create(
                            (parent || Object).prototype,
                            extend(
                                {},
                                proto || {},
                                {constructor: constructor})))
                },
                cls || {}));
    },

    isArray = _.isArray,
    isObject = _.isObject,
    isFunction = _.isFunction,
    isString = _.isString,
    isNumber = _.isNumber,
    isBounded = _.isFinite,
    isBoolean = _.isBoolean,
    isDate = _.isDate,
    isRegex = _.isRegExp,
    isNotANumber = _.isNaN,
    isNil = _.isNull,
    isUndef = _.isUndefined,
    isDef = complement(isUndef),

    // Is the value undefined or null?
    isAbsent = function(value) {
        return isUndef(value) || isNil(value);
    };

//------------------
//    Public API
//------------------

module.exports = {
    // Constants
    undef: undef,
    nil: nil,
    nan: nan,
    inf: Infinity,

    // Core
    identity: identity,
    noop: noop,
    constant: constant,
    bind: bind,
    partial: partial,
    compose: compose,
    once: once,
    times: times,
    bound: bound,
    unbind: unbind,
    call: call,
    apply: apply,
    hail: hail,
    invoke: invoke,

    // Arrays and Objects
    each: each,
    all: all,
    any: any,
    map: map,
    reduce: reduce,
    rreduce: rreduce,
    filter: filter,
    find: find,

    // Arrays and Strings
    index: index,
    rindex: rindex,
    slice: slice,
    len: len,

    // Functions
    complement: complement,
    sliceargs: sliceargs,

    // Arrays
    first: first,
    butfirst: butfirst,
    last: last,
    butlast: butlast,
    contains: contains,
    unique: unique,
    flatten: flatten,
    zip: zip,
    object: object,
    push: push,
    pop: pop,
    shift: shift,
    unshift: unshift,
    splice: splice,
    concat: concat,
    join: join,
    sort: sort,
    reverse: reverse,
    top: top,
    sorted: sorted,
    reversed: reversed,
    transposed: transposed,
    destructure: destructure,
    destructured: destructured,

    // Objects
    has: has,
    extend: extend,
    merge: merge,
    keys: keys,
    values: values,
    items: items,
    pick: pick,
    pluck: pluck,
    select: select,
    get: get,
    set: set,

    // Strings
    char: extend(char, {
        from: charFrom,
        code: charCode
    }),
    upper: upper,
    lower: lower,
    split: split,
    replace: replace,
    trim: trim,

    // Numbers
    abs: abs,
    floor: floor,
    ceil: ceil,
    round: round,
    min: min,
    max: max,
    log: log,
    exp: exp,
    pow: pow,
    sqrt: sqrt,
    random: random,
    fixed: fixed,
    precise: precise,
    sum: sum,
    product: product,
    parse: {
        integer: parseInt,
        number: parseFloat
    },

    // Dates
    now: now,
    later: later,
    utc: utc,

    // Regular Expressions
    test: test,
    match: extend(match, {
        each: matchEach
    }),

    // JSON
    json: {
        encode: jsonencode,
        decode: jsondecode
    },

    // Types
    declare: declare,
    is: {
        array: isArray,
        object: isObject,
        fn: isFunction,
        string: isString,
        number: isNumber,
        finite: isBounded,
        boolean: isBoolean,
        date: isDate,
        regex: isRegex,
        nan: isNotANumber,
        nil: isNil,
        undef: isUndef,
        def: isDef,
        absent: isAbsent
    }
};
