const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');
const moment = require('moment');

const app = express();
const port = 3009;

app.use(express.json());
app.use(express.static('public'));


app.get('/', (req, res) => {
    // res.sendFile('/index.html');
    res.sendFile('D:\\JetBrains\\WebstormProjects\\demo11\\public\\index.html');
});

const wss = new WebSocket.Server({port: 8081});


app.post('/checkPrinter', async (req, res) => {

    console.log(moment().format('YYYY-MM-DD HH:mm:ss'));

    const ipAddress = req.ip || req.socket.remoteAddress;
    let ipAddr;
    if (ipAddress.startsWith('::ffff:')) {
        const ipv4Address = ipAddress.slice(7);
        ipAddr = ipAddress.substring(7);
    } else {
        ipAddr = ipAddress;
    }


    const input = req.body.printerIp;
    let result = [];
    if (input === '') {
        const printers = {
            "A05": "105",
            "A06": "109",
            "A07": "107",
            "A08": "108",
            "B01": "151",
            "B02": "152",
            "B03": "153",
            "B04": "179",
            "B05": "155",
            "B06": "156",
            "B07": "157",
            "B08": "158",
            "B09": "159",
            "B10": "174",
            "B11": "161",
            "B12": "177",
            "B13": "175",
            "B14": "164",
            "B15": "176",
            "B16": "182",
            "B17": "189",
            "B18": "168",
            "B19": "169",
            "B20": "103",
            "B21": "186",
        };

        let progress = 0;
        const totalPrinters = Object.keys(printers).length;
        const progressStep = 100 / totalPrinters;

        for (const [name, ip] of Object.entries(printers)) {
            try {
                const printerInfo = await queryPrinterStatus(ip);
                console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} ${ipAddr}: ip :${ip}`);

                // result += printerInfo;
                result.push(printerInfo);

            } catch (error) {
                // result += `Error for ${ip}: ${error.message}`;
                result.push({error: `Error for ${ip}: ${error.message}`});
                console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} ${ipAddr}: Error for ${ip}: ${error.message}`);
            }
            // 更新进度
            progress += progressStep;
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({progress}));
                }
            });
        }
    } else {
        try {
            console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} ${ipAddr}: input :${input}`);
            const printerInfo = await queryPrinterStatus(input);
            result.push(printerInfo);
        } catch (error) {
            result.push({error: `Error: ${error.message}`});
        }

        let progress = 0;
        // 更新进度
        progress += 100;
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({progress}));
            }
        });
    }

    res.json(result);
});

async function queryPrinterStatus(ip) {
    const printer_info_url = 'http://172.20.22.' + ip + ':5000/get_printer_information/';
    const printer_info_response = await axios.get(printer_info_url, {
        timeout: 500 // 设置超时时间为 5000 毫秒（5 秒）
    });

    // 如果返回的数据已经是对象
    if (typeof printer_info_response.data === 'object') {
        const printerInfoRoot = printer_info_response.data;
        if (printerInfoRoot && printerInfoRoot.device_id) {
            const device_id = printerInfoRoot.device_id;
            const status_info_url = 'http://172.20.22.' + ip + ':5000/status/' + device_id;
            const status_info_response = await axios.get(status_info_url, {
                timeout: 500 // 设置超时时间为 5000 毫秒（5 秒）
            });

            // 检查状态信息数据是否是对象
            if (typeof status_info_response.data === 'object') {
                const statusInfoRoot = status_info_response.data;
                if (statusInfoRoot) {
                    const status = statusInfoRoot.status || 'null';
                    const progress = statusInfoRoot.progress || '0';
                    const remaining_time = statusInfoRoot.remaining_time ? roundToOneDecimalPlace(statusInfoRoot.remaining_time / 60) : '0';
                    const mode = statusInfoRoot.mode || '';
                    // return `<p>device_id: ${device_id}, status: ${status}, progress: ${progress}, remaining_time: ${remaining_time} min, mode: ${mode}</p>`;
                    // return `
                    //     <div>
                    //         <p>device_id: ${device_id} status: ${status} progress: ${progress} remaining_time: ${remaining_time} min mode: ${mode}</p>
                    //     </div>
                    // `;
                    return {
                        device_id: device_id,
                        status: status,
                        progress: progress,
                        remaining_time: remaining_time,
                        mode: mode
                    };
                }
            } else {
                console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')} Invalid data format for status information at IP:`, ip);
                // return `Invalid data format for status information at IP: ${ip}`;
                return {error: `Invalid data format for status information at IP: ${ip}`};
            }
        } else {
            console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')} device_id is not defined for printer at IP: `, ip);
            // return `device_id is not defined for printer at IP: ${ip}`;
            return {error: `device_id is not defined for printer at IP: ${ip}`};
        }
    } else {
        console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}  Invalid data format for printer information at IP:`, ip);
        // return `Invalid data format for printer information at IP: ${ip}`;
        return {error: `Invalid data format for printer information at IP: ${ip}`};
    }
}

function roundToOneDecimalPlace(num) {
    const factor = 10.0;
    num *= factor;
    const intNum = Math.round(num);
    return intNum / factor;
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});