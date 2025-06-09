import { el } from '../assets/system.js';
import { CodeDoc } from './CodeDoc.js';

export function Docs() {
  return el('glurr-docs', {
    class: 'padded',
    style: { display: 'block', width: 300, height: 300, overflow: 'auto' }
  },
    el('style', {}, `
glurr-docs h2 { border-bottom: 2px solid black; margin: 5px 0 }
glurr-docs details p { margin: 0 }
glurr-docs details summary { font-family: Monaco, monospace; }
glurr-docs code {
  display: inline-block;
  margin: 5px 0;
  padding: 3px 20px;
  border: 1px solid #888;
  border-radius: 3px;
}
`),
    el('p', {}, `Glurr is a stack language inspired by Forth`),
    el('p', {}, `Glurr consists of "words" and very little structural syntax.
    Words does not recieve parameters, they pop and push values from and to the stack.`),

    el('p', {}, `Numbers push a floating point number to the stack.`),
    el('p', {}, el('code', {}, `3.14`)),
    el('p', {}, `Strings push a string to the stack.`),
    el('p', {}, el('code', {}, `"foo"`)),
    el('p', {}, `{ ... } skips execution for contained code by entering compile mode and pushes a jump reference to the start of this code block. `),
    el('p', {}, `: bind a string name to a jump reference.`),
    el('p', {}, el('code', {}, `"square" { dup * } :`)),
    el('p', {}, `Mention a defined word to invoke it. A return jump reference is pushed to the control stack and the execution index is changed to the word jump refererence.`),
    el('p', {}, el('code', {}, `5 square . ( prints 25 )`)),
    el(CodeDoc, { file: './glurr/interpret.js' })
  );
}
