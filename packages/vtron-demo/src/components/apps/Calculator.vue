<template>
<div class="wrapper">
  <div class="calculator">
    <div class="calculator__result">
      <input type="text" class="calculator__result-secondary" disabled>
      <input type="text" class="calculator__result-primary" value="0" readonly>
    </div>
    <div class="calculator__mem-buttons">
      <button class="calculator__m-btn" disabled>MC</button>
      <button class="calculator__m-btn" disabled>MR</button>
      <button class="calculator__m-btn" disabled>M+</button>
      <button class="calculator__m-btn" disabled>M-</button>
      <button class="calculator__m-btn" disabled>MS</button>
      <button class="calculator__m-btn" disabled>M</button>
    </div>
    <div class="calculator__buttons">
      <button class="calculator__btn" data-operator="percent">%</button>
      <button class="calculator__btn" data-option="clearEntry">CE</button>
      <button class="calculator__btn" data-option="clear">C</button>
      <button class="calculator__btn calculator__btn--backspace" data-option="undo"></button>
      
      <button class="calculator__btn" data-operator="fraction">&sup1;/ ₓ</button>
      <button class="calculator__btn" data-operator="pow">x&sup2;</button>
      <button class="calculator__btn" data-operator="sqrt">&radic;</button>
      <button class="calculator__btn" data-operator="divide">&divide;</button>

      <button class="calculator__btn calculator__btn--number" data-number>7</button>
      <button class="calculator__btn calculator__btn--number" data-number>8</button>
      <button class="calculator__btn calculator__btn--number" data-number>9</button>
      <button class="calculator__btn" data-operator="multiply">&times;</button>
      
      <button class="calculator__btn calculator__btn--number" data-number>4</button>
      <button class="calculator__btn calculator__btn--number" data-number>5</button>
      <button class="calculator__btn calculator__btn--number" data-number>6</button>
      <button class="calculator__btn" data-operator="minus">&minus;</button>

      <button class="calculator__btn calculator__btn--number" data-number>1</button>
      <button class="calculator__btn calculator__btn--number" data-number>2</button>
      <button class="calculator__btn calculator__btn--number" data-number>3</button>
      <button class="calculator__btn" data-operator="plus">+</button>

      <button class="calculator__btn calculator__btn--number" data-option="reverse">+/-</button>
      <button class="calculator__btn calculator__btn--number" data-number>0</button>
      <button class="calculator__btn calculator__btn--number" data-option="dot">,</button>
      <button class="calculator__btn calculator__btn--equals" data-operator="equal">=</button>
    </div>
  </div>
</div>
</template>
<script setup>
import { onMounted } from 'vue';


class Calculations {
  
  static doMath = (currentResult = null, value = null, operator = null) => {
    
    switch(operator) {
      case 'plus':
        return currentResult + value;

      case 'minus':
        return currentResult - value;

      case 'multiply':
        return currentResult * value;

      case 'divide':
        return currentResult / value;
    }
  }

  static returnOperator = (operator = null) => {

    switch(operator) {
      case 'plus':
        return '+';

      case 'minus':
        return '−';

      case 'multiply':
        return '×';

      case 'divide':
        return '÷';

      case 'equal':
        return '=';
    }
  }
}
class Calculator {
  constructor() {

    this.result = document.querySelector('.calculator__result-primary');
    this.subRes = document.querySelector('.calculator__result-secondary');
    this.numbers = [...document.querySelectorAll('[data-number]')];
    this.options = [...document.querySelectorAll('[data-option]')];
    this.operators = [...document.querySelectorAll('[data-operator]')];
    
    this.numbers.forEach(number => number.addEventListener('click', this.addNumber));
    this.options.forEach(option => option.addEventListener('click', this.addOption));
    this.operators.forEach(operator => operator.addEventListener('click', this.calculate));
    
    this.calculations = [];
    this.newNumber = false;
    this.reset = false;
    this.lastOperator = null;
    this.currentResult = 0;
    
    this.clear();
  }

  addNumber = (e) => {

    if(this.reset) this.clear();
    
    this.number = e.target.textContent;

    if(this.result.value === '0') this.result.value = this.number;
    else if(this.newNumber) this.result.value = this.number;
    else this.result.value += this.number;

    this.newNumber = false;
  }

  addOption = (e) => {
    
    this.option = e.target.dataset.option;
    this.lastChar = this.result.value[this.result.value.length - 1];
    
    if(this.option === 'dot') {
      (this.lastChar === '.' || this.result.value.indexOf('.') !== -1) 
        ? this.result.value
        : this.result.value += '.';
    }
    
    else if(this.option === 'clearEntry') this.result.value = '0';
    
    else if(this.option === 'clear') this.clear();
    
    else if(this.option === 'reverse') this.result.value = this.result.value * -1;

    else if(this.option === 'undo') {

      (this.result.value.length === 1) 
        ? this.result.value = '0' 
        : this.result.value = this.result.value.substring(0, this.result.value.length - 1);
    }
  }

  calculate = (e) => {

    this.operator = e.target.dataset.operator;
    this.value = Number(this.result.value);
    this.subRes.style.visibility = 'visible';

    if(this.operator === 'pow') {
      this.subRes.value = ` sqr(${this.result.value})`;
      this.result.value = Math.pow(this.result.value, 2);
    }

    else if(this.operator === 'sqrt') {
      this.subRes.value = ` ${e.target.textContent}(${this.result.value})`;
      this.result.value = Math.sqrt(this.result.value);
    }

    else if(this.operator === 'fraction') {
      this.subRes.value = ` 1/(${this.result.value})`;
      this.result.value = 1 / this.result.value;
    }

    else if(this.operator === 'percent') this.result.value = parseFloat(((this.currentResult * this.value) / 100).toPrecision(14));

    else {

      if(this.operator === 'equal' && this.newNumber && this.lastOperator !== null && this.lastOperator !== 'equal'){
        
        if(this.calculations.length > 2) 
        this.value = this.calculations.map(item => item).reverse().find(item => typeof item === 'number');

        this.calculations = [this.currentResult, Calculations.returnOperator(this.lastOperator), this.value, Calculations.returnOperator(this.operator)];
        
        this.currentResult = Calculations.doMath(this.currentResult, this.value, this.lastOperator);
        this.currentResult = (parseFloat(this.currentResult.toPrecision(14)));
        
        this.result.value = this.currentResult;
        this.subRes.value = this.calculations.join(' ');

      } else {

        if(this.newNumber) {
          this.lastOperator = this.operator;
          this.calculations[this.calculations.length-1] = Calculations.returnOperator(this.operator);
          this.subRes.value = this.calculations.join(' ');
          this.reset = false;
          return;
        }
        
        (this.lastOperator === null) 
          ? this.currentResult = this.value
          : this.currentResult = Calculations.doMath(this.currentResult, this.value, this.lastOperator);
         
        (this.operator !== 'equal')
          ? this.lastOperator = this.operator 
          : this.reset = true;
        
        this.newNumber = true;
        this.calculations.push(this.value);
        this.calculations.push(Calculations.returnOperator(this.operator));

        this.currentResult = (parseFloat(this.currentResult.toPrecision(14)));
        this.result.value = this.currentResult;

        this.subRes.value = this.calculations.join(' ');
      }
    }
  }

  clear = () => {
    this.subRes.style.visibility = 'hidden';
    this.result.value = '0';
    this.subRes.value = '';
    this.calculations = [];
    this.newNumber = false;
    this.reset = false;
    this.lastOperator = null;
    this.currentResult = 0;
  }
}
onMounted(()=>{
  new Calculator();
})
</script>
<style scoped>

html,
body,
div,
span,
applet,
object,
iframe,
h1,
h2,
h3,
h4,
h5,
h6,
p,
blockquote,
pre,
a,
abbr,
acronym,
address,
big,
cite,
code,
del,
dfn,
em,
img,
ins,
kbd,
q,
s,
samp,
small,
strike,
strong,
sub,
sup,
tt,
var,
b,
u,
i,
center,
dl,
dt,
dd,
ol,
ul,
li,
fieldset,
form,
label,
legend,
table,
caption,
tbody,
tfoot,
thead,
tr,
th,
td,
article,
aside,
canvas,
details,
embed,
figure,
figcaption,
footer,
header,
hgroup,
menu,
nav,
output,
ruby,
section,
summary,
time,
mark,
audio,
video {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 100%;
  font: inherit;
  vertical-align: baseline;
}

/* HTML5 display-role reset for older browsers */
article,
aside,
details,
figcaption,
figure,
footer,
header,
hgroup,
menu,
nav,
section {
  display: block;
}

body {
  line-height: 1;
}

ol,
ul {
  list-style: none;
}

blockquote,
q {
  quotes: none;
}

blockquote:before, blockquote:after {
  content: '';
  content: none;
}

q:before, q:after {
  content: '';
  content: none;
}

table {
  border-collapse: collapse;
  border-spacing: 0;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}

* {
  -webkit-box-sizing: border-box;
          box-sizing: border-box;
}

html, body {
  background-color: #252525;
  font-family: "Noto Sans JP", sans-serif;
  color: #111111;
}

.wrapper {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
}

.calculator {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  min-width: 320px;
  padding: 4px;
  background-color: #bcbcbc;
  -webkit-box-shadow: 0px 0px 15px 0px rgba(0, 0, 0, 0.75);
          box-shadow: 0px 0px 15px 0px rgba(0, 0, 0, 0.75);
}

.calculator__result {
  -ms-flex-preferred-size: 100%;
      flex-basis: 100%;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-align: end;
      -ms-flex-align: end;
          align-items: flex-end;
  -webkit-box-pack: end;
      -ms-flex-pack: end;
          justify-content: flex-end;
  padding: 20px;
  background-color: #bcbcbc;
}

.calculator__result-primary, .calculator__result-secondary {
  background-color: transparent;
  border: none;
  text-align: right;
  font-weight: 700;
  font-size: 2.6rem;
  padding-left: 30px;
  font-family: "Noto Sans JP", sans-serif;
  color: #111111;
}

.calculator__result-secondary {
  visibility: hidden;
  width: 100%;
  font-weight: 400;
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #4b4b4b;
}

.calculator__mem-buttons {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
}

.calculator__m-btn {
  -webkit-box-flex: 1;
      -ms-flex: 1;
          flex: 1;
  border: none;
  background-color: #bcbcbc;
  font-family: "Noto Sans JP", sans-serif;
  padding: 15px;
}

.calculator__buttons {
  display: -ms-grid;
  display: grid;
  -ms-grid-columns: (1fr)[4];
      grid-template-columns: repeat(4, 1fr);
  gap: 2px;
  background-color: #bcbcbc;
}

.calculator__btn {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  border: none;
  font-family: "Noto Sans JP", sans-serif;
  font-size: 1.3rem;
  font-weight: 100;
  padding: 10px 0;
  background-color: #d9d9d9;
  color: #111111;
  -webkit-transition: 0.25s;
  transition: 0.25s;
}

.calculator__btn:hover {
  background-color: #e6e6e6;
}

.calculator__btn:active {
  background-color: white;
}

.calculator__btn--number {
  font-weight: 500;
  background-color: #f2f2f2;
}

.calculator__btn--equals {
  background-color: #73a5c0;
}

.calculator__btn--equals:hover {
  background-color: #48809f;
}

.calculator__btn--backspace {
  /* background: url("../public/backspace.svg") center no-repeat; */
  background-color: #d9d9d9 !important;
}

.calculator__btn--backspace:hover {
  background-color: #ebebeb !important;
}

.calculator__btn--backspace:active {
  background-color: white !important;
}
</style>