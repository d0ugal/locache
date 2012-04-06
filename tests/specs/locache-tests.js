describe("Tests for browsers without localStorage support", function(){

    it("should test that localStorage is enabled in this browser, if it is, this will pass and the remaining tests will be skipped.", function() {

        var msg = [
            "This test is intended to fail to make you aware that",
            "localStorage isn't supported by your browser. While the cache",
            "wont be able to work, its safe to use as it will fail silently.",
            "It will be like always getting a cache miss. Most of the tests",
            "are skipped, but some will run to verify graceful degrading."
        ].join(" ");

        if (!locache.supportsLocalStorage){
            console.log(msg);
        }

        expect(locache.supportsLocalStorage).toBe(true);

    });

    // Tests specific to browsers that don't have local storage. These simply
    // test that the functionality degrades well. All cache attempts will be
    // dropped siliently and fetches should act like a cache miss.
    if(!locache.supportsLocalStorage){

        it("silent failing when localStorage isn't supported", function(){

            locache.set("my_key", "my_value");
            expect(locache.get("my_key")).toBe(null);
            locache.remove("my_key");
            locache.incr("my_key");
            locache.decr("my_key");
            locache.setMany({
                "key 1": "value 1",
                "key 2": "value 2"
            });
            expect(locache.getMany(['key 1', 'key 2'])).toBe([null, null]);
            locache.removeMany(['key 1', 'key 2']);
            locache.flush();
            locache.cleanup();

        });

        it("with no localStorage length and flush", function(){

            expect(locache.length()).toBe(0);
            locache.set("key", "value");
            expect(locache.length()).toBe(0);
            locache.flush();
            expect(locache.length()).toBe(0);

        });

        it("with no localStorage setting, getting and removing simple values", function(){

            var key = "my_key";
            var value = "my_value";

            locache.set(key, value);
            expect(locache.get(key)).toBe(null);

            locache.remove(key);
            expect(locache.get(key)).toBe(null);

        });

        it("with no localStorage setting a value with an expire time", function(){

            var key = "will_expire";
            var value = "value";

            locache.set(key, value, 1);
            expect(locache.get(key)).toBe(null);

        });

        it("with no localStorage incr and decr'ing of keys", function(){

            locache.incr("counter");
            expect(locache.get("counter")).toBe(null);
            locache.decr("counter");
            expect(locache.get("counter")).toBe(null);

        });

        it("with no localStorage test many operations - set, get, remove", function(){

            locache.setMany({
                'key1': 'val1',
                'key2': 'val2',
                'key3': 'val3'
            });

            var vals = locache.getMany(['key1','key2','key3']);
            expect(vals).toBe([null, null, null]);
            locache.removeMany(['key1','key2','key3']);
            var vals2 = locache.getMany(['key1','key2','key3']);
            expect(vals2).toBe([null, null, null]);

        });

        return;

    }

});


describe("Tests for browsers with localStorage support", function(){

    if (!locache.supportsLocalStorage) return;

    beforeEach(function(){
        localStorage.clear();
    });

    /*
     * Resume normal testing - for browsers that *do* support localStorage.
     */

    it("should test the length of the cache and flushing", function(){

        expect(locache.length()).toBe(0);
        locache.set("key", "value");
        expect(locache.length()).toBe(1);
        locache.flush();
        expect(locache.length()).toBe(0);

    });

    it("should test setting, getting and removing simple values", function(){

        var key = "my_key";
        var value = "my_value";

        locache.set(key, value);
        expect(locache.get(key)).toBe(value);

        locache.remove(key);
        expect(locache.get(key)).toBe(null);

        locache.set("my_number", 11);
        expect(locache.get("my_number")).toBe(11);

    });

    it("should test setting a value with an expire time", function(){

        var key = "will_expire";
        var value = "value";

        locache.set(key, value, 1);
        expect(locache.get(key)).toBe(value);

        var callCount = 0;

        // Should still be there after 100 ms
        setTimeout(function(){
            expect(locache.get(key)).toBe(value);
            callCount++;
        }, 100);

        // after a full second, it should have expired.
        setTimeout(function(){
            expect(locache.get(key)).toBe(null);
            callCount++;
        }, 1000);

        waitsFor(function(){
            return callCount == 2;
        });

    });

    it("should test incr and decr'ing of keys", function(){

        locache.incr("counter");
        expect(locache.get("counter")).toBe(1);
        locache.incr("counter");
        expect(locache.get("counter")).toBe(2);
        locache.decr("counter");
        expect(locache.get("counter")).toBe(1);
        locache.decr("counter");
        expect(locache.get("counter")).toBe(0);
        locache.decr("counter");
        expect(locache.get("counter")).toBe(-1);

        locache.decr("negativecounter");
        expect(locache.get("negativecounter")).toBe(-1);

        locache.set("my_number", 11);
        locache.incr("my_number");
        expect(locache.get("my_number")).toBe(12);

    });

    it("should test test many operations - set, get, remove", function(){

        locache.setMany({
            'key1': 'val1',
            'key2': 'val2',
            'key3': 'val3'
        });

        var vals = locache.getMany(['key1','key2','key3']);
        expect(vals).toEqual(['val1', 'val2', 'val3']);

        expect(locache.get('key1')).toBe('val1');

        locache.removeMany(['key1','key2','key3']);
        var vals2 = locache.getMany(['key1','key2','key3']);
        expect(vals2).toEqual([null, null, null]);

    });

    it("should test storing objects", function(){

        locache.set('user', {
            'name': "Dougal Matthews",
            'admin': true
        });

        var result = locache.get('user');

        expect(result).toEqual({
            'name': "Dougal Matthews",
            'admin': true
        });

    });

    it("should test expire calculations", function(){

        var now = new Date().getTime(),
            past = now / 10,
            future = now * 10;

        var key =  "mykey",
            cacheKey = locache.cachePrefix + key,
            expireKey = locache.expirePrefix + key;

        // Bypass the normal setting mechanisims by manually calling the
        // storage wrapper around localStorage.
        locache.storage.set(cacheKey, "value");

        // Now manually set the expire date as in the past.
        locache.storage.set(expireKey, past);
        expect(locache.hasExpired(key)).toBe(true);

        // set the expire to "now", plus 5 seconds to make sure its not quite
        // expired yet.
        locache.storage.set(expireKey, now + 5);
        expect(locache.hasExpired(key)).toBe(false);

        // set the expire to "now", minus a second to make sure its just
        // expired.
        locache.storage.set(expireKey, now - 1);
        expect(locache.hasExpired(key)).toBe(true);

        // Finally, test the future.
        locache.storage.set(expireKey, future);
        expect(locache.hasExpired(key)).toBe(false);

    });


    it("should test cleaning up expired values", function(){

        localStorage.clear();

        var now = new Date().getTime(),
            past = now / 10,
            future = now * 10;

        var key1 =  "mykey1",
            cacheKey1 = locache.cachePrefix + key1,
            expireKey1 = locache.expirePrefix + key1,
            key2 =  "mykey2",
            cacheKey2 = locache.cachePrefix + key2,
            expireKey2 = locache.expirePrefix + key2;

        // Bypass the normal setting mechanisims by manually calling the
        // storage wrapper around localStorage.
        locache.storage.set(cacheKey1, "value1");
        locache.storage.set(cacheKey2, "value2");

        // set the first value to expire on a date in the past, and then
        // second to expire in the future.
        locache.storage.set(expireKey1, past);
        locache.storage.set(expireKey2, future);

        // Both values should be stored in localStorage - by passing the
        // normal get method to avoid the checks for validation
        expect(locache.storage.get(cacheKey1)).toBe("value1");
        expect(locache.storage.get(cacheKey2)).toBe("value2");

        // Perform a cleanup.
        locache.cleanup();

        // Check the values again, the first should have been removed but the
        // second should be as originally stored.
        expect(locache.storage.get(cacheKey1)).toBe(null);
        expect(locache.storage.get(cacheKey2)).toBe("value2");

    });

});
