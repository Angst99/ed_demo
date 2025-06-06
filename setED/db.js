const mysql = require('mysql');


// const connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '123456',
//     database: 'mydatabase'
// });


const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'mydatabase',
    connectionLimit: 10 ,// 根据需要调整连接数量
    connectTimeout: 60000, // 设置连接超时时间为 60 秒
});

const createTableIfNotExists = (tableName) => {
    pool.query(`CREATE TABLE IF NOT EXISTS ${tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        IP VARCHAR(15) NOT NULL,
        device_id VARCHAR(10) NOT NULL,
        unmodifiedValue DECIMAL(10,3) NOT NULL,
        modifiedValue DECIMAL(10,3) NOT NULL,
        modificationTime VARCHAR(20) NOT NULL,
        userIP VARCHAR(15) NOT NULL
    )`, (err) => {
        if (err) {
            console.error(`Error creating table: ${tableName}`, err);
        } else {
            console.log(`pool2 ${tableName} created or already exists.`);
        }
    });
};

const createTable2IfNotExists = (tableName) => {
    pool.query(`CREATE TABLE IF NOT EXISTS ${tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        IP VARCHAR(15) NOT NULL,
        machineType INT NOT NULL,
        fileName VARCHAR(50) NOT NULL,
        standardWeight DECIMAL(10,2),
        area DECIMAL(10,2) NOT NULL,
        volume DECIMAL(10,2) NOT NULL,
        printQuantity INT NOT NULL,
        unmodifiedValue DECIMAL(10,3) NOT NULL,
        modifiedValue DECIMAL(10,3) NOT NULL,
        adjustWeight DECIMAL(10,2) NOT NULL,
        averageWeight  DECIMAL(10,2),
        printWeight VARCHAR(50),
        nextPrintWeight VARCHAR(30),
        weightRange VARCHAR(20) NOT NULL,
        modificationTime VARCHAR(20) NOT NULL
    )`, (err) => {
        if (err) {
            console.error(`Error creating table: ${tableName}`, err);
        } else {
            console.log(`${tableName} created or already exists.`);
        }
    });
};


const execSql = (sql, value, callback) => {
    pool.getConnection((err, connection) => {
        if (err) {
            callback(err, null);
            return;
        }
        connection.query(sql, value, (err, result) => {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, result.insertId);
            connection.release();
        });
    });

};

const insertData = (sql, values, callback) => {
    pool.getConnection((err, connection) => {
        if (err) {
            callback(err, null);
            return;
        }
        connection.query(sql, values, (err, result) => {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, result.insertId);
            connection.release();
        });
    });

};

const queryData = (sql,values, callback) => {
    pool.getConnection((err, connection) => {
        if (err) {
            callback(err, null);
            return;
        }
        connection.query(sql, values,(err, results, fields) => {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, results);
            connection.release();
        });
    });
};

const updateData = (sql, values, callback) => {
    pool.getConnection((err, connection) => {
        if (err) {
            callback(err, null);
            return;
        }
        connection.query(sql, values, (err, result) => {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, result.affectedRows);
            connection.release();
        });
    });
};

const deleteData = (sql, value, callback) => {
    pool.getConnection((err, connection) => {
        if (err) {
            callback(err, null);
            return;
        }
        connection.query(sql, value, (err, result) => {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, result.affectedRows);
            connection.release();
        });
    });
};

module.exports = {
    createTableIfNotExists,
    createTable2IfNotExists,
    execSql,
    insertData,
    queryData,
    updateData,
    deleteData
};