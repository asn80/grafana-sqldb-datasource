///<reference path="app/headers/common.d.ts" />
System.register(['lodash', 'app/core/utils/datemath', './sql_series', './sql_query', './response_parser', './query_builder', './query_part'], function(exports_1) {
    var lodash_1, dateMath, sql_series_1, sql_query_1, response_parser_1, query_builder_1, query_part_1;
    var SqlDatasource;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (dateMath_1) {
                dateMath = dateMath_1;
            },
            function (sql_series_1_1) {
                sql_series_1 = sql_series_1_1;
            },
            function (sql_query_1_1) {
                sql_query_1 = sql_query_1_1;
            },
            function (response_parser_1_1) {
                response_parser_1 = response_parser_1_1;
            },
            function (query_builder_1_1) {
                query_builder_1 = query_builder_1_1;
            },
            function (query_part_1_1) {
                query_part_1 = query_part_1_1;
            }],
        execute: function() {
            SqlDatasource = (function () {
                /** @ngInject */
                function SqlDatasource(instanceSettings, $q, backendSrv, templateSrv) {
                    this.$q = $q;
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                    this.type = 'sqldb';
                    this.username = instanceSettings.username;
                    this.password = instanceSettings.password;
                    this.name = instanceSettings.name;
                    this.database = instanceSettings.database;
                    this.interval = (instanceSettings.jsonData || {}).timeInterval;
                    this.supportAnnotations = true;
                    this.supportMetrics = true;
                    this.responseParser = new response_parser_1.default();
                    this.url = instanceSettings.url;
                    this.dbms = (instanceSettings.jsonData || {}).dbms;
                    this.queryBuilder = new query_builder_1.default({ dbms: this.dbms }, this.dbms, { matchOperators: query_part_1.default.getMatchOperators(this.dbms) });
                }
                SqlDatasource.prototype.getTagKeys = function () {
                    var timeColQuery = this.queryBuilder.buildExploreQuery('TAG_KEYS');
                    return this.metricFindQuery(timeColQuery);
                };
                SqlDatasource.prototype.getTagValues = function (options) {
                    var timeColQuery = this.queryBuilder.buildExploreQuery('TAG_VALUES');
                    return this.metricFindQuery(timeColQuery);
                };
                SqlDatasource.prototype.query = function (options) {
                    var _this = this;
                    var queryTargets = [];
                    var i, y;
                    var allQueries = lodash_1.default.map(options.targets, function (target) {
                        /* ClickHouse has implicit date on most of the table engines,
                         * infer the Date data type if it isn't defined (raw queries). */
                        var timeColType = target.timeColDataType;
                        if (_this.dbms === 'clickhouse') {
                            var dateCol = target.dateColDataType || 'date : Date';
                            var arr = dateCol.split(':');
                            if (arr.length > 0) {
                                target.dateCol = arr[0].trim();
                                target.dateDataType = arr[1].trim().toLowerCase();
                            }
                            if (timeColType === undefined) {
                                timeColType = '* : DateTime';
                            }
                        }
                        if (target.hide) {
                            return [];
                        }
                        if (timeColType === undefined) {
                            return [];
                        }
                        /* Support Ad-Hoc filters */
                        var filters = _this.templateSrv.getAdhocFilters(_this.name);
                        target.filters = lodash_1.default.union(filters, target.tags);
                        queryTargets.push(target);
                        var arr = timeColType.split(':');
                        target.timeCol = arr[0].trim();
                        target.timeDataType = arr[1].trim().toLowerCase();
                        var queryModel = new sql_query_1.default(target, _this.templateSrv, options.scopedVars);
                        queryModel.dbms = _this.dbms;
                        var query = queryModel.render(true);
                        query = _this._replaceQueryVars(query, options, target);
                        return query;
                    }).join(";");
                    if (!allQueries) {
                        return { data: [] };
                    }
                    allQueries = this.templateSrv.replace(allQueries, options.scopedVars);
                    return this._seriesQuery(allQueries).then(function (data) {
                        if (!data || !data.results || queryTargets.length === 0) {
                            return { data: [] };
                        }
                        var seriesList = [];
                        lodash_1.default.each(data.results, function (result, i) {
                            if (!result || !result.series) {
                                return;
                            }
                            lodash_1.default.each(result.series, function (series, j) {
                                var target = queryTargets[j];
                                var alias = target.alias;
                                if (alias) {
                                    alias = _this.templateSrv.replace(target.alias, options.scopedVars);
                                }
                                var sqlSeries = new sql_series_1.default({
                                    series: series,
                                    table: target.table,
                                    alias: alias,
                                    groupBy: target.groupBy
                                });
                                switch (target.resultFormat) {
                                    case 'table':
                                        if (j > 0) {
                                            return;
                                        }
                                        seriesList = seriesList.concat(sqlSeries.getTable());
                                        break;
                                    case 'docs':
                                        if (j > 0) {
                                            return;
                                        }
                                        seriesList = seriesList.concat(sqlSeries.getDocs());
                                        break;
                                    default:
                                        seriesList = seriesList.concat(sqlSeries.getTimeSeries());
                                        break;
                                }
                            });
                        });
                        return { data: seriesList };
                    });
                };
                ;
                SqlDatasource.prototype.annotationQuery = function (options) {
                    var timeDataType = options.annotation.timeDataType;
                    if (!options.annotation.query || options.annotation.query === '') {
                        var castTimeCol = '';
                        if (this._abstractDataType(timeDataType) === 'timestamp') {
                            castTimeCol = this._ts2Num('$timeColumn', timeDataType);
                        }
                        else {
                            castTimeCol = '$timeColumn';
                        }
                        castTimeCol += ' * 1000';
                        options.annotation.query =
                            'SELECT ' +
                                castTimeCol + ' AS time, ' +
                                (options.annotation.tags || 'NULL') + ' AS tags, ' +
                                (options.annotation.title || 'NULL') + ' AS title, ' +
                                (options.annotation.text || 'NULL') + ' AS text ' +
                                'FROM ' + options.annotation.schema + '.' + options.annotation.table + ' ' +
                                'WHERE $timeFilter';
                    }
                    var query = options.annotation.query;
                    query = this._replaceQueryVars(query, options, options.annotation);
                    query = this.templateSrv.replace(query, null, 'regex');
                    return this._seriesQuery(query).then(function (data) {
                        if (!data || !data.results || !data.results[0]) {
                            throw { message: 'No results in response from SqlDB' };
                        }
                        return new sql_series_1.default({ series: data.results[0].series, annotation: options.annotation }).getAnnotations();
                    });
                };
                ;
                SqlDatasource.prototype.metricFindQuery = function (query) {
                    var interpolated;
                    try {
                        interpolated = this.templateSrv.replace(query, null, 'regex');
                    }
                    catch (err) {
                        return this.$q.reject(err);
                    }
                    return this._seriesQuery(interpolated)
                        .then(lodash_1.default.curry(this.responseParser.parse)(query));
                };
                ;
                SqlDatasource.prototype._seriesQuery = function (query) {
                    if (this.dbms == 'clickhouse') {
                        return this._sqlRequest('GET', '/', { query: query + ' FORMAT JSON' }).then(function (data) {
                            /* Reparse CH response from columnar to row based format. */
                            var series = lodash_1.default.map(data.data, function (row) {
                                var r = [];
                                for (var i in row) {
                                    r.push(row[i]);
                                }
                                return r;
                            });
                            var columns = lodash_1.default.map(data.meta, function (row) {
                                return row.name;
                            });
                            data.results = [{ series: [{ values: series, columns: columns }] }];
                            return data;
                        }, function (error) {
                            var message = error.message || '';
                            var match = /DB::Exception: (.+), e\.what/.exec(error.data.response);
                            if (match) {
                                message = match[1];
                            }
                            throw lodash_1.default.merge({}, error, { message: message, data: { error: error.data.response } });
                        });
                    }
                    return this._sqlRequest('POST', '/query', { query: query, epoch: 'ms' });
                };
                SqlDatasource.prototype.serializeParams = function (params) {
                    if (!params) {
                        return '';
                    }
                    return lodash_1.default.reduce(params, function (memo, value, key) {
                        if (value === null || value === undefined) {
                            return memo;
                        }
                        memo.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
                        return memo;
                    }, []).join("&");
                };
                SqlDatasource.prototype.testDatasource = function () {
                    return this.metricFindQuery('SELECT 1 AS num').then(function (result) {
                        return { status: "success", message: "Data source is working", title: "Success" };
                    }, function (error) {
                        var errorMessage = error;
                        if (errorMessage.data) {
                            errorMessage = errorMessage.data.message;
                        }
                        if (lodash_1.default.isArray(errorMessage)) {
                            if (errorMessage.indexOf('connection refused') !== -1) {
                                errorMessage = 'Connection error: Could not connect the database';
                            }
                            else if (errorMessage.indexOf('Access denied') !== -1) {
                                errorMessage = 'Authentication error: Invalid user name or password';
                            }
                        }
                        return { status: "error", message: errorMessage, title: "Error" };
                    });
                };
                SqlDatasource.prototype._sqlRequest = function (method, url, data) {
                    var self = this;
                    var options = {
                        method: method,
                        url: this.url + url,
                        precision: "ms",
                        inspect: { type: 'sqldb' },
                        paramSerializer: this.serializeParams,
                    };
                    if (method == 'POST') {
                        options.data = data;
                    }
                    else {
                        options.params = data;
                    }
                    return this.backendSrv.datasourceRequest(options).then(function (result) {
                        if (lodash_1.default.isString(result.data)) {
                            throw { message: 'Not a JSON response.', data: { response: result.data } };
                        }
                        return result.data;
                    }, function (err) {
                        if (err.status !== 0 || err.status >= 300) {
                            if (err.data && err.data.error) {
                                throw { message: 'SqlDB Error Response: ' + err.data.error, data: err.data, config: err.config };
                            }
                            else {
                                console.log(err);
                                throw { message: 'SqlDB Error: ' + err.message, data: err.data, config: err.config };
                            }
                        }
                    });
                };
                ;
                SqlDatasource.prototype._replaceQueryVars = function (query, options, target) {
                    var from = this._getSubTimestamp(options.rangeRaw.from, target.timeDataType, false);
                    var to = this._getSubTimestamp(options.rangeRaw.to, target.timeDataType, true);
                    var isToNow = (options.rangeRaw.to === 'now');
                    var timeFilter = this._getTimeFilter(isToNow);
                    if (target.dateCol) {
                        timeFilter += ' AND ' + this._getDateFilter(isToNow);
                    }
                    query = query.replace(/\$timeFilter/g, timeFilter);
                    query = query.replace(/\$from/g, from);
                    query = query.replace(/\$to/g, to);
                    from = this._getSubTimestamp(options.rangeRaw.from, target.dateDataType || 'date', false);
                    to = this._getSubTimestamp(options.rangeRaw.to, target.dateDataType || 'date', true);
                    query = query.replace(/\$dateFrom/g, from);
                    query = query.replace(/\$dateTo/g, to);
                    from = this._getSubTimestamp(options.rangeRaw.from, 'numeric', false);
                    to = this._getSubTimestamp(options.rangeRaw.to, 'numeric', true);
                    query = query.replace(/\$unixFrom/g, from);
                    query = query.replace(/\$unixTo/g, to);
                    from = this._getSubTimestamp(options.rangeRaw.from, 'timestamp with time zone', false);
                    to = this._getSubTimestamp(options.rangeRaw.to, 'timestamp with time zone', true);
                    query = query.replace(/\$timeFrom/g, from);
                    query = query.replace(/\$timeTo/g, to);
                    var unixtimeColumn = this._getRoundUnixTime(target);
                    query = query.replace(/\$unixtimeColumn/g, unixtimeColumn);
                    query = query.replace(/\$timeColumn/g, target.timeCol);
                    query = query.replace(/\$dateColumn/g, target.dateCol);
                    var autoIntervalNum = this._getIntervalNum(target.interval || options.interval);
                    query = query.replace(/\$interval/g, autoIntervalNum);
                    return query;
                };
                SqlDatasource.prototype._getTimeFilter = function (isToNow) {
                    if (isToNow) {
                        return '$timeColumn >= $from';
                    }
                    return '$timeColumn >= $from AND $timeColumn <= $to';
                };
                SqlDatasource.prototype._getDateFilter = function (isToNow) {
                    if (isToNow) {
                        return '$dateColumn >= $dateFrom';
                    }
                    return '$dateColumn >= $dateFrom AND $dateColumn <= $dateTo';
                };
                SqlDatasource.prototype._getSubTimestamp = function (date, toDataType, roundUp) {
                    var rtn = null;
                    if (lodash_1.default.isString(date)) {
                        if (date === 'now') {
                            switch (this._abstractDataType(toDataType)) {
                                case 'timestamp':
                                    return this._num2Ts('now()', toDataType);
                                case 'numeric':
                                    return this._ts2Num('now()', 'timestamp with time zone');
                            }
                        }
                        var parts = /^now-(\d+)([d|h|m|s])$/.exec(date);
                        if (parts) {
                            var amount = parseInt(parts[1]);
                            var unit = parts[2];
                            switch (this.dbms) {
                                case 'postgres':
                                    rtn = '(now() - \'' + amount + unit + '\'::interval)';
                                    break;
                                case "mysql":
                                    var units = {
                                        'd': 'DAY',
                                        'h': 'HOUR',
                                        'm': 'MINUTE',
                                        's': 'SECOND',
                                        'w': 'WEEK',
                                    };
                                    rtn = 'DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL ' + amount + ' ' + units[unit] + ')';
                                    break;
                                case 'clickhouse':
                                    var units = {
                                        'w': '7 * 24 * 3600',
                                        'd': '24 * 3600',
                                        'h': '3600',
                                        'm': '60',
                                        's': '1',
                                    };
                                    rtn = '(now()-' + amount + '*' + units[unit] + ')';
                                    /* The types for Date and DateTime are different, must cast. */
                                    if (toDataType == 'date') {
                                        rtn = 'toDate' + rtn;
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                        else {
                            date = dateMath.parse(date, roundUp);
                        }
                    }
                    var isNumericDate = false;
                    if (rtn == null) {
                        rtn = (date.valueOf() / 1000).toFixed(0);
                        isNumericDate = true;
                    }
                    switch (this._abstractDataType(toDataType)) {
                        case 'timestamp':
                            if (isNumericDate) {
                                rtn = this._num2Ts(rtn, toDataType);
                            }
                            break;
                        case 'numeric':
                            if (!isNumericDate) {
                                rtn = this._ts2Num(rtn, 'timestamp with time zone');
                            }
                            break;
                    }
                    return rtn;
                };
                SqlDatasource.prototype._getRoundUnixTime = function (target) {
                    var col = '$timeColumn';
                    if (this._abstractDataType(target.timeDataType) === 'timestamp') {
                        col = this._ts2Num(col, 'timestamp with time zone');
                    }
                    var rtn = col;
                    if (target.groupBy && target.groupBy.length > 0) {
                        var interval = this._getIntervalNum(target.groupBy[0].params[0]);
                        switch (this.dbms) {
                            case "postgres":
                                rtn = 'round(' + col + ' / ' + interval + ') * ' + interval;
                                break;
                            case "mysql":
                                rtn = '(' + col + ' DIV ' + interval + ') * ' + interval;
                                break;
                            case 'clickhouse':
                                if (interval > 1) {
                                    rtn = 'intDiv(toUInt32(' + col + '), ' + interval + ') * ' + interval;
                                }
                                else {
                                    rtn = col;
                                }
                                break;
                        }
                    }
                    return rtn;
                };
                SqlDatasource.prototype._num2Ts = function (str, toDataType) {
                    if (str === 'now()') {
                        if (this.dbms == 'clickhouse' && toDataType == 'date') {
                            return 'today()';
                        }
                        return str;
                    }
                    else {
                        switch (this.dbms) {
                            case 'postgres':
                                return 'to_timestamp(' + str + ')';
                            case 'mysql':
                                return 'FROM_UNIXTIME(' + str + ')';
                            case 'clickhouse':
                                if (toDataType == 'date') {
                                    return 'toDate(toDateTime(' + str + '))';
                                }
                                return 'toDateTime(' + str + ')';
                            default:
                                return str;
                        }
                    }
                };
                SqlDatasource.prototype._ts2Num = function (str, toDataType) {
                    switch (this.dbms) {
                        case 'postgres':
                            return 'extract(epoch from ' + str + '::' + this._pgShortTs(toDataType) + ')';
                        case 'mysql':
                            return 'UNIX_TIMESTAMP(' + str + ')';
                        case 'clickhouse':
                            return 'toUnixTimestamp(' + str + ')';
                        default:
                            return str;
                    }
                };
                SqlDatasource.prototype._getIntervalNum = function (str) {
                    var rtn = str;
                    if (str === 'auto') {
                        return '$interval';
                    }
                    var parts = /^(\d+)([a-z]*)$/.exec(str);
                    if (parts) {
                        var second = parseInt(parts[1]);
                        var unit = parts[2];
                        // cast to seconds
                        switch (unit) {
                            case 'ms':
                                if (this.dbms !== 'clickhouse') {
                                    rtn = second / 1000;
                                }
                                else {
                                    rtn = second;
                                }
                                break;
                            case 'm':
                                rtn = second * 60;
                                break;
                            case 'h':
                                rtn = second * 60 * 60;
                                break;
                            case 'd':
                                rtn = second * 60 * 60 * 24;
                                break;
                            case 'w':
                                rtn = second * 60 * 60 * 24 * 7;
                                break;
                            default:
                                rtn = second;
                        }
                    }
                    return rtn;
                };
                SqlDatasource.prototype._abstractDataType = function (datatype) {
                    switch (datatype) {
                        case 'timestamp with time zone':
                        case 'timestamp without time zone':
                        case 'timestamp':
                        case 'timestamptz':
                        case 'datetime':
                        case 'date':
                            return 'timestamp';
                        case 'numeric':
                        case 'decimal':
                        case 'bigint':
                        case 'integer':
                        case 'real':
                        case 'float':
                        case 'double':
                        case 'double precision':
                        case 'uint64':
                        case 'uint32':
                        case 'uint16':
                        case 'uint8':
                        case 'int64':
                        case 'int32':
                        case 'int16':
                        case 'int8':
                        case 'float64':
                        case 'float32':
                            return 'numeric';
                        default:
                            return datatype;
                    }
                };
                SqlDatasource.prototype._pgShortTs = function (str) {
                    switch (str) {
                        case 'timestamptz':
                        case 'timestamp with time zone':
                            return 'timestamptz';
                        case 'timestamp':
                        case 'timestamp without time zone':
                            return 'timestamp';
                        default:
                            return str;
                    }
                    ;
                };
                return SqlDatasource;
            })();
            exports_1("default", SqlDatasource);
        }
    }
});
//# sourceMappingURL=datasource.js.map