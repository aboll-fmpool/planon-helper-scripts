// ==UserScript==
// @name         Reports - Replace text in formular
// @namespace    http://tampermonkey.net/
// @version      0.1.2
// @description  search and replace texts in report formulars
// @author       a.boll
// @match        https://www.tampermonkey.net/index.php?version=5.3.3&ext=dhdg&updated=true
// @include      https://*planoncloud.com*
// @include      file://*test.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        GM_addStyle
// ==/UserScript==
/* global $ */


GM_addStyle(`
.reportReplaceExpressionConsole {
    border:solid;
}
.reportReplaceExpressionConsole .button {
    width: 100px;
    border: solid;
    cursor: pointer;
}

.reportReplaceExpressionConsole .controls > div {
   display:inline;
}

.checkFields {
    background-color: green;
}
.abortAutomation {
   background-color: red;
}
.addInput,
.removeInput{
    display: inline;
    background-color: grey;
    width:25px;
}
.reportReplaceExpressionConsole .textInput{
    color: #000000;
}
.reportReplaceExpressionConsole input.log {
    width: 300px;
    color: #000000;
}

.detailLog {
    position: fixed;
    right: 0px;
    background-color: gray;
    width: 750px;
    top: 0px;
    z-index: 999;
}

.detailLog .content{
   font-size: 14px;
}

.detailLog .closeDetailog{
   display:inline;
}

.detailLogHeader{
    display:inline;
}

.detailLogRow {
    display: inline-block;
    width: 244px;
    vertical-align: top;
    border: solid 1px;
    overflow: hidden;
    word-wrap: break-word;
}

.detailLogButton {
    display:inline;
    background-color: gray;
    width: 8px;
}

.detailLogColumn.button {
    background-color: white;
    width: 250px;
}

.detailLogRow.header {
    background-color: darkgray;
    color: black;
}

`);



var REPORT_DEFINITON_PANEL_SELECTOR = ".PnWebReportDefinitionDialog";
var $TIME_OUT = 100;
var $ABORT = false;
var $PRE_CONFIGS = [
    {
        name: 'MKCO-prefatturazione_SpaceUsage_(04e)-Dettaglio_ExportXLS (MT)',
        params: [
            {
                search: '31-03-2025',
                replace: '30-04-2025'
            },
            {
                search: '01-03-2025',
                replace: '01-04-2025'
            },
            {
                search: '28-02-2025',
                replace: '31-03-2025'
            },
            {
                search: '01-02-2025',
                replace: '01-03-2025'
            },
            {
                search: '"03-2025"',
                replace: '"04-2025"'
            }
        ]
    }
];


var $LOG_SELECTOR = ".reportReplaceExpressionConsole input.log"
var $CONTROL_PANEL = `
<div class="reportReplaceExpressionConsole">
    <div class="controls">
        <div class="checkFields button">Replace Text</div>
        <div class="abortAutomation button">Abort</div>
        <div> Report Configs:
            <select name="reports" id="reportConfigs"></select>
        </div>
    </div>
    <div>
        Log: <input readonly class="log"\>
        <div class="button detailLogButton">Details</div>
        <div class="detailLog">
            <div class="closeDetailog button">X</div>
            <h2 class="detailLogHeader">Replacements:<h2>
            <div class="content"></div>
        </div>
    </div>
    <div class="replaceValues">
        <div class="replaceItem fix">Search: <input class="textInput search" /> Replace: <input class="textInput replace"/><div class="addInput button">+</div></div>
    </div>
</div>
`;
var $NEW_RPLACE_ITEM = `<div class="replaceItem added">Search: <input class="textInput search" /> Replace: <input class="textInput replace"/><div class="removeInput button">-</div></div>`;

var $REPORT_CONFIG_OPTION_SELECTOR = '.reportReplaceExpressionConsole #reportConfigs';

var $SELECT_FIELDS_LIST_LINK_SELECTOR = '.selectedFieldsPanel .tree-branch a.pn-node-link';
var $SETTINGS_COLUMN_TEXT_SELECTOR = '.reportPropertiesPanel .BOGrid .fields-group-container .fields-group .field-editor-con input[name*="columnHeaderTextField"]';
var $EXPRESSION_BUILDER_OKAY_BUTTON_SELECTOR = ".PnWebReportExpressionEditorDialog .okButton";
var $EXPRESSION_BUILDER_EXPRESSION_TEXTAREA_SELECTOR = '.expression-textarea-field[name*="expressionsPanel:expressionArea"]';
var $LOGS_EXPRESSION_CHANGES = [];

var $REPLACEMENT_STRING = "$!#_REPLACE_THIS_STRING_";

class ReplaceTextInReportFormulars {

    constructor() {
        this.config = [];
        // TODO  https://stackoverflow.com/questions/1479319/simplest-cleanest-way-to-implement-a-singleton-in-javascript
        if(ReplaceTextInReportFormulars._instance) {
            return ReplaceTextInReportFormulars._instance;
        }
        ReplaceTextInReportFormulars._instance = this;
    }

    createReplaceTextInExpressionPanel() {
        this.waitForElm(REPORT_DEFINITON_PANEL_SELECTOR).then((elm) => {
            $(REPORT_DEFINITON_PANEL_SELECTOR).on("remove", function () {
                console.log('Element is destoried');
                setTimeout(function () {
                    var instance = new ReplaceTextInReportFormulars();
                    instance.createReplaceTextInExpressionPanel();
                }, $TIME_OUT);
            });
            console.log('Element is ready');
            $(REPORT_DEFINITON_PANEL_SELECTOR + ' .reportTopPanel').append($CONTROL_PANEL);
            this.addReportConfig();
            this.addButtonAction();
            $(".detailLog").toggle();
        });
    }



    addReportConfig() {
        $($REPORT_CONFIG_OPTION_SELECTOR).append($('<option>', {
            value: -1,
            text: ''
        }));
        $PRE_CONFIGS.forEach(
            function addConfigOptions(item, index) {
                $($REPORT_CONFIG_OPTION_SELECTOR).append($('<option>', {
                    value: index,
                    text: item.name
                }));
            }
        );
        $($REPORT_CONFIG_OPTION_SELECTOR).on("change", function () {
            var selectedConfig = $($REPORT_CONFIG_OPTION_SELECTOR).val();
            $('.replaceValues .replaceItem.added').remove();
            $('.replaceValues .replaceItem .textInput').val('');
            if (selectedConfig >= 0) {
                console.log($PRE_CONFIGS);
                $PRE_CONFIGS[selectedConfig].params.forEach(
                    function addOption(item, index) {
                        if (index > 0) {
                            var instance = new ReplaceTextInReportFormulars();
                            instance.addReplaceValuesItem();
                        }
                        $('.replaceValues .replaceItem:last input.search').val(item.search);
                        $('.replaceValues .replaceItem:last input.replace').val(item.replace);
                    }
                );

            }
        });
    }



    addButtonAction() {
        $(".abortAutomation").click(function () {
            $ABORT = true;
        });
        $(".addInput").click(function () {
            var instance = new ReplaceTextInReportFormulars();
            instance.addReplaceValuesItem();
        });
        $(".checkFields").click(function () {
            var instance = new ReplaceTextInReportFormulars();
            instance.replaceValuesInExpressions();
        });
        $(".detailLogButton").click(function () {
            var instance = new ReplaceTextInReportFormulars();
            instance.showLogs();
        });
    }

    showLogs() {
        $(".detailLog").toggle();
        $(".detailLog .content").empty();
        var logs = "";
        var columns = "";
        for (var i = 0; i < $LOGS_EXPRESSION_CHANGES.length; i++) {
            columns += `<div class="detailLogColumn button" data-index="${i}">${$LOGS_EXPRESSION_CHANGES[i].column}</div>`;
        }
        $(".closeDetailog").click(function () {
            $(".detailLog").toggle();
        });

        logs += `<div>`;
        logs += `<div class="detailLogRow header">Columns</div>`;
        logs += `<div class="detailLogRow header">Old Formular</div>`;
        logs += `<div class="detailLogRow header">New Formular</div>`;
        logs += `<div class="detailLogRow">${columns}</div>`;
        logs += `<div class="detailLogRow old"></div>`;
        logs += `<div class="detailLogRow new"></div>`;
        logs += `</div>`;
        $(".detailLog .content").append(logs);
        $(".detailLogColumn").click(function () {
            console.log($(this));
            var index = $(this).attr('data-index');
            $(".detailLogRow.old").empty();
            $(".detailLogRow.new").empty();
            $(".detailLogRow.old").append($LOGS_EXPRESSION_CHANGES[index].old);
            $(".detailLogRow.new").append($LOGS_EXPRESSION_CHANGES[index].new);
        });
    }

    replaceValuesInExpressions() {
        $ABORT = false;
        console.log("click button check fields");
        this.setConfig();
        var links = $($SELECT_FIELDS_LIST_LINK_SELECTOR);
        links[0].click();
        if (!$ABORT) {
            $LOGS_EXPRESSION_CHANGES = [];
            this.processLinks(1, links);
        }
    }

    setConfig() {
        this.config = [];
        var tempConf = [];
        console.log(["find items", $(".replaceValues .replaceItem"), $(".replaceValues .replaceItem").text(), $("body").html()]);
        $(".replaceValues .replaceItem").each(
            function () {
                console.log(["for each", this]);
                var searchText = $.trim($(this).find(".search").val());
                console.log(["stext", searchText]);
                if (searchText === "") {
                    $($LOG_SELECTOR).val("Search value is empty");
                    $ABORT = true;
                }
                var replaceText = $.trim($(this).find(".replace").val());
                if (replaceText === "") {
                    $($LOG_SELECTOR).val("Replace value is empty");
                    $ABORT = true;
                }
                tempConf.push({ search: searchText, replace: replaceText });
            }
        );
        this.config = tempConf;
        console.log("conf", this.config);
    }

    addReplaceValuesItem() {
        $(".replaceValues").append($NEW_RPLACE_ITEM);
        $(".replaceValues .replaceItem:last .removeInput").click(function () {
            $(this).parent().remove();
        });
    }

    processLinks(index, linkList) {
        console.log(['processLinks', index, linkList]);
        if (index >= linkList.length) {
            $($LOG_SELECTOR).val("Finished checking!");
            console.log($LOGS_EXPRESSION_CHANGES);
            return;
        }
        var link = $(linkList[index]);
        var columnText = $.trim(link.text());
        $($LOG_SELECTOR).val("Checking: " + columnText);
        link.click();
        console.log(["processLinks -> clicked", link]);
        this.waitForTextToAppear(columnText, $SETTINGS_COLUMN_TEXT_SELECTOR, this.checkFieldIfExpressionMatch, [index, linkList, columnText], this.errorProcessLinks);
    }

    errorProcessLinks(args) {
        var index = args[0];
        var linkList = $($SELECT_FIELDS_LIST_LINK_SELECTOR);
        var instance = new ReplaceTextInReportFormulars();
        instance.processLinks(index, linkList);
    }

    checkFieldIfExpressionMatch(args) {
        console.log(['checkFieldIfExpressionMatch', args]);
        var index = args[0];
        var linkList = args[1];
        var columnText = args[2];
        var formular = $.trim($('.reportPropertiesPanel .BOGrid .fields-group-container .fields-group .field-editor-con input[name*="fullNameTextField"]').val());
        var includes = false;

        var instance = new ReplaceTextInReportFormulars();
        for (var i = 0; i < instance.config.length; i++) {
            if (formular.includes(instance.config[i].search)) {
                includes = true;
            }
        }
        if (includes) {
            console.log(["found", formular]);
            $('a.pnicon-formula-pencil').click();
            instance.waitForElmentToAppear($EXPRESSION_BUILDER_EXPRESSION_TEXTAREA_SELECTOR, instance.replaceTextInFormular, [index, linkList, columnText]);
        } else {
            instance.processLinks(index + 1, linkList);
        }
    }

    replaceTextInFormular(args) {
        console.log("replaceTextInFormular", args);
        var columnText = args[2];
        var expressionText = $($EXPRESSION_BUILDER_EXPRESSION_TEXTAREA_SELECTOR).val();
        var log = {
            column: columnText,
            old: expressionText,
            new: ''
        }
        var i;
        var instance = new ReplaceTextInReportFormulars();
        for (i = 0; i < instance.config.length; i++) {
            expressionText = expressionText.replaceAll(instance.config[i].search, $REPLACEMENT_STRING + i);
        }
        for (i = 0; i < instance.config.length; i++) {
            expressionText = expressionText.replaceAll($REPLACEMENT_STRING + i, instance.config[i].replace);
        }
        log.new = expressionText;
        $LOGS_EXPRESSION_CHANGES.push(log);
        console.log(["exp", expressionText]);
        $($EXPRESSION_BUILDER_EXPRESSION_TEXTAREA_SELECTOR).val(expressionText);
        $($EXPRESSION_BUILDER_EXPRESSION_TEXTAREA_SELECTOR).click();

        instance.waitForElmentToAppear($EXPRESSION_BUILDER_OKAY_BUTTON_SELECTOR + '[aria-disabled="false"]', instance.clickOkayInExpressionBuilder, args)
    }

    clickOkayInExpressionBuilder(args) {
        var index = args[0];
        var linkList = args[1];
        $($EXPRESSION_BUILDER_OKAY_BUTTON_SELECTOR).click();
        $($EXPRESSION_BUILDER_OKAY_BUTTON_SELECTOR).on("remove", function () {
            console.log('Expression builder closed');
            setTimeout(function () {
                var instance = new ReplaceTextInReportFormulars();
                instance.processLinks(index + 1, $($SELECT_FIELDS_LIST_LINK_SELECTOR));
            }, $TIME_OUT);
        });
    }

    waitForElmentToAppear(selector, callback, callbackArgs) {
        console.log(["waitForElmentToAppear", selector, callback, callbackArgs]);
        if ($ABORT) {
            return;
        }
        var elementFound = false;
        setTimeout(function () {
            elementFound = $(selector).length > 0;
            console.log(["compare", elementFound, selector, $(selector).length]);
            if (!elementFound) {
                var instance = new ReplaceTextInReportFormulars();
                instance.waitForElmentToAppear(selector, callback, callbackArgs);
            } else {
                console.log(["waitForElmentToAppear - callback", callbackArgs]);
                callback(callbackArgs);
            }
        }, $TIME_OUT);
    }

    waitForTextToAppear(compareText, selector, callback, callbackArgs, callbackOnFailure, counter) {
        console.log(["waitForTextToAppear", compareText, selector, callback, callbackArgs, callbackOnFailure, counter]);
        if ($ABORT) {
            return;
        }
        if (isNaN(counter)) {
            counter = 0;
        } else {
            counter++;
        }
        if (counter > 25) {
            // text did not appeared after 25 times
            callbackOnFailure(callbackArgs);
            return;
        }
        var labelText = "";
        setTimeout(function () {
            labelText = $.trim($(selector).val());
            console.log(["compare", labelText, compareText]);
            if (labelText != compareText) {
                var instance = new ReplaceTextInReportFormulars();
                instance.waitForTextToAppear(compareText, selector, callback, callbackArgs, callbackOnFailure, counter);
            } else {
                console.log(["waitForTextToAppear - callback", callbackArgs]);
                callback(callbackArgs);
            }
        }, $TIME_OUT);
    }


    waitForElm(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }
}

const myInstance = new ReplaceTextInReportFormulars();

(function () {
    'use strict';

    // Your code here...
    myInstance.createReplaceTextInExpressionPanel();
})();

if(module !== undefined && module.exports !== undefined) {
    module.exports = ReplaceTextInReportFormulars;
}