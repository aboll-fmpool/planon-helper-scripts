var jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;
global.MutationObserver = class {
  constructor(callback) { }
  disconnect() { }
  observe(element, initObject) { }
};
global.GM_addStyle = function () { };

var mockInstance = new class JQMock {

  constructor() {
    this.mockedVal = "";
    this.findValues = [];
  }

  setVal(val) {
    this.mockedVal = val;
  }

  addFindValue(identifier, val) {
    var inst = new JQMock();
    inst.setVal(val)
    this.findValues.push({
      identifier: identifier,
      val: inst
    });
  }

  standard() {
    return "standard";
  }

  val() {
    return this.mockedVal;
  }

  each(func) {
    func();
  };

  find(identifier) {
    for (var i = 0; i < this.findValues.length; i++) {
      if (this.findValues[i].identifier == identifier) {
        return this.findValues[i].val;
      }
    }
    console.log(["no identifer for: " + identifier, this.findValues]);
  }

  click() {

  }

};
var jQueryMock = function () { return mockInstance; }

// use real jQuery
// global.$ = global.jQuery = require('jquery')(window);
global.$ = jQueryMock;
global.$.trim = function (text) { return text; };

const clazz = require('../main/Reports-Replace_text_in_formular.user');

describe('Reports-Replace_text_in_formular', () => {
  test('replaceTextInFormular should replace text', () => {
    // Arrange
    var expression = '"01-04-2025, 01-03-2025"';
    mockInstance.setVal(expression);
    mockInstance.addFindValue(".search", "01-03-2025");
    mockInstance.addFindValue(".replace", "01-04-2025");

    var sut = new clazz();
    sut.setConfig();

    var expected = '"01-05-2025, 01-04-2025"';

    // Act
    sut.replaceTextInFormular(['', 'myColumnText'])
    var actual = $('.expression-textarea-field[name*="expressionsPanel:expressionArea"]').val();

    // Assert
    expect(actual).toBe(expected);
  });
});