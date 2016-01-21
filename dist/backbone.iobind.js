/*!
 * backbone.iobind
 * Copyright (c) 2016 Majik Systems
 * Originally by Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 * https://github.com/logicalparadox/backbone.iobind
 */

// Wrapper based on https://github.com/umdjs/umd
// https://github.com/umdjs/umd/blob/master/returnExports.js

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['backbone', 'underscore', 'socket.io', 'jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    var _ = require('underscore'),
      Backbone = require('backbone'),
      io = require('socket.io-client'),
      $ = require('jquery');
    module.exports = factory(Backbone, _, io, $);
  } else {
    // Browser globals (root is window)
    factory(root.Backbone, root._, root.io, (root.jQuery || root.Zepto || root.ender || root.$));
  }
}(this, function (Backbone, _, io, $){
/*!
 * backbone.iobind - Model
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Version
 */
Backbone.Model.prototype.ioBindVersion = '@VERSION';

/**
 * # .ioBind(event, callback, [context])
 *
 * Bind and handle trigger of socket.io events for models.
 *
 * ### Guidelines
 *
 * Do NOT bind to reserved backbone events, such as `change`, `remove`, and `add`.
 * Proxy these events using different event tags such as `update`, `delete`, and `create`.
 *
 * The socket.io socket must either exist at `window.socket`, `Backbone.socket`, or
 * `this.socket` or it must be passed as the second argument.
 *
 * ### Example
 *
 * * Model definition has url: `my_model`
 * * Model instance has id: `abc123`
 *
 * #### Create a new bind (client-side):
 *
 *     model.ioBind('update', window.io, this.updateView, this);
 *
 * #### Send socket.io message (server-side)
 *
 *     socket.emit( 'my_model/abc123:update', { title: 'My New Title' } );
 *
 * @name ioBind
 * @param {String} eventName
 * @param {Object} io from active socket.io connection (optional)
 * @param {Function} callback
 * @param {Object} context (optional) object to interpret as this on callback
 * @api public
 */

Backbone.Model.prototype.ioBind = function (eventName, io, callback, context) {
  var ioEvents = this._ioEvents || (this._ioEvents = {})
    , globalName = _.result(this, 'url') + ':' + eventName
    , self = this;
  if ('function' == typeof io) {
    context = callback;
    callback = io;
    io = this.socket || window.socket || Backbone.socket;
  }
  var event = {
    name: eventName,
    global: globalName,
    cbLocal: callback,
    cbGlobal: _.bind(callback, context)
  };
  io.on(event.global, event.cbGlobal);
  this.once('destroy', _.bind(this.ioUnbind, this, event.name, io, event.cbLocal));
  if (!ioEvents[event.name]) {
    ioEvents[event.name] = [event];
  } else {
    ioEvents[event.name].push(event);
  }
  return this;
};

/**
 * # .ioUnbind(event, [callback])
 *
 * Unbind model triggers and stop listening for server events for a specific
 * event and optional callback.
 *
 * The socket.io socket must either exist at `window.socket`, `Backbone.socket`,
 * or `this.socket` or it must be passed as the second argument.
 *
 * @name ioUnbind
 * @param {String} eventName
 * @param {Object} io from active socket.io connection
 * @param {Function} callback (optional) If not provided will remove all callbacks for eventname.
 * @api public
 */

Backbone.Model.prototype.ioUnbind = function (eventName, io, callback) {
  var ioEvents = this._ioEvents || (this._ioEvents = {})
    , globalName = _.result(this, 'url') + ':' + eventName;
  if ('function' == typeof io) {
    callback = io;
    io = this.socket || window.socket || Backbone.socket;
  }
  var events = ioEvents[eventName];
  if (!_.isEmpty(events)) {
    if ('function' === typeof callback) {
      _.each(events, function(event, index) {
        if (callback == event.cbLocal) {
          io.removeListener(event.global, event.cbGlobal);
          events.splice(index, 1);
        }
      }, this);
    } else {
      io.removeAllListeners(globalName);
      // for compatibility with socket.io version >= 1.0
      if (io.$events) {
        delete io.$events[globalName];
      }
    }
    if (events.length === 0) {
      delete ioEvents[eventName];
    }
  }
  return this;
};

/**
 * # .ioUnbindAll()
 *
 * Unbind all callbacks and server listening events for the given model.
 *
 * The socket.io socket must either exist at `window.socket`, `Backbone.socket`,
 * or `this.socket` or it must be passed as the only argument.
 *
 * @name ioUnbindAll
 * @param {Object} io from active socket.io connection
 * @api public
 */

Backbone.Model.prototype.ioUnbindAll = function (io) {
  var ioEvents = this._ioEvents || (this._ioEvents = {});
  if (!io) io = this.socket || window.socket || Backbone.socket;
  for (var ev in ioEvents) {
    this.ioUnbind(ev, io);
  }
  return this;
};
/*!
 * backbone.iobind - Collection
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Version
 */

Backbone.Collection.prototype.ioBindVersion = '@VERSION';

/**
 * # ioBind
 *
 * Bind and handle trigger of socket.io event for collections.
 *
 * ### Guidelines
 *
 * Do NOT bind to reserved backbone events, such as `change`, `remove`, and `add`.
 *
 * Proxy these events using different event tags such as `update`, `delete`, and `create`.
 *
 * The socket.io socket must either exist at `window.socket`, `Backbone.socket`,
 * or `this.socket` or it must be passed as the second argument.
 *
 * ### Example
 *
 * * Model definition has url: `my_model`
 * * Model instance has id: `abc123`
 *
 * #### Create a new bind (client-side):
 *
 *     model.ioBind('update', window.io, this.updateView, this);
 *
 * #### Send socket.io message (server-side)
 *
 *     socket.emit( 'my_model/abc123:update', { title: 'My New Title' } );
 *
 * @name ioBind
 * @param {String} eventName
 * @param {Object} io from active socket.io connection
 * @param {Function} callback
 * @param {Object} context (optional): Object to interpret as this on callback
 * @api public
 */

Backbone.Collection.prototype.ioBind = function (eventName, io, callback, context) {
  var ioEvents = this._ioEvents || (this._ioEvents = {})
    , globalName = _.result(this, 'url') + ':' + eventName
    , self = this;
  if ('function' == typeof io) {
    context = callback;
    callback = io;
    io = this.socket || window.socket || Backbone.socket;
  }
  var event = {
    name: eventName,
    global: globalName,
    cbLocal: callback,
    cbGlobal: _.bind(callback, context)
  };
  io.on(event.global, event.cbGlobal);
  if (!ioEvents[event.name]) {
    ioEvents[event.name] = [event];
  } else {
    ioEvents[event.name].push(event);
  }
  return this;
};

/**
 * # ioUnbind
 *
 * Unbind model triggers and stop listening for server events for a specific event
 * and optional callback.
 *
 * The socket.io socket must either exist at `window.socket`, `Backbone.socket`,
 * or `this.socket` or it must be passed as the second argument.
 *
 * @name ioUnbind
 * @param {String} eventName
 * @param {Object} io from active socket.io connection
 * @param {Function} callback (optional) If not provided will remove all callbacks for `eventName`
 * @api public
 */

Backbone.Collection.prototype.ioUnbind = function (eventName, io, callback) {
  var ioEvents = this._ioEvents || (this._ioEvents = {})
    , globalName = _.result(this, 'url') + ':' + eventName;
  if ('function' == typeof io) {
    callback = io;
    io = this.socket || window.socket || Backbone.socket;
  }
  var events = ioEvents[eventName];
  if (!_.isEmpty(events)) {
    if ('function' === typeof callback) {
      _.each(events, function(event, index) {
        if (callback == event.cbLocal) {
          io.removeListener(event.global, event.cbGlobal);
          events.splice(index, 1);
        }
      }, this);
    } else {
      io.removeAllListeners(globalName);
      // for compatibility with socket.io version >= 1.0
      if (io.$events) {
        delete io.$events[globalName];
      }
    }
    if (events.length === 0) {
      delete ioEvents[eventName];
    }
  }
  return this;
};

/**
 * # ioUnbindAll
 *
 * Unbind all callbacks and server listening events for the given model.
 *
 * The socket.io socket must either exist at `window.socket`, `Backbone.socket`,
 * or `this.socket` or it must be passed as the only argument.
 *
 * @name ioUnbindAll
 * @param {Object} io from active socket.io connection
 * @api public
 */

Backbone.Collection.prototype.ioUnbindAll = function (io) {
  var ioEvents = this._ioEvents || (this._ioEvents = {});
  if (!io) io = this.socket || window.socket || Backbone.socket;
  for (var ev in ioEvents) {
    this.ioUnbind(ev, io);
  }
  return this;
};
/*!
 * backbone.iobind - Backbone.sync replacement
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var ajaxSync = Backbone.sync;

/**
 * # Backbone.sync
 *
 * Replaces default Backbone.sync function with socket.io transport
 *
 * ### Assumptions
 *
 * Currently expects active socket to be located at `window.socket`,
 * `Backbone.socket` or the sync'ed model own socket.
 * See inline comments if you want to change it.
 * ### Server Side
 *
 *     socket.on('todos:create', function (data, fn) {
 *      ...
 *      fn(null, todo);
 *     });
 *     socket.on('todos:read', ... );
 *     socket.on('todos:update', ... );
 *     socket.on('todos:delete', ... );
 *
 * @name sync
 */
var socketSync = function (method, model, options) {
  var params = _.extend({}, options)

  if (params.url) {
    params.url = _.result(params, 'url');
  } else {
    params.url = _.result(model, 'url') || urlError();
  }

  var cmd = params.url.split('/')
    , namespace = (cmd[0] !== '') ? cmd[0] : cmd[1]; // if leading slash, ignore

  if ( !params.data && model ) {
    params.data = params.attrs || model.toJSON(options) || {};
  }

  if (params.patch === true && params.data.id == null && model) {
    params.data.id = model.id;
  }

  // If your socket.io connection exists on a different var, change here:
  var io = model.socket || Backbone.socket || window.socket

  //since Backbone version 1.0.0 all events are raised in methods 'fetch', 'save', 'remove' etc

  var defer = $.Deferred();
  io.emit(namespace + ':' + method, params.data, function (err, data) {
    if (err) {
      if(options.error) options.error(err);
      defer.reject();
    } else {
      if(options.success) options.success(data);
      defer.resolve();
    }
  });
  var promise = defer.promise();
  model.trigger('request', model, promise, options);
  return promise;
};

var getSyncMethod = function(model) {
  if (_.result(model, 'ajaxSync')) {
    return ajaxSync;
  }

  return socketSync;
};

// Override 'Backbone.sync' to default to socketSync,
// the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
Backbone.sync = function(method, model, options) {
  return getSyncMethod(model).apply(this, [method, model, options]);
};

// Throw an error when a URL is needed, and none is supplied.
// Copy from backbone.js#1558
var urlError = function() {
  throw new Error('A "url" property or function must be specified');
};
  return Backbone;
}));
