declare type TestValue<A> = {
    value: A;
} | {
    error: any;
};
declare type TestResult<A> = [TestValue<A>, number];
export declare abstract class IO<A> {
    abstract run(): Promise<A>;
    abstract test(mocks: [IO<any>, any][], idx: number): TestResult<A>;
    static of<A>(a: A): IO<A>;
    of<A>(a: A): IO<A>;
    map<B>(f: (a: A) => B): IO<B>;
    chain<B>(f: (a: A) => IO<B>): IO<B>;
    flatMap<B>(f: (a: A) => IO<B>): IO<B>;
}
export declare function map<A, B>(f: (a: A) => B, io: IO<A>): IO<B>;
export declare function withEffects<A, P extends any[]>(f: (...args: P) => A): (...args: P) => IO<A>;
export declare function withEffectsP<A, P extends any[]>(f: (...args: P) => Promise<A>): (...args: P) => IO<A>;
export declare function call<A, P extends any[]>(f: (...args: P) => A, ...args: P): IO<A>;
export declare function callP<A, P extends any[]>(f: (...args: P) => Promise<A>, ...args: P): IO<A>;
export declare function throwE(error: any): IO<any>;
export declare function catchE(errorHandler: (error: any) => IO<any>, io: IO<any>): IO<any>;
export declare function runIO<A>(e: IO<A>): Promise<A>;
export declare function testIO<A>(io: IO<A>, mocks: any[], expectedResult: A): void;
export {};
