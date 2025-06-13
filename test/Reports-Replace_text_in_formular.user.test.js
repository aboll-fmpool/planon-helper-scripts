var jsdom = require("jsdom");
const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
var window = dom.window;
// const sut = require('../main/Reports-Replace_text_in_formular.user');
const sut = require('../main/Reports-Replace_text_in_formular.user');
// const mockFn = jest.fn().mockName('GM_addStyle');
//jest.mock('GM_addStyle')
//import replaceTextInExpressionFormular from '../main/Reports-Replace_text_in_formular.user'

const mockCallback = jest.fn(x => 42 + x);

describe('Reports-Replace_text_in_formular', () => {
  test('adds 1 + 2 to equal 3', () => {
    //GM_addStyle(mockCallback)
    //sut.replaceTextInFormular();
    //expect(sum(.1, 2)).toBe(3);
  
    
    expect(sut.test()).toBe(1);
    //replaceTextInExpressionFormular.replaceTextInExpressionFormular();
  });
});