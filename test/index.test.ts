import axios, { AxiosError } from "axios";
import retryPromise from "../src";

describe("Retry promise", () => {
    it("should not retry resolved promise", async () => {
        await expect(
            retryPromise(
                () => new Promise((resolve, reject) => resolve(true)),
                {
                    maxTries: 3,
                    delay: 0,
                }
            )
        ).resolves.toEqual(true);
    });

    it("should retry according to shouldRetry", async () => {
        const promiseBuilder = jest.fn(
            () => new Promise<boolean>((resolve, reject) => reject(null))
        );

        await expect(
            retryPromise(promiseBuilder, {
                maxTries: 3,
                delay: 0,
                shouldRetry: () => false,
            })
        ).rejects.toEqual(null);
        expect(promiseBuilder).toHaveBeenCalledTimes(1);

        promiseBuilder.mockClear();
        await expect(
            retryPromise(promiseBuilder, {
                maxTries: 3,
                delay: 0,
                shouldRetry: () => true,
            })
        ).rejects.toEqual(null);
        expect(promiseBuilder).toHaveBeenCalledTimes(3);
    });

    it("should try N times before rejecting", async () => {
        const promiseBuilder = jest.fn(
            () => new Promise<boolean>((resolve, reject) => reject(null))
        );

        await expect(
            retryPromise(promiseBuilder, {
                maxTries: 3,
                delay: 0,
            })
        ).rejects.toEqual(null);
        expect(promiseBuilder).toHaveBeenCalledTimes(3);
    });

    it("should try only 2 times if resolved", async () => {
        const promiseBuilder = jest.fn(
            (currentRetryId?: number) =>
                new Promise<boolean>((resolve, reject) => {
                    if (currentRetryId === 2) {
                        resolve(true);
                    }
                    reject(null);
                })
        );

        await expect(
            retryPromise(promiseBuilder, {
                maxTries: 3,
                delay: 0,
            })
        ).resolves.toEqual(true);
        expect(promiseBuilder).toHaveBeenCalledTimes(2);
    });

    it("Should retry on response 500", async () => {
        const promiseBuilder = jest.fn(() =>
            axios.get("https://httpbin.org/status/500")
        );

        await expect(
            retryPromise<unknown, AxiosError>(promiseBuilder, {
                maxTries: 3,
                delay: 0,
                shouldRetry: (err) =>
                    err.response ? err.response.status === 500 : true,
            })
        ).rejects.toHaveProperty("response.status", 500);
        expect(promiseBuilder).toHaveBeenCalledTimes(3);
    });
});
