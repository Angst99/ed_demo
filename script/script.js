const os = require('os');
const net = require('net');

// 获取本地网络信息
function getLocalNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const networkInfo = [];
    for (const interfaceName in interfaces) {
        const iface = interfaces[interfaceName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && !alias.internal) {
                networkInfo.push({
                    interface: interfaceName,
                    address: alias.address,
                    netmask: alias.netmask
                });
            }
        }
    }
    return networkInfo;
}

// 尝试连接指定IP和端口
function tryConnect(ip, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1000);

        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });

        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });

        socket.connect(port, ip);
    });
}

// 主函数
async function main() {
    const localNetworkInfo = getLocalNetworkInfo();
    console.log('本地网络信息:', localNetworkInfo);

    // 示例：尝试连接其他网段的主机
    const targetIp = '172.20.36.254';
    const targetPort = 80;
    const isConnected = await tryConnect(targetIp, targetPort);
    if (isConnected) {
        console.log(`${targetIp}:${targetPort} 可以连接`);
    } else {
        console.log(`${targetIp}:${targetPort} 无法连接`);
    }
}

main();
