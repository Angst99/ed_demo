const { spawn } = require('child_process');

const pythonScriptPath = 'prediction.py';
const pythonArgs = [[20, 20000, 1000, 2]];

const pythonProcess = spawn('python', [pythonScriptPath,...pythonArgs]);

let output = '';

pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
});

pythonProcess.stderr.on('data', (data) => {
    console.error(`Python script error: ${data}`);
});

pythonProcess.on('close', (code) => {
    if (code === 0) {
        console.log(`Python script output: ${output}`);
    } else {
        console.error(`Python script exited with code ${code}`);
    }
});