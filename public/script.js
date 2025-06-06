// import './styles.css';

document.addEventListener('DOMContentLoaded', function () {

    // 创建元素
    const appContainer = document.getElementById('app');


    const h1 = document.createElement('h1');
    h1.textContent = 'Printer Status Checker';
    const h2 = document.createElement('h1');
    h2.textContent = 'Printer Status Checker';

    const wrapperDiv = document.createElement('div');

    wrapperDiv.classList.add('wrapper-div');
    const leftDiv = document.createElement('div');
    leftDiv.classList.add('left-div');
    leftDiv.tabIndex = 1;
    const rightDiv = document.createElement('div');
    rightDiv.classList.add('right-div');
    rightDiv.tabIndex = 2;


    // const arrayMode = ['打印机查询', '打印机信息', '打印机进度'];
    // const modeDiv = document.createElement('div');
    // modeDiv.classList.add('autocomplete');
    // modeDiv.appendChild(createSelect('打印机进度', arrayMode));

    const innerDiv1 = document.createElement('div');
    const innerDiv2 = document.createElement('div');

    const input = document.createElement('input');
    input.type = 'search';
    input.classList.add('autocomplete');
    input.id = 'printerIpInput';
    input.placeholder = '请输入打印机 IP (按回车键输出进度)';

    const button = document.createElement('button');
    button.classList.add('blue-button');
    button.id = 'myButton';
    button.textContent = '查询';

    const resultDiv = document.createElement('div');
    resultDiv.id = 'result';
    // resultDiv.classList.add('result');

    const autocompleteDiv = document.createElement('div');
    autocompleteDiv.classList.add('autocomplete');

    const table = document.createElement('table');
    table.id = 'myTable';
    table.classList.add('matching-table');

    const thead = document.createElement('thead');
    const tr1 = document.createElement('tr');
    const th1 = document.createElement('th');
    th1.textContent = 'device_id';
    const th2 = document.createElement('th');
    th2.textContent = 'status';
    const th3 = document.createElement('th');
    th3.textContent = 'progress';
    const th4 = document.createElement('th');
    th4.textContent = 'remaining_time';
    const th5 = document.createElement('th');
    th5.textContent = 'mode';

    tr1.appendChild(th1);
    tr1.appendChild(th2);
    tr1.appendChild(th3);
    tr1.appendChild(th4);
    tr1.appendChild(th5);

    thead.appendChild(tr1);

    const tbody = document.createElement('tbody');

    table.appendChild(thead);
    table.appendChild(tbody);

    autocompleteDiv.appendChild(table);

    // innerDiv1.appendChild(modeDiv);
    innerDiv1.appendChild(input);
    innerDiv1.appendChild(button);

    innerDiv2.appendChild(resultDiv);
    innerDiv2.appendChild(autocompleteDiv);

    leftDiv.appendChild(h1);
    leftDiv.appendChild(innerDiv1);
    leftDiv.appendChild(innerDiv2);


    rightDiv.appendChild(h2);

    wrapperDiv.appendChild(leftDiv);
    wrapperDiv.appendChild(rightDiv);

    // appContainer.appendChild(h1);

    appContainer.appendChild(wrapperDiv);


    document.getElementById('myButton').addEventListener('click', async function () {
        const input = document.getElementById('printerIpInput').value;
        const resultDiv = document.getElementById('result');

        // 显示加载提示
        resultDiv.innerHTML = '正在加载...';
        const progressBar = document.createElement('progress');
        progressBar.id = 'progressBar';
        progressBar.value = 0;
        progressBar.max = 100;

        // 将 progress 元素添加到 resultDiv 中
        resultDiv.appendChild(progressBar);

        let socket = new WebSocket('ws://172.20.9.235:8081');

        socket.addEventListener('message', function (event) {
            const data = JSON.parse(event.data);
            // console.log(data);
            const progressBar = document.getElementById('progressBar');

            // 检查进度条元素是否存在
            if (progressBar) {
                progressBar.value = data.progress;
                if (data.progress === 100) {
                    const resultDiv = document.getElementById('result');
                    if (resultDiv) {
                        resultDiv.innerHTML = '加载完毕';
                    }
                }
            }
        });


        const tbody = document.getElementById('myTable').getElementsByTagName('tbody')[0];
        tbody.innerHTML = '';
        try {
            const response = await fetch('/checkPrinter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({printerIp: input}),
            });

            const data = await response.json();
            data.forEach(item => {
                if (item.error) {
                    // 如果是错误信息，创建一个包含错误信息的行
                    const errorRow = document.createElement('tr');
                    const errorCell = document.createElement('td');
                    errorCell.colSpan = 5;
                    errorCell.textContent = item.error;
                    errorRow.appendChild(errorCell);
                    tbody.appendChild(errorRow);
                } else {
                    // 如果是设备信息，创建一个正常的行并填充数据
                    const row = document.createElement('tr');
                    const deviceIdCell = document.createElement('td');
                    const statusCell = document.createElement('td');
                    const progressCell = document.createElement('td');
                    const remainingTimeCell = document.createElement('td');
                    const modeCell = document.createElement('td');

                    deviceIdCell.textContent = item.device_id;
                    statusCell.textContent = item.status;
                    progressCell.textContent = item.progress;
                    remainingTimeCell.textContent = item.remaining_time;
                    modeCell.textContent = item.mode;

                    row.appendChild(deviceIdCell);
                    row.appendChild(statusCell);
                    row.appendChild(progressCell);
                    row.appendChild(remainingTimeCell);
                    row.appendChild(modeCell);

                    tbody.appendChild(row);
                }
            });


        } catch (error) {
            tbody.innerHTML = '';
            const errorRow = document.createElement('tr');
            const errorCell = document.createElement('td');
            errorCell.colSpan = 5;
            errorCell.textContent = `Error: ${error.message}`;
            errorRow.appendChild(errorCell);
            tbody.appendChild(errorRow);
        }
    });

    // 输入框回车事件
    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            // 这里可以添加按钮按下的逻辑
            document.getElementById('myButton').click();
            console.log('Button pressed');
        }
    });

    // 左边 div 回车事件
    leftDiv.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            // 这里可以添加左边按钮按下的逻辑
            document.getElementById('myButton').click();
            console.log('Left button pressed');
        }
    });

    // 右边 div 回车事件
    rightDiv.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            // 这里可以添加右边按钮按下的逻辑
            // document.getElementById('myButton').click();
            console.log('Right button pressed');
        }
    });



    function createSelect(name, str){
        const _select = document.createElement("select");
        const firstOption = document.createElement("option");
        firstOption.value = "------select------";
        firstOption.text = "------请选择------";
        _select.appendChild(firstOption);
        for (let i = 0; i < str.length; i++){
            const _option = document.createElement("option");
            _option.value = str[i];
            _option.text = str[i];
            if (name === str[i]){
                _option.selected = "true";
            }
            _select.appendChild(_option);
        }
        return _select;
    }

});