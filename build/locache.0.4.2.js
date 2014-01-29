/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, browser:true, jquery:true, indent:4, maxerr:200 */

//      locache 0.4.2
//
//      (c) 2012 Dougal Matthews
//      locache may be freely distributed under the MIT license.
//
//      locache is a client side caching framework that stores data
//      with DOM Storage and proves a memcache inspired API for
//      setting and retrieving values.

(function () {

    "use strict";

    // Initial Setup
    // --------------------

    // Save a reference to the global object, in most cases this is `window`.
    var root = this;

    // Object context bnding shim to support older versions of IE.
    var bind = function (func, thisValue) {
        return function () {
            return func.apply(thisValue, arguments);
        };
    };

    // Cache class constructor. This is the base &ldquo;class&rdquo; for
    // locache and is used for the global instance plus any of your own
    // custom caches.
    // The constructor accepts a properties object, and assigns each value
    // of the object to the instance. At the moment, this is only really used
    // to set the 'storage' property - so you can choose a builtin or use
    // your own storage mechanism.
    function LocacheCache(options) {

        if (options && options.storage) {
            this.storage = options.storage;
        }

        // Re-bind the context of the two async methods so `this` is equal to
        // the instance of locache. This allows them to easily access the
        // other methods and storage objects. This is a bit of hack, and may
        // not be the best idea.
        this.async.set = bind(this.async.set, this);
        this.async.get = bind(this.async.get, this);

    }

    // Current version of locache, this is inserted in the build process.
    LocacheCache.prototype.VERSION = "0.4.2";

    // Boolean value that determines if they browser supports localStorage or
    // not. This is based on the Modernizr implementation that can be found
    // in [the Modernizr GitHub repository.](https://github.com/Modernizr/Modernizr/blob/c56fb8b09515f629806ca44742932902ac145302/modernizr.js#L696-731)
    var supportsLocalStorage = LocacheCache.prototype.supportsLocalStorage = (function () {

        try {
            // Create a test value and attempt to set, get and remove the
            // value. These are the core functionality required by locache
            var test_val = "___locache___";
            root.localStorage.setItem(test_val, test_val);
            root.localStorage.getItem(test_val);
            root.localStorage.removeItem(test_val);
            // If any of the checks fail, an exception will be raised. At
            // that point we can flag the browser as not supporting
            // localStorage.
            return true;
        } catch (e) {
            return false;
        }

    })();

    // Boolean value that determines if they browser supports sessionStorage or
    // not. This is based on the Modernizr implementation that can be found
    // in [the Modernizr GitHub repository.](https://github.com/Modernizr/Modernizr/blob/c56fb8b09515f629806ca44742932902ac145302/modernizr.js#L696-731)
    var supportsSessionStorage = LocacheCache.prototype.supportsSessionStorage = (function () {

        try {
            // Create a test value and attempt to set, get and remove the
            // value. These are the core functionality required by locache
            var test_val = "___locache___";
            root.sessionStorage.setItem(test_val, test_val);
            root.sessionStorage.getItem(test_val);
            root.sessionStorage.removeItem(test_val);
            // If any of the checks fail, an exception will be raised. At
            // that point we can flag the browser as not supporting
            // sessionStorage.
            return true;
        } catch (e) {
            return false;
        }

    })();

    // Boolean flag to check if the browser supports native JSON.
    var supportsNativeJSON = LocacheCache.prototype.supportsNativeJSON = !!root.JSON;

    // Boolean flag to check if the browser supports HTML postMessage.
    var supportsPostMessage = LocacheCache.prototype.supportsPostMessage = !!window.postMessage;

    // Internal utility functions
    // --------------------

    // A defer implementation to avoid IO access blocking the current
    // thread. This is exposed on the LocacheCache prototype, simply so it
    // can be accessed from within the unit tests. It's not intended for
    // public use.
    var defer = LocacheCache.prototype._defer = (function () {

        // Store of the pending functions
        var timeouts = [];
        // Message name used to identify posts related to the defer
        var messageName = "function-defer-message";

        // Add a message event listener. If its not from this window or doesn't
        // have the message name defined above, don't do anything and allow it
        // to propagate to other handlers. Otherwise, its meant for us so stop
        // the event.
        var addEventListener;
        if (root.addEventListener) {
            addEventListener = root.addEventListener;
        } else if (root.attachEvent) {
            addEventListener = root.attachEvent;
        }

        addEventListener("message", function (event) {

            if (event.source !== root || event.data !== messageName) {
                return;
            }
            event.stopPropagation();

            // Make sure we have some pending functions, otherwise return.
            if (timeouts.length === 0) {
                return;
            }

            // take the oldest from the 'queue' and call that functions.
            var fn = timeouts.shift();
            fn();

            // Return false, to make sure the event isn't propagated
            return false;

        }, true);

        // Constructor for the Defer, takes a function object and stores it
        // on itself.
        function Deferred(fn) {
            this.fn = fn;
        }

        // The defer method runs the function and stores the result. Upon
        // finishing, it looks for a finishedFunction, that if exists, is
        // called and passed the result.
        Deferred.prototype.defer = function () {
            this.resultValue = this.fn();
            if (this.hasOwnProperty('finishedFunction')) {
                this.finishedFunction(this.resultValue);
            }
        };

        // Return if the defer has finished. THis is determined by the
        // existence of the resultValue on the object.
        Deferred.prototype.hasFinished = function () {
            return this.hasOwnProperty('resultValue');
        };

        // The finished function takes another function and assigns that to
        // be called when the deferred function has finished.
        Deferred.prototype.finished = function (fn) {
            this.finishedFunction = fn;
            // Check to see if the deferred function has finished, this can
            // happen if its very quick or the finished function is assigned
            // late. If it is, call it straight away.
            if (this.hasFinished()) {
                this.finishedFunction(this.resultValue);
            }
            // Make this object chainable.
            return this;
        };

        // Wrapper utility function that provides access to the Deferred
        // implementation and makes it very simple to use.
        function defer(fn) {
            // Create the defer instance that wraps the function
            var d = new Deferred(fn);
            // Add the defer method on the Deferred object, with the instance
            // bound to the queue.
            timeouts.push(bind(d.defer, d));
            // post a message to the window that can be received by the
            // message handler.
            root.postMessage(messageName, "*");
            // Finally, return the deferred object instance.
            return d;
        }

        // Only return the defer function, this is all we want to be publicly
        // accessible.
        return defer;

    })();

    // Two cache prefixes. When storing values, all keys are prefixed
    // to avoid collisions with other usage of the storage backend.
    // If the stored value is given an expire time then a second key
    // is set with a different prefix to store this time.
    LocacheCache.prototype.cachePrefix = '___locache___';
    LocacheCache.prototype.expirePrefix = '___locacheExpire___';

    // Built in locache backends. These are simple wrappers around the actual
    // storage mechanism to allow for them to be easily exchanged.

    LocacheCache.prototype.backends = {
        // Wrapper around localStorage - persistent local storage in the
        // browser.
        local: {
            set: function (key, value) {
                return root.localStorage.setItem(key, value);
            },

            get: function (key) {
                return root.localStorage.getItem(key);
            },

            remove: function (key) {
                return root.localStorage.removeItem(key);
            },

            length: function (key) {
                return root.localStorage.length;
            },

            key: function (index) {
                if (index < 0 || index >= this.length()) {
                    return;
                }
                return root.localStorage.key(index);
            },
            enabled: function () {
                return supportsNativeJSON && supportsLocalStorage;
            }
        },
        // Wrapper around sessionStorage - storage in the browser that is
        // cleared each time a new session is started - new browser window etc.
        session: {
            set: function (key, value) {
                return root.sessionStorage.setItem(key, value);
            },

            get: function (key) {
                return root.sessionStorage.getItem(key);
            },

            remove: function (key) {
                return root.sessionStorage.removeItem(key);
            },

            length: function (key) {
                return root.sessionStorage.length;
            },

            key: function (index) {
                if (index < 0 || index >= this.length()) {
                    return;
                }
                return root.sessionStorage.key(index);
            },
            enabled: function () {
                return supportsNativeJSON && supportsSessionStorage;
            }
        }

    };

    LocacheCache.prototype.storage = LocacheCache.prototype.backends.local;

    // Utility method to get the number of milliseconds since the Epoch. This
    // is used when comparing keys to see if they have expired.
    var _currentTime = function () {
        return new Date().getTime();
    };

    // Given a key, return the key used internally for storing values without
    // the risk of collisions over usage of the storage backend.
    LocacheCache.prototype.key = function (key) {
        return this.cachePrefix + key;
    };

    // Given a key, return the key to be used internally for expiry time.
    LocacheCache.prototype.expirekey = function (key) {
        return this.expirePrefix + key;
    };

    // Given a key, look up its expire time and determine if its in the past
    // or not. Returns a Boolean.
    LocacheCache.prototype.hasExpired = function (key) {

        var expireKey = this.expirekey(key);
        var expireValue = parseInt(this.storage.get(expireKey), 10);

        // If we have non-zero integer perform the comparison.
        if (expireValue && expireValue < _currentTime()) {
            return true;
        }

        return false;

    };

    // Main public API functions.
    // --------------------

    // Given a key, a value and an optional number of seconds store the value
    // in the storage backend.
    LocacheCache.prototype.set = function (key, value, seconds) {

        // If the storage backend isn't supported or the key passed in is
        // falsy, perform a no-op.
        if (!this.storage.enabled() || !key) {
            return;
        }

        var expireKey = this.expirekey(key);
        var valueKey = this.key(key);

        if (seconds) {
            // The time stored is in milliseconds, but this function expects
            // seconds, so multiply by 1000.
            var ms = seconds * 1000;
            this.storage.set(expireKey, _currentTime() + ms);
        }
        else {
            // Remove the expire key, if no timeout is set
            this.storage.remove(expireKey);
        }

        // For the value, always convert it into a JSON object. THis means
        // that we can safely store many types of objects. They still need to
        // be serialisable so it still rules out some, such as functions.
        value = JSON.stringify(value);
        return this.storage.set(valueKey, value);

    };

    // Fetch a value from the cache. Either returns the value, or if it
    // doesn't exist (or has expired) return null.
    LocacheCache.prototype.get = function (key) {

        // If the storage backend isn't supported or the key passed in is
        // falsy, perform a no-op and return null.
        if (!this.storage.enabled() || !key) {
            return null;
        }

        // If the value has expired, before returning null remove the key
        // from the storage backend to free up the space.
        if (this.hasExpired(key)) {
            this.remove(this.key(key));
            return null;
        }

        var valueKey = this.key(key);
        var value = this.storage.get(valueKey);

        // After we have the value back, check its truthy and then attempt to
        // parse the JSON. If the JSON parsing fails, return null. This could
        // be handled better but its hard to know what to do here? We only
        // set JSON and thus we expect JSON but we don't want to delete
        // values that must have come from another source.
        if (value) {
            try {
                return JSON.parse(value);
            } catch (err) {
                return null;
            }
        }

        // If value isn't truthy, it must be an empty string or similar, so
        // just return that.
        return value;

    };

    // The async object, provides an extra level to the namespace that
    // contains all of the sync calls supports within locache
    LocacheCache.prototype.async = {

        set: function (key, value, seconds) {
            return defer(bind(function () {
                return this.set(key, value, seconds);
            }, this));
        },

        get: function (key) {
            return defer(bind(function () {
                return this.get(key);
            }, this));

        }

    };

    // When removing a key - delete from the storage both the value key/value
    // pair and the expiration time key/value pair.
    LocacheCache.prototype.remove = function (key) {

        // If the storage backend isn't enabled perform a no-op.
        if (!this.storage.enabled()) {
            return;
        }

        var expireKey = this.expirekey(key);
        var valueKey = this.key(key);

        this.storage.remove(expireKey);
        this.storage.remove(valueKey);

    };

    // Given a key name, fetch it, increment the value and store it again. If
    // the counter hasn't be initialised yet, set it to zero and then perform
    // the increment. The fetched value is always parsed as an int to make
    // sure the increment will work - this means if a non-int was stored, it
    // will be converted first and thus reset the counter to zero.
    LocacheCache.prototype.incr = function (key) {

        // If the storage backend isn't enabled perform a no-op.
        if (!this.storage.enabled()) {
            return;
        }

        var current = parseInt(this.get(key), 10);
        if (!current) {
            current = 0;
        }
        current ++;
        this.set(key, current);
        return current;

    };

    // Exactly the same as the incr function, but with a decrementing value.
    LocacheCache.prototype.decr = function (key) {

        // If the storage backend isn't enabled perform a no-op.
        if (!this.storage.enabled()) {
            return;
        }

        var current = parseInt(this.get(key), 10);
        if (!current) {
            current = 0;
        }
        current --;
        this.set(key, current);
        return current;

    };

    // Given a properties object, in the form of {key: value, key:value} set
    // multiple keys.
    LocacheCache.prototype.setMany = function (properties, seconds) {

        // If the storage backend isn't enabled perform a no-op.
        if (!this.storage.enabled()) {
            return;
        }

        // Iterate through all the object properties.
        for (var key in properties) {
            // Ignore any inherited properties, by making sure they are in
            // the given object.
            if (properties.hasOwnProperty(key)) {
                this.set(key, properties[key], seconds);
            }
        }

    };

    // Given an array of keys, return an array of values. If values don't
    // exist, null will be in their place.
    LocacheCache.prototype.getMany = function (keys) {

        var results = {};

        for (var i = 0; i < keys.length; i++) {
            // To ensure that the correct structure is returned, if
            // the storage backend isn't enabled return an array of null
            // values with the correct length.
            if (this.storage.enabled()) {
                results[keys[i]] = this.get(keys[i]);
            } else {
                results[keys[i]] = null;
            }
        }

        return results;

    };


    // Given an array of keys, return an array of values. If values don't
    // exist, null will be in their place.
    LocacheCache.prototype.getManyValues = function (keys) {

        var results = [];

        for (var i = 0; i < keys.length; i++) {
            // To ensure that the correct structure is returned, if
            // the storage backend isn't enabled return an array of null
            // values with the correct length.
            if (this.storage.enabled()) {
                results.push(this.get(keys[i]));
            } else {
                results.push(null);
            }
        }

        return results;

    };

    // Given an array of keys, remove all of them from the cache.
    LocacheCache.prototype.removeMany = function (keys) {

        // If the storage backend isn't enabled perform a no-op.
        if (!this.storage.enabled()) {
            return;
        }

        for (var i = 0; i < keys.length; i++) {
            this.remove(keys[i]);
        }

    };

    // Delete all stored values from the cache. This method will only remove
    // values added to the storage backend with the locache prefix in the key.
    LocacheCache.prototype.flush = function () {

        // If the storage backend isn't enabled perform a no-op.
        if (!this.storage.enabled()) {
            return;
        }

        var length = this.storage.length();
        var prefix = this.cachePrefix;

        // Iterate through all the keys stored in the storage backend - if
        // the key tarts with the prefix cache prefix, then remove that key.
        // backwards to make sure removing items does not mess up the index
        for (var i = length - 1; i >= 0; i--) {
            var key = this.storage.key(i);
            if (key && key.indexOf(prefix) === 0) {
                var actualKey = key.substring(prefix.length, key.length);
                this.remove(actualKey);
            }
        }

    };

    // Return the number of cache values stored in the storage backend. This
    // only calculates the values stored by locache
    LocacheCache.prototype.length = function () {

        // If the storage backend isn't supported perform a no-op and return
        // zero.
        if (!this.storage.enabled()) {
            return 0;
        }

        var c = 0;
        var length = this.storage.length();
        var prefix = this.cachePrefix;

        for (var i = 0; i < length; i++) {
            if (this.storage.key(i).indexOf(prefix) === 0) {
                c++;
            }
        }

        return c;

    };

    // Return the set of keys in the storage backend. This only returns the
    // keys stored by locache. Returns an empty array if no keys are found.
    LocacheCache.prototype.keys = function () {

        // If the storage backend isn't supported perform a no-op and return
        // an empty array.
        if (!this.storage.enabled()) {
            return [];
        }

        var keys = [];
        var length = this.storage.length();
        var prefix = this.cachePrefix;

        for (var i = 0; i < length; i++) {
            var key = this.storage.key(i);
            if (key.indexOf(prefix) === 0) {
                var actualKey = key.substring(prefix.length, key.length);
                keys.push(actualKey);
            }
        }

        return keys;

    };

    // A cleanup utility method to remove expired keys. Iterate through all
    // the keys stored in the storage backend. If they key is a locache key
    // (it has the prefix) then check to see if the key has expired. If it
    // has, remove the key from the cache.
    LocacheCache.prototype.cleanup = function () {

        // If the storage backend isn't enabled perform a no-op.
        if (!this.storage.enabled()) {
            return;
        }

        var length = this.storage.length();
        var prefix = this.cachePrefix;

        for (var i = 0; i < length; i++) {
            var key = this.storage.key(i);
            // If the key matches, remove the prefix to get the original key
            // and then make use of the normal remove method that will clean
            // up the cache value key pair and the cache expiration time key
            // pair.
            if (key && key.indexOf(prefix) === 0) {
                var actualKey = key.substring(prefix.length, key.length);
                if (this.hasExpired(actualKey)) {
                    this.remove(actualKey);
                }
            }
        }

    };

    // A factory method added to the LocacheCache constructor to create
    // instances of itself. Rather than placing the class publicly, wrap
    // it up in a method and keep it for internal usage.
    LocacheCache.prototype.createCache = function (options) {
        return new LocacheCache(options);
    };

    // The top-level instance. All public locache objects will be
    // attached to this object.
    var locache = new LocacheCache();

    // To provide easy access to session caching, attach another instance of
    // locache to the main object. This means we can now use the full API
    // against sessionStorage simply by doing: `locache.session.set(...)` and
    // `locache.session.get(...)`
    locache.session = new LocacheCache({
        storage: locache.backends.session
    });

    // Attach the locache namespace to the global window object.
    root.locache = locache;

}).call(this);
