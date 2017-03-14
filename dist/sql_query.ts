///<reference path="app/headers/common.d.ts" />

import _ from 'lodash';
import queryPart from './query_part';

export default class SqlQuery {
  dbms: string;
  target: any;
  selectModels: any[];
  queryBuilder: any;
  groupByParts: any;
  templateSrv: any;
  scopedVars: any;

  /** @ngInject */
  constructor(target, templateSrv?, scopedVars?) {
    this.dbms = null;
    this.target = target;
    this.templateSrv = templateSrv;
    this.scopedVars = scopedVars;

    target.schema = target.schema;
    target.dsType = 'sqldb';
    target.timeColDataType = target.timeColDataType;
    target.resultFormat = target.resultFormat || 'time_series';
    target.tags = target.tags || [];
    target.filters = target.filters || [];
    target.groupBy = target.groupBy || [
      {type: 'time', params: ['$interval']},
    ];
    target.targetLists = target.targetLists || [[
      {type: 'field', params: ['*']},
      {type: 'count', params: []},
    ]];
    target.alias = target.alias || '$t.$col';

    this.updateProjection();
  }

  updateProjection() {
    this.selectModels = _.map(this.target.targetLists, function(parts: any) {
      return _.map(parts, queryPart.create);
    });
    this.groupByParts = _.map(this.target.groupBy, queryPart.create);
  }

  updatePersistedParts() {
    this.target.targetLists = _.map(this.selectModels, function(selectParts) {
      return _.map(selectParts, function(part: any) {
        return {type: part.def.type, params: part.params};
      });
    });
  }

  hasGroupByTime() {
    return _.find(this.target.groupBy, (g: any) => g.type === 'time');
  }

  addGroupBy(type) {
    var partModel = queryPart.create({type: type});
    var partCount = this.target.groupBy.length;

    if (partCount === 0) {
      this.target.groupBy.push(partModel.part);
    } else if (type === 'time') {
      this.target.groupBy.splice(0, 0, partModel.part);
    } else {
      this.target.groupBy.push(partModel.part);
    }

    this.updateProjection();
  }

  removeGroupByPart(part, index) {
    var categories = queryPart.getCategories();

    if (part.def.type === 'time') {
      // remove aggregations
      this.target.targetLists = _.map(this.target.targetLists, (s: any) => {
        return _.filter(s, (part: any) => {
          var partModel = queryPart.create(part);
          if (partModel.def.category === categories.Aggregations) {
            return false;
          }
          if (partModel.def.category === categories.Selectors) {
            return false;
          }
          return true;
        });
      });
    }

    this.target.groupBy.splice(index, 1);
    this.updateProjection();
  }

  removeSelect(index: number) {
    this.target.targetLists.splice(index, 1);
    this.updateProjection();
  }

  removeSelectPart(selectParts, part) {
    // if we remove the field remove the whole statement
    if (part.def.type === 'field') {
      if (this.selectModels.length > 1) {
        var modelsIndex = _.indexOf(this.selectModels, selectParts);
        this.selectModels.splice(modelsIndex, 1);
      }
    } else {
      var partIndex = _.indexOf(selectParts, part);
      selectParts.splice(partIndex, 1);
    }

    this.updatePersistedParts();
  }

  addSelectPart(selectParts, type) {
    var partModel = queryPart.create({type: type});
    partModel.def.addStrategy(selectParts, partModel, this);
    this.updatePersistedParts();
  }

  private renderTagCondition(tag, index, interpolate) {
    var str = "";
    var operator = tag.operator;
    var value = tag.value;

    if (!operator) {
      if (/^\/.*\/$/.test(value)) {
        operator = '=~';
      } else {
        operator = '=';
      }
    }

    // Support wildcard values to behave like regular filters
    if (interpolate) {
      for (var i in this.templateSrv.variables) {
        var v = this.templateSrv.variables[i];
        if (v.name == value.slice(1) && this.templateSrv.isAllValue(v.current.value)) {
          return str;
        }
      }
    }

    // quote value unless regex or number(s)
    var matchOperators = queryPart.getMatchOperators(this.dbms);
    if (operator.indexOf('IN') > -1) {
      // IN/NOT IN operators may have a tupe on the right side
      value = value.replace(/[()]/g, '');
      if (interpolate) {
        value = this.templateSrv.replace(value, this.scopedVars);
      }
      // Check if the array is all numbers
      var values = _.map(value.split(','), x => x.trim());
      var intArray = _.reduce(values, (memo, x) => {
        return memo && !isNaN(+x);
      }, true);
      // Force quotes and braces
      for (var i in values) {
        values[i] = values[i].replace(/\'\"/,'');
        if (!intArray) {
          values[i] = "'" + value.replace(/\\/g, '\\\\') + "'";
        }
      }
      value = '(' + values.join(', ') + ')';
    } else if (!matchOperators || (operator !== matchOperators.match && operator !== matchOperators.not)) {
      if (interpolate) {
        value = this.templateSrv.replace(value, this.scopedVars);
      }

      if (!operator.startsWith('>') && !operator.startsWith('<') && isNaN(+value)) {
        value = "'" + value.replace(/\\/g, '\\\\') + "'";
      }
    } else if (interpolate) {
      value = this.templateSrv.replace(value, this.scopedVars, 'regex');
      value = "'" + value.replace(/^\//, '').replace(/\/$/, '') + "'";
    } else if (isNaN(+value)) {
      value = "'" + value.replace(/^\//, '').replace(/\/$/, '') + "'";
    }

    if (index > 0) {
      str = (tag.condition || 'AND') + ' ';
    }
    return str + tag.key + ' ' + operator + ' ' + value;
  }

  gettableAndSchema(interpolate) {
    var schema = this.target.schema;
    var table = this.target.table || 'table';

    if (!table.match('^/.*/')) {
      table = table;
    } else if (interpolate) {
      table = this.templateSrv.replace(table, this.scopedVars, 'regex');
    }

    if (schema !== 'default') {
      schema = this.target.schema + '.';
    } else {
      schema = "";
    }

    var rtn = schema + table;

    return rtn;
  }

 render(interpolate?) {
    var target = this.target;

    if (target.rawQuery) {
      /* There is no structural information about raw query, so best
         effort parse the GROUP BY column to be able to detect series.
         Only grouped by expressions or their aliases are inferred. */
      var parts = /GROUP BY (.+)\s*(?:ORDER|LIMIT|HAVING|$)/.exec(target.query);
      if (parts) {
        var last = parts[parts.length - 1];
        target.groupBy = _.map(last.split(','), (e, i) => {
          return {type: i > 0 ? 'field' : 'time', params: [e.trim()]};
        });
      }
      if (interpolate) {
        var q = this.templateSrv.replace(target.query, this.scopedVars, 'regex');
        /* Support filter expansion in raw queries as well. */
        var conditions = _.map(target.filters, (tag, index) => {
          return this.renderTagCondition(tag, index, interpolate);
        });
        return q.replace(/\$filter/, (conditions.length > 0 ? conditions.join(' ') : '1'));
      } else {
        return target.query;
      }
    }

    var hasTimeGroupBy = false;
    var selectClause = [];
    var groupByClause = [];
    var orderByClause = '';
    var usePositions = (this.dbms !== 'clickhouse');

    if (target.groupBy.length !== 0) {
      _.each(this.target.groupBy, function(groupBy, i) {

        var alias = null;
        switch (groupBy.type) {
          case 'time':
            selectClause.push('$unixtimeColumn * 1000 AS time_msec');
            if (!usePositions) {
              alias = 'time_msec';
            }
            break;

          case 'alias':
            var part = selectClause.pop();
            selectClause.push(queryPart.create(groupBy).render(part));
            groupByClause.pop();
            alias = groupBy.params[0];
            break;

          default:
            var part = queryPart.create(groupBy).render();
            selectClause.push(part);
            if (!usePositions) {
              alias = part;
            }
            break;
        }

        if (alias !== null) {
          groupByClause.push(alias);
        } else {
          groupByClause.push((i + 1).toFixed(0));
        }
      });
    }

    var query = 'SELECT ';
    if (selectClause.length > 0) {
      query += selectClause.join(', ') + ', ';
    }

    var i, j;
    var targetList = '';
    for (i = 0; i < this.selectModels.length; i++) {
      let parts = this.selectModels[i];
      var selectText = "";
      for (j = 0; j < parts.length; j++) {
        let part = parts[j];
        selectText = part.render(selectText);
      }

      if (i > 0) {
        targetList += ', ';
      }
      targetList += selectText;
    }
    query += targetList;

    query += ' FROM ' + this.gettableAndSchema(interpolate) + ' WHERE ';
    var conditions = _.map(target.filters, (tag, index) => {
      return this.renderTagCondition(tag, index, interpolate);
    });

    query += conditions.join(' ');
    query += (conditions.length > 0 ? ' AND ' : '') + '$timeFilter';

    if (groupByClause.length > 0) {
      query += ' GROUP BY ' + groupByClause.join(', ');
    }

    orderByClause = groupByClause.join(', ') || targetList;
    query += ' ORDER BY ' + orderByClause;

    return query;
  }
}
