# `pfts` - Pragmatic Functional TypeScript

`pfts` is a opinionated TypeScript library heavily inspired by F#'s pragmatic and practical approach to functional programming, and by the way both it and Rust handles errors.

## Goals

`pfts`'s main goal is to make it easier to write clear, concise and correct code. The library is built to achieve this
through abstractions (`Option`, `Result`, `AsyncOption`, `AsyncResult, etc...) that helps keep your functions honest/predictable and make illegal states unrepresentable.

There also a couple of immutable collection types (`Dict` and `List`) with a much greater number of functions than the default
JavaScript `Map` and `Array` types to facilitate development. `pfts` collection uses their own method names to help distinguish them from the JavaScript types (.e.g, `list.forall()` instead of `array.every()`.

`pfts` tries to keep things idiomatic to TypeScript, with the fact that JavaScript relies heavily on objects and the dot notation kept in mind when developing the library.

## Getting started

Install `pfts` with

##### npm

```bash
npm install purify-ts
```

##### yarn

```bash
yarn add purify-ts
```

## Thanks

- [FsToolkit.ErrorHandling](https://github.com/demystifyfp/FsToolkit.ErrorHandling)
  For serving as inspiration to the public API of the library.
- [Purify](https://github.com/gigobyte/purify)
  For their `Codec` implemtation, which served as inspiration and great help when building the `Validator` type.
- [Effect-TS](https://github.com/Effect-TS/core)
  For which without I wouldn't have been able to figure out how to abuse generators.
