/*jshint asi:true */

//      gauge.js VERSION-PLACEHOLDER
//
//      (c) 2012 Dougal Matthews
//      gauge.js may be freely distributed under the MIT licence.
//
//      gauge.js is a client side caching framework that stores data
//      with DOM Storage and proves a memcache inspired API for
//      setting and retrieving values.

(function(){

    "use strict";

    // Initial Setup

    var root = this

    var gauge = root.gauge = {}

    gauge.Env = function(){

    }

    gauge.Suite = function(benchmarks){
        this.benchmarks = benchmarks
    }

    gauge.getEnv = function(){
        return new gauge.Env()
    }

    gauge.suite = function(benchmarks){
        return new gauge.Suite(benchmarks)
    }



}).call(this)