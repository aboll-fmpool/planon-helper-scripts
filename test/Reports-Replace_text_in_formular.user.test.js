var jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;
global.MutationObserver = class {
    constructor(callback) {}
    disconnect() {}
    observe(element, initObject) {}
};
global.GM_addStyle = function(){};
// var $ = jQuery = require('jquery')(window);
/*
jsdom.env(
  "https://iojs.org/dist/",
  ["http://code.jquery.com/jquery.js"],
  function (err, window) {
    console.log("there have been", window.$("a").length - 4, "io.js releases!");
  }
);
*/
//const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
//var window = dom.window;
const clazz = require('../main/Reports-Replace_text_in_formular.user');
// const mockFn = jest.fn().mockName('GM_addStyle');
//jest.mock('GM_addStyle')
//import replaceTextInExpressionFormular from '../main/Reports-Replace_text_in_formular.user'

const mockCallback = jest.fn(x => 42 + x);

describe('Reports-Replace_text_in_formular', () => {
  test('replaceTextInFormular should replace text', () => {
    //GM_addStyle(mockCallback)
    //sut.replaceTextInFormular();
    //expect(sum(.1, 2)).toBe(3);
    var sut = new clazz();
  
    expect(sut.replaceTextInFormular(['', 'myColumnText'])).toBe(1);
    //replaceTextInExpressionFormular.replaceTextInExpressionFormular();
  });
});