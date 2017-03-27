System.register([], function(exports_1) {
    var clickhouse, mergeVariants, i, nspec;
    return {
        setters:[],
        execute: function() {
            clickhouse = {
                Aggregations: [
                    { type: 'count' },
                    { type: 'avg' },
                    { type: 'sum' },
                    { type: 'uniq' },
                    { type: 'uniqHLL12' },
                    { type: 'uniqExact' },
                    { type: 'median' },
                    { type: 'medianTiming' },
                    { type: 'medianTDigest' },
                    {
                        type: 'quantile',
                        params: [{ name: 'p', type: 'numeric', options: ['0.9', '0.95', '0.99'] }],
                        defaultParams: ['0.9'],
                        renderer: 'parametricFunctionRenderer'
                    },
                    {
                        type: 'quantileTiming',
                        params: [{ name: 'p', type: 'numeric', options: ['0.9', '0.95', '0.99'] }],
                        defaultParams: ['0.9'],
                        renderer: 'parametricFunctionRenderer'
                    },
                    {
                        type: 'quantileTDigest',
                        params: [{ name: 'p', type: 'numeric', options: ['0.9', '0.95', '0.99'] }],
                        defaultParams: ['0.9'],
                        renderer: 'parametricFunctionRenderer'
                    },
                    // Conditional variants
                    {
                        type: 'countIf',
                        params: [{ name: 'cond', type: 'numeric', dynamicLookup: true }],
                        defaultParams: ['1'],
                    },
                    {
                        type: 'sumIf',
                        params: [{ name: 'cond', type: 'numeric', dynamicLookup: true }],
                        defaultParams: ['1'],
                    },
                    {
                        type: 'avgIf',
                        params: [{ name: 'cond', type: 'numeric', dynamicLookup: true }],
                        defaultParams: ['1'],
                    },
                    {
                        type: 'uniqIf',
                        params: [{ name: 'cond', type: 'numeric', dynamicLookup: true }],
                        defaultParams: ['1'],
                    },
                    {
                        type: 'uniqExactIf',
                        params: [{ name: 'cond', type: 'numeric', dynamicLookup: true }],
                        defaultParams: ['1'],
                    },
                    {
                        type: 'uniqHLL12If',
                        params: [{ name: 'cond', type: 'numeric', dynamicLookup: true }],
                        defaultParams: ['1'],
                    },
                    {
                        type: 'medianIf',
                        params: [{ name: 'cond', type: 'numeric', dynamicLookup: true }],
                        defaultParams: ['1'],
                    },
                    {
                        type: 'medianTimingIf',
                        params: [{ name: 'cond', type: 'numeric', dynamicLookup: true }],
                        defaultParams: ['1'],
                    },
                    {
                        type: 'medianTDigestIf',
                        params: [{ name: 'cond', type: 'numeric', dynamicLookup: true }],
                        defaultParams: ['1'],
                    },
                    {
                        type: 'quantileIf',
                        params: [
                            { name: 'cond', type: 'numeric', dynamicLookup: true },
                            { name: 'p', type: 'numeric', options: ['0.9', '0.95', '0.99'] }
                        ],
                        defaultParams: ['0.9', '1'],
                        renderer: 'parametricFunctionRenderer'
                    },
                    {
                        type: 'quantileTimingIf',
                        params: [
                            { name: 'cond', type: 'numeric', dynamicLookup: true },
                            { name: 'p', type: 'numeric', options: ['0.9', '0.95', '0.99'] }
                        ],
                        defaultParams: ['0.9', '1'],
                        renderer: 'parametricFunctionRenderer'
                    },
                    {
                        type: 'quantileTDigestIf',
                        params: [
                            { name: 'cond', type: 'numeric', dynamicLookup: true },
                            { name: 'p', type: 'numeric', options: ['0.9', '0.95', '0.99'] }
                        ],
                        defaultParams: ['0.9', '1'],
                        renderer: 'parametricFunctionRenderer'
                    }
                ],
                Transform: [
                    // Conditional functions
                    {
                        type: 'if',
                        params: [
                            { name: 'cond', dynamicLookup: true },
                            { name: 'then', dynamicLookup: true },
                            { name: 'else', dynamicLookup: true }
                        ],
                        defaultParams: ['1', '\'then\'', '\'else\''],
                    },
                ],
                // Other functions
                Transform_Other: [
                    { type: 'hostName' },
                    { type: 'visibleWidth', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toTypeName', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'blockSize' },
                    { type: 'currentDatabase' },
                    { type: 'isFinite', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'isInfinite', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'isNaN', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'hasColumnInTable', params: [{ name: 'db' }, { name: 'table' }, { name: 'column', dynamicLookup: true }] },
                    { type: 'transform', params: [{ name: 'x', dynamicLookup: true }, { name: 'from' }, { name: 'to' }, { name: 'default' }] },
                    { type: 'formatReadableSize', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'least', params: [{ name: 'x', dynamicLookup: true }, { name: 'y', dynamicLookup: true }] },
                    { type: 'greatest', params: [{ name: 'x', dynamicLookup: true }, { name: 'y', dynamicLookup: true }] },
                    { type: 'uptime' },
                    { type: 'version' },
                    { type: 'rowNumberInAllBlocks' },
                    { type: 'runningDifference', params: [{ name: 'x', dynamicLookup: true }] },
                ],
                // Bit functions
                Transform_Bit: [
                    { type: 'abs', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'bitAnd', params: [{ name: 'x', dynamicLookup: true }, { name: 'y', dynamicLookup: true }] },
                    { type: 'bitOr', params: [{ name: 'x', dynamicLookup: true }, { name: 'y', dynamicLookup: true }] },
                    { type: 'bitXor', params: [{ name: 'x', dynamicLookup: true }, { name: 'y', dynamicLookup: true }] },
                    { type: 'bitNot', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'bitShiftLeft', params: [{ name: 'x', dynamicLookup: true }, { name: 'y', dynamicLookup: true }] },
                    { type: 'bitShiftRight', params: [{ name: 'x', dynamicLookup: true }, { name: 'y', dynamicLookup: true }] },
                ],
                // Type conversion functions
                Transform_Casting: [
                    { type: 'toDate', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toDateTime', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toString', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toFixedString', params: [{ name: 'x', dynamicLookup: true }, { name: 'N', type: 'numeric' }] },
                    { type: 'toStringCutToZero', params: [{ name: 'x', dynamicLookup: true }] },
                ],
                // Functions for working with dates and times
                Transform_DateTime: [
                    { type: 'toYear', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toMonth', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toDayOfMonth', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toDayOfWeek', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toHour', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toMinute', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toSecond', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toStartOfDay', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toMonday', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toStartOfMonth', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toStartOfQuarter', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toStartOfYear', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toStartOfMinute', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toStartOfFiveMinute', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toStartOfHour', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toTime', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toRelativeYearNum', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toRelativeMonthNum', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toRelativeWeekNum', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toRelativeDayNum', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toRelativeHourNum', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toRelativeMinuteNum', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'toRelativeSecondNum', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'now' },
                    { type: 'today' },
                    { type: 'yesterday' },
                ],
                // Functions for working with strings
                Transform_String: [
                    { type: 'empty', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'notEmpty', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'length', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'lengthUTF8', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'lower', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'upper', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'lowerUTF8', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'upperUTF8', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'reverse', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'reverseUTF8', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'concat', params: [{ name: 'x', dynamicLookup: true }, { name: 'y', dynamicLookup: true }] },
                    { type: 'substring', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }, { name: 'z' }] },
                    { type: 'substringUTF8', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }, { name: 'z' }] },
                    { type: 'appendTrailingCharIfAbsent', params: [{ name: 'x', dynamicLookup: true }, { name: 'y', dynamicLookup: true }] },
                    { type: 'convertCharset', params: [{ name: 'x', dynamicLookup: true }, { name: 'y', dynamicLookup: true }, { name: 'z', dynamicLookup: true }] },
                    { type: 'position', params: [{ name: 'x', dynamicLookup: true }, { name: 'y', dynamicLookup: true }] },
                    { type: 'positionUTF8', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }] },
                    { type: 'match', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }] },
                    { type: 'extract', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }] },
                    { type: 'extractAll', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }] },
                    // Functions for searching and replacing in strings
                    { type: 'replaceOne', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }, { name: 'z' }] },
                    { type: 'replaceAll', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }, { name: 'z' }] },
                    { type: 'replaceRegexpOne', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }, { name: 'z' }] },
                    { type: 'replaceRegexpAll', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }, { name: 'z' }] },
                ],
                // Functions for working with arrays
                Transform_Array: [
                    { type: 'empty', params: [{ name: 'arr', dynamicLookup: true }] },
                    { type: 'notEmpty', params: [{ name: 'arr', dynamicLookup: true }] },
                    { type: 'length', params: [{ name: 'arr', dynamicLookup: true }] },
                    { type: 'emptyArrayUInt8', params: [{ name: 'arr', dynamicLookup: true }] },
                    { type: 'emptyArrayInt8', params: [{ name: 'arr', dynamicLookup: true }] },
                    { type: 'emptyArrayFloat32', params: [{ name: 'arr', dynamicLookup: true }] },
                    { type: 'emptyArrayDate', params: [{ name: 'arr', dynamicLookup: true }] },
                    { type: 'emptyArrayString', params: [{ name: 'arr', dynamicLookup: true }] },
                    { type: 'emptyArrayToSingle', params: [{ name: 'arr', dynamicLookup: true }] },
                    { type: 'range', params: [{ name: 'arr' }] },
                    { type: 'array', params: [{ name: 'arr' }] },
                    { type: 'arrayElement', params: [{ name: 'arr', dynamicLookup: true }, { name: 'y' }] },
                    { type: 'has', params: [{ name: 'arr', dynamicLookup: true }, { name: 'y' }] },
                    { type: 'indexOf', params: [{ name: 'arr', dynamicLookup: true }, { name: 'y' }] },
                    { type: 'countEqual', params: [{ name: 'arr', dynamicLookup: true }, { name: 'y' }] },
                    { type: 'arrayEnumerate', params: [{ name: 'arr' }] },
                    { type: 'arrayEnumerateUniq', params: [{ name: 'arr' }] },
                    { type: 'arrayUniq', params: [{ name: 'arr' }] },
                    { type: 'arrayJoin', params: [{ name: 'arr' }] },
                    // Higher-order functions
                    { type: 'arrayMap', params: [{ name: 'arr' }, { name: 'y', dynamicLookup: true }] },
                    { type: 'arrayFilter', params: [{ name: 'arr' }, { name: 'y', dynamicLookup: true }] },
                    { type: 'arrayCount', params: [{ name: 'arr', dynamicLookup: true }] },
                    { type: 'arrayExists', params: [{ name: 'arr', dynamicLookup: true }] },
                    { type: 'arrayAll', params: [{ name: 'arr', dynamicLookup: true }] },
                    { type: 'arraySum', params: [{ name: 'arr', dynamicLookup: true }] },
                    { type: 'arrayFirst', params: [{ name: 'arr' }, { name: 'y', dynamicLookup: true }] },
                    { type: 'arrayFirstIndex', params: [{ name: 'arr' }, { name: 'y', dynamicLookup: true }] },
                    // Functions for splitting and merging strings and arrays
                    { type: 'splitByChar', params: [{ name: 'arr', dynamicLookup: true }, { name: 'y' }] },
                    { type: 'splitByString', params: [{ name: 'arr', dynamicLookup: true }, { name: 'y' }] },
                    { type: 'arrayStringConcat', params: [{ name: 'arr', dynamicLookup: true }] },
                    { type: 'alphaTokens', params: [{ name: 'arr', dynamicLookup: true }] },
                ],
                // Functions for working with URLs
                Transform_URL: [
                    { type: 'protocol', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'domain', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'domainWithoutWWW', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'topLevelDomain', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'firstSignificantSubdomain', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'cutToFirstSignificantSubdomain', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'path', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'pathFull', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'queryString', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'fragment', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'queryStringAndFragment', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'extractURLParameter', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }] },
                    { type: 'extractURLParameters', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'extractURLParameterNames', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'URLHierarchy', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'URLPathHierarchy', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'decodeURLComponent', params: [{ name: 'x', dynamicLookup: true }] },
                    // Functions that remove part of a URL.
                    { type: 'cutWWW', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'cutQueryString', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'cutFragment', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'cutQueryStringAndFragment', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'cutURLParameter', params: [{ name: 'x', dynamicLookup: true }] },
                ],
                // Functions for working with IP addresses
                Transform_IPAddress: [
                    { type: 'IPv4NumToString', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'IPv4StringToNum', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'IPv4NumToStringClassC', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'IPv6NumToString', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'IPv6StringToNum', params: [{ name: 'x', dynamicLookup: true }] },
                ],
                // Functions for generating pseudo-random numbers
                Transform_Rand: [
                    { type: 'rand', params: [] },
                    { type: 'rand64', params: [] },
                ],
                // Hash functions
                Transform_Hash: [
                    { type: 'halfMD5', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'MD5', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'sipHash64', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'sipHash128', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'cityHash64', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'intHash32', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'intHash64', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'SHA1', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'SHA224', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'SHA256', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'URLHash', params: [{ name: 'x', dynamicLookup: true }] },
                ],
                // Encoding functions
                Transform_Encoding: [
                    { type: 'hex', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'unhex', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'UUIDStringToNum', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'UUIDNumToString', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'bitmaskToList', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'bitmaskToArray', params: [{ name: 'x', dynamicLookup: true }] },
                ],
                // Rounding functions
                Transform_Math: [
                    { type: 'floor', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }] },
                    { type: 'ceil', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }] },
                    { type: 'round', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }] },
                    { type: 'roundToExp2', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'roundDuration', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'roundAge', params: [{ name: 'x', dynamicLookup: true }] },
                    // Mathematical functions
                    { type: 'e', params: [] },
                    { type: 'pi', params: [] },
                    { type: 'exp', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'log', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'exp2', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'log2', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'exp10', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'log10', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'sqrt', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'cbrt', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'erf', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'erfc', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'lgamma', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'tgamma', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'sin', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'cos', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'tan', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'asin', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'acos', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'atan', params: [{ name: 'x', dynamicLookup: true }] },
                    { type: 'pow', params: [{ name: 'x', dynamicLookup: true }, { name: 'y' }] },
                ],
                // Functions for working with external dictionaries
                Transform_Dictionary: [
                    { type: 'dictGetUInt8', params: [{ name: 'dict' }, { name: 'attr' }, { name: 'key', dynamicLookup: true }] },
                    { type: 'dictGetUInt16', params: [{ name: 'dict' }, { name: 'attr' }, { name: 'key', dynamicLookup: true }] },
                    { type: 'dictGetUInt32', params: [{ name: 'dict' }, { name: 'attr' }, { name: 'key', dynamicLookup: true }] },
                    { type: 'dictGetUInt64', params: [{ name: 'dict' }, { name: 'attr' }, { name: 'key', dynamicLookup: true }] },
                    { type: 'dictGetInt8', params: [{ name: 'dict' }, { name: 'attr' }, { name: 'key', dynamicLookup: true }] },
                    { type: 'dictGetInt16', params: [{ name: 'dict' }, { name: 'attr' }, { name: 'key', dynamicLookup: true }] },
                    { type: 'dictGetInt32', params: [{ name: 'dict' }, { name: 'attr' }, { name: 'key', dynamicLookup: true }] },
                    { type: 'dictGetInt64', params: [{ name: 'dict' }, { name: 'attr' }, { name: 'key', dynamicLookup: true }] },
                    { type: 'dictGetFloat32', params: [{ name: 'dict' }, { name: 'attr' }, { name: 'key', dynamicLookup: true }] },
                    { type: 'dictGetFloat64', params: [{ name: 'dict' }, { name: 'attr' }, { name: 'key', dynamicLookup: true }] },
                    { type: 'dictGetDate', params: [{ name: 'dict' }, { name: 'attr' }, { name: 'key', dynamicLookup: true }] },
                    { type: 'dictGetDateTime', params: [{ name: 'dict' }, { name: 'attr' }, { name: 'key', dynamicLookup: true }] },
                    { type: 'dictGetString', params: [{ name: 'dict' }, { name: 'attr' }, { name: 'key', dynamicLookup: true }] },
                    { type: 'dictIsIn', params: [{ name: 'dict' }, { name: 'attr' }, { name: 'key', dynamicLookup: true }] },
                    { type: 'dictGetHierarchy', params: [{ name: 'dict' }, { name: 'key', dynamicLookup: true }] }
                ]
            };
            // Add Merge variants of aggregators
            mergeVariants = [];
            for (i in clickhouse.Aggregations) {
                nspec = Object.assign({}, clickhouse.Aggregations[i]);
                nspec.type += 'Merge';
                mergeVariants.push(nspec);
            }
            clickhouse.Aggregations.push.apply(clickhouse.Aggregations, mergeVariants);
            exports_1("default",{
                clickhouse: clickhouse
            });
        }
    }
});
//# sourceMappingURL=query_part_funcs.js.map