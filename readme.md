**Yetanotherstore** is a simple non persistent way to store global states and to attach events on what is happening to this storage. It was originally designed to be used in React to avoid the complexity of other lib (i'm looking at you Redux!), though it can easily be used without React.  

```
npm install --save yetanotherstore
```

# Concept
Yetanotherstore provides a unique singleton-like dictionary (key-values). There are some built in methods to add, remove, check and list properties. This guaranties that the *key-values* are never edited without the help of the provided methods.

In addition, some events are going to be emitted every time the storage is modified. See the **event** section.

# Create a Store
First, you need to create a Store instance in a place where it's going to be accessible by the components that need it. Let's create a file `AppStore.js` that will instantiate `Store` and export the store object:
```js
// AppStore.js

import Store from 'yetanotherstore'

let AppStore = new Store()
export default AppStore
```
Now, every file that import `AppStore.js` will be able to use the Store instance and access the same pool of data.

# Methods

```javascript
import AppStore from './AppStore'

// ...

// Add something to the store
AppStore.set('someKey', 'some value')
AppStore.set('anotherKey', {firstname: 'Johnny', lastname: 'Bravo'})

// get a value
les someVal = AppStore.get('someKey')

// Remove something from the store
AppStore.delete('someKey')

// check is the store has some key
if(AppStore.has('someKey')){
  // ...
}

// Get an array with all the keys
let allTheKeys = AppStore.keys()

// Reset the store so that it becomes empty
AppStore.reset()
```


# Events
All the following event can accept multiple callback, there is no limit. Read more about the event engine [here](https://www.npmjs.com/package/@jonathanlurie/eventmanager).

## `valueSet`
Everytime a value is added or set in the store with the method `Store.set()`, the event `valueSet` is emitted. To subscribe to this event, do the following:
```js
import AppStore from './AppStore'
AppStore.on('valueSet', function(evt){
  // ...
})
```

Then, the object `evt` contains the properties:
- `key`: the key that was just added or modified
- `value`: the corresponding value
- `previousValue`: the previous value, if there was already something corresponding to this key (`undefined` otherwise)

## `valueDeleted`
When a value is removed from the Store with the method `Store.delete()`, the event `valueDeleted` is emitted. To subscribe to this event, do the following:
```js
import AppStore from './AppStore'
AppStore.on('valueDeleted', function(evt){
  // ...
})
```

Then, the object `evt` contains the properties:
- `key`: the key that was just deleted
- `value`: the corresponding value

## `reseted`
When the whole store is reset with the method `Store.reset()`, the event `reseted` is emitted. To subscribe to this event, do the following:
```js
import AppStore from './AppStore'
AppStore.on('reseted', function(){
  // ...
})
```
This callback has no argument.

# Extra
## Gatekeeper
A store provides the possibility to add a *gatekeeper* function, to make sure that some verifications is performed before stuff are being pushed into the store. The gatekeeper function takes two argument: `key` and 'value' and must return 'true' (the data is valid and can be pushed into the store) or 'false' (the data is invalid and cannot be pushed).   

If the gatekeeper refuses to let a piece of data in, the event `refused` is emited. Let's see an example:

```js
let store = new yetanotherstore()

// From now on, the gatekeeper accepts only values that are of type string
store.setGateKeeper((key, value) => {
  return typeof value === 'string'
})

// the callback when a value is refused by the gatekeeper function
store.on('refused', data => {
  console.log(`Nope, the value ${data.value} is not a string`)
})

// Later, for some reason, we want to remove the gatekeeper:
store.setGateKeeper(null)
```

## Lock
This is to prevent the store to be set any values with the regular `.set(key, value)` method. But, if we use the *forceLock* version, we can still push things in:

```js
let store = new yetanotherstore()

// lock the store, no one can push data inthere unless they use .set(key, value, true)
// with true being the 'forceLock' argument
store.lock()

// this won't add anything to the store
store.set('myKey', 32)

// but this will:
store.set('myForcedKey', 32, true)

// Then, other methods are available:
store.unlock()
let isItLocked = store.isLocked() // true or false

```

# The React usecase
**Yetanotherstore** can be used across components as a global store, such that a value added by a component trigger an event into one or multiple other components.
