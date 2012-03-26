(function(){

    var root = this;


    var locache = {};
    root.locache = locache;

    locache.supportsLocalStorage = (function() {

        // Based on the Modernizr implementation;
        // https://github.com/Modernizr/Modernizr/blob/c56fb8b09515f629806ca44742932902ac145302/modernizr.js#L696-731

        try {
            var test_val = "___locache___";
            localStorage.setItem(test_val, test_val);
            localStorage.getItem(test_val);
            localStorage.removeItem(test_val);
            return true;
        } catch(e) {
            console.log(e.getMessage());
            return false;
        }

    });

    locache.supportsNativeJSON = !!window.JSON;

    locache.cachePrefix = '___locache___';
    locache.expirePrefix = '___locacheExpire___';

    locache.storage = {

        set : function(key, value){
            // Due to a strange bug (seen usually on the iPad) removing the
            // key before setting it can avoid QUOTA_EXCEEDED_ERR's
            localStorage.removeItem(key);
            return localStorage.setItem(key, value);
        },

        get : function(key, value){
            return localStorage.getItem(key);
        },

        remove : function(key){
            return localStorage.removeItem(key);
        },

        length : function(key){
            return localStorage.length;
        },

        key : function(index){
            return localStorage.key(index);
        }
    };

    var _currentTime = function(){
        return new Date().getTime();
    };

    locache.key = function(key){
        return this.cachePrefix + key;
    };

    locache.expirekey = function(key){
        return this.expirePrefix + key;
    };

    locache.hasExpired = function(key){

        var expireKey = this.expirekey(key);
        var expireValue = parseInt(this.storage.get(expireKey), 10);

        if (expireValue && expireValue < _currentTime()){
            this.remove(this.key(key));
            return true;
        }

        return false;

    };

    locache.set = function(key, value, seconds){

        if (!this.supportsLocalStorage || !key) return;

        var expireKey = this.expirekey(key);
        var valueKey = this.key(key);

        if(seconds){
            ms = seconds * 1000;
            this.storage.set(expireKey, _currentTime() + ms);
        }

        value = JSON.stringify(value);
        this.storage.set(valueKey, value);

    };

    locache.get = function(key){

        if (!this.supportsLocalStorage) return null;

        if (this.hasExpired(key)){
            return null;
        }

        var valueKey = this.key(key);
        var value = this.storage.get(valueKey);

        if (value){
            try{
                return JSON.parse(value);
            } catch(err){
                return null;
            }
        }

        return value;

    };

    locache.remove = function(key){

        if (!this.supportsLocalStorage) return;

        var expireKey = this.expirekey(key);
        var valueKey = this.key(key);

        this.storage.remove(expireKey);
        this.storage.remove(valueKey);

    };

    locache.incr = function(key){
        if (!this.supportsLocalStorage) return;

        var current = parseInt(this.get(key), 10);
        if (!current){
            current = 0;
        }
        var new_number = current + 1;
        this.set(key, new_number);
        return new_number;

    };

    locache.decr = function(key){
        if (!this.supportsLocalStorage) return;

        var current = parseInt(this.get(key), 10);
        if (!current){
            current = 0;
        }
        var new_number = current - 1;
        this.set(key, new_number);
        return new_number;

    };

    locache.setMany = function(properties){
        if (!this.supportsLocalStorage) return;

        for (var key in properties) {
            if (properties.hasOwnProperty(key)) {
                locache.set(key, properties[key]);
            }
        }

    };

    locache.getMany = function(keys){

        var results = [];

        for (var i=0; i < keys.length; i++){
            if (this.supportsLocalStorage){
                results.push(this.get(keys[i]));
            } else {
                results.push(null);
            }
        }

        return results;

    };

    locache.remoteMany = function(keys){
        if (!this.supportsLocalStorage) return;

        for (var i=0; i < keys.length; i++){
            this.remove(keys[i]);
        }

    };

    locache.flush = function(){

        if (!this.supportsLocalStorage) return;

        var length = this.storage.length();
        var prefix = this.cachePrefix;

        for (var i=0; i < length; i++) {
            var key = this.storage.key(i);
            if (key.indexOf(prefix) === 0) this.storage.remove(key);
        }

    };

    locache.length = function(){

        if (!this.supportsLocalStorage) return 0;

        var c = 0;
        var length = this.storage.length();
        var prefix = this.cachePrefix;

        for (var i=0; i < length; i++) {
            if (this.storage.key(i).indexOf(prefix) === 0) c++;
        }

        return c;

    };

    locache.cleanup = function(){

        if (!this.supportsLocalStorage) return;

        var length = this.storage.length();
        var prefix = this.cachePrefix;

        for (var i=0; i < length; i++) {
            var key = this.storage.key(i);
            if (key.indexOf(prefix) === 0) this.storage.remove(key);
        }

    };

}).call(this);