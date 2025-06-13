//import {GM_addStyle} from '../Reports-Replace_text_in_formular.user'
//import { describe, expect, test } from '@jest/globals';

require('./mock');
// const sut = require('../main/Reports-Replace_text_in_formular.user');
const sut = require('../main/func');
const mockFn = jest.fn().mockName('GM_addStyle');
//jest.mock('GM_addStyle')
//import replaceTextInExpressionFormular from '../main/Reports-Replace_text_in_formular.user'

const mockCallback = jest.fn(x => 42 + x);

describe('Reports-Replace_text_in_formular', () => {
  test('adds 1 + 2 to equal 3', () => {
    //GM_addStyle(mockCallback)
    //sut.replaceTextInFormular();
    //expect(sum(.1, 2)).toBe(3);
    var k = new sut();
    
    expect(k.test()).toBe(1);
    //replaceTextInExpressionFormular.replaceTextInExpressionFormular();
  });
});