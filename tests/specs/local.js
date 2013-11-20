/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, browser:true, jquery:true, indent:4, maxerr:200 */
/*global describe beforeEach it expect waitsFor locache */

describe("localStorage:", function () {

    "use strict";

    if (!locache.supportsLocalStorage) {
        return;
    }

    beforeEach(function () {
        window.localStorage.clear();
        this.cache = locache.createCache(); // Create a default, localStorage cache
    });

    it("should return a length of 3", function () {
        expect(this.cache.length()).toBe(0);
        this.cache.setMany({
            "key1": "value1",
            "key2": "value2",
            "key3": "value3"
        });
        this.cache.set("key3", "value3"); // duplicated on purpose.
        expect(this.cache.length()).toBe(3);
    });

    it("should return an empty list of keys", function () {
        expect(this.cache.length()).toBe(0);
        window.localStorage.setItem("external", "ignore");
        expect(this.cache.keys()).toEqual([]);
    });

    it("should return a list of keys", function () {
        expect(this.cache.length()).toBe(0);
        this.cache.setMany({
            "key1": "value1",
            "key2": "value2",
            "key3": "value3"
        });
        window.localStorage.setItem("external", "ignore");
        expect(this.cache.keys().sort()).toEqual(["key1", "key2", "key3"]);
    });

    it("should set and get a string and verify the data type", function () {
        this.cache.set("my_string", "my_value");
        expect(this.cache.get("my_string")).toBe("my_value");
        expect(typeof this.cache.get("my_string")).toBe("string");
    });

    it("should test getting a nonexistant key returns null", function () {
        expect(this.cache.get("my_string")).toBe(null);
    });

    it("should set and get a number and verify the data type", function () {
        this.cache.set("my_number", 11);
        expect(this.cache.get("my_number")).toBe(11);
        expect(typeof this.cache.get("my_number")).toBe("number");
    });

    it("should get a cached item after the timeout was omitted", function () {

        // set with timeout
        this.cache.set("item", "a", 0.1);
        // remove the timeout
        this.cache.set("item", "a");

        var callCount = 0;

        var that = this;

        // wait 0.2 seconds to retrieve the item from the cache. Despite
        // originally setting a
        setTimeout(function () {
            expect(that.cache.get("item")).toBe("a");
            callCount++;
        }, 200);

         waitsFor(function () {
            return callCount === 1;
        });
    });

    it("should test setting a value with an expire time", function () {

        var key = "will_expire", value = "value";

        // expires in 1 second.
        this.cache.set(key, value, 1);
        expect(this.cache.get(key)).toBe(value);

        var callCount = 0;

        var that = this;
        // Should still be there after 100 ms
        setTimeout(function () {
            expect(that.cache.get(key)).toBe(value);
            callCount++;
        }, 100);

        // after a full second, it should have expired.
        setTimeout(function () {
            expect(that.cache.get(key)).toBe(null);
            callCount++;
        }, 1100);

        waitsFor(function () {
            return callCount === 2;
        });

    });

    it("hould test incrementing a key", function () {
        expect(this.cache.get("counter")).toBe(null);
        this.cache.incr("counter");
        expect(this.cache.get("counter")).toBe(1);
        this.cache.incr("counter");
        expect(this.cache.get("counter")).toBe(2);
    });

    it("should test decrementing a key", function () {
        expect(this.cache.get("counter")).toBe(null);
        this.cache.decr("counter");
        expect(this.cache.get("counter")).toBe(-1);
        this.cache.decr("counter");
        expect(this.cache.get("counter")).toBe(-2);
    });

    it("should test setting many keys", function () {

        var pairs = {'key1': 'val1', 'key2': 'val2', 'key3': 'val3'};
        this.cache.setMany(pairs);

        expect(this.cache.get('key1')).toEqual("val1");
        expect(this.cache.get('key3')).toEqual("val3");

    });

    it("should test getting many keys at once", function () {

        var pairs = {'key1': 'val1', 'key2': 'val2', 'key3': 'val3'};
        this.cache.setMany(pairs);

        var vals = this.cache.getMany(['key1', 'key2', 'key3']);
        expect(vals).toEqual(pairs);

    });

    it("should test getting many values at once", function () {

        var pairs = {'key1': 'val1', 'key2': 'val2', 'key3': 'val3'};
        this.cache.setMany(pairs);

        var vals = this.cache.getManyValues(['key1', 'key2', 'key3']);
        expect(vals).toEqual(['val1', 'val2', 'val3']);

    });

    it("should test storing objects", function () {

        this.cache.set('user', {
            'name': "Dougal Matthews",
            'admin': true
        });

        var result = this.cache.get('user');

        expect(result).toEqual({
            'name': "Dougal Matthews",
            'admin': true
        });

    });

});
