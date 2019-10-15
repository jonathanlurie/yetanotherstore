(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.yetanotherstore = factory());
}(this, (function () { 'use strict';

  /**
   * This is borrowed from https://gist.github.com/jed/982883
   * because the uuid most popular package is using a node dep
   */

   function b(
    a                  // placeholder
  ){
    return a           // if the placeholder was passed, return
      ? (              // a random number from 0 to 15
        a ^            // unless b is 8,
        Math.random()  // in which case
        * 16           // a random number from
        >> a/4         // 8 to 11
        ).toString(16) // in hexadecimal
      : (              // or otherwise a concatenated string:
        [1e7] +        // 10000000 +
        -1e3 +         // -1000 +
        -4e3 +         // -4000 +
        -8e3 +         // -80000000 +
        -1e11          // -100000000000,
        ).replace(     // replacing
          /[018]/g,    // zeroes, ones, and eights with
          b            // random hex digits
        )
  }

  function b(a){
    return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)
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

        let eventId = b();
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
    }


    /**
     * Add or update a value in the store, under the name of the key.
     * Throw the events:
     *   - 'valueDeleted' with the argument {key: string, value: any, previousValue: any}
     *   - 'set:{key}' where {key} is the key as a string, with the argument {key: string, value: any, previousValue: any}
     * @param {string|number} key - identifier of the value
     * @param {any} value - the value
     * @return {string} the key as a string
     */
    set(key, value){
      if(typeof key === 'object'){
        throw new Error('Keys cannot be object')
        return
      }

      let validKey = key.toString();
      let argObj = {
        key: validKey,
        value: value,
        previousValue: this._storage[validKey] // possibly undefined
      };

      this._storage[validKey] = value;

      this.emit('valueSet', [argObj]);
      this.emit(`set:${validKey}`, [argObj]);
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
        argObj = {
          key: validKey,
          value: value
        };

        delete this._storage[validKey];
        this.emit('valueDeleted', [argObj]);
        this.emit(`del:${validKey}`, [argObj]);
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
     * Get all the keys in the store
     * @return {Array} array of strings
     */
    keys(){
      return Object.keys(this._storage)
    }

  }

  return Store;

})));
//# sourceMappingURL=yetanotherstore.js.map
