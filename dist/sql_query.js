///<reference path="app/headers/common.d.ts" />
System.register(['lodash', './query_part'], function(exports_1) {
    var lodash_1, query_part_1;
    var SqlQuery;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (query_part_1_1) {
                query_part_1 = query_part_1_1;
            }],
        execute: function() {
            SqlQuery = (function () {
                /** @ngInject */
                function SqlQuery(target, templateSrv, scopedVars) {
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
                        { type: 'time', params: ['$interval'] },
                    ];
                    target.targetLists = target.targetLists || [[
                            { type: 'field', params: ['*'] },
                            { type: 'count', params: [] },
                        ]];
                    target.alias = target.alias || '$t.$col';
                    this.updateProjection();
                }
                SqlQuery.prototype.updateProjection = function () {
                    this.selectModels = lodash_1.default.map(this.target.targetLists, function (parts) {
                        return lodash_1.default.map(parts, query_part_1.default.create);
                    });
                    this.groupByParts = lodash_1.default.map(this.target.groupBy, query_part_1.default.create);
                };
                SqlQuery.prototype.updatePersistedParts = function () {
                    this.target.targetLists = lodash_1.default.map(this.selectModels, function (selectParts) {
                        return lodash_1.default.map(selectParts, function (part) {
                            return { type: part.def.type, params: part.params };
                        });
                    });
                };
                SqlQuery.prototype.hasGroupByTime = function () {
                    return lodash_1.default.find(this.target.groupBy, function (g) { return g.type === 'time'; });
                };
                SqlQuery.prototype.addGroupBy = function (type) {
                    var partModel = query_part_1.default.create({ type: type });
                    var partCount = this.target.groupBy.length;
                    if (partCount === 0) {
                        this.target.groupBy.push(partModel.part);
                    }
                    else if (type === 'time') {
                        this.target.groupBy.splice(0, 0, partModel.part);
                    }
                    else {
                        this.target.groupBy.push(partModel.part);
                    }
                    this.updateProjection();
                };
                SqlQuery.prototype.removeGroupByPart = function (part, index) {
                    var categories = query_part_1.default.getCategories();
                    if (part.def.type === 'time') {
                        // remove aggregations
                        this.target.targetLists = lodash_1.default.map(this.target.targetLists, function (s) {
                            return lodash_1.default.filter(s, function (part) {
                                var partModel = query_part_1.default.create(part);
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
                };
                SqlQuery.prototype.removeSelect = function (index) {
                    this.target.targetLists.splice(index, 1);
                    this.updateProjection();
                };
                SqlQuery.prototype.removeSelectPart = function (selectParts, part) {
                    // if we remove the field remove the whole statement
                    if (part.def.type === 'field') {
                        if (this.selectModels.length > 1) {
                            var modelsIndex = lodash_1.default.indexOf(this.selectModels, selectParts);
                            this.selectModels.splice(modelsIndex, 1);
                        }
                    }
                    else {
                        var partIndex = lodash_1.default.indexOf(selectParts, part);
                        selectParts.splice(partIndex, 1);
                    }
                    this.updatePersistedParts();
                };
                SqlQuery.prototype.addSelectPart = function (selectParts, type) {
                    var partModel = query_part_1.default.create({ type: type });
                    partModel.def.addStrategy(selectParts, partModel, this);
                    this.updatePersistedParts();
                };
                SqlQuery.prototype.renderTagCondition = function (tag, index, interpolate) {
                    var str = "";
                    var operator = tag.operator;
                    var value = tag.value;
                    if (!operator) {
                        if (/^\/.*\/$/.test(value)) {
                            operator = '=~';
                        }
                        else {
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
                    var matchOperators = query_part_1.default.getMatchOperators(this.dbms);
                    if (operator.indexOf('IN') > -1) {
                        // IN/NOT IN operators may have a tupe on the right side
                        value = value.replace(/[()]/g, '');
                        if (interpolate) {
                            value = this.templateSrv.replace(value, this.scopedVars);
                        }
                        // Check if the array is all numbers
                        var values = lodash_1.default.map(value.split(','), function (x) { return x.trim(); });
                        var intArray = lodash_1.default.reduce(values, function (memo, x) {
                            return memo && !isNaN(+x);
                        }, true);
                        // Force quotes and braces
                        for (var i in values) {
                            values[i] = values[i].replace(/\'\"/, '');
                            if (!intArray) {
                                values[i] = "'" + value.replace(/\\/g, '\\\\') + "'";
                            }
                        }
                        value = '(' + values.join(', ') + ')';
                    }
                    else if (!matchOperators || (operator !== matchOperators.match && operator !== matchOperators.not)) {
                        if (interpolate) {
                            value = this.templateSrv.replace(value, this.scopedVars);
                        }
                        if (!operator.startsWith('>') && !operator.startsWith('<') && isNaN(+value)) {
                            value = "'" + value.replace(/\\/g, '\\\\') + "'";
                        }
                    }
                    else if (interpolate) {
                        value = this.templateSrv.replace(value, this.scopedVars, 'regex');
                        value = "'" + value.replace(/^\//, '').replace(/\/$/, '') + "'";
                    }
                    else if (isNaN(+value)) {
                        value = "'" + value.replace(/^\//, '').replace(/\/$/, '') + "'";
                    }
                    if (index > 0) {
                        str = (tag.condition || 'AND') + ' ';
                    }
                    return str + tag.key + ' ' + operator + ' ' + value;
                };
                SqlQuery.prototype.gettableAndSchema = function (interpolate) {
                    var schema = this.target.schema;
                    var table = this.target.table || 'table';
                    if (!table.match('^/.*/')) {
                        table = table;
                    }
                    else if (interpolate) {
                        table = this.templateSrv.replace(table, this.scopedVars, 'regex');
                    }
                    if (schema !== 'default') {
                        schema = this.target.schema + '.';
                    }
                    else {
                        schema = "";
                    }
                    var rtn = schema + table;
                    return rtn;
                };
                SqlQuery.prototype.render = function (interpolate) {
                    var _this = this;
                    var target = this.target;
                    if (target.rawQuery) {
                        /* There is no structural information about raw query, so best
                           effort parse the GROUP BY column to be able to detect series.
                           Only grouped by expressions or their aliases are inferred. */
                        var parts = /GROUP BY (.+)\s+(?:ORDER|LIMIT|HAVING|$)/.exec(target.query);
                        if (parts) {
                            var last = parts[parts.length - 1];
                            target.groupBy = lodash_1.default.map(last.split(','), function (e, i) {
                                return { type: i > 0 ? 'field' : 'time', params: [e.trim()] };
                            });
                        }
                        if (interpolate) {
                            var q = this.templateSrv.replace(target.query, this.scopedVars, 'regex');
                            /* Support filter expansion in raw queries as well. */
                            var conditions = lodash_1.default.map(target.filters, function (tag, index) {
                                return _this.renderTagCondition(tag, index, interpolate);
                            });
                            return q.replace(/\$filter/, (conditions.length > 0 ? conditions.join(' ') : '1'));
                        }
                        else {
                            return target.query;
                        }
                    }
                    var hasTimeGroupBy = false;
                    var selectClause = [];
                    var groupByClause = [];
                    var orderByClause = '';
                    var usePositions = (this.dbms !== 'clickhouse');
                    if (target.groupBy.length !== 0) {
                        lodash_1.default.each(this.target.groupBy, function (groupBy, i) {
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
                                    selectClause.push(query_part_1.default.create(groupBy).render(part));
                                    groupByClause.pop();
                                    alias = groupBy.params[0];
                                    break;
                                default:
                                    var part = query_part_1.default.create(groupBy).render();
                                    selectClause.push(part);
                                    if (!usePositions) {
                                        alias = part;
                                    }
                                    break;
                            }
                            if (alias !== null) {
                                groupByClause.push(alias);
                            }
                            else {
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
                        var parts_1 = this.selectModels[i];
                        var selectText = "";
                        for (j = 0; j < parts_1.length; j++) {
                            var part = parts_1[j];
                            selectText = part.render(selectText);
                        }
                        if (i > 0) {
                            targetList += ', ';
                        }
                        targetList += selectText;
                    }
                    query += targetList;
                    query += ' FROM ' + this.gettableAndSchema(interpolate) + ' WHERE ';
                    var conditions = lodash_1.default.map(target.filters, function (tag, index) {
                        return _this.renderTagCondition(tag, index, interpolate);
                    });
                    query += conditions.join(' ');
                    query += (conditions.length > 0 ? ' AND ' : '') + '$timeFilter';
                    if (groupByClause.length > 0) {
                        query += ' GROUP BY ' + groupByClause.join(', ');
                    }
                    orderByClause = groupByClause.join(', ') || targetList;
                    query += ' ORDER BY ' + orderByClause;
                    return query;
                };
                return SqlQuery;
            })();
            exports_1("default", SqlQuery);
        }
    }
});
//# sourceMappingURL=sql_query.js.map