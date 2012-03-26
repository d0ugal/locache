locache
------------------------------

locache is a python memcache inspired interface to localStorage in the
browser. locache has no dependacies and is very small. locache will degrade
well, meaning that if your using a browser that doesn't support localStorage
(usually IE6 or IE7) then you wont get any errors, but caching attempts will
be silently dropped and lookups will always appear to be a cache miss.


Setting, Getting and removing values
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Values can be stored one at a time as shown below, these values will never
expire and will only be removed when you (or the browser) removes them.

::

    locache.set("my_key", "my_value");

    locache.get("my_key");
    // my_value

    locache.remove("my_key");

When you store an object, that's what you'll get back. For example, a number;

::

    locache.set("counter", 1);
    typeof locache.get("counter");
    // number



Storing complex objects isn't a problem too. Just make sure they are JSON
serializable.

::

    locache.set('user', {
        'name': "Dougal Matthews",
        'alias': d0ugal
    })

    var result = locache.get('user');

    //{
    //    'name': "Dougal Matthews",
    //    'alias': d0ugal
    //}


You can also perform batch operations.

::

    locache.setMany({
        'name': 'locache',
        'language': 'JavaScript'
    });

    locache.getMany(['name', 'language']);
    // ['locache', 'JavaScript'];

    locache.removeMany(['name', 'language']);


Setting values that expire
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

::

    seconds = 5;
    locache.get("expiring_key", "expiring_value", seconds);

    // After 5 seconds this will return null.
    locache.get("expiring_key");


Incrementing and decremening? Sure.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

::

    locache.incr("counter");
    // 1
    locache.incr("counter");
    // 2
    locache.decr("counter");
    // 1
    locache.decr("counter");
    // 0
    locache.decr("counter");
    // -1


Flushing the cache
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Use the following to clear only the locache values stored in localStorage.

::

    locache.flush();


Performing cleanup
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Since localStorage doesn't support expiring values, they will still be left
around. This may or may not be a problem for you. If you want to make sure
they are cleaned up, use the following method on page load, or with a
setTimeout loop.

::

    locache.cleanup();