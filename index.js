'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.combineReducers = combineReducers;

var _redux = require('redux');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DispatchContext = (function () {
  function DispatchContext() {
    var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var action = arguments[1];
    var reducers = arguments[2];

    _classCallCheck(this, DispatchContext);

    this.state = state;
    this.action = action;
    this.reducers = reducers;
    this._result = {};
    this._lock = {};
    this._magicalObject = createMagicalObject(this);
  }

  _createClass(DispatchContext, [{
    key: 'resultOf',
    value: function resultOf(key) {
      var result = this._result[key] || (this._result[key] = this._run(key));
      return result.value;
    }
  }, {
    key: '_run',
    value: function _run(key) {
      if (this._lock[key]) {
        throw new Error('Circular dependency detected!');
      }
      this._lock[key] = true;
      try {
        return {
          value: this.reducers[key].call(null, this.state[key], this.action, this._magicalObject)
        };
      } finally {
        this._lock[key] = false;
      }
    }
  }]);

  return DispatchContext;
})();

function createMagicalObject(context) {
  var out = {};
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    var _loop = function _loop() {
      var key = _step.value;

      Object.defineProperty(out, key, {
        enumerable: true,
        get: function get() {
          return context.resultOf(key);
        }
      });
    };

    for (var _iterator = Object.keys(context.reducers)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      _loop();
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return out;
}

function createProxyOf(reducers) {
  var out = {};
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    var _loop2 = function _loop2() {
      var key = _step2.value;

      out[key] = function (state, context) {
        return context instanceof DispatchContext ? context.resultOf(key) : reducers[key](state, context, {});
      };
    };

    for (var _iterator2 = Object.keys(reducers)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      _loop2();
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return out;
}

function combineReducers(reducers) {
  var combination = (0, _redux.combineReducers)(createProxyOf(reducers));
  return function (state, action) {
    var context = new DispatchContext(state, action, reducers);
    return combination(state, context);
  };
}
