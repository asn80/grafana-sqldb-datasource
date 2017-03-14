/// <reference path="app/headers/common.d.ts" />
export default class SqlDatasource {
    private $q;
    private backendSrv;
    private templateSrv;
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
    constructor(instanceSettings: any, $q: any, backendSrv: any, templateSrv: any);
    getTagKeys(): any;
    getTagValues(options: any): any;
    query(options: any): any;
    annotationQuery(options: any): any;
    metricFindQuery(query: any): any;
    _seriesQuery(query: any): any;
    serializeParams(params: any): any;
    testDatasource(): any;
    _sqlRequest(method: any, url: any, data: any): any;
    _replaceQueryVars(query: any, options: any, target: any): any;
    _getTimeFilter(isToNow: any): string;
    _getDateFilter(isToNow: any): string;
    _getSubTimestamp(date: any, toDataType: any, roundUp: any): any;
    _getRoundUnixTime(target: any): string;
    _num2Ts(str: any, toDataType: any): any;
    _ts2Num(str: any, toDataType: any): any;
    _getIntervalNum(str: any): any;
    _abstractDataType(datatype: any): any;
    _pgShortTs(str: any): any;
}
