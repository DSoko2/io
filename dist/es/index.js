function deepEqual(a, b) {
    if (typeof a === "object" && typeof b === "object") {
        const aKeys = Object.keys(a);
        for (const key of aKeys) {
            if (!deepEqual(a[key], b[key])) {
                return false;
            }
        }
        return true;
    }
    else if (typeof a === "function" && typeof b === "function") {
        return true;
    }
    else {
        return a === b;
    }
}
export class IO {
    static of(a) {
        return new PureIO(a);
    }
    of(a) {
        return new PureIO(a);
    }
    map(f) {
        return new FlatMapIO(this, (a) => IO.of(f(a)));
    }
    chain(f) {
        return new FlatMapIO(this, f);
    }
    flatMap(f) {
        return new FlatMapIO(this, f);
    }
}
class PureIO extends IO {
    constructor(a) {
        super();
        this.a = a;
    }
    run() {
        return Promise.resolve(this.a);
    }
    test(_mocks, idx) {
        return [{ value: this.a }, idx];
    }
}
class FlatMapIO extends IO {
    constructor(io, f) {
        super();
        this.io = io;
        this.f = f;
    }
    run() {
        return this.io.run().then((a) => this.f(a).run());
    }
    test(mocks, idx) {
        const [value, newIdx] = this.io.test(mocks, idx);
        if ("value" in value) {
            return this.f(value.value).test(mocks, newIdx);
        }
        else {
            return [value, newIdx];
        }
    }
}
export function map(f, io) {
    return new FlatMapIO(io, (a) => IO.of(f(a)));
}
class CallPromiseIO extends IO {
    constructor(f, args) {
        super();
        this.f = f;
        this.args = args;
    }
    run() {
        return this.f(...this.args);
    }
    test(mocks, idx) {
        if (idx >= mocks.length)
            throw new Error(`Only ${mocks.length} mocks provided, at least ${idx + 1} required`);
        if (!deepEqual(this, mocks[idx][0]))
            throw new Error(`Value invalid, expected ${mocks[idx][0]} but saw ${this}`);
        return [{ value: mocks[idx][1] }, idx + 1];
    }
}
// in the IO monad
export function withEffects(f) {
    return (...args) => new CallPromiseIO((...a) => Promise.resolve(f(...a)), args);
}
export function withEffectsP(f) {
    return (...args) => new CallPromiseIO(f, args);
}
export function call(f, ...args) {
    return new CallPromiseIO((...a) => Promise.resolve(f(...a)), args);
}
export function callP(f, ...args) {
    return new CallPromiseIO(f, args);
}
class ThrowErrorIO extends IO {
    constructor(error) {
        super();
        this.error = error;
    }
    run() {
        return Promise.reject(this.error);
    }
    test(_mocks, idx) {
        return [{ error: this.error }, idx];
    }
}
export function throwE(error) {
    return new ThrowErrorIO(error);
}
class CatchErrorIO extends IO {
    constructor(io, errorHandler) {
        super();
        this.io = io;
        this.errorHandler = errorHandler;
    }
    run() {
        return this.io.run().catch((err) => this.errorHandler(err).run());
    }
    test(mocks, idx) {
        const [value, nextIdx] = this.io.test(mocks, idx);
        if ("value" in value) {
            return [value, nextIdx];
        }
        else {
            return this.errorHandler(value.error).test(mocks, nextIdx);
        }
    }
}
export function catchE(errorHandler, io) {
    return new CatchErrorIO(io, errorHandler);
}
export function runIO(e) {
    return e.run();
}
export function testIO(io, mocks, expectedResult) {
    const [value, idx] = io.test(mocks, 0);
    if (idx < mocks.length)
        throw new Error(`Only ${idx} mocks used, but ${mocks.length} provided`);
    if ("error" in value)
        throw new Error(value.error);
    else if (!deepEqual(value.value, expectedResult))
        throw new Error(`Value invalid, expected ${expectedResult} but saw ${value.value}`);
}
