(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.yetanotherstore = factory());
}(this, (function () { 'use strict';

  /**
   * This is borrowed from https://gist.github.com/jed/982883
   * because the uuid most popular package is using a node dep
   */

  function uuidv4(a){
    return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuidv4)
  }

  /**
   * The EventManager deals with events, create them, call them.
   * This class is mostly for being inherited from.
   */
  class EventManager {
    /**
     * Constructor
     * @param {boolean} enabled - if true (default), the events emitting is enabled, if false, they won't be fired.
     */
    constructor(enabled=true) {
      this._events = {};
      this._enabled = enabled;

      // by event hash, stores the even name and the callback, in order to remove it
      // efficiently
      this._eventIndex = {};
    }


    /**
     * Tells how many events are registered under this event name
     * @return {number}
     */
    countEvents(eventName){
      if(eventName in this._events){
        return this._events[eventName].length
      }else{
        return 0
      }
    }


    /**
     * This way, the events are not emitted
     */
    disableEvents() {
      this._enabled = false;
    }


    /**
     * This way, the events are properly emitted
     */
    enableEvents() {
      this._enabled = true;
    }

    /**
     * Define an event, with a name associated with a function
     * @param  {String} eventName - Name to give to the event
     * @param  {Function} callback - function associated to the even
     * @return {string|null} the eventId (useful to remove it) or null if the event couldnt be added
     */
    on(eventName, callback) {
      if (typeof callback === 'function') {
        if (!(eventName in this._events)) {
          this._events[eventName] = [];
        }

        let eventId = uuidv4();
        this._eventIndex[eventId] = {
          eventName: eventName,
          callback: callback
        };

        this._events[eventName].push(eventId);

        return eventId
      } else {
        console.warn('The callback must be of type Function');
      }

      return null
    }


    /**
     * Emit the event, run the functions attached to it
     * @param {string} eventName - the name of the event to run
     * @param {Array} args - array of arguments the event callbacks are going to be called with (with destructuring operator)
     */
    emit(eventName, args = []) {
      if(!this._enabled){
        return
      }

      // the event must exist and be non null
      if ((eventName in this._events) && (this._events[eventName].length > 0)) {
        const events = this._events[eventName];
        for (let i = 0; i < events.length; i += 1) {
          this._eventIndex[events[i]].callback(...args);
        }
      }
    }


    /**
     * Emit the event, run the functions attached to it in a async fashion
     * @param {string} eventName - the name of the event to run
     * @param {Array} args - array of arguments the event callbacks are going to be called with (with destructuring operator)
     */
     async emitAsync(eventName, args = []) {
      if(!this._enabled){
        return
      }

      // the event must exist and be non null
      if ((eventName in this._events) && (this._events[eventName].length > 0)) {
        const events = this._events[eventName];
        for (let i = 0; i < events.length; i += 1) {
          await this._eventIndex[events[i]].callback(...args);
        }
      }
    }


    /**
     * Delete an event using its id
     * @param {string} id - id of the event (returned by the `.on()` method)
     */
    delete(eventId) {
      if(!(eventId in this._eventIndex)){
        console.log(`No event of id ${eventId}.`);
        return
      }

      // array of events of the same name as eventId
      let eventOfSameName = this._events[this._eventIndex[eventId].eventName];
      let index = eventOfSameName.indexOf(eventId);

      delete this._eventIndex[eventId];

      if(index !== -1) {
        eventOfSameName.splice(index, 1);
      }

      if(eventOfSameName.length === 0){
        delete this._events[this._eventIndex[eventId].eventName];
      }
    }


  }

  /**
   * A store is a place to store 'key:value' tuples. A key is generally a string
   * and unique identifier within the store. The value can be anything.
   *
   * This store provides some events, such as 'valueSet', 'set:{key}', 'valueDeleted',
   * 'del:{key}' and 'reseted'. Those event can be subscribed to with the following:
   * ```js
   * myStoreInstance.on( THE_EVENT_NAME, (val) => {
   *   // do something
   * })
   * ```
   */
  class Store extends EventManager {

    constructor(){
      super();
      this._storage = {};
      this._gateKeeper = null;
      this._locked = false;
    }


    /**
     * Add or update a value in the store, under the name of the key.
     * Throw the events:
     *   - 'valueDeleted' with the argument {key: string, value: any, previousValue: any}
     *   - 'set:{key}' where {key} is the key as a string, with the argument {key: string, value: any, previousValue: any}
     * @param {string|number} key - identifier of the value
     * @param {any} value - the value
     * @param {boolean} forceLock - bypass the locked after the .lock() methods was called.
     * @return {string} the key as a string
     */
    set(key, value, forceLock = false){
      if(this._locked && !forceLock){
        return
      }

      if(typeof key === 'object'){
        throw new Error('Keys cannot be object')
        return
      }

      let validKey = key.toString();
      let argObj = {
        key: validKey,
        value: value
      };

      if(this._gateKeeper){
        let isValid = this._gateKeeper(key, value);
        if(!isValid){
          return this.emit('refused', [argObj])
        }
      }

      argObj.previousValue = this._storage[validKey]; // possibly undefined
      this._storage[validKey] = value;
      this.emit('valueSet', [argObj]);
      this.emit(`set:${validKey}`, [argObj]);
      return validKey
    }


    /**
     * Add or update a value in the store, under the name of the key. Async.
     * Throw the events:
     *   - 'valueDeleted' with the argument {key: string, value: any, previousValue: any}
     *   - 'set:{key}' where {key} is the key as a string, with the argument {key: string, value: any, previousValue: any}
     * @param {string|number} key - identifier of the value
     * @param {any} value - the value
     * @param {boolean} forceLock - bypass the locked after the .lock() methods was called.
     * @return {string} the key as a string
     */
     async setAsync(key, value, forceLock = false){
      if(this._locked && !forceLock){
        return
      }

      if(typeof key === 'object'){
        throw new Error('Keys cannot be object')
        return
      }

      let validKey = key.toString();
      let argObj = {
        key: validKey,
        value: value
      };

      if(this._gateKeeper){
        let isValid = this._gateKeeper(key, value);
        if(!isValid){
          await this.emitAsync('refused', [argObj]);
          return
        }
      }

      argObj.previousValue = this._storage[validKey]; // possibly undefined
      this._storage[validKey] = value;
      await this.emitAsync('valueSet', [argObj]);
      await this.emitAsync(`set:${validKey}`, [argObj]);
      return validKey
    }



    /**
     * Retrieve the value corresponding to the 'key'
     * @param {string|number} key - identifier of the value
     * @return {any|undefined} the value, possibly 'undefined' if not in store
     */
    get(key){
      let validKey = key.toString();
      return this._storage[validKey]
    }


    /**
     * Delete a value from the store, using its key as identifier.
     * Throw the events:
     *   - 'valueDeleted' with the argument {key: string, value: any}
     *   - 'del:{key}' where {key} is the key as a string, with the argument {key: string, value: any}
     * @param {string|number} key - identifier of the value
     * @return {boolean} true if the value was successfully deleted, false if not (because not found)
     */
    delete(key){
      let validKey = key.toString();
      if(validKey in this._storage){
        const argObj = {
          key: validKey,
          value: this._storage[validKey]
        };

        delete this._storage[validKey];
        this.emit('valueDeleted', [argObj]);
        this.emit(`del:${validKey}`, [argObj]);
        return true
      }

      return false
    }


    /**
     * Delete a value from the store, using its key as identifier. Async.
     * Throw the events:
     *   - 'valueDeleted' with the argument {key: string, value: any}
     *   - 'del:{key}' where {key} is the key as a string, with the argument {key: string, value: any}
     * @param {string|number} key - identifier of the value
     * @return {boolean} true if the value was successfully deleted, false if not (because not found)
     */
     async deleteAsync(key){
      let validKey = key.toString();
      if(validKey in this._storage){
        const argObj = {
          key: validKey,
          value: this._storage[validKey]
        };

        delete this._storage[validKey];
        await this.emitAsync('valueDeleted', [argObj]);
        await this.emitAsync(`del:${validKey}`, [argObj]);
        return true
      }

      return false
    }


    /**
     * Check if a given key is in the store
     * @param {string|number} key - identifier of the value
     * @return {boolean} true if is in store, false if not
     */
    has(key){
      return (key.toString() in this._storage)
    }


    /**
     * Flush the store, remove everything.
     * Throw the event 'reseted' with no argument.
     */
    reset(){
      this._storage = {};
      this.emit('reseted', []);
    }


    /**
     * Flush the store, remove everything. Async.
     * Throw the event 'reseted' with no argument.
     */
    async resetAsync(){
      this._storage = {};
      await this.emitAsync('reseted', []);
    }


    /**
     * Get all the keys in the store
     * @return {Array} array of strings
     */
    keys(){
      return Object.keys(this._storage)
    }


    /**
     * Get all the values from the store, without the keys
     * @return {Array}
     */
    values(){
      return Object.values(this._storage)
    }


    /**
     * Define the gate keeper function.
     * This function is a data validator for the .set method. It takes two arguments
     * (the key and the value of the piece of data to add) and returns true (valid to be added)
     * of false (not valid to be added). If the object is non valid to be added, then the event
     * 'refused' is emitted, with the arg {key, value}.
     * If the gatekeeper function is no set or set to null, the feature is not used and no
     * control will happen on the call of the .set method/
     * @param {function|null} fn - the gatekeeper function
     */
    setGateKeeper(fn) {
      if(typeof fn === 'function' || fn === null){
        this._gateKeeper = fn;
      }
    }


    /**
     * Check if the store is locked
     * @return {boolean}
     */
    isLocked(){
      return this._locked
    }


    /**
     * Lock the store, so that the .set method cannot be used unless the
     * arg forceLock is set to true.
     */
    lock(){
      this._locked = true;
    }


    /**
     * No longer use the lock
     */
    unlock(){
      this._locked = false;
    }


    /**
     * Add an event to when a key is being set. Equivalent to `on('set:keyName, fn)` but shorter
     * @param {String} key - unique key of an entry in the store
     * @param {callback} fn - callback function for when this key is being set
     */
    async onSet(key, fn) {
      return await this.on(`set:${key}`, fn)
    }


    /**
     * Add an event to when a key is being deleted. Equivalent to `on('del:keyName, fn)` but shorter
     * @param {String} key - unique key of an entry in the store
     * @param {callback} fn - callback function for when this key is being deleted
     */
    async onDelete(key, fn) {
      return await this.on(`del:${key}`, fn)
    }


    /**
     * Binds a function to the 'valueSet' event. Such event happens whenever the `.set()`
     * method is called on this store. 
     * This method is not specific for a given key.
     * @param {Function} callback function to be called when the 'valueSet' event occurs.
     * This callback has a single argument of the shape {key: string|number, value: any, previousValue: any}
     */
    async onValueSet(fn) {
      return await this.on('valueSet', fn)
    }


    /**
     * Binds a function to the 'valueDeleted' event. Such event happens whenever the `.delete()`
     * method is called on this store. 
     * This method is not specific for a given key.
     * @param {Function} callback function to be called when the 'valueDeleted' event occurs.
     * This callback has a single argument of the shape {key: string|number, value: any, previousValue: any}
     */
    async onValueDeleted(fn) {
      return await this.on('valueDeleted', fn)
    }


    /**
     * Binds a function to the 'reseted' event. Such event happens whenever the `.reset()`
     * method is called on this store. 
     * This method is not specific for a given key.
     * @param {Function} callback function to be called when the 'reseted' event occurs.
     * This callback has no argument
     */
    async onReseted(fn) {
      return await this.on('reseted', fn)
    }

  }

  return Store;

})));
//# sourceMappingURL=yetanotherstore.js.map
