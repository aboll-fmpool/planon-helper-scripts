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

// use real jQuery
global.$ = global.jQuery = require('jquery')(window);

const clazz = require('../main/Reports-Replace_text_in_formular.user');

var config = `
<div class="replaceValues">
  <div class="replaceItem">
    <input class="search" value="01-03-2025">
    <input class="replace" value="01-04-2025">
  </div>
</div>
`;

var column = `
  <input class="expression-textarea-field" name=expressionsPanel:expressionArea" value="01-04-2025, 01-03-2025">
  <div class="PnWebReportExpressionEditorDialog"><input class="okButton" aria-disabled="false"></div>';
`;

describe('Reports-Replace_text_in_formular', () => {
  test('replaceTextInFormular should replace text', () => {
    // Arrange
    $("body").append(config);
    $("body").append(column);

    //console.log(["from TEst", myInstance]);


    var sut = new clazz();
    sut.setConfig();

    var expected = '01-04-2025, 01-04-2025';

    // Act
    sut.replaceTextInFormular(['', 'myColumnText'])
    var actual = $('.expression-textarea-field[name*="expressionsPanel:expressionArea"]').val();

    // Assert
    expect(actual).toBe(expected);
  });
});