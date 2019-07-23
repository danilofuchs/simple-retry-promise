# Simple Retry Promise

Retry rejected promises until it resolves, for a maximum of N tries.
**No** exponential backoff

## Installation

```bash
$    npm i simple-retry-promise
# or
$    yarn add simple-retry-promise
```

## Example
```typescript
import retryPromise from "simple-retry-promise";

retryPromise(
    () => new Promise((resolve, reject) => resolve(true)),
    {
        maxTries: 3,                // mandatory
        delay: 0,                   // defaults to 3000 ms
        shouldRetry: (err) => true, // defaults to `() => true`
    }
)
```

## Typescript

`retryPromise` can be used with two type parameters. The first (`T`) is the expected return type of the Promise. `E` is the type of Error you will receive in `shouldRetry`.

```typescript

retryPromise<boolean, Error>(
    () => new Promise<boolean>((resolve, reject) => resolve(true)),
    {
        maxTries: 3,
        delay: 0,
        shouldRetry: (err: Error) => err.code === 'ETIMEDOUT'
    }
)
```

### Example with axios

`simple-retry-promise` works perfectly with [axios](https://github.com/axios/axios).

The following snippet retries the request everytime the endpoint returns status 500, for a maximum of 3 times, with a delay of 200ms between an error and the next request.

```typescript
import axios, { AxiosResponse, AxiosError }  from "axios";
import retryPromise from "simple-retry-promise";

async function fetchWithRetry() {
    const response = await retryPromise<
            AxiosResponse<unknown>,
            AxiosError
        >(
            () => axios.get("https://httpbin.org/status/500"),
            {
                maxRetries: 3,
                delay: 200,
                shouldRetry: (err) => // err is of type `AxiosError`
                    err.response ? err.response.status === 500 : true,
        }
    );

    // `response` will be of type `AxiosResponse<unknown>`
    // `response.data` will be of type `unknown`

    return response.data;
}

```