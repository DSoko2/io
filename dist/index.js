"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
function deepEqual(a, b) {
    if (typeof a === "object" && typeof b === "object") {
        var aKeys = Object.keys(a);
        for (var _i = 0, aKeys_1 = aKeys; _i < aKeys_1.length; _i++) {
            var key = aKeys_1[_i];
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
var IO = /** @class */ (function () {
    function IO() {
    }
    IO.of = function (a) {
        return new PureIO(a);
    };
    IO.prototype.of = function (a) {
        return new PureIO(a);
    };
    IO.prototype.map = function (f) {
        return new FlatMapIO(this, function (a) { return IO.of(f(a)); });
    };
    IO.prototype.chain = function (f) {
        return new FlatMapIO(this, f);
    };
    IO.prototype.flatMap = function (f) {
        return new FlatMapIO(this, f);
    };
    return IO;
}());
exports.IO = IO;
var PureIO = /** @class */ (function (_super) {
    __extends(PureIO, _super);
    function PureIO(a) {
        var _this = _super.call(this) || this;
        _this.a = a;
        return _this;
    }
    PureIO.prototype.run = function () {
        return Promise.resolve(this.a);
    };
    PureIO.prototype.test = function (_mocks, idx) {
        return [{ value: this.a }, idx];
    };
    return PureIO;
}(IO));
var FlatMapIO = /** @class */ (function (_super) {
    __extends(FlatMapIO, _super);
    function FlatMapIO(io, f) {
        var _this = _super.call(this) || this;
        _this.io = io;
        _this.f = f;
        return _this;
    }
    FlatMapIO.prototype.run = function () {
        var _this = this;
        return this.io.run().then(function (a) { return _this.f(a).run(); });
    };
    FlatMapIO.prototype.test = function (mocks, idx) {
        var _a = this.io.test(mocks, idx), value = _a[0], newIdx = _a[1];
        if ("value" in value) {
            return this.f(value.value).test(mocks, newIdx);
        }
        else {
            return [value, newIdx];
        }
    };
    return FlatMapIO;
}(IO));
function map(f, io) {
    return new FlatMapIO(io, function (a) { return IO.of(f(a)); });
}
exports.map = map;
var CallPromiseIO = /** @class */ (function (_super) {
    __extends(CallPromiseIO, _super);
    function CallPromiseIO(f, args) {
        var _this = _super.call(this) || this;
        _this.f = f;
        _this.args = args;
        return _this;
    }
    CallPromiseIO.prototype.run = function () {
        return this.f.apply(this, this.args);
    };
    CallPromiseIO.prototype.test = function (mocks, idx) {
        if (idx >= mocks.length)
            throw new Error("Only " + mocks.length + " mocks provided, at least " + (idx + 1) + " required");
        if (!deepEqual(this, mocks[idx][0]))
            throw new Error("Value invalid, expected " + mocks[idx][0] + " but saw " + this);
        return [{ value: mocks[idx][1] }, idx + 1];
    };
    return CallPromiseIO;
}(IO));
// in the IO monad
function withEffects(f) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return new CallPromiseIO(function () {
            var a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                a[_i] = arguments[_i];
            }
            return Promise.resolve(f.apply(void 0, a));
        }, args);
    };
}
exports.withEffects = withEffects;
function withEffectsP(f) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return new CallPromiseIO(f, args);
    };
}
exports.withEffectsP = withEffectsP;
function call(f) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return new CallPromiseIO(function () {
        var a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            a[_i] = arguments[_i];
        }
        return Promise.resolve(f.apply(void 0, a));
    }, args);
}
exports.call = call;
function callP(f) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return new CallPromiseIO(f, args);
}
exports.callP = callP;
var ThrowErrorIO = /** @class */ (function (_super) {
    __extends(ThrowErrorIO, _super);
    function ThrowErrorIO(error) {
        var _this = _super.call(this) || this;
        _this.error = error;
        return _this;
    }
    ThrowErrorIO.prototype.run = function () {
        return Promise.reject(this.error);
    };
    ThrowErrorIO.prototype.test = function (_mocks, idx) {
        return [{ error: this.error }, idx];
    };
    return ThrowErrorIO;
}(IO));
function throwE(error) {
    return new ThrowErrorIO(error);
}
exports.throwE = throwE;
var CatchErrorIO = /** @class */ (function (_super) {
    __extends(CatchErrorIO, _super);
    function CatchErrorIO(io, errorHandler) {
        var _this = _super.call(this) || this;
        _this.io = io;
        _this.errorHandler = errorHandler;
        return _this;
    }
    CatchErrorIO.prototype.run = function () {
        var _this = this;
        return this.io.run().catch(function (err) { return _this.errorHandler(err).run(); });
    };
    CatchErrorIO.prototype.test = function (mocks, idx) {
        var _a = this.io.test(mocks, idx), value = _a[0], nextIdx = _a[1];
        if ("value" in value) {
            return [value, nextIdx];
        }
        else {
            return this.errorHandler(value.error).test(mocks, nextIdx);
        }
    };
    return CatchErrorIO;
}(IO));
function catchE(errorHandler, io) {
    return new CatchErrorIO(io, errorHandler);
}
exports.catchE = catchE;
function runIO(e) {
    return e.run();
}
exports.runIO = runIO;
function testIO(io, mocks, expectedResult) {
    var _a = io.test(mocks, 0), value = _a[0], idx = _a[1];
    if (idx < mocks.length)
        throw new Error("Only " + idx + " mocks used, but " + mocks.length + " provided");
    if ("error" in value)
        throw new Error(value.error);
    else if (!deepEqual(value.value, expectedResult))
        throw new Error("Value invalid, expected " + expectedResult + " but saw " + value.value);
}
exports.testIO = testIO;
