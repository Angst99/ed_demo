const express = require('express');
const fs = require('fs');
const cors = require('cors');
const axios = require("axios");
const moment = require("moment/moment");
const app = express();
const dbConnection = require('./db');

// 使用 cors 中间件
app.use(cors());
app.use(express.json());

app.use(express.static('D:\\JetBrains\\WebstormProjects\\vite-react\\dist'));

app.get('/', (req, res) => {
    res.sendFile('/index.html');
});

//修改ed网页的用户信息
app.get('/getUserInfo', (req, res) => {
    let ipAddress = req.ip || req.socket.remoteAddress;
    let ipAddr;

    if (ipAddress.startsWith('::ffff:')) {
        const ipv4Address = ipAddress.slice(7);
        ipAddr = ipAddress.substring(7);
    } else {
        ipAddr = ipAddress;
    }

    console.log(ipAddr);

    res.json({
        uid: '001',
        uname: '',
        ipAddr: ipAddr,
        avatar: '',
    });
});


//四舍五入
function roundToOneDecimalPlace(num) {
    const factor = 10.0;
    num *= factor;
    const intNum = Math.round(num);
    return intNum / factor;
}

async function queryPrinterStatus(ip) {
    let printerInfoJson = {};
    const printer_info_url = 'http://172.20.22.' + ip + ':5000/get_printer_information/';
    const printer_info_response = await axios.get(printer_info_url, {
        timeout: 2000 // 设置超时时间为 5000 毫秒（5 秒）
    });

    // 如果返回的数据已经是对象
    if (typeof printer_info_response.data === 'object') {
        const printerInfoRoot = printer_info_response.data;
        if (printerInfoRoot && printerInfoRoot.device_id) {

            const device_id = printerInfoRoot.device_id;
            const status_info_url = 'http://172.20.22.' + ip + ':5000/status/' + device_id;
            const status_info_response = await axios.get(status_info_url, {
                timeout: 2000 // 设置超时时间为 5000 毫秒（5 秒）
            });

            if (typeof status_info_response.data === 'object') {
                const statusInfoRoot = status_info_response.data;
                if (statusInfoRoot) {
                    const status = statusInfoRoot.status || 'null';
                    const progress = statusInfoRoot.progress || '0';
                    const remaining_time = statusInfoRoot.remaining_time ? roundToOneDecimalPlace(statusInfoRoot.remaining_time / 60) : '0';
                    const mode = statusInfoRoot.mode || '';

                    printerInfoJson.device_id = device_id;
                    printerInfoJson.status = status;
                    printerInfoJson.progress = progress;
                    printerInfoJson.remaining_time = remaining_time;
                    printerInfoJson.mode = mode;
                }
            }

            const ip_addr = printerInfoRoot.ip_addr || "null";
            const software_version = printerInfoRoot.software_version || "null";
            const hardware_version = printerInfoRoot.hardware_version || "null";

            printerInfoJson.ip_addr = ip_addr;
            printerInfoJson.software_version = software_version;
            printerInfoJson.hardware_version = hardware_version;

            const get_light_intensity_url = "http://172.20.22." + ip + ':5000/get_light_intensity';

            const light_intensity_response = await axios.get(get_light_intensity_url, {
                timeout: 2000
            });

            if (typeof light_intensity_response.data === 'object') {
                const light_intensity = light_intensity_response.data;
                if (light_intensity) {
                    printerInfoJson.light_intensity = light_intensity;
                }
            }
            try {
                const getShapeConfig_url = "http://172.20.22." + ip + ":5000/getShapeConfig";
                const shape_data = await axios.get(getShapeConfig_url, {
                    timeout: 2000
                });
                if (typeof shape_data === 'object') {
                    if (shape_data.data) {
                        printerInfoJson.erode_dilate = shape_data.data.data.erode_dilate;
                        printerInfoJson.gamma = shape_data.data.data.gamma;
                    }
                }
            } catch (error) {

                // console.log('Error fetching printer info:', error);
                printerInfoJson.erode_dilate = NaN;
                printerInfoJson.gamma = NaN;
            }


            const queue_url = "http://172.20.22." + ip + ":5000/queue_json/1/7";
            const queue_response = await axios.get(queue_url, {
                timeout: 2000
            });
            const jsonData = queue_response.data;
            if (typeof jsonData === 'object' && jsonData.data) {
                let dataArray = [];
                jsonData.data.forEach((item, index) => {
                    let obj = {};

                    obj.index = index;

                    if (item.device_id && typeof item.device_id === 'string') {
                        obj.device_id = item.device_id;
                    }
                    if (item.filename && typeof item.filename === 'string') {
                        obj.filename = item.filename;
                    }
                    if (item.status && typeof item.status === 'string') {
                        obj.status = item.status;
                    }
                    if (item.info && typeof item.info === 'string') {
                        const infoJSON = JSON.parse(item.info);
                        if (infoJSON.volume && typeof infoJSON.volume === 'number') {
                            obj.volume0 = roundToOneDecimalPlace(infoJSON.volume);
                        }
                        if (infoJSON.area && typeof infoJSON.area === 'number') {
                            obj.area = roundToOneDecimalPlace(infoJSON.area);
                        }
                        if (infoJSON.volume && infoJSON.area) {
                            const volume2 = infoJSON.volume * 1.05 + infoJSON.area / 100;
                            obj.volume = roundToOneDecimalPlace(volume2);
                        } else {
                            obj.volume = 0;
                        }
                    }
                    if (item.create_time && typeof item.create_time === 'string') {
                        obj.create_time = item.create_time;
                    }
                    dataArray.push(obj);

                })

                printerInfoJson.queue = dataArray;
            }
        }
    }
    return printerInfoJson;
}


app.post('/printerInfo', async (req, res) => {
    const input = req.body.printerIp;
    try {
        const printerInfo = await queryPrinterStatus(input);
        res.json(printerInfo);
    } catch (error) {
        console.error('Error fetching printer info:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }

});

//机台名称反查IP 接口
app.post('/searchIP', async (req, res) => {
    try {
        const selectValues = [`${req.body.deviceName}-%`];
        const selectSql = `SELECT * FROM deviceIP WHERE device_id LIKE ?`;
        dbConnection.queryData(selectSql, selectValues, (err, results) => {
            if (err) {
                console.error('Error querying data:', err);
                res.status(500).json({error: 'Internal Server Error'});
            } else {
                console.log(results);
                res.json(results);
            }
        });
    } catch (error) {
        console.error('Error fetching printer info:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }

});

//查询所有IP
app.post('/searchAllIP', async (req, res) => {
    try {
        const selectValues = ['A%', 'B%', 'C%', 'D%', 'E%', 'F%'];
        const querySql = `select * from deviceIP where device_id like? order by device_id ASC`;

        const allResults = {};

        const promises = [];

        for (const value of selectValues) {
            const promise = new Promise((resolve, reject) => {
                dbConnection.queryData(querySql, value, (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        // 根据 value 的首字母添加到对应的键名下
                        const key = `row${value[0].toUpperCase()}`;
                        allResults[key] = results;
                        resolve(results);
                    }
                });
            });
            promises.push(promise);
        }

        return Promise.all(promises)
            .then(() => {
                const jsonData = JSON.stringify(allResults, null, 2);
                res.json(allResults);

                return allResults;
            })
            .catch(err => {
                console.error('Error querying data:', err);
                return null;
            });
    } catch (error) {
        console.error('Error fetching printer info:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }

});


//修改ed的接口
app.post('/setShape', async (req, res) => {
    let ipAddress = req.ip || req.socket.remoteAddress;
    let ipAddr;

    if (ipAddress.startsWith('::ffff:')) {
        const ipv4Address = ipAddress.slice(7);
        ipAddr = ipAddress.substring(7);
    } else {
        ipAddr = ipAddress;
    }
    try {

        const status_response = await axios.get('http://172.20.22.' + req.body.printerIp + ':5000/status_json', {
            timeout: 2000
        });
        // console.log(status_response);
        if (status_response !== null && status_response.data.status === 'printing') {
            res.status(300).json({data: "warning", message: "打印中，无法修改配置"});
            return;
        }


        const data = new URLSearchParams();
        data.append('erode_dilate', req.body.erode_dilate);
        data.append('gamma', req.body.gamma);

        console.log(`${req.body.printerIp}  ${data}`);


        axios.post('http://172.20.22.' + req.body.printerIp + ':5000/setShapeConfig', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        })
            .then(response => {
                const jsonStatus = {data: "error", record: "null"}
                if (response.status === 200) {
                    const jsonResponse = response.data;
                    console.log(jsonResponse);

                    if (jsonResponse.code === 0 && jsonResponse.data === '\u6210\u529f') {
                        jsonStatus.data = "success";
                        console.log('请求成功，响应数据符合');

                        dbConnection.createTableIfNotExists('EDChangeTrack');
                        console.log(`${req.body.originalEDValue} ➜ ${req.body.erode_dilate}`);

                        if (req.body.originalEDValue !== req.body.erode_dilate) {
                            const insertValues = [req.body.printerIp, req.body.device_id, req.body.originalEDValue, req.body.erode_dilate, moment().format('YYYY/MM/DD/HH:mm:ss'), ipAddr];

                            const insertSql = `INSERT INTO EDChangeTrack (IP, device_id, unmodifiedValue, modifiedValue, modificationTime, userIP) VALUES (?,?,?,?,?,?)`;

                            dbConnection.insertData(insertSql, insertValues, (err, insertId) => {
                                if (err) {
                                    console.error('Error inserting data:', err);
                                    jsonStatus.record = 'error';
                                } else {
                                    console.log('Inserted row with id:', insertId);
                                    jsonStatus.record = 'ok';
                                }
                                res.status(200).json(jsonStatus);

                            });
                            if (req.body.isUpLoadWeight) {
                                dbConnection.createTable2IfNotExists('weightChange');
                                console.log(req.body);
                                const insertValue2 = [req.body.printerIp, req.body.MachineTypeOption,
                                    req.body.fileName,
                                    (Number(req.body.standardLowerLimit) + Number(req.body.standardUpperLimit)) / 2,
                                    req.body.area,
                                    req.body.volume,
                                    req.body.weights.split('-').length,
                                    req.body.originalEDValue,
                                    Number(req.body.erode_dilate),
                                    Number(req.body.adjustWeight),
                                    req.body.averageWeight,
                                    req.body.weights,
                                    req.body.standardLowerLimit + '-' + req.body.standardUpperLimit,
                                    moment().format('YYYY/MM/DD/HH:mm:ss')];
                                console.log(insertValue2);
                                console.log(req.body.adjustWeight);
                                const insertSql2 = `INSERT INTO weightChange (IP, machineType, fileName, standardWeight, area, volume, printQuantity, unmodifiedValue, modifiedValue, adjustWeight, averageWeight, printWeight, weightRange, modificationTime) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

                                dbConnection.insertData(insertSql2, insertValue2, (err, insertId) => {
                                    if (err) {
                                        console.error('table2  Error inserting data:', err);
                                    } else {
                                        console.log('table2 Inserted row with id:', insertId);
                                    }
                                });
                            }


                        } else {
                            console.log('修改值等于原始值，不记录');
                            jsonStatus.record = 'exists';
                            res.status(200).json(jsonStatus);

                        }

                    } else {
                        console.log('请求成功，但响应数据不符合');
                    }
                } else {
                    console.log(`请求成功，但状态码异常: ${response.status}`);
                }
            })
            .catch(error => {
                console.error(`request error: ${error.message}`);
            });
    } catch (error) {
        console.error('Error fetching printer info:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }

});

// 历史ed修改记录接口
app.post('/getHistory', async (req, res) => {
    try {
        const selectSql = `SELECT * FROM edchangetrack WHERE IP =? ORDER BY modificationTime DESC`;
        const selectValues = [req.body.printerIp];
        console.log(selectValues);
        dbConnection.queryData(selectSql, selectValues, (err, results) => {
            if (err) {
                console.error('Error querying data:', err);
                res.status(500).json({error: 'Internal Server Error'});
            } else {
                res.json(results);
            }
        });
    } catch (error) {
        console.error('Error fetching printer info:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }

});


const port = 3003;
const server = app.listen(port, () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localAddress = '';
    let networkAddress = '';

    //百度搜的
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const interface of interfaces) {
            if (interface.family === 'IPv4' && !interface.internal) {
                networkAddress = `http://${interface.address}:${port}`;
            }
            if (interface.family === 'IPv4' && interface.internal) {
                localAddress = `http://${interface.address}:${port}`;
            }
        }
    }

    console.log(`  ➜  Local:   ${localAddress}`);
    console.log(`  ➜  Network: ${networkAddress}`);
});
