**Yetanotherstore** is a simple non persistent way to store global states and to attach events on what is happening to this storage. It was originally designed to be used in React to avoid the complexity of other lib (i'm looking at you Redux!), though it can easily be used without React.  

```
npm install --save yetanotherstore
```

# Concept
Yetanotherstore provides a unique singleton-like dictionary (key-values). There are some built in methods to add, remove, check and list properties but the object that contains those properties is not directly accessible (thanks to scoping). This guaranties that the *key-values* are never edited without the help of the provided methods.

In addition, some events are going to be emitted everytime the storage is modified. See the **event** section.

# Methods

```javascript
import Store from 'yetanotherstore'

// ...

// Add something to the store
Store.add('someKey', 'some value')
Store.add('anotherKey', {firstname: 'Johnny', lastname: 'Bravo'})

// get a value
les someVal = Store.get('someKey')

// Remove something from the store
Store.delete('someKey')

// check is the store has some key
if(Store.has('someKey')){
  // ...
}

// Get an array with all the keys
let allTheKeys = Store.keys()

// Reset the store so that it becomes empty
Store.reset()
```


# Events
All the following event can accept multiple callback, there is no limit. Read more about the event engine [here](https://www.npmjs.com/package/@jonathanlurie/eventmanager).

## `valueSet`
Everytime a value is added or set in the store with the method `Store.set()`, the event `valueSet` is emitted. To subscribe to this event, do the following:
```js
Store.on('valueSet', function(evt){
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
Store.on('valueDeleted', function(evt){
  // ...
})
```

Then, the object `evt` contains the properties:
- `key`: the key that was just deleted
- `value`: the corresponding value

## `reseted`
When the whole store is reset with the method `Store.reset()`, the event `reseted` is emitted. To subscribe to this event, do the following:
```js
Store.on('reseted', function(){
  // ...
})
```
This callback has no argument.

# The React usecase
**Yetanotherstore** can be used across components as a global store, such that a value added by a component trigger an event into one or multiple other components.
