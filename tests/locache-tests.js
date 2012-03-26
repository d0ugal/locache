$(function(){

    if (locache.supportsLocalStorage) localStorage.clear();

    test("local storage is supported by the testing browser.", function() {

        var msg = [
            "localStorage isn't supported by your browser. While the cache",
            "wont be able to work, its safe to use as it will fail silently.",
            "It will be like always getting a cache miss. However, no tests",
            "should fail - but a large number are skipped.",
            "This test is intended to fail to make you aware."
        ].join(" ");

        ok(locache.supportsLocalStorage, msg);

    });

    // Tests specific to browsers that don't have local storage
    if(!locache.supportsLocalStorage){

        // The following tests will fail as they test the cache system.
        // Testing for browsers that don't support localStorage here (probably
        // IE7 and IE6 only).
        test("silent failing when localStorage isn't supported", function(){

            locache.set("my_key", "my_value");
            strictEqual(locache.get("my_key"), null);
            locache.remove("my_key");
            locache.incr("my_key");
            locache.decr("my_key");
            locache.setMany({
                "key 1": "value 1",
                "key 2": "value 2"
            });
            deepEqual(locache.getMany(['key 1', 'key 2']), [null, null]);
            locache.removeMany(['key 1', 'key 2']);
            locache.flush();
            locache.cleanup();

        });

        test("with no localStorage length and flush", function(){

            strictEqual(locache.length(), 0);
            locache.set("key", "value");
            strictEqual(locache.length(), 0);
            locache.flush();
            strictEqual(locache.length(), 0);

        });

        test("with no localStorage setting, getting and removing simple values", function(){

            var key = "my_key";
            var value = "my_value";

            locache.set(key, value);
            strictEqual(locache.get(key), null);

            locache.remove(key);
            strictEqual(locache.get(key), null);

        });

        test("with no localStorage setting a value with an expire time", function(){

            var key = "will_expire";
            var value = "value";

            locache.set(key, value, 1);
            strictEqual(locache.get(key), null);

            setTimeout(function(){
                strictEqual(locache.get(key), null);
            }, 100);

            setTimeout(function(){
                strictEqual(locache.get(key), null);
                start();
            }, 1000);

            stop();

        });

        test("with no localStorage incr and decr'ing of keys", function(){

            locache.incr("counter");
            strictEqual(locache.get("counter"), null);
            locache.decr("counter");
            strictEqual(locache.get("counter"), null);

        });

        test("with no localStorage test many operations - set, get, remove", function(){

            locache.setMany({
                'key1': 'val1',
                'key2': 'val2',
                'key3': 'val3'
            });

            var vals = locache.getMany(['key1','key2','key3']);
            deepEqual(vals, [null, null, null]);
            locache.removeMany(['key1','key2','key3']);
            var vals2 = locache.getMany(['key1','key2','key3']);
            deepEqual(vals2, [null, null, null]);

        });

        return;

    }

    test("length and flush", function(){

        strictEqual(locache.length(), 0);
        locache.set("key", "value");
        strictEqual(locache.length(), 1);
        locache.flush();
        strictEqual(locache.length(), 0);

    });

    test("setting, getting and removing simple values", function(){

        var key = "my_key";
        var value = "my_value";

        locache.set(key, value);
        strictEqual(locache.get(key), value);

        locache.remove(key);
        strictEqual(locache.get(key), null);

        locache.set("my_number", 11);
        strictEqual(locache.get("my_number"), 11);

    });

    test("setting a value with an expire time", function(){

        var key = "will_expire";
        var value = "value";

        locache.set(key, value, 1);
        strictEqual(locache.get(key), value);

        // Should still be there after 100 ms
        setTimeout(function(){
            strictEqual(locache.get(key), value);
        }, 100);

        // after a full second, it should have expired.
        setTimeout(function(){
            strictEqual(locache.get(key), null);
            start();
        }, 1000);

        stop();

    });

    test("incr and decr'ing of keys", function(){

        locache.incr("counter");
        strictEqual(locache.get("counter"), 1);
        locache.incr("counter");
        strictEqual(locache.get("counter"), 2);
        locache.decr("counter");
        strictEqual(locache.get("counter"), 1);
        locache.decr("counter");
        strictEqual(locache.get("counter"), 0);
        locache.decr("counter");
        strictEqual(locache.get("counter"), -1);

        locache.decr("negativecounter");
        strictEqual(locache.get("negativecounter"), -1);

        locache.set("my_number", 11);
        locache.incr("my_number");
        strictEqual(locache.get("my_number"), 12);

    });

    test("test many operations - set, get, remove", function(){

        locache.setMany({
            'key1': 'val1',
            'key2': 'val2',
            'key3': 'val3'
        });

        var vals = locache.getMany(['key1','key2','key3']);
        deepEqual(vals, ['val1', 'val2', 'val3']);

        strictEqual(locache.get('key1'), 'val1');

        locache.removeMany(['key1','key2','key3']);
        var vals2 = locache.getMany(['key1','key2','key3']);
        deepEqual(vals2, [null, null, null]);

    });

    test("storing objects", function(){

        locache.set('user', {
            'name': "Dougal Matthews",
            'admin': true
        });

        var result = locache.get('user');

        deepEqual(result, {
            'name': "Dougal Matthews",
            'admin': true
        });

    });

});