(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.yetanotherstore = factory());
}(this, (function () { 'use strict';

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

        let eventId = this._generateEventId();
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

      if(index !== -1) {
        eventOfSameName.splice(index, 1);
      }
    }


    /**
     * @private
     * Generate a pseudorandom event name
     * @return {string}
     */
    _generateEventId(length=8){
      let text = '';
      var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

      for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text
    }

  }

  let storage = {};

  class Store extends EventManager {

    constructor(){
      super();
    }

    set(key, value){
      let argObj = {
        key: key,
        value: value,
        previousValue: storage[key] // possibly undefined
      };

      storage[key] = value;

      this.emit('valueSet', [argObj]);
    }


    get(key){
      return storage[key]
    }


    delete(key){
      if(key in storage){
        argObj = {
          key: key,
          value: value
        };

        delete storage[key];
        this.emit('valueDeleted', [argObj]);
      }
    }


    has(key){
      return (key in storage)
    }


    reset(){
      storage = {};
      this.emit('reseted', []);
    }


    keys(){
      return Object.keys(storage)
    }

  }

  let singletonStore = new Store();

  return singletonStore;

})));
//# sourceMappingURL=yetanotherstore.js.map
