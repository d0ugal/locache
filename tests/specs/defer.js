/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, browser:true, jquery:true, indent:4, maxerr:200 */
/*global sinon describe beforeEach it expect waitsFor locache */

describe("defer:", function () {

    "use strict";

    beforeEach(function () {
        this.defer = locache._defer;
    });

    it("should test defer", function () {

        var c = 0;

        this.defer(function () {
            c++;
            expect(c).toBe(1);
        });
        expect(c).toBe(0);

        waitsFor(function () {return c > 0; });

    });

    it("should test finished", function () {

        var c = 0, done = false;

        this.defer(function () {
            c++;
        }).finished(function () {
            expect(c).toBe(1);
            done = true;
        });

        waitsFor(function () {return done; });

    });

});
