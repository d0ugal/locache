(function(){

    var root = this;

    // Based on the Modernizr implementation;
    // https://github.com/Modernizr/Modernizr/blob/c56fb8b09515f629806ca44742932902ac145302/modernizr.js#L696-731

    var locache = {};
    root.locache = locache;

    locache.supportsLocalStorage = (function() {

        try {
            localStorage.setItem("___locache___", "___locache___");
            localStorage.removeItem("___locache___");
            return true;
        } catch(e) {
            return false;
        }

    })();

    locache.supportsNativeJSON = !!window.JSON;

    locache.cache_prefix = '___locache___';
    locache.expire_prefix = '___locacheExpire___';

    var _set = function(key, value){
        return localStorage.setItem(key, value);
    };

    var _get = function(key, value){
        return localStorage.getItem(key);
    };

    var _del = function(key){
        return localStorage.removeItem(key);
    };

    var _len = function(key){
        return localStorage.length;
    };

    var _key = function(index){
        return localStorage.key(index);
    };


    var _currentTime = function(){
        return new Date().getTime();
    };

    locache.key = function(key){
        return locache.cache_prefix + key;
    };

    locache.expirekey = function(key){
        return locache.expire_prefix + key;
    };

    locache.set = function(key, value, seconds){

        if (!this.supportsLocalStorage || !key) return;

        var expireKey = this.expirekey(key);
        var valueKey = this.key(key);

        if(seconds){
            ms = seconds * 1000;
            _set(expireKey, _currentTime() + ms);
        }

        if (typeof value === 'string'){
            _set(valueKey, value);
            return;
        }

        value = JSON.stringify(value);
        _set(valueKey, value);

    };

    locache.get = function(key){

        if (!this.supportsLocalStorage) return;

        var expireKey = this.expirekey(key);
        var valueKey = this.key(key);

        var expireValue = parseInt(_get(expireKey), 10);

        if (expireValue && expireValue < _currentTime()){
            this.remove(valueKey);
            return null;
        }

        return _get(valueKey);

    };

    locache.remove = function(key){

        if (!this.supportsLocalStorage) return;

        var expireKey = this.expirekey(key);
        var valueKey = this.key(key);

        _del(expireKey);
        _del(valueKey);

    };

    locache.incr = function(key){
        if (!this.supportsLocalStorage) return;

        this.set(key, parseInt(this.get(key), 10) + 1);
    };

    locache.decr = function(key){
        if (!this.supportsLocalStorage) return;
    };

    locache.set_multi = function(keys){
        if (!this.supportsLocalStorage) return;
    };

    locache.get_multi = function(keys){
        if (!this.supportsLocalStorage) return;
    };

    locache.delete_multi = function(keys){
        if (!this.supportsLocalStorage) return;
    };

    locache.flush = function(){

        if (!this.supportsLocalStorage) return;

        var len = _len();
        var prefix = this.cache_prefix;

        for (var i=0; i < len -1 ; i++) {
            var key = _key(i);
            if (key.indexOf(prefix) === 0) _del(key);
        }

    };

    locache.length = function(){

        if (!this.supportsLocalStorage) return 0;

        var c = 0;
        var len = _len();
        var prefix = this.cache_prefix;

        for (var i=0; i < len -1 ; i++) {
            if (_key(i).indexOf(prefix) === 0) c++;
        }

        return c;

    };

}).call(this);