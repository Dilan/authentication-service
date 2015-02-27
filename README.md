Authentication Service
======================

---
Requirements
---

    1) Redis have to be installed and start on port 6379

Install
-------

    $ npm install

Start
-----

    $ node app.js

Test
----
    $ npm test

Interface
---------

#### Auth by code####

    // request:
    $ curl -X POST -H "Content-Type: application/json" -d '{ "authCode":"0000" }' http://127.0.0.1:3008

    // success response:
    {
        "error": false,
        "token": "5383fb399fc99e2862b22129",
        "restaurantId": "fake-restaurant",
        "tables": [
            {
                "description": "table near the WC.",
                "internalId": "0001",
                "id": "1"
            },
            {
                "description": "table near the door.",
                "internalId": "0002",
                "id": "2"
            }
        ]
    }

    // fail response:
    {
        "error": true,
        "errorCode": "401",
        "errorMsg": "Unauthorized"
    }

#### Find by token and update ####

    // request:
    $ curl -X PUT -H "Content-Type: application/json" -d '{ "token": "5383fb399fc99e2862b22129" }'  http://127.0.0.1:3008/tokens

    // response:
    {
        "error":false,
        "token":"5383fb399fc99e2862b22129",
        "restaurantId":"fake-restaurant"
    }
