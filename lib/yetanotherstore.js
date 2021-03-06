'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var EventManager = _interopDefault(require('@jonathanlurie/eventmanager'));

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

module.exports = Store;
//# sourceMappingURL=yetanotherstore.js.map
