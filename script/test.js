function calculate(x1, x2, x3, x4) {
    return 0.00687947 * x1 - 0.00001392 * x2 + 0.00022071 * x3 + 0.03151787 * x4 - 0.00101;
}

const x1 = 16;
const x2 = 20572;
const x3 = 1469.9;
const x4 = 2;

const result = calculate(x1, x2, x3, x4);
console.log(result);