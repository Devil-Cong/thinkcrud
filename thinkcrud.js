'use strict';

module.exports = function(db, table) {
    var PRI = '',
    exps = {
        eq          : '=',
        neq         : '<>',
        gt          : '>',
        egt         : '>=',
        lt          : '<',
        elt         : '<=',
        notlike     : 'NOT LIKE',
        like        : 'LIKE',
        in          : 'IN',
        notin       : 'NOT IN',
        between     : 'BETWEEN',
        notbetween  : 'NOT BETWEEN'
    },
    sqlOptions = {
        whereStr    : '',
        fieldsStr   : '',
        orderStr    : '',
        limitStr    : '',
        groupStr    : ''
    },
    init = function(next){
        if( '' === PRI ){
            db.getConnection(function(conErr, connection){
                if(conErr){
                    throw conErr;
                }
                connection.query('DESC ' + table, function(err, rows, fields){
                    if(err){
                        throw err;
                    }
                    connection.release();
                    rows.forEach(function(o, i){
                        if( o.Key === 'PRI' ){
                            PRI = o.Field;
                            return;
                        }
                    });
                    next();
                });
            });
        }else{
            next();
        }
    },
    resetSqlOption = function(){
        for(var prop in sqlOptions){
            sqlOptions[prop] = '';
        }
    },
    isString = function(value) {
        return (typeof value === 'string') && (value.constructor === String);
    },
    isNumber = function(value){
    	return (typeof value === 'number') && (value.constructor === Number);
    },
    isArray = function(value){
    	return (typeof value === 'object') && (value.constructor === Array);
    },
    inArray = function(value, array){
    	return !!~array.indexOf(value);
    },
    isObject = function(value){
    	return (typeof value === 'object') && (value.constructor === Object)
    },
    isNonEmptyObject = function(value){
    	if(isObject(value)){
    		var hasProp = false;  
            for (var prop in value){  
                hasProp = true;  
                break;  
            }
            return hasProp;
    	}else{
    		return false;
    	}
    },
    parseWhereItem = function(key, value){
    	if(isArray(value)){
    		if(isString(value[0])){
    			var exp = value[0].toLowerCase();
    			if(inArray(exp, ['eq', 'neq', 'gt', 'egt', 'lt', 'elt', 'notlike', 'like'])){
    				return key + ' ' + exps[exp] + ' ' + parseValue(value[1]);
    			}else if(inArray(exp, ['notin','in']) && isArray(value[1])){
    				return key + ' ' + exps[exp] + ' ' + '(' + value[1].map(parseValue).join(',') + ')';
    			}else if(inArray(exp, ['between','notbetween']) && isArray(value[1])){
    				return key + ' ' + exps[exp] + ' ' + parseValue(value[1][0]) + ' AND ' + parseValue[value[1][1]];
    			}else{
    				throw new Error(value[0]);
    			}
    		}else{
    			throw new Error(value);
    		}
    	}else{
    		return key + ' = ' + parseValue(value);
    	}
    },
    parseValue = function(value){
    	if(isString(value)){
    		return '\'' + value + '\'';
    	}else if(isNumber(value)){
    		return value;
    	}
    };
    return {
    	field : function(fields){
    		if(isString(fields) && '' !== fields){
    			sqlOptions.fieldsStr = fields;
    		}else{
    			sqlOptions.fieldsStr = '*';
    		}
    		return this;
    	},
    	limit : function(offset, rows){
    		var limitStr = '';
    		if(offset){
    			limitStr = offset;
    		}
            if(rows){
                limitStr += ',' + rows;
            }
            sqlOptions.limitStr = ('' !== limitStr) ? ' LIMIT ' + limitStr + ' ' : '';
    		return this;
    	},
    	group : function(groupStr){
            if(isString(groupStr) && '' !== groupStr){
                sqlOptions.groupStr = ' GROUP BY ' + groupStr;
            }
            return this;
        },
    	order : function(orders){
    		var orderStr = '';
    		if(isString(orders) && '' !== orders){
    			orderStr = orders;
    		}else if(isNonEmptyObject(orders)){
    			var ord = [];
    			for(var prop in orders){
    				ord.push(prop + ' ' + orders[prop]);
    			}
    			orderStr = ord.join(',');
    		}
    		sqlOptions.orderStr = ('' !== orderStr) ? ' ORDER BY ' + orderStr : '';
    		return this;
    	},
    	where : function(map){
    		if(isString(map)){
    			sqlOptions.whereStr = map;
    		}else{
    			var str = [],
    				operate = map.hasOwnProperty('_logic') ? map._logic.toUpperCase() : '';
    			if(inArray(operate, ['AND', 'OR', 'XOR'])){
    				operate = ' ' + operate + ' ';
    				delete map._logic;
    			}else{
    				operate = ' AND ';
    			}
    			if(map.hasOwnProperty('_string') && isString(map._string)){
    				str.push('( ' + map._string + ' )');
    				delete map._string;
    			}
    			for( var prop in map ){
    				str.push('( ' + parseWhereItem(prop, map[prop]) + ' )');
    			}
    			sqlOptions.whereStr = ' WHERE ' + str.join(operate);
    		}
    		return this;
    	},
    	select : function(next){
            var sql = 'SELECT ' + ( ('' !== sqlOptions.fieldsStr) ? sqlOptions.fieldsStr : '*') + ' FROM ' + table
                    + ( ('' !== sqlOptions.whereStr) ? sqlOptions.whereStr : '') + ( ('' !== sqlOptions.groupStr) ? sqlOptions.groupStr : '')
                    + ( ('' !== sqlOptions.orderStr) ? sqlOptions.orderStr : '') + ( ('' !== sqlOptions.limitStr) ? sqlOptions.limitStr : '')
                    + ';';
            db.getConnection(function(conErr, connection){
                if(conErr){
                    throw conErr;
                }
                connection.query(sql, function(err, rows, fields){
                    connection.release();
                    resetSqlOption();
                    next ? next(err, rows, fields) : '';
                });
            }); 
    	},
        insert : function(data, next){
            var sql = 'INSERT INTO ' + table + ' SET ?',
                insertId = 0;
            db.getConnection(function(conErr, connection){
                if(conErr){
                    throw conErr;
                }
                connection.query(sql, data, function(err, rows){
                    connection.release();                    
                    resetSqlOption();
                    next ? next(err, rows) : '';      
                });
            });
        },
        update : function(data, next){
            if(!data){
                throw new Error();
            }
            var sql = '',
                str = [],
                condition = '';
            init(function(){
                if( ('' !== PRI) && data.hasOwnProperty(PRI) ){
                    condition = ' WHERE ' + PRI + ' = ' + parseValue(data[PRI]);
                    delete data[PRI];
                }else{
                    condition = sqlOptions.whereStr;
                }             
                for(var prop in data){
                    str.push( prop + ' = ' + parseValue(data[prop]) );
                }
                sql = 'UPDATE ' + table + ' SET ' + str.join(', ') + condition + ( ('' !== sqlOptions.orderStr) ? sqlOptions.orderStr : '')
                    + ( ('' !== sqlOptions.limitStr) ? sqlOptions.limitStr : '') + ';';
                db.getConnection(function(conErr, connection){
                    if(conErr){
                        throw conErr;
                    }
                    connection.query(sql, function(err, rows){
                        connection.release();
                        resetSqlOption();
                        next ? next(err, rows) : '';       
                    });
                });
            });
        },
        delete : function(data, next){            
            init(function(){
                if( data && ('' !== PRI) && data.hasOwnProperty(PRI) ){
                    condition = ' WHERE ' + PRI + ' = ' + parseValue(data[PRI]);
                }else if('' !== sqlOptions.whereStr){
                    condition = sqlOptions.whereStr;
                }else{
                    throw new Error();
                }
                sql = 'DELETE FROM ' + table + condition + ( ('' !== sqlOptions.orderStr) ? sqlOptions.orderStr : '')
                    + ( ('' !== sqlOptions.limitStr) ? sqlOptions.limitStr : '') + ';';
                db.getConnection(function(conErr, connection){
                    if(conErr){
                        throw conErr;
                    }
                    connection.query(sql, function(err, rows){
                        connection.release();
                        resetSqlOption();
                        next ? next(err, rows) : '';
                    });
                });
            });
        }
    }
};

