locache
------------------------------

JavaScript caching framework for client side caching in the browser using
localStorage. With a memcache inspired API usage is very easy and familiar.
locache has no dependencies and is very small.

locache gracefully degrades when the browser doesn't support localStorage.
Usually this will be IE6 or IE7, you wont get any errors, but caching
attempts will be silently dropped and lookups will always appear to be a
cache miss.


Setting, getting and removing values
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Values can be stored one at a time as shown below, these values will never
expire and will only be removed when you (or the browser) removes them.

::

    locache.set("my_key", "my_value")

    locache.get("my_key")
    // my_value

    locache.remove("my_key")

When you store an object, that's what you'll get back. For example, a number:

::

    locache.set("counter", 1)
    typeof locache.get("counter")
    // number



Storing complex objects isn't a problem too. Just make sure they are JSON
serializable.

::

    locache.set('user', {
        'name': "Dougal Matthews",
        'alias': d0ugal
    })

    var result = locache.get('user')

    //{
    //    'name': "Dougal Matthews",
    //    'alias': d0ugal
    //}


You can also perform batch operations.

::

    locache.setMany({
        'name': 'locache',
        'language': 'JavaScript'
    })

    locache.getMany(['name', 'language'])
    // ['locache', 'JavaScript']

    locache.removeMany(['name', 'language'])


Setting values that expire
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

::

    seconds = 5;
    locache.set("key", "value", seconds);

    // After 5 seconds this will return null.
    locache.get("key");


Incrementing and decrementing? Sure.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

::

    locache.incr("counter")
    // 1
    locache.incr("counter")
    // 2
    locache.decr("counter")
    // 1
    locache.decr("counter")
    // 0
    locache.decr("counter")
    // -1


Flushing the cache
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Use the following to clear only the locache values stored in localStorage.

::

    locache.flush()


Performing cleanup
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Since localStorage doesn't support expiring values, they will still be left
around. This may or may not be a problem for you. If you want to make sure
they are cleaned up, use the following method on page load, or with a
setTimeout loop.

::

    locache.cleanup()
