// ==UserScript==
// @name         Reports - Replace text in formular - dev local
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
}

.detailLogRow {
    display: inline-block;
    width: 244px;
    vertical-align: top;
    border: solid 1px;
}

.detailLogButton {
    display:inline;
    background-color: gray;
}

.detailLogColumn.button {
    background-color: white;
}

.detailLogRow.header {
    background-color: darkgray;
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
                search: '30-04-2025',
                replace: '31-05-2025'
            },
            {
                search: '01-04-2025',
                replace: '01-05-2025'
            },
            {
                search: '31-03-2025',
                replace: '30-04-2025'
            },
            {
                search: '01-03-2025',
                replace: '01-04-2025'
            },
            {
                search: '"04-2025"',
                replace: '"05-2025"'
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
            <h2>Replacements:<h2>
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
    }

    createReplaceTextInExpressionPanel() {
        this.waitForElm(REPORT_DEFINITON_PANEL_SELECTOR).then((elm) => {
            $(REPORT_DEFINITON_PANEL_SELECTOR).on("remove", function () {
                console.log('Element is destoried');
                setTimeout(function () {
                    createReplaceTextInExpressionPanel();
                }, $TIME_OUT);
            });
            console.log('Element is ready');
            $(REPORT_DEFINITON_PANEL_SELECTOR + ' .reportTopPanel').append($CONTROL_PANEL);
            addReportConfig();
            addButtonAction();
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
                            addReplaceValuesItem();
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
            addReplaceValuesItem();
        });
        $(".checkFields").click(function () {
            replaceValuesInExpressions();
        });
        $(".detailLogButton").click(function () {
            showLogs();
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
        setConfig();
        var links = $($SELECT_FIELDS_LIST_LINK_SELECTOR);
        links[0].click();
        if (!$ABORT) {
            $LOGS_EXPRESSION_CHANGES = [];
            processLinks(1, links);
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
        waitForTextToAppear(columnText, $SETTINGS_COLUMN_TEXT_SELECTOR, checkFieldIfExpressionMatch, [index, linkList, columnText], errorProcessLinks);
    }

    errorProcessLinks(args) {
        var index = args[0];
        var linkList = $($SELECT_FIELDS_LIST_LINK_SELECTOR);
        processLinks(index, linkList);
    }

    checkFieldIfExpressionMatch(args) {
        console.log(['checkFieldIfExpressionMatch', args]);
        var index = args[0];
        var linkList = args[1];
        var columnText = args[2];
        var formular = $.trim($('.reportPropertiesPanel .BOGrid .fields-group-container .fields-group .field-editor-con input[name*="fullNameTextField"]').val());
        var includes = false;

        for (var i = 0; i < this.config.length; i++) {
            if (formular.includes(this.config[i].search)) {
                includes = true;
            }
        }
        if (includes) {
            console.log(["found", formular]);
            $('a.pnicon-formula-pencil').click();
            this.waitForElmentToAppear($EXPRESSION_BUILDER_EXPRESSION_TEXTAREA_SELECTOR, replaceTextInFormular, [index, linkList, columnText]);
        } else {
            processLinks(index + 1, linkList);
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
        for (var i = 0; i < this.config.length; i++) {
            expressionText = expressionText.replaceAll(this.config[i].search, $REPLACEMENT_STRING + i);
        }
        for (var i = 0; i < this.config.length; i++) {
            expressionText = expressionText.replaceAll($REPLACEMENT_STRING + i, this.config[i].replace);
        }
        log.new = expressionText;
        $LOGS_EXPRESSION_CHANGES.push(log);
        $($EXPRESSION_BUILDER_EXPRESSION_TEXTAREA_SELECTOR).val(expressionText);
        $($EXPRESSION_BUILDER_EXPRESSION_TEXTAREA_SELECTOR).click();

        //this.waitForElmentToAppear($EXPRESSION_BUILDER_OKAY_BUTTON_SELECTOR + '[aria-disabled="false"]', this.clickOkayInExpressionBuilder, args)
    }

    clickOkayInExpressionBuilder(args) {
        var index = args[0];
        var linkList = args[1];
        $($EXPRESSION_BUILDER_OKAY_BUTTON_SELECTOR).click();
        $($EXPRESSION_BUILDER_OKAY_BUTTON_SELECTOR).on("remove", function () {
            console.log('Expression builder closed');
            setTimeout(function () {
                processLinks(index + 1, $($SELECT_FIELDS_LIST_LINK_SELECTOR));
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
                this.waitForElmentToAppear(selector, callback, callbackArgs);
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
                waitForTextToAppear(compareText, selector, callback, callbackArgs, callbackOnFailure, counter);
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

// export default replaceTextInExpressionFormular;
module.exports = ReplaceTextInReportFormulars;