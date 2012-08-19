/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, browser:true, jquery:true, indent:4, maxerr:200 */
/*global describe beforeEach it expect waitsFor locache */

describe("asynclocal:", function () {

    "use strict";

    if (!locache.supportsSessionStorage) {
        return;
    }

    beforeEach(function () {
        window.localStorage.clear();
        this.cache = locache.createCache({storage: locache.backends.asynclocal});
    });

    it("should test setting a key async", function () {

        var asynDone = false;
        var cache = this.cache;

        cache.async.set("key", "value").finished(function (event) {
            expect(cache.length()).toBe(1);
            asynDone = true;
        });

        expect(cache.length()).toBe(0);

        waitsFor(function () {
            return asynDone;
        });

    });

    it("should set and get a string and verify the data type", function () {

        var cache = this.cache;
        var asynDone = false;

        cache.async.set("my_string", "my_value").finished(function () {
            cache.async.get("my_string").finished(function (result) {
                expect(result).toBe("my_value");
                expect(typeof result).toBe("string");
                asynDone = true;
            });
        });

        waitsFor(function () {
            return asynDone;
        });

    });

});
