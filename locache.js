/*jshint asi:true */

//      locache 0.1.0
//
//      (c) 2012 Dougal Matthews
//      locache may be freely distributed under the MIT licence.
//
//      locache is a client side caching framework that stores data
//      is localStorage and proves a memcache inspired API for
//      setting and retrieving values.

//

(function(){

    "use strict";

    // Initial Setup
    // --------------------

    // Save a reference to the global window object.
    var root = this

    // The top-level namespace. All public locache objects will be
    // attached to this object.
    var locache = {}
    // Attach the locache namespace to the global window object.
    root.locache = locache

    // Current version of locache. Keep this in sync with the version
    // at the top of this file.
    locache.VERSION = "0.1.0"

    // Boolean value that determines if they browser supports localStorage or
    // not. This is based on the Modernizr implementation that can be found
    // in [the Modernizr GitHub repository.](https://github.com/Modernizr/Modernizr/blob/c56fb8b09515f629806ca44742932902ac145302/modernizr.js#L696-731)
    locache.supportsLocalStorage = (function() {

        try {
            // Create a test value and attempt to set, get and remove the
            // value. These are the core functionality required by locache.
            var test_val = "___locache___"
            localStorage.setItem(test_val, test_val)
            localStorage.getItem(test_val)
            localStorage.removeItem(test_val)
            // If any of the checks fail, an exception will be raised. At
            // that point we can flag the browser as not supporting
            // localStorage.
            return true
        } catch(e) {
            return false
        }

    })()

    // Boolean flag to check if the browser supports native JSON.
    locache.supportsNativeJSON = !!window.JSON

    // Internal utility functions
    // --------------------

    // Two cache prefixes. When storing values, all keys are prefixed
    // to avoid collisions with other usage of localStorage. If the
    // stored value is given an expire time then a second key is set
    // with a different prefix to store this time.
    locache.cachePrefix = '___locache___'
    locache.expirePrefix = '___locacheExpire___'

    // A simple wrapper around localStorage for usage interlally within
    // locache. This is added to offer a level of abstraction so the
    // storage system can be changed to support any browser oddities.
    locache.storage = {

        set : function(key, value){
            return localStorage.setItem(key, value)
        },

        get : function(key, value){
            return localStorage.getItem(key)
        },

        remove : function(key){
            return localStorage.removeItem(key)
        },

        length : function(key){
            return localStorage.length
        },

        key : function(index){
            if (index < 0 || index >= this.length()){
                return
            }
            return localStorage.key(index)
        }
    }

    // Utility method to get the number of milliseconds since the Epoch. This
    // is used when comparing keys to see if they have expired.
    var _currentTime = function(){
        return new Date().getTime()
    }

    // Given a key, return the key used internally for storing values without
    // the risk of collisions over usage of localStorage.
    locache.key = function(key){
        return this.cachePrefix + key
    }

    // Given a key, return the key to be used internally for expiry time.
    locache.expirekey = function(key){
        return this.expirePrefix + key
    }

    // Given a key, look up its expire time and determine if its in the past
    // or not. Returns a Boolean.
    locache.hasExpired = function(key){

        var expireKey = this.expirekey(key)
        var expireValue = parseInt(this.storage.get(expireKey), 10)

        // If we have non-zero integer perform the comparison.
        if (expireValue && expireValue < _currentTime()){
            return true
        }

        return false

    }

    // Main public API functions.
    // --------------------

    // Given a key, a value and an optional number of seconds store the value
    // in localStorage.
    locache.set = function(key, value, seconds){

        // If localStorage isn't supported or the key passed in is falsy,
        // perform a no-op.
        if (!this.supportsLocalStorage || !key) return

        var expireKey = this.expirekey(key)
        var valueKey = this.key(key)

        if(seconds){
            // The time stored is in milliseconds, but this function expects
            // seconds, so multiply by 1000.
            var ms = seconds * 1000
            this.storage.set(expireKey, _currentTime() + ms)
        }

        // For the value, always convert it into a JSON object. THis means
        // that we can safely store many types of objects. They still need to
        // be serialisable so it still rules out some, such as functions.
        value = JSON.stringify(value)
        this.storage.set(valueKey, value)

    }

    // Fetch a value from the cache. Either returns the value, or if it
    // doesn't exist (or has expired) return null.
    locache.get = function(key){

        // If localStorage isn't supported perform a no-op.
        if (!this.supportsLocalStorage) return null

        // If the value has expired, before returning null remove the key
        // from localStorage to free up the space.
        if (this.hasExpired(key)){
            this.remove(this.key(key))
            return null
        }

        var valueKey = this.key(key)
        var value = this.storage.get(valueKey)

        // After we have the value back, check its truthy and then attempt to
        // parse the JSON. If the JSON parsing fails, return null. This could
        // be handled better but its hard to know what to do here? We only
        // set JSON and thus we expect JSON but we don't want to delete
        // values that must have come from another source.
        if (value){
            try{
                return JSON.parse(value)
            } catch(err){
                return null
            }
        }

        // If value isn't truthy, it must be an empty string or similar, so
        // just return that.
        return value

    }

    // When removing a key - delete from the storage both the value key/value
    // pair and the expiration time key/value pair.
    locache.remove = function(key){

        // If localStorage isn't supported perform a no-op.
        if (!this.supportsLocalStorage) return

        var expireKey = this.expirekey(key)
        var valueKey = this.key(key)

        this.storage.remove(expireKey)
        this.storage.remove(valueKey)

    }

    // Given a key name, fetch it, increment the value and store it again. If
    // the counter hasn't be initialised yet, set it to zero and then perform
    // the increment. The fetched value is always parsed as an int to make
    // sure the increment will work - this means if a non-int was stored, it
    // will be converted first and thus reset the counter to zero.
    locache.incr = function(key){

        // If localStorage isn't supported perform a no-op.
        if (!this.supportsLocalStorage) return

        var current = parseInt(this.get(key), 10)
        if (!current){
            current = 0
        }
        current ++
        this.set(key, current)
        return current

    }

    // Exactly the same as the incr function, but with a decrementing value.
    locache.decr = function(key){

        // If localStorage isn't supported perform a no-op.
        if (!this.supportsLocalStorage) return

        var current = parseInt(this.get(key), 10)
        if (!current){
            current = 0
        }
        current --
        this.set(key, current)
        return current

    }

    // Given a properties object, in the form of {key: value, key:value} set
    // multiple keys.
    locache.setMany = function(properties, seconds){

        // If localStorage isn't supported perform a no-op.
        if (!this.supportsLocalStorage) return

        // Iterate through all the object properties.
        for (var key in properties) {
            // Ignore any inherited properties, by making sure they are in
            // the given objecct.
            if (properties.hasOwnProperty(key)) {
                locache.set(key, properties[key], seconds)
            }
        }

    }

    // Given an array of keys, return an array of values. If values don't
    // exist, null will be in their place.
    locache.getMany = function(keys){

        var results = []

        for (var i=0; i < keys.length; i++){
            // To ensure that the correct structure is returned, if
            // localStorage isn't supported return an array of null values
            // with the correct length.
            if (this.supportsLocalStorage){
                results.push(this.get(keys[i]))
            } else {
                results.push(null)
            }
        }

        return results

    }

    // Given an array of keys, remove all of them from the cache.
    locache.removeMany = function(keys){

        // If localStorage isn't supported perform a no-op.
        if (!this.supportsLocalStorage) return

        for (var i=0; i < keys.length; i++){
            this.remove(keys[i])
        }

    }

    // Delete all stored values from the cache. This method will only remove
    // values added to localStorage with the locache prefix in the key.
    locache.flush = function(){

        // If localStorage isn't supported perform a no-op.
        if (!this.supportsLocalStorage) return

        var length = this.storage.length()
        var prefix = this.cachePrefix

        // Iteratate through all the keys stored in localStorage - if the key
        // starts with the prefix cache prefix, then remove that key.
        for (var i=0; i < length; i++) {
            var key = this.storage.key(i)
            if (key && key.indexOf(prefix) === 0) this.storage.remove(key)
        }

    }

    // Return the number of cache values stored in localStorage. This only
    // calculates the values stored by locache.
    locache.length = function(){

        // If localStorage isn't supported perform a no-op and return zero.
        if (!this.supportsLocalStorage) return 0

        var c = 0
        var length = this.storage.length()
        var prefix = this.cachePrefix

        for (var i=0; i < length; i++) {
            if (this.storage.key(i).indexOf(prefix) === 0) c++
        }

        return c

    }

    // A cleanup utility method to remove expired keys. Iterate through all
    // the keys stored inlocalStorage. If they key is a locache key (it has
    // the prefix) then check to see if the key has expired. If it has,
    // remove the key from the cache.
    locache.cleanup = function(){

        // If localStorage isn't supported perform a no-op.
        if (!this.supportsLocalStorage) return

        var length = this.storage.length()
        var prefix = this.cachePrefix

        for (var i=0; i < length; i++) {
            var key = this.storage.key(i)
            // If the key matches, remove the prefix to get the original key
            // and then make use of the normal remove method that will clean
            // up the cache value key pair and the cache epiration time key
            // pair.
            if (key && key.indexOf(prefix) === 0){
                var actualKey = key.substring(prefix.length, key.length)
                if (this.hasExpired(actualKey)){
                    this.remove(actualKey)
                }
            }
        }

    }

}).call(this);