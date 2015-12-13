'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.waitFor = waitFor;
exports.combineReducers = combineReducers;

var _redux = require('redux');

function waitFor(key, inject) {
  var reducer = function reducer(state, action) {
    var thunk = function thunk(combinedState) {
      if (typeof combinedState[key] !== 'undefined' && typeof combinedState[key] !== 'function') {
        var nextState = inject(combinedState[key])(state, action);
        return typeof nextState === 'function' ? nextState(combinedState) : nextState;
      } else {
        return thunk;
      }
    };
    return thunk;
  };
  return reducer;
}

function combineReducers(reducers) {
  var combination = (0, _redux.combineReducers)(reducers);
  var digest = function digest(state) {
    var nextStateAddition = {};
    var digested = false;
    var needsFurtherDigest = false;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.keys(state)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        if (typeof state[key] === 'function') {
          var next = nextStateAddition[key] = state[key](state);
          if (next !== state[key]) digested = true;
          if (typeof next === 'function') needsFurtherDigest = true;
        }
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

    if (digested) {
      var digestedState = Object.assign({}, state, nextStateAddition);
      return needsFurtherDigest ? digest(digestedState) : digestedState;
    } else if (needsFurtherDigest) {
      throw new Error('Unable to digest! Missing dependency?');
    } else {
      return state;
    }
  };
  return function (state, action) {
    return digest(combination(state, action));
  };
}

