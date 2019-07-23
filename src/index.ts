interface RetryPromiseOptions<E> {
    /** Number of tries before throwing */
    maxTries: number;
    /** Given an Error within the retry attempt range,
     *  you need to return a boolean if the promise
     *  should be retried (defaults to always true) */
    shouldRetry?: (error: E) => boolean;
    /** Delay between retries after each error,
     *  in ms (defaults to 3000ms) */
    delay?: number;
}

/**
 * Retries the promise until it is successful or N times, throwing an error
 * @param promise The promise to retry
 * @param options Configurations for retry attempts. `options.maxTries` is required
 * @template T The type of return of Promise<T>
 * @template E The type of error the promise can throw
 */
const retryPromise = async <T, E extends Error>(
    promiseBuilder: (currentRetryId?: number) => Promise<T>,
    options: RetryPromiseOptions<E>
) => {
    const defaultOptions = {
        shouldRetry: () => true,
        delay: 3000,
    };
    const { maxTries, shouldRetry, delay } = {
        ...defaultOptions,
        ...options,
    };

    return retry(promiseBuilder, maxTries, { shouldRetry, delay });
};

interface RetryOptions<E> {
    shouldRetry: (error: E) => boolean;
    delay: number;
}
const retry = async <T, E extends Error>(
    promiseBuilder: (currentRetryId?: number) => Promise<T>,
    currentTry: number,
    options: RetryOptions<E>
) => {
    const { shouldRetry, delay } = options;

    return new Promise<T>((resolve, reject) => {
        promiseBuilder(currentTry)
            .then(resolve)
            .catch((err: E) => {
                if (currentTry === 1) {
                    reject(err);
                }
                if (currentTry > 1 && shouldRetry(err)) {
                    setTimeout(() => {
                        retry(promiseBuilder, currentTry - 1, options)
                            .then(resolve)
                            .catch(reject);
                    }, delay);
                } else {
                    reject(err);
                }
            });
    });
};

export default retryPromise;
