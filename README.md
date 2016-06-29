# thinkcrud

最近在学习 node.js ，也在使用 npm 的 mysql 操作 MySQL 数据库，但是个人觉得在使用 mysql 操作数据的时候，在组织 SQL  语句的时候感觉有点麻烦，可能是本人写习惯了 ThinkPHP ，习惯了将一张表直接转换成一个 Model ，并利用 Model 里的 where()、select()、add()、save() 等方法方便快捷地去操作数据库，于是思索着能不能自己写一个类似的 ThinkPHP CRUD 数据库的 node.js 插件。经过简单查看 ThinkPHP 的源代码后，于是写了这个较为简单，能够协助我们快速组织 SQL 语句的插件。当然现有的功能是十分简单的，后续有时间会继续开发，看看能否有一天像 ThinkPHP 当中操作数据库那样功能完善。

### 安装

	npm install thinkcrud

### 使用

首先你要先在 node.js 里面引入 mysql ，同 时创建连接池。

``` javascript
var mysql = require('mysql');
var thinkcrud = require('thinkcrud');
var pool = mysql.createPool({
    connectionLimit: 10,
    host: '192.168.1.111',
    user: 'root',
    password: '123456',
    database: 'sports'
});
var order = thinkcrud(pool, 'sp_order'); // sp_order 是数据库对应的表名
```

这样子就简单地将一个表转换为一个对应的操作对象。

#### select() 查询

``` javascript
order.select(function(err, rows, fields){
	// err 为 SQL 执行错误
	// rows 为查询返回结果数组
	// fields 为所查询表字段信息
});
```

其实际执行的 SQL 语句

	SELECT * FROM sp_order;

#### where() 条件
``` javascript
var map = {
	name: 'Leon',
	class: 12,
	order_no: '20160325094353017859'
};
order.where( map ).select(function(err, rows, fields){

});
```

其实际执行的 SQL 语句

	SELECT * FROM sp_order WHERE ( name = 'Leon' ) AND ( class = 12 ) AND ( order_no = '20160325094353017859' );

若设置 where() 参数中 _logic 属性，则可更改逻辑连接词

``` javascript
var map = {
	name: 'Leon',
	class: 12,
	order_no: '20160325094353017859'，
	_logic: 'OR' // 默认为 AND
};
order.where( map ).select(function(err, rows, fields){

});
```

其实际执行的 SQL 语句

	SELECT * FROM sp_order WHERE ( name = 'Leon' ) OR ( class = 12 ) OR ( order_no = '20160325094353017859' );

同时也支持表达式条件

表达式          | 含义           | 协助记忆
:--------------:|:--------------:|:------------------:
EQ              |等于( = )       |equal
NEQ             |不等于( <> )    |not equal 
GT              |大于( > )       |greater 
EGT             |大于等于( >= )  |equal or greater 
LT              |小于( < )       |less than 
ELT             |小于等于( <= )  |equal or less than 
LIKE            |模糊查询        |
[NOT] BETWEEN   |( 不在 )区间查询|  
[NOT] IN        |( 不在 )IN 查询 | 

``` javascript
var map = {
	title: ['like', '%test%'],
    status: ['in', [1, 2, 3] ],
    date: ['between', ['2015-01-01','2016-01-01']],
    age: ['lt', 20],
	_logic: 'OR'
};
order.where( map ).select(function(err, rows, fields){

});
```

其实际执行的 SQL 语句

	SELECT * FROM sp_order WHERE ( title LIKE %课程% ) OR ( status IN (1, 2, 3) ) OR ( date BETWEEN '2015-01-01' AND '2016-01-01' ) OR ( age < 20 );

当然也可以通常设置 where() 参数中的 _string 属性，直接配置条件

``` javascript
var map = {
    age: ['lt', 20],
    _string: 'good_id = 7 AND count > 200',
	_logic: 'OR'
};
order.where( map ).select(function(err, rows, fields){

});
```

其实际执行的 SQL 语句

	SELECT * FROM sp_order WHERE ( age < 20 ) OR ( good_id = 7 AND count > 200 );

#### field() 字段过滤

可通过执行 field() 来过滤所要查询的字段，默认不执行该方法为查询所有字段 ( SELECT * ) ,同时也可使用 SQL 函数

``` javascript
var map = {
	name: 'Leon',
	class: 12
};
order.field('name, MAX(age)').where( map ).select(function(err, rows, fields){

});
```

其实际执行的 SQL 语句

	SELECT name, MAX(age) FROM sp_order WHERE ( name = 'Leon' ) AND ( class = 12 );

#### limit()、order()、group()

``` javascript
order.order('name DESC').group('class').limit(2).select(function(err, rows, fields){

});
```

其实际执行的 SQL 语句

	SELECT * FROM sp_order GROUP BY class ORDER BY name DESC LIMIT 2;

在 select() 执行之前，limit()、order()、group() 没有执行顺序要求。
另一种用法

``` javascript
order.order({ name: 'DESC', id: 'ASC' }).group('class').limit(2, 6).select(function(err, rows, fields){

});
```

其实际执行的 SQL 语句

	SELECT * FROM sp_order GROUP BY class ORDER BY name DESC, id ASC LIMIT 2, 6;

#### insert() 插入

``` javascript
var data = {
	name: 'Leon',
	class: 12,
	order_no: '20160325094353017859'	
};
order.insert(data, function(err, result){
	// err 为 SQL 执行错误
	// result 为执行返回结果，新增数据的主键等
});
```

其实际执行的 SQL 语句

	INSERT INTO sp_order ( name, class, order_no ) VALUES ( 'Leon', 12, '20160325094353017859' );

insert() 这里没有做其它的 SQL 语句拼接，而是直接采用 mysql 原本的 insert 方式执行。
下个版本会增加获取对应执行 SQL 语句的功能，到时候再一起改进这一块。

#### update() 更新

``` javascript
var data = {
	id: 20, // 主键
	name: 'Leon',
	class: 12,
	order_no: '20160325094353017859'	
};
order.update(data, function(err, result){
	// err 为 SQL 执行错误
	// result 为执行返回结果，包括影响行数等
});
```

其实际执行的 SQL 语句

	UPADTE sp_order SET name = 'Leon', class = 12, order_no = '20160325094353017859' WHERE id = 20;

当使用 update() 更新数据的时候，若传递的参数中带有主键，则有限将主键作为更新数据的条件。
或者也可通过 where()、order()、limit() 来组合更新数据的条件，限制更新数据的条数。

``` javascript
var data = {
	order_no: '20160325094353017859'	
};
order.where({ class: 12 }).order({ id: 'DESC' }).limit(2).update(data, function(err, result){
	// err 为 SQL 执行错误
	// result 为执行返回结果，包括影响行数等
});
```

其实际执行的 SQL 语句

	UPADTE sp_order SET order_no = '20160325094353017859' WHERE class = 12 ORDER BY id DESC LIMIT 2;

