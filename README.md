
redux-waitfor
=============

Reducer combinator that allows reducers to wait upon each other.


Warning
-------

__You might not need to use this.__
See this discussion: [waitFor leads to wrong design](https://github.com/facebook/flux/issues/209).

In the motivation section, I’ve explained the alternative without using `waitFor`,
but since I’ve alread spent time creating, testing, and documenting this thing,
I’ll put it online anyway.


Motivation
----------

When building a Redux app, there are some cases that a reducer does not only
depend on the `state` and `action`, but also depend on the state returned by
another reducer.

For instance, I am building an expense tracking application using speech
recognition. Therefore, there are these events:

- `SpeechRecognitionInitialize` (fired when tapping the mic)
- `SpeechRecognitionStart` (fired when the app is ready to listen)
- `SpeechRecognitionResult` (fired as you speak)
- `SpeechRecognitionEnd` (fired when speech recognition ended)

My `transcript` reducer consumes these series of events (actions) and produces
the transcript of what I just said (e.g. “40 Baht food”).

From the `transcript`, I need to derive an `interpretation` from the spoken text
(e.g. `{ amount: 40, category: "food" }`).

From the `interpretation`, I need to derive an expense entry which will be saved
into the database.
However, before I save it to the database, I want to be able to edit it before I save.

There are two choices in architecturing this:

1. Put `transcript`, `interpretation`, and `stagedDatabaseEntry` into the store.
   This is the first idea that comes into my mind.
   “Surely I should do it this way,” I said to myself.

   But this means we need to set up dependencies between these reducers,
   so that when speech is recognized, the `interpretation` reducer has access
   to the latest `transcript`, and `stagedDatabaseEntry` has access to the
   latest `interpretation`.

   This is where `redux-waitfor` comes into play.

   Think of this approach as using materialized views.
   Also consider the next option, as this option might not be the most appropriate one.

2. Only put `transcript` in the store, and use [reselect](https://github.com/rackt/reselect)
   to derive both `interpretation` and `stagedDatabaseEntry`.

   For the last requirement that I want to modify the `stagedDatabaseEntry` before
   actually saving it to the database, I’ll just store the `stagedDatabaseOverrides`
   instead and derive the actual entry on-the-fly.

   This solution is less obvious to me, and I only came up with it as I write
   the documentation of this `redux-waitfor` package.

   Think of this approach as using a (non-materialized) view of the database.
   In fact, this may be a better option!


Usage
-----

If you insist on using this thing, first, you need to import it:

```js
import { combineReducers } from 'redux-waitfor'
```

### combineReducers(reducers)

Upgraded `combineReducers` that — in addition to giving the state and action — also gives your reducer a magical object which can be used to obtain the state of neighboring reducers.

```js
const interpretationReducer = (state = { }, action, magicalObject) => (
  deriveInterpretationFromTranscript(magicalObject.transcript)
)
```

Using ES6 destructuring, this becomes:

```js
const interpretationReducer = (state = { }, action, { transcript }) => (
  deriveInterpretationFromTranscript(transcript)
)
```
