
'use strict';

var //---------------
    //    Imports
    //---------------

    q = require('q'),
    lang = require('./lang'),
    undef = lang.undef,
    identity = lang.identity,
    constant = lang.constant,
    times = lang.times,
    bound = lang.bound,
    partial = lang.partial,
    bound = lang.bound,
    invoke = lang.invoke,
    destructured = lang.destructured,
    slice = lang.slice,
    each = lang.each,
    map = lang.map,
    len = lang.len,
    push = lang.push,
    pop = lang.pop,
    reversed = lang.reversed,
    keys = lang.keys,
    select = lang.select,
    object = lang.object,
    set = lang.set,
    min = lang.min,
    isArray = lang.is.array,
    isFunction = lang.is.fn,
    isObject = lang.is.object,

    //----------------------
    //    Implementation
    //----------------------

    // Create a deferred object.
    defer = bound(q, 'defer'),

    // Create a rejected promise.
    reject = bound(q, 'reject'),

    // Resolve a promise or simple value.
    when = bound(q, 'when'),

    // The baseline implementation of q.all().
    baseAll = bound(q, 'all'),

    // The baseline implementation of q.allSettled().
    baseAny = bound(q, 'allSettled'),

    // Is the promise fulfilled, rejected or pending?
    isFulfilled = function(promise) {
        return promise.isFulfilled();
    },
    isRejected = function(promise) {
        return promise.isRejected();
    },
    isPending = function(promise) {
        return promise.isPending();
    },

    // Create a promise resolver that calls or applies the functions it is passed in parallel.
    makeParallel = function(resolve, whichargs) {
        return function(fns) {
            var args = whichargs(slice(arguments, 1));

            return (
                isArray(fns) ?
                    resolve(
                        map(fns, function(fn) {
                            return (
                                isFunction(fn) ?
                                    invoke(fn, args) :
                                    fn);
                        })) :
                    isObject(fns) ?
                        (function() {
                            var properties = keys(fns);

                            return (
                                resolve(
                                    map(select(fns, properties), function(fn) {
                                        return (
                                            isFunction(fn) ?
                                                invoke(fn, args) :
                                                fn);
                                    }))
                                .then(partial(object, properties)));
                        }()) :
                        isFunction(fns) ?
                            invoke(fns, args) :
                            fns);
        };
    },

    // Create a promise resolver that calls or applies the functions it is passed in sequence.
    makeSequence = function(baseResolve, resolve, whichargs) {
        return function(fns) {
            var args = whichargs(slice(arguments, 1));

            return (
                isArray(fns) ?
                    (function() {
                        var previous;

                        return (
                            resolve(
                                map(fns, function(fn) {
                                    var promise = (
                                            baseResolve([previous])
                                            .then(function() {
                                                return (
                                                    isFunction(fn) ?
                                                        invoke(fn, args) :
                                                        fn);
                                            }));

                                    previous = promise;
                                    return promise;
                                })));
                    }()) :
                    isObject(fns) ?
                        (function() {
                            var properties = keys(fns),
                                previous;

                            return (
                                resolve(
                                    map(properties, function(property) {
                                        var fn = fns[property],
                                            promise = (
                                                baseResolve([previous])
                                                .then(function() {
                                                    return (
                                                        isFunction(fn) ?
                                                            invoke(fn, args) :
                                                            fn);
                                                }));

                                        previous = promise;
                                        return promise;
                                    }))
                                .then(partial(object, properties)));
                        }()) :
                        isFunction(fns) ?
                            when(invoke(fns, args)) :
                            when(fns));
        };
    },

    // Resolve the top-level promises or values from an array, object or other value as an array,
    // object or value, respectively.
    resolveAll = function(promises) {
        return (
            isArray(promises) ?
                q.all(promises) :
                isObject(promises) ?
                    (function() {
                        var properties = keys(promises);

                        return (
                            q.all(map(properties, function(property) {
                                return promises[property];
                            }))
                            .then(partial(object, properties)));
                    }()) :
                    when(promises));
    },

    // Settle the top-level promises or values from an array, object or other value as an array,
    // object or value, respectively. Rejected results will be passed as undefined. If all results
    // are rejected, rejects the promise.
    resolveAny = function(promises) {
        return (
            isArray(promises) ?
                (q.allSettled(promises)
                .then(function(results) {
                    var fulfilled = [],
                        rejected = [],
                        values = [];

                    each(results, function(result) {
                        if (result.state === 'fulfilled') {
                            push(fulfilled, result.value);
                            push(values, result.value);
                        } else if (result.state === 'rejected') {
                            push(rejected, result.reason);
                            push(values, undef);
                        }
                    });
                    return (
                        len(results) && len(results) === len(rejected) ?
                            reject(rejected) :
                            values);
                })) :
                isObject(promises) ?
                    (function() {
                        var properties = keys(promises);

                        return (
                            resolveAny(map(properties, function(property) {
                                return promises[property];
                            }))
                            .then(
                                partial(object, properties),
                                partial(object, properties)));
                    }()) :
                    when(promises));
    },

    // Returns a promise for the results from resolving each promise in the given array, object
    // or value mapped over the given function. The second argument may optionally be a number
    // specifying a batch size that limits the number of promises that will be resolved at a time,
    // e.g. for throttling requests to a server.
    resolveMap = function(promises, batchOrFn, optFn) {
        var batch,
            fn;

        if (isFunction(batchOrFn)) {
            fn = batchOrFn;
            return (
                isArray(promises) ?
                    resolveAll(
                        map(promises, function(promise, i) {
                            return when(promise).then(function(resolved) {
                                return fn(resolved, i);
                            });
                        })) :
                    isObject(promises) ?
                        (function() {
                            var properties = keys(promises);

                            return (
                                resolveAll(
                                    map(select(promises, properties), function(promise, i) {
                                        return when(promise).then(function(resolved) {
                                            return fn(resolved, properties[i]);
                                        });
                                    }))
                                .then(partial(properties)));
                        }()) :
                        when(promises).then(fn));
        } else {
            batch = batchOrFn;
            fn = optFn;
            return (
                isArray(promises) ?
                    (function() {
                        var results = [],
                            collect = partial(push, results);

                        promises = reversed(promises);
                        return (
                            resolveAll(
                                times(min(batch, len(promises)), function() {
                                    var finished = defer(),
                                        finish = bound(finished, 'resolve'),
                                        error = bound(finished, 'reject'),
                                        i = 0;

                                    (function next() {
                                        if (len(promises)) {
                                            (when(fn(pop(promises), i))
                                                .then(collect)
                                                .then(next)
                                                .fail(error));
                                        } else {
                                            finish();
                                        }
                                        i += 1;
                                    }());
                                    return finished.promise;
                                }))
                            .then(constant(results)));
                    }()) :
                    isObject(promises) ?
                        (function() {
                            var properties = keys(promises),
                                results = {},
                                collect = partial(set, results);

                            promises = select(promises, properties);
                            return (
                                resolveAll(
                                    times(min(batch, len(promises)), function() {
                                        var finished = defer(),
                                            finish = bound(finished, 'resolve'),
                                            error = bound(finished, 'reject'),
                                            i = 0;

                                        (function next() {
                                            if (len(promises)) {
                                                (when(fn(pop(promises), properties[i]))
                                                    .then(partial(collect, properties[i]))
                                                    .then(next)
                                                    .fail(error));
                                            } else {
                                                finish();
                                            }
                                            i += 1;
                                        }());
                                        return finished.promise;
                                    }))
                                .then(constant(results)));
                        }()) :
                        when(fn(promises)));
        }
    },

    // Call the top-level functions from an array, object or other value in parallel and resolve
    // the returned values as an array, object or value, respectively.
    callParallelAll = makeParallel(resolveAll, identity),

    // Call the top-level functions from an array, object or other value in parallel and settle
    // the returned values as an array, object or value, respectively. Rejected results will be
    // passed as undefined. If all results are rejected, rejects the promise.
    callParallelAny = makeParallel(resolveAny, identity),

    // Apply the top-level functions from an array, object or other value in parallel and resolve
    // the returned values as an array, object or value, respectively.
    applyParallelAll = makeParallel(resolveAll, destructured(identity)),

    // Apply the top-level functions from an array, object or other value in parallel and settle
    // the returned values as an array, object or value, respectively. Rejected results will be
    // passed as undefined. If all results are rejected, rejects the promise.
    applyParallelAny = makeParallel(resolveAny, destructured(identity)),

    // Call the top-level functions from an array, object or other value in sequence and resolve
    // the returned values as an array, object or value, respectively.
    callSequenceAll = makeSequence(baseAll, resolveAll, identity),

    // Call the top-level functions from an array, object or other value in sequence and settle
    // the returned values as an array, object or value, respectively. Rejected results will be
    // passed as undefined. If all results are rejected, rejects the promise.
    callSequenceAny = makeSequence(baseAny, resolveAny, identity),

    // Apply the top-level functions from an array, object or other value in sequence and resolve
    // the returned values as an array, object or value, respectively.
    applySequenceAll = makeSequence(baseAll, resolveAll, destructured(identity)),

    // Apply the top-level functions from an array, object or other value in sequence and settle
    // the returned values as an array, object or value, respectively. Rejected results will be
    // passed as undefined. If all results are rejected, rejects the promise.
    applySequenceAny = makeSequence(baseAny, resolveAny, destructured(identity));

//------------------
//    Public API
//------------------

module.exports = {
    q: q,
    defer: defer,
    when: when,
    all: resolveAll,
    any: resolveAny,
    map: resolveMap,
    call: {
        all: callParallelAll,
        any: callParallelAny,
        sequence: {
            all: callSequenceAll,
            any: callSequenceAny
        }
    },
    apply: {
        all: applyParallelAll,
        any: applyParallelAny,
        sequence: {
            all: applySequenceAll,
            any: applySequenceAny
        }
    },
    is: {
        fulfilled: isFulfilled,
        rejected: isRejected,
        pending: isPending
    }
};
