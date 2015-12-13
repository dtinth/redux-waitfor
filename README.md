
redux-waitfor
=============

Reducer combinator that allows reducers to wait upon each other.


Warning
-------

__You might not need to use this.__
See this discussion: [waitFor leads to wrong design](https://github.com/facebook/flux/issues/209).
Also see this discussion about [reducers depending upon each other on Redux](https://gist.github.com/gaearon/d77ca812015c0356654f#gistcomment-1466314).

In the motivation section, I’ve explained an alternative without using `waitFor`,
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

I came up with two choices to architect this:

1. Put `transcript`, `interpretation`, and `stagedDatabaseEntry` into the store.
   This is the first, most obvious idea that comes into my mind.
   If I use Flux, I’d do it this way and it’d be perfectly fine.
   _“This is clearly the way,”_ I said to myself.

   But this means we need mechanisms to set up dependencies between these reducers,
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
   the documentation for this `redux-waitfor` package.

   Think of this approach as using a (non-materialized) view of the database.
   In fact, this may be a better option.
   The data in the store is normalized, which means no dependencies or need to synchronize.
   No magic `waitFor` tricks, which leads to simpler code.


Usage
-----

If you insist on using this thing, first, you need to import it:

```js
import { waitFor, combineReducers } from 'redux-waitfor'
```

### waitFor(key, inject)

This is a function that takes a reducer, and returns a reducer that waits for
data from another part of the store with the specified `key`.

```js
const interpretationReducer = waitFor('transcript', transcript =>
  (state = { }, action) => deriveInterpretationFromTranscript(transcript)
)
```

But wait! How can a reducer wait for more data? That seems impossible.
Let’s try invoking this magical reducer.

```
> interpretationReducer(void 0, action)
[Function]
```

A function (a thunk) is returned instead of the new state!
This signifies that we need more data from other parts of the store.
We then pass the state from other parts of the store into that thunk:

```
> interpretationReducer(void 0, action)({
    transcript: '40 Bath food'
  })
{ amount: 40, category: 'Food' }
```

Now we have the actual, new state.

What really happens is that when we invoke that thunk, it will inject
the state of the thing it’s waiting for into the `inject` function
(specified as a parameter to `waitFor`).
That `inject` function then takes it and returns a reducer,
which is then immediately invoked.


### combineReducers(reducers)

This is Redux’s `combineReducers`, but works with thunks.

__How it works:__ Perhaps the easiest way to explain it is by examples.
Here is our current state:

```js
{ transcript: '',
  interpretation: null,
  stagedDatabaseEntry: null }
```

An action happened. It is dispatched to each reducer, just like Redux’s `combineReducers`.

Now, some reducer returned the new state, and some returned a thunk:

```js
{ transcript: '40 Baht food',
  interpretation: [Function],
  stagedDatabaseEntry: [Function] }
```

We then enter the __digest cycle__. We send the above state into each thunk.

Since `transcript` is available, the thunk injects it and invokes the reducer.
Meanwhile, the `interpretation` is not yet available during that digest cycle.
In this case, the thunk returns itself.

This is the resulting state:

```js
{ transcript: '40 Baht food',
  interpretation: { amount: 40, category: 'food' },
  stagedDatabaseEntry: [Function] }
```

This means we need another digest cycle.
We did the same, and obtain the final state:

```js
{ transcript: '40 Baht food',
  interpretation: { amount: 40, category: 'food' },
  stagedDatabaseEntry: { /* ... */ } }
```

For more example and tests, see [example.js](example.js) (which also serves as a unit test — it’s pretty comprehensive!).

As you can see, this is quite advanced and requires lots of explanation.
Perhaps you can take this advice from The Zen of Python instead:

> __If the implementation is hard to explain, it's a bad idea.__<br />
> If the implementation is easy to explain, it may be a good idea.

So, unless you really need to, don’t use this library!
