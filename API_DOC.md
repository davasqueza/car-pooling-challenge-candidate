# Car Pooling Service API

Car Pooling API is a service that allow groups of people to request a journey sharing a car with another passengers, making
the ride more affordable and eco-friendlier. The service allow register car with 4, 5 or 6 seats and groups of people up to 6.

## Implementation details
Current implementation was implemented using an in-memory approach with three data structures:

* **availableCars** A dictionary used to store cars ready to receive passengers.
* **waiting** A list used to store groups of people waiting for be served.
* **groupAssigned** A dictionary used to store groups of people with a journey registered.

### Car registration

When a list of cars is being registered using *cars* endpoint, the server classify each one of them according to their
available seats, this is done in order enable quick access to cars with available seats.

**Cars to be registered**
* ID: 1, Seats: 5
* ID: 2, Seats: 4
* ID: 3, Seats: 6
* ID: 4, Seats: 4
* ID: 5, Seats: 6

**Cars stored**
* **4**: (ID: 2, Seats: 4, Free: 4) | (ID: 4, Seats: 4, Free: 4)
* **5**: (ID: 1, Seats: 5, Free: 5)
* **6**: (ID: 3, Seats: 6, Free: 6) | (ID: 5, Seats: 6, Free: 6)

The service also includes a property call *Free*, it allows to track the amount of free seats, his usage will be explained
in detail on drop off section.

### Journey registration

When a group of people requests a journey, the server tries to find an available car to server them, if there is not one
available then save the group to a waiting list.

Taking as example the previous list of cars stored:

**People groups requesting journey**
* ID: 1, People: 3
* ID: 2, People: 6

**Group assignation**
* **1** (Car: (ID: 2, Seats: 4, Free: 1), People: 3)
* **2** (Car: (ID: 3, Seats: 6, Free: 0), People: 6)

**Cars stored (After groups assignation)**
* **0**: (ID: 3, Seats: 6, Free: 0)
* **1**: (ID: 2, Seats: 4, Free: 1)
* **4**: (ID: 4, Seats: 4, Free: 4)
* **5**: (ID: 1, Seats: 5, Free: 5)
* **6**: (ID: 5, Seats: 6, Free: 6)

The service has as priority passenger arrival order and car assignation with fewer seats, to do that the service starts
to lookup for available seats in the list of *Cars stored* beginning with the range of cars with the lowest free seats and
going up to the highest ones.

It also updates the *Free* attribute to take in account the new amount of available seats after assignation. For example,
car with ID: 2 now has 1 free seat, due to the assignation of people group with ID: 1 with 3 passengers.

After this, if a new people group wants to request a journey, it will take in consideration that car with ID: 2 has now
only one seat left.

**People groups requesting journey**
* ID: 3, People: 1

**Group assignation**
* **1** (Car: (ID: 2, Seats: 4, Free: 1), People: 3)
* **2** (Car: (ID: 3, Seats: 6, Free: 0), People: 6)
* **3** (Car: (ID: 2, Seats: 4, Free: 0), People: 1)

**Cars stored (After groups assignation)**
* **0**: (ID: 3, Seats: 6, Free: 0) | (ID: 2, Seats: 4, Free: 0)
* **4**: (ID: 4, Seats: 4, Free: 4)
* **5**: (ID: 1, Seats: 5, Free: 5)
* **6**: (ID: 5, Seats: 6, Free: 6)

As you can see, now car with ID: 2 has now two different people group (ID: 1, ID: 3), and it will not be taken in consideration
for further assignations.

### Journey location

With the dictionary of group assignation, looking for a journey status is pretty straightforward, it only requires retrieve
it from *Group assignation* using people group ID as a key.

### People group drop off

Drop off has several stages:
* **Check current assignation** Tries to retrieve the current car assigned to the people group. If them does not have a car
  assigned, the service removes them from the waiting list.
* **Car seats release** If a car was assigned to the people group, the service restores the amount of seats previous to
  group assignation, to make them available to new passengers.
* **Car new assignation** After the service release the car, it tries to fill again the seats looking for people groups awaiting
  a ride, it takes in consideration arrival order when is possible.

Suppose the following scenario:

**Group assignation**
* **1** (Car: (ID: 2, Seats: 4, Free: 1), People: 3)

**Cars stored**
* **0**: (ID: 2, Seats: 4, Free: 1)

**Waiting list**
* (ID: 3, People: 6)
* (ID: 4, People: 2)

People group with ID: 3 and 4 is waiting for assignation, because there are no cars left that allow a journey with 2 and 6 passengers.
Now, if people group ID: 1 requests drop off, we get:

**Group assignation**
* **4** (Car: (ID: 2, Seats: 4, Free: 2), People: 2)

**Cars stored**
* **2**: (ID: 2, Seats: 4, Free: 2)

**Waiting list**
* (ID: 3, People: 6)

Several things happened here:
* People group ID: 1 was removed from *Group assignation* dictionary
* Car ID: 2 released 3 seats, updating *Free* attribute to 4
* The service starts looking for a people group that allow to fill the released seats
* The service skip people group ID: 3, because the only car remaining only has 4 seats available
* The service finds that People group ID: 4 requires 2 seats, that could be served by car ID: 2
* The service fill the seats of car ID: 2 with People group ID: 4
* The service move car ID: 2 to the new capacity list

## Performance

Performance will be measured taking in consideration each one of the operations performed to *availableCars*, *waiting*
and *groupAssigned*.

* **Update car list** This process iterates over the car list classifying each one by seats and store them on *availableCars*,
  the iteration is only being performed one time, making it a linear time complexity O(n), where *n* is the amount of cars.
  Additionally, according to [ECMAScript 2015 Language Specification](https://262.ecma-international.org/6.0/#sec-set-objects)
  *Set* must "provide access times that are sublinear on the number of elements in the collection", so registering and fetching
  cars on *availableCars* should be also around O(n) and O(1) (Depending on *Set* implementation)
* **Assign people group to car** This process iterates over *availableCars* to try to find a suitable car and then assign it.
  Because cars are already classified by free amount of seats the worst case would be a scenario when there is only one car
  remaining with 6 seats and a people group of 1, making it O(6) for looking for a car and O(n) for the assignation.
* **Assign people group to waiting list** This process just adds a people group to the array *waiting*, this allows
  registering new groups with O(1).
* **Get journey status** Fetch current status only require access to *groupAssigned* using group ID as index, so this operation
  is performed with O(1)
* **Remove people group from car** This operation requires to remove the car from current availability section, trying to
  fill released seats with new passenger, remove them from waiting list and assign them to a car. Add/Remove operations over
  *availableCars* and *groupAssigned* are O(1). Trying to fill the car in the worst scenario should be O(m), where *m* is the
  amount of passenger in the waiting list and all of them are not suitable to aboard the car. The best scenario should be O(1)
  being the first waiting group on waiting list suitable to aboard the car and them completely fills the car. Removing a group
  from the waiting list in the worst scenario should be O($`6m`$), because each removal is O(m) and we can have a car with six
  seats available and six groups of one passenger with the lowest priority. A linked list could be implemented if that becomes an
  issue.


## API

### GET /status

Indicate the service has started up correctly and is ready to accept requests. It returns detailed information about the
current status of Event loop, CPU and heap

Sample:

```json
{
  "status": "ok",
  "info": {
    "eventLoop": {
      "status": "up",
      "delay": 0,
      "limit": 700
    },
    "cpu": {
      "status": "up",
      "loadavg": [
        0.13,
        0.31,
        0.16
      ],
      "weightedLoad": 0.010833333333333334,
      "threshold": 3
    },
    "memory_heap": {
      "status": "up"
    }
  },
  "error": {},
  "details": {}
}
```

Responses:

* **200 OK** When the service is ready to receive requests.

### PUT /cars

Load the list of available cars in the service and remove all previous data
(reset the application state). This method may be called more than once during
the life cycle of the service.

**Body** _required_ The list of cars to load.

**Content Type** `application/json`

Sample:

```json
[
  {
    "id": 1,
    "seats": 4
  },
  {
    "id": 2,
    "seats": 6
  }
]
```

Responses:

* **200 OK** When the list is registered correctly.
* **400 Bad Request** When there is a failure in the request format, expected
  headers, or the payload can't be unmarshalled.
  * **CarInvalidSeat** When a car has an invalid amount of seats
* **500 Internal Server Error** When there is an unrecoverable server or service error.

### POST /journey

A group of people requests to perform a journey.

**Body** _required_ The group of people that wants to perform the journey

**Content Type** `application/json`

Sample:

```json
{
  "id": 1,
  "people": 4
}
```

Responses:

* **200 OK** or **202 Accepted** When the group is registered correctly
* **400 Bad Request** When there is a failure in the request format or the
  payload can't be unmarshalled.
* **500 Internal Server Error** When there is an unrecoverable server or service error.

### POST /dropoff

A group of people requests to be dropped off. Whether they traveled or not.

**Body** _required_ A form with the group ID, such that `ID=X`

**Content Type** `application/x-www-form-urlencoded`

Responses:

* **200 OK** or **204 No Content** When the group is unregistered correctly.
* **404 Not Found** When the group is not to be found.
* **400 Bad Request** When there is a failure in the request format or the
  payload can't be unmarshalled.
* **500 Internal Server Error** When there is an unrecoverable server or service error.

### POST /locate

Given a group ID such that `ID=X`, return the car the group is traveling
with, or no car if they are still waiting to be served.

**Body** _required_ A url encoded form with the group ID such that `ID=X`

**Content Type** `application/x-www-form-urlencoded`

**Accept** `application/json`

Responses:

* **200 OK** With the car as the payload when the group is assigned to a car. See below for the expected car representation
```json
  {
    "id": 1,
    "seats": 4
  }
```

* **204 No Content** When the group is waiting to be assigned to a car.
* **404 Not Found** When the group is not to be found.
* **400 Bad Request** When there is a failure in the request format or the
  payload can't be unmarshalled.
**500 Internal Server Error** When there is an unrecoverable server or service error.
