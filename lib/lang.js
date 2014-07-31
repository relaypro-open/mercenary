'use strict';

var _ = require('lodash'),

    //-----------------
    //    Constants
    //-----------------

    undef = void 0,
    nil = null,

    //------------------
    //    Prototypes
    //------------------

    functionProto = Function.prototype,
    arrayProto = Array.prototype,
    objectProto = Object.prototype,
    stringProto = String.prototype,
    regexProto = RegExp.prototype,
    dateProto = Date.prototype,

    //------------
    //    Core
    //------------

    identity = _.identity,
    noop = _.noop,
    constant = _.constant,
    bind = _.bind,
    partial = _.partial,
    compose = _.compose,

    // Return a function that binds the given method name to its object.
    bound = function(object, method) {
        return bind(object[method], object);
    },

    // Unbind a method so that its first argument will assign its this context.
    unbind = function(fn) {
        return bind(functionProto.call, fn);
    },

    call = unbind(functionProto.call),
    apply = unbind(functionProto.apply),

    //--------------------------
    //    Arrays and Objects
    //--------------------------

    each = _.each,
    all = _.all,
    any = _.any,
    map = _.map,
    reduce = _.reduce,
    filter = _.filter,
    find = _.find,

    //--------------------------
    //    Arrays and Strings
    //--------------------------

    index = _.indexOf,
    rindex = _.lastIndexOf,

    // Slices an array or string with optional negative indexing.
    arrayProtoSlice = arrayProto.slice,
    slice = function(value) {
        return apply(value.slice || arrayProtoSlice, value, arrayProtoSlice.call(arguments, 1));
    },

    // Returns the length of an array or string, defaulting to zero.
    len = function(value) {
        return (value && value.length) || 0;
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

    // Return a function that applies the given function to a limited number
    // of arguments.
    maxargs = function(fn, limit, context) {
        return function() {
            return apply(fn, context || this, slice(arguments, 0, limit || 0));
        };
    },

    //--------------
    //    Arrays
    //--------------

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
        return apply(zip, undef, array);
    },

    // Destructure an array by applying it to a function.
    destructure = function(array, fn, context) {
        return apply(fn, context, array || []);
    },

    // Returns a function that will destructure an array by applying it to a function.
    destructured = function(fn, context) {
        return function(array) {
            return destructure(array, fn, context || this);
        };
    },

    //---------------
    //    Objects
    //---------------

    extend = _.extend,
    keys = _.keys,
    values = _.values,
    pluck = _.pluck,
    has = unbind(objectProto.hasOwnProperty),

    //---------------
    //    Strings
    //---------------

    char = unbind(stringProto.charAt),
    upper = unbind(stringProto.toLocaleUpperCase || stringProto.toUpperCase),
    lower = unbind(stringProto.toLocaleLowerCase || stringProto.toLowerCase),
    split = unbind(stringProto.split),
    replace = unbind(stringProto.replace),

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
    pow = math.pow,
    sqrt = math.sqrt,
    random = math.random,

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

    // Convert a date to a UTC string.
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
    isDef = complement(isUndef);

//------------------
//    Public API
//------------------

module.exports = {
    // Constants
    undef: undef,
    nil: nil,

    // Core
    identity: identity,
    noop: noop,
    constant: constant,
    bind: bind,
    partial: partial,
    compose: compose,
    bound: bound,
    unbind: unbind,
    call: call,
    apply: apply,

    // Arrays and Objects
    each: each,
    all: all,
    any: any,
    map: map,
    reduce: reduce,
    filter: filter,
    find: find,

    // Arrays and Strings
    index: index,
    rindex: rindex,
    slice: slice,
    len: len,

    // Functions
    complement: complement,
    maxargs: maxargs,

    // Arrays
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
    sorted: sorted,
    reversed: reversed,
    transposed: transposed,
    destructure: destructure,
    destructured: destructured,

    // Objects
    extend: extend,
    keys: keys,
    values: values,
    pluck: pluck,
    has: has,

    // Strings
    char: char,
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
    pow: pow,
    sqrt: sqrt,
    random: random,
    sum: sum,
    product: product,

    // Dates
    now: now,
    later: later,
    utc: utc,

    // Regular Expressions
    test: test,
    match: match,
    matchEach: matchEach,

    // JSON
    json: {
        encode: jsonencode,
        decode: jsondecode
    },

    // Types
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
        def: isDef
    }
};
