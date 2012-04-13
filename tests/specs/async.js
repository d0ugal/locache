/*jshint asi:true */

describe("asynclocal:", function(){

    "use strict";

    if (!locache.supportsSessionStorage) return

    beforeEach(function(){
        window.localStorage.clear()
        this.cache = locache.createCache({storage: locache.backends.asynclocal})
    })

    it("should return a length of 3", function(){

        var cache = this.cache

        cache.set("key", "value").finished(function(event){

            console.log("a" + cache.length())

        });

        console.log("b" + cache.length())

    })

    it("should set and get a string and verify the data type", function(){
        var cache = this.cache
        cache.set("my_string", "my_value").finished(function(){
            cache.get("my_string").finished(function(result){
                expect(result).toBe("my_value")
                expect(typeof result).toBe("string")
            })
        })


    })

})
