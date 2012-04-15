/*jshint asi:true */

describe("defer:", function(){

    "use strict";

    beforeEach(function(){
        this.defer = locache._defer
    })

    it("should test defer", function(){

        var c = 0

        this.defer(function(){
            c++
            expect(c).toBe(1)
        })
        expect(c).toBe(0)
    })

    it("should test finished", function(){

        var c = 0, done = false

        this.defer(function(){
            c++
        }).finished(function(){
            expect(c).toBe(1)
            done = true
        })

        waitsFor(function(){return done})
    })

})
