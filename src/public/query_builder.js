define([
  'lodash'
],
function (_) {
  'use strict';

  function SqlQueryBuilder(target, dbms) {
    this.target = target;
    this.dbms = dbms;
  }

  function renderTagCondition (tag, index) {
    var str = "";
    var operator = tag.operator;
    var value = tag.value;
    if (index > 0) {
      str = (tag.condition || 'AND') + ' ';
    }

    // quote value unless regex or number
    if (isNaN(+value)) {
      value = "'" + value + "'";
    }

    return str + '"' + tag.key + '" ' + operator + ' ' + value;
  }

  var p = SqlQueryBuilder.prototype;

  p.build = function() {
    return this.target.rawQuery ? this._modifyRawQuery() : this._buildQuery();
  };

  p.buildExploreQuery = function(type, withKey) {
    var query;
    var table;

    var templates = {
      base: {
        defaults: {
          colType: 'concat(column_name, \' : \', data_type)',
          numericTypes: "'numeric', 'decimal', 'bigint', 'integer', " +
                        "'double', 'double precision', 'float'",
          exceptSchemaArr: "'information_schema', 'pg_catalog'"
        },
        SCHEMA: 'SELECT schema_name FROM information_schema.schemata ORDER BY schema_name',
        TABLES: 'SELECT column_name FROM information_schema.tables ' +
                'WHERE table_schema = \'${schema}\'' +
                'ORDER BY table_name',
        FIELDS: 'SELECT ${colType} FROM information_schema.columns ' +
                'WHERE table_schema = \'${schema}\' AND table_name = \'${table}\' ' +
                'ORDER BY ordinal_position',
        TAG_KEYS: 'SELECT column_name FROM information_schema.columns ' +
                  'WHERE table_schema = \'${schema}\' AND table_name = \'${table}\' ' +
                  'ORDER BY ordinal_position',
        TAG_VALUES: 'SELECT distinct(${key}) FROM "${schema}"."${table}" ORDER BY ${key}',
        SET_DEFAULT: 'SELECT table_schema, table_name, ${colType} FROM information_schema.columns ' +
                     'WHERE table_schema NOT IN (${exceptSchemaArr}) ' +
                     'ORDER BY (data_type LIKE \'timestamp%\') desc, ' +
                       '(data_type = \'datetime\') desc, ' +
                       'table_schema, table_name, ' +
                       '(data_type IN (${numericTypes})) desc, ordinal_position LIMIT 1'
      },

      postgres: {
        defaults: {colType: 'column_name || \' : \' || data_type'}
      },

      clickhouse: {
        defaults: {schema: 'default', colType: 'name || \' : \' || type', table: '%', schema: '%'},
        SCHEMA: 'SELECT name FROM system.databases ORDER BY name',
        TABLES: 'SELECT distinct(name) FROM system.tables WHERE database LIKE \'${schema}\' ORDER BY name',
        FIELDS: 'SELECT ${colType} as col FROM system.columns ' +
                'WHERE database LIKE \'${schema}\' AND table LIKE \'${table}\' ORDER BY col',
        TAG_KEYS: 'SELECT distinct(name) FROM system.columns ' +
                  'WHERE database LIKE \'${schema}\' AND table LIKE \'${table}\' ORDER BY name',
        TAG_VALUES: 'SELECT 1',
        SET_DEFAULT: 'SELECT 1'
      }
    }

    /* Specialisations of base template */
    templates.postgres = _.merge({}, templates.base, templates.postgres);

    var template = templates[this.dbms];
    if (!template) {
      template = templates.base;
    }

    var vars = _.defaults(this.target, template.defaults);
    vars.key = withKey;
    switch (type) {
    case 'TAG_KEYS':
    case 'TAG_VALUES':
    case 'TABLES':
    case 'FIELDS':
    case 'SCHEMA':
    case 'SET_DEFAULT':
      return _.template(template[type])(vars);
    default:
      break;
    }

    if (table) {
      if (!table.match('^/.*/') && !table.match(/^merge\(.*\)/)) {
        table = '"' + table+ '"';
      }
      query += ' FROM ' + table;
    }

    if (this.target.filters && this.target.filters.length > 0) {
      var whereConditions = _.reduce(this.target.filters, function(memo, tag) {
        // do not add a condition for the key we want to explore for
        if (tag.key === withKey) {
          return memo;
        }
        memo.push(renderTagCondition(tag, memo.length));
        return memo;
      }, []);

      if (whereConditions.length > 0) {
        query +=  ' WHERE ' + whereConditions.join(' ');
      }
    }

    return query;
  };

  return SqlQueryBuilder;
});
