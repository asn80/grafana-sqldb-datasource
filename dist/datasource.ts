///<reference path="app/headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';

import * as dateMath from 'app/core/utils/datemath';
import SqlSeries from './sql_series';
import SqlQuery from './sql_query';
import ResponseParser from './response_parser';
import SqlQueryBuilder from './query_builder';
import queryPart from './query_part';

export default class SqlDatasource {
  type: string;
  username: string;
  password: string;
  name: string;
  database: any;
  interval: any;
  supportAnnotations: boolean;
  supportMetrics: boolean;
  responseParser: any;
  url: string;
  dbms: string;
  queryBuilder: any;

  /** @ngInject */
  constructor(instanceSettings, private $q, private backendSrv, private templateSrv) {
    this.type = 'sqldb';

    this.username = instanceSettings.username;
    this.password = instanceSettings.password;
    this.name = instanceSettings.name;
    this.database = instanceSettings.database;
    this.interval = (instanceSettings.jsonData || {}).timeInterval;
    this.supportAnnotations = true;
    this.supportMetrics = true;
    this.responseParser = new ResponseParser();
    this.url = instanceSettings.url;
    this.dbms = (instanceSettings.jsonData || {}).dbms;
    this.queryBuilder = new SqlQueryBuilder(
      {dbms: this.dbms}, this.dbms, { matchOperators: queryPart.getMatchOperators(this.dbms) }
    );
  }

  getTagKeys() {
    var timeColQuery = this.queryBuilder.buildExploreQuery('TAG_KEYS');
    return this.metricFindQuery(timeColQuery)
  }
  
  getTagValues(options) {
    var timeColQuery = this.queryBuilder.buildExploreQuery('TAG_VALUES');
    return this.metricFindQuery(timeColQuery)
  }

  query(options) {
    var queryTargets = [];
    var i, y;

    var allQueries = _.map(options.targets, (target) => {
      /* ClickHouse has implicit date on most of the table engines,
       * infer the Date data type if it isn't defined (raw queries). */
      var timeColType = target.timeColDataType;
      if (this.dbms === 'clickhouse') {
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

      if (target.hide) { return []; }
      if (timeColType === undefined) {
        return [];
      }

      /* Support Ad-Hoc filters */
      var filters = this.templateSrv.getAdhocFilters(this.name);
      target.filters = _.union(filters, target.tags);

      queryTargets.push(target);
      var arr = timeColType.split(':');
      target.timeCol = arr[0].trim();
      target.timeDataType = arr[1].trim().toLowerCase();

      var queryModel = new SqlQuery(target, this.templateSrv, options.scopedVars);
      queryModel.dbms = this.dbms;
      var query =  queryModel.render(true);
      query = this._replaceQueryVars(query, options, target);

      return query;

    }).join(";");

    if (!allQueries) {
        return { data: [] };
    }
    allQueries = this.templateSrv.replace(allQueries, options.scopedVars);

    return this._seriesQuery(allQueries).then((data): any => {
      if (!data || !data.results || queryTargets.length === 0) {
        return { data: [] };
      }

      var seriesList = [];
      _.each(data.results, (result, i) => {
        if (!result || !result.series) { return; }

        _.each(result.series, (series, j) => {
          var target = queryTargets[j];

          var alias = target.alias;
          if (alias) {
            alias = this.templateSrv.replace(target.alias, options.scopedVars);
          }

          var sqlSeries = new SqlSeries({
            series:  series,
            table:   target.table,
            alias:   alias,
            groupBy: target.groupBy
          });

          switch (target.resultFormat) {
          case 'table':
            if (j > 0) { return; }
            seriesList = seriesList.concat(sqlSeries.getTable());
            break;

          case 'docs':
            if (j > 0) { return; }
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

  annotationQuery(options) {
    var timeDataType = options.annotation.timeDataType;

    if (!options.annotation.query || options.annotation.query === '') {
      var castTimeCol = '';
      if (this._abstractDataType(timeDataType) === 'timestamp') {
        castTimeCol = this._ts2Num('$timeColumn', timeDataType);
      } else {
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

    return this._seriesQuery(query).then(data => {
      if (!data || !data.results || !data.results[0]) {
        throw { message: 'No results in response from SqlDB' };
      }
      return new SqlSeries({series: data.results[0].series, annotation: options.annotation}).getAnnotations();
    });
  };

  metricFindQuery(query) {
    var interpolated;
    try {
      interpolated = this.templateSrv.replace(query, null, 'regex');
    } catch (err) {
      return this.$q.reject(err);
    }

    return this._seriesQuery(interpolated)
      .then(_.curry(this.responseParser.parse)(query));
  };

  _seriesQuery(query) {
    if (this.dbms == 'clickhouse') {
      return this._sqlRequest('GET', '/', {query: query + ' FORMAT JSON'}).then(data => {
        /* Reparse CH response from columnar to row based format. */
        var series = _.map(data.data, row => {
          var r = [];
          for (var i in row) {
            r.push(row[i]);
          }
          return r;
        });
        var columns = _.map(data.meta, row => {
          return row.name;
        });
        data.results = [{series: [{values: series, columns: columns}]}];
        return data;
      },
      error => {
        var message = error.message || '';
        var match = /DB::Exception: (.+), e\.what/.exec(error.data.response);
        if (match) {
          message = match[1];
        }
        throw _.merge({}, error, {message: message, data: {error: error.data.response}});
      });
    }
    return this._sqlRequest('POST', '/query', {query: query, epoch: 'ms'});
  }


  serializeParams(params) {
    if (!params) { return '';}

    return _.reduce(params, (memo, value, key) => {
      if (value === null || value === undefined) { return memo; }
      memo.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
      return memo;
    }, []).join("&");
  }

  testDatasource() {
    return this.metricFindQuery('SELECT 1 AS num').then(
      (result) => {
        return { status: "success", message: "Data source is working", title: "Success" };
      },
      (error) => {
        var errorMessage = error;
        if (errorMessage.data) {
          errorMessage = errorMessage.data.message;
        }

        if (_.isArray(errorMessage)) {
          if (errorMessage.indexOf('connection refused') !== -1) {
            errorMessage = 'Connection error: Could not connect the database';
          } else if (errorMessage.indexOf('Access denied') !== -1) {
            errorMessage = 'Authentication error: Invalid user name or password';
          }
        }

        return { status: "error", message: errorMessage, title: "Error" };
      });
  }

  _sqlRequest(method, url, data) {
    var self = this;

    var options: any = {
      method: method,
      url:    this.url + url,
      precision: "ms",
      inspect: { type: 'sqldb' },
      paramSerializer: this.serializeParams,
    };

    if (method == 'POST') {
      options.data = data;
    } else {
      options.params = data;
    }

    return this.backendSrv.datasourceRequest(options).then(result => {
      if (_.isString(result.data)) {
        throw { message: 'Not a JSON response.', data: {response: result.data} };
      }
      return result.data;
    }, function(err) {
      if (err.status !== 0 || err.status >= 300) {
        if (err.data && err.data.error) {
          throw { message: 'SqlDB Error Response: ' + err.data.error, data: err.data, config: err.config };
        } else {
          console.log(err);
          throw { message: 'SqlDB Error: ' + err.message, data: err.data, config: err.config };
        }
      }
    });
  };

  _replaceQueryVars(query, options, target) {
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
  }

  _getTimeFilter(isToNow) {
    if (isToNow) {
      return '$timeColumn >= $from';
    }
    return '$timeColumn >= $from AND $timeColumn <= $to';
  }

  _getDateFilter(isToNow) {
    if (isToNow) {
      return '$dateColumn >= $dateFrom';
    }
    return '$dateColumn >= $dateFrom AND $dateColumn <= $dateTo';
  }

  _getSubTimestamp(date, toDataType, roundUp) {
    var rtn = null;

    if (_.isString(date)) {
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

      } else {
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
      if (! isNumericDate) {
        rtn = this._ts2Num(rtn, 'timestamp with time zone');
      }
      break;
    }

    return rtn;
  }

  _getRoundUnixTime(target) {
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
        } else {
          rtn = col;
        }
        break;
      }
    }

    return rtn;
  }

  _num2Ts(str, toDataType) {
    if (str === 'now()') {
      if (this.dbms == 'clickhouse' && toDataType == 'date') {
        return 'today()';
      }
      return str;
    } else {
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
  }

  _ts2Num(str, toDataType) {
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
  }

  _getIntervalNum(str) {
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
          } else {
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

        default: // "s"
          rtn = second;
      }
    }

    return rtn;
  }

  _abstractDataType(datatype) {
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
  }

  _pgShortTs(str) {
    switch (str) {
    case 'timestamptz':
    case 'timestamp with time zone':
      return 'timestamptz';

    case 'timestamp':
    case 'timestamp without time zone':
      return 'timestamp';

    default:
      return str;
    };
  }
}
