# pieru

[![github][github-image]][github-url]
[![coveralls][coveralls-image]][coveralls-url]

[github-image]: https://github.com/RauliL/pieru/actions/workflows/test.yml/badge.svg
[github-url]: https://github.com/RauliL/pieru/actions/workflows/test.yml
[coveralls-image]: https://coveralls.io/repos/github/RauliL/pieru/badge.svg
[coveralls-url]: https://coveralls.io/github/RauliL/pieru

MongoDB query compatible object match.

## Installation

```bash
$ npm install pieru
```

## Usage

```Javascript
import { createQuery } from 'pieru';

const match = createQuery({
    name: {$exists: true},
    qty: {$gt: 3},
    $and: [
        { price: { $lt: 100 } },
        { price: { $gt: 50 } },
    ],
});

match({ name: 'example', qty: 10, price: 65.10 });    // -> true
match({ name: 'bla', qty: 10, price: 30.10 });        // -> false
```

Please check out the [query selector] section in the MongoDB documentation.

[query selector]: http://docs.mongodb.org/manual/reference/operators/#query-selectors

### Supported operators

- All comparison operators
- All logical operators
- All element operators except $type
- All JavaScript operators
- All array operators

The following operators are currently not supported:

- All geospatial operators
- $type operator

The $where operator is supported but disabled by default (security).

```Javascript
const match = createQuery(query, { $where: true });
```
