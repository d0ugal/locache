$(function(){

    var _setup = function(){
        if (locache.supportsLocalStorage) localStorage.clear();
    };

    test("check if local storage is supported by the testing browser.", function() {

        var msg = [
            "localStorage isn't supported by your browser. While the cache",
            "wont be able to work, its safe to use as it will fail silently.",
            "It will be like always getting a cache miss. However, no tests",
            "should fail - but a large number are skipped."
        ].join(" ");

        ok(locache.supportsLocalStorage, msg);

    });

    // Tests specific to browsers that don't have local storage
    if(!locache.supportsLocalStorage){

        // The following tests will fail as they test the cache system.
        return;
    }

    test("Set, get and remove and item.", function(){

        _setup();

        var key = "my_key";
        var value = "my_value";

        locache.set(key, value);
        equal(locache.get(key), value);

        locache.remove(key);
        equal(locache.get(key), null);

    });

    test("Set a value with an expire time", function(){

        _setup();

        var key = "will_expire";
        var value = "value";

        locache.set(key, value, 1);
        equal(locache.get(key), value);

        // Should still be there after 100 ms
        setTimeout(function(){
            equal(locache.get(key), value);
        }, 100);

        // after a full second, it should have expired.
        setTimeout(function(){
            equal(locache.get(key), null);
            start();
        }, 1000);

        stop();

    });

    test("length and flush", function(){

        _setup();

        equal(locache.length(), 0);
        locache.set("key", "value");
        equal(locache.length(), 1);
        locache.flush();
        equal(locache.length(), 0);

    });

    test("incr and decr keys", function(){

        _setup();

        locache.incr("counter");
        equal(locache.get("counter"), 1);
        locache.incr("counter");
        equal(locache.get("counter"), 2);

    });

});