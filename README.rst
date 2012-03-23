locache
------------------------------

locache is a python memcache inspired interface to localStorage in the
browser. locache has no dependacies and is very small.


Setting and Getting values
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

::

    locache.set("my_key", "my_value");
    locache.get("my_key");


Setting values that expire
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

::

    seconds = 5;
    locache.get("expiring_key", "expiring_value", seconds);

    // After 5 seconds this will return null.
    locache.get("expiring_key");


Flushing the cache
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

::
    locache.flush();