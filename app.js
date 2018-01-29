var mysql = require('mysql');
var fivebeans = require('fivebeans');

var host = '127.0.0.1';
var port = 11333;
var tube = 'invoice';

var connection = mysql.createConnection({
    host: 'mysql5015.site4now.net',
    user: 'db_a066df_tim',
    password: 'Project01',
    database: 'db_a066df_micheal'
});

connection.connect();

var emitter = new fivebeans.client(host, port);
emitter.on('connect', function () {
    console.log("connected to beanstalkd");
    emitter.use('invoice', function (error, tname) {
        if (error) throw error;
        console.log("using " + tname);
        connection.query('SELECT * FROM orders as o WHERE o.status < 6 AND o.status > 0', function (error, results, fields) {
            console.log(results);
            if (error) throw error;
            results.forEach(function (row) {
                var job = row;
                connection.query('SELECT p.amount,products.description,products.name,products.price,products.storage_id FROM products_orders as p LEFT JOIN products ON p.product_id = products.id WHERE p.order_id = ' + row.id + ';', function (error, results, fields) {
                    job.products = results;
                    console.log(job);
                    emitter.put(0, 0, 60, JSON.stringify(['invoice', {
                        type: 'invoice',
                        payload: job
                    }]), function (error, jobid) {
                        console.log(row);
                        console.log('queued a job in invoice: ' + jobid);
                        if (job.status < 6) {
                            //connection.query(' UPDATE orders SET status = status + 1 WHERE id = ' + job.id);
                        }
                    });
                });
            });
            console.log('Finish');
            connection.end();
        });
    });
});

emitter.connect();