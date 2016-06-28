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

})
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

})
```

其实际执行的 SQL 语句
	SELECT * FROM sp_order WHERE ( name = 'Leon' ) OR ( class = 12 ) OR ( order_no = '20160325094353017859' );