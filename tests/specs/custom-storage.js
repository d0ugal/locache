/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, browser:true, jquery:true, indent:4, maxerr:200 */
/*global sinon describe beforeEach it expect waitsFor locache */

describe("Custom Storage:", function () {

    "use strict";

    if (!locache.supportsNativeJSON) {
        return;
    }

    beforeEach(function () {
        // Define the storage API with no-op functions for stubbing below.
        // Only enabled returns True, as otherwise its backend is never
        // touched (for disabling when browsers don't support a feature, like
        // localStorage).
        var f = function () {};
        this.storage = { set: f, get: f, remove: f, length: f, key: f,
            enabled: function () { return true; }};

        // Create a cache object to re-use, let it create with the default storage
        // and then we will augment it with the mock in each test.
        this.cache = locache.createCache({storage: this.storage});

    });

    it("should call 'set' on the storage object once when an expire isn't provided", function () {
        var spy = sinon.spy(this.storage, 'set');
        this.cache.set("foo", "bar");
        expect(spy.calledOnce).toBe(true);
    });

    it("should call 'set' on the storage object twice when an expire is provided", function () {
        // When setting with an expire value, we need to set the expire key
        // along with the value key. Thus, two calls to storage.set will be
        // made.
        var spy = sinon.spy(this.storage, 'set');
        this.cache.set("foo", "bar", 60);
        expect(spy.calledTwice).toBe(true);
    });

    it("shouldn't call 'set' when the key is falsy", function () {
        var spy = sinon.spy(this.storage, 'set');
        this.cache.get('', 'value', 50);
        expect(spy.callCount).toBe(0);
    });


    it("should call 'get' twice when fetching a key", function () {
        // When getting an object, a lookup to the expire key is also made.
        var spy = sinon.spy(this.storage, 'get');
        this.cache.get("foo");
        expect(spy.calledTwice).toBe(true);
    });

    it("shouldn't call 'get' when the key is falsy", function () {
        // When getting an object, a falsy key, or no key shouldn't do
        // anything
        var spy = sinon.spy(this.storage, 'get');
        this.cache.get();
        expect(spy.callCount).toBe(0);
    });

    it("shouldn't call any functions if the storage is disabled", function () {

        // Stub the storage object to make enabled return false.
        sinon.stub(this.storage, 'enabled').returns(false);

        var spy = sinon.spy(this.storage, 'set');
        this.cache.get('foo', 'bar', 50);
        // Since enabled is false, the set call shouldn't be passed to the
        // storage backend, and thus set wont be called.
        expect(spy.callCount).toBe(0);

    });

});