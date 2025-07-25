const display = document.getElementById('display');

function append(char) {
  display.value = display.value === '' || display.value === '0' ? char : display.value + char;
}

function clearDisplay() {
  display.value = '';
}

function backspace() {
  display.value = display.value.slice(0, -1);
}

function calculate() {
  try {
    display.value = eval(display.value);
  } catch {
    display.value = 'Error';
  }
}