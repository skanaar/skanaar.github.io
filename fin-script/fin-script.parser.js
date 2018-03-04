/* parser generated by jison 0.4.13 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var parser = {trace: function trace(){},
yy: {},
symbols_: {"error":2,"root":3,"body":4,"EOF":5,"exp":6,"ID":7,"(":8,"args":9,")":10,"NUMBER":11,"TYPE":12,"SYM":13,"OP":14,",":15,"param":16,":":17,"params":18,"case":19,"CASE":20,"RETURN":21,"let":22,"LET":23,"=":24,"func":25,"FUNC":26,"{":27,"}":28,"RULE":29,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",7:"ID",8:"(",10:")",11:"NUMBER",12:"TYPE",13:"SYM",14:"OP",15:",",17:":",20:"CASE",21:"RETURN",23:"LET",24:"=",26:"FUNC",27:"{",28:"}",29:"RULE"},
productions_: [0,[3,2],[6,1],[6,4],[6,3],[6,2],[6,1],[6,5],[9,1],[9,3],[16,3],[18,1],[18,3],[19,4],[22,6],[25,12],[25,11],[25,11],[25,10],[25,7],[25,6],[4,1],[4,1],[4,1],[4,2],[4,2],[4,2]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
    $$[$0-1].default = {node:'number', value:'noaction', type:'Command', loc:{}};
    return $$[$0-1];
  
break;
case 2:this.$ = {node:'deref', name:$$[$0], loc:_$[$0]}; 
break;
case 3:this.$ = {node:'invoke', name:$$[$0-3], args:$$[$0-1], loc:_$[$0-3]}; 
break;
case 4:this.$ = {node:'invoke', name:$$[$0-2], args:[], loc:_$[$0-2]}; 
break;
case 5:this.$ = {node:'number', value:+$$[$0-1], type:$$[$0], loc:_$[$0-1]}; 
break;
case 6:this.$ = {node:'symbol', name:$$[$0], type:'Stock', loc:_$[$0]}; 
break;
case 7:this.$ = {node:'operator', operator:$$[$0-4], a:$$[$0-3], b:$$[$0-2], loc:_$[$0-4]}; 
break;
case 8:this.$ = [$$[$0]]; 
break;
case 9:this.$ = $$[$0-2].concat($$[$0]); 
break;
case 10:this.$ = {node:'param', name:$$[$0-2], type:$$[$0], loc:_$[$0-2]}; 
break;
case 11:this.$ = [$$[$0]]; 
break;
case 12:this.$ = $$[$0-2].concat($$[$0]); 
break;
case 13:this.$ = {node:'case', predicate:$$[$0-2], value: $$[$0], loc:_$[$0-3]}; 
break;
case 14:this.$ = {node:'let', name:$$[$0-4], type:$$[$0-2], value: $$[$0], loc:_$[$0-5]}; 
break;
case 15:this.$ = {node:'func', name:$$[$0-10], type: $$[$0-5], params: $$[$0-8], body: $$[$0-3], default: $$[$0], loc:_$[$0-11]}; $$[$0-3].params=$$[$0-8]; $$[$0-3].default=$$[$0]; 
break;
case 16:this.$ = {
      node:'func', name:$$[$0-9], type: $$[$0-4], params: $$[$0-7],
      body: {node:'body', cases:[], lets:[], funcs:[], params:$$[$0-7], default: $$[$0]},
      default: $$[$0], loc:_$[$0-10]};
    
break;
case 17:this.$ = {node:'func', name:$$[$0-9], type: $$[$0-5], params: [], body: $$[$0-3], default: $$[$0], loc:_$[$0-10]}; $$[$0-3].default = $$[$0]; 
break;
case 18:this.$ = {node:'func', name:$$[$0-8], type: $$[$0-4], params: [], body: {node:'body', cases:[], lets:[], funcs:[], params:[], default:$$[$0]}, default: $$[$0], loc:_$[$0-9]}; 
break;
case 19:this.$ = {node:'func', name:$$[$0-5], type: 'Command', params: [], body: $$[$0-3], default: $$[$0], loc:_$[$0-6]}; $$[$0-3].default = $$[$0]; 
break;
case 20:this.$ = {node:'func', name:$$[$0-4], type: 'Command', params: [], body: {node:'body', cases:[], lets:[], funcs:[], params:[], default:$$[$0]}, default: $$[$0], loc:_$[$0-5]}; 
break;
case 21:this.$ = {node:'body', cases:[$$[$0]], lets:[], funcs:[], params:[], loc:_$[$0]}; 
break;
case 22:this.$ = {node:'body', cases:[], lets:[$$[$0]], funcs:[], params:[], loc:_$[$0]}; 
break;
case 23:this.$ = {node:'body', cases:[], lets:[], funcs:[$$[$0]], params:[], loc:_$[$0]}; 
break;
case 24:this.$ = [$$[$0-1].cases.push($$[$0]), $$[$0-1]][1]; 
break;
case 25:this.$ = [$$[$0-1].lets.push($$[$0]), $$[$0-1]][1]; 
break;
case 26:this.$ = [$$[$0-1].funcs.push($$[$0]), $$[$0-1]][1]; 
break;
}
},
table: [{3:1,4:2,19:3,20:[1,6],22:4,23:[1,7],25:5,26:[1,8],29:[1,9]},{1:[3]},{5:[1,10],19:11,20:[1,6],22:12,23:[1,7],25:13,26:[1,8],29:[1,9]},{5:[2,21],20:[2,21],23:[2,21],26:[2,21],28:[2,21],29:[2,21]},{5:[2,22],20:[2,22],23:[2,22],26:[2,22],28:[2,22],29:[2,22]},{5:[2,23],20:[2,23],23:[2,23],26:[2,23],28:[2,23],29:[2,23]},{6:14,7:[1,15],8:[1,18],11:[1,16],13:[1,17]},{7:[1,19]},{7:[1,20]},{7:[1,21]},{1:[2,1]},{5:[2,24],20:[2,24],23:[2,24],26:[2,24],28:[2,24],29:[2,24]},{5:[2,25],20:[2,25],23:[2,25],26:[2,25],28:[2,25],29:[2,25]},{5:[2,26],20:[2,26],23:[2,26],26:[2,26],28:[2,26],29:[2,26]},{21:[1,22]},{5:[2,2],8:[1,23],10:[2,2],14:[2,2],15:[2,2],20:[2,2],21:[2,2],23:[2,2],26:[2,2],28:[2,2],29:[2,2]},{12:[1,24]},{5:[2,6],10:[2,6],14:[2,6],15:[2,6],20:[2,6],21:[2,6],23:[2,6],26:[2,6],28:[2,6],29:[2,6]},{6:25,7:[1,15],8:[1,18],11:[1,16],13:[1,17]},{17:[1,26]},{8:[1,27]},{27:[1,28]},{6:29,7:[1,15],8:[1,18],11:[1,16],13:[1,17]},{6:32,7:[1,15],8:[1,18],9:30,10:[1,31],11:[1,16],13:[1,17]},{5:[2,5],10:[2,5],14:[2,5],15:[2,5],20:[2,5],21:[2,5],23:[2,5],26:[2,5],28:[2,5],29:[2,5]},{14:[1,33]},{12:[1,34]},{7:[1,38],10:[1,36],16:37,18:35},{4:39,19:3,20:[1,6],22:4,23:[1,7],25:5,26:[1,8],28:[1,40],29:[1,9]},{5:[2,13],20:[2,13],23:[2,13],26:[2,13],28:[2,13],29:[2,13]},{10:[1,41],15:[1,42]},{5:[2,4],10:[2,4],14:[2,4],15:[2,4],20:[2,4],21:[2,4],23:[2,4],26:[2,4],28:[2,4],29:[2,4]},{10:[2,8],15:[2,8]},{6:43,7:[1,15],8:[1,18],11:[1,16],13:[1,17]},{24:[1,44]},{10:[1,45],15:[1,46]},{17:[1,47]},{10:[2,11],15:[2,11]},{17:[1,48]},{19:11,20:[1,6],22:12,23:[1,7],25:13,26:[1,8],28:[1,49],29:[1,9]},{21:[1,50]},{5:[2,3],10:[2,3],14:[2,3],15:[2,3],20:[2,3],21:[2,3],23:[2,3],26:[2,3],28:[2,3],29:[2,3]},{6:51,7:[1,15],8:[1,18],11:[1,16],13:[1,17]},{10:[1,52]},{6:53,7:[1,15],8:[1,18],11:[1,16],13:[1,17]},{17:[1,54]},{7:[1,38],16:55},{12:[1,56]},{12:[1,57]},{21:[1,58]},{6:59,7:[1,15],8:[1,18],11:[1,16],13:[1,17]},{10:[2,9],15:[2,9]},{5:[2,7],10:[2,7],14:[2,7],15:[2,7],20:[2,7],21:[2,7],23:[2,7],26:[2,7],28:[2,7],29:[2,7]},{5:[2,14],20:[2,14],23:[2,14],26:[2,14],28:[2,14],29:[2,14]},{12:[1,60]},{10:[2,12],15:[2,12]},{27:[1,61]},{10:[2,10],15:[2,10]},{6:62,7:[1,15],8:[1,18],11:[1,16],13:[1,17]},{5:[2,20],20:[2,20],23:[2,20],26:[2,20],28:[2,20],29:[2,20]},{27:[1,63]},{4:64,19:3,20:[1,6],22:4,23:[1,7],25:5,26:[1,8],28:[1,65],29:[1,9]},{5:[2,19],20:[2,19],23:[2,19],26:[2,19],28:[2,19],29:[2,19]},{4:66,19:3,20:[1,6],22:4,23:[1,7],25:5,26:[1,8],28:[1,67],29:[1,9]},{19:11,20:[1,6],22:12,23:[1,7],25:13,26:[1,8],28:[1,68],29:[1,9]},{21:[1,69]},{19:11,20:[1,6],22:12,23:[1,7],25:13,26:[1,8],28:[1,70],29:[1,9]},{21:[1,71]},{21:[1,72]},{6:73,7:[1,15],8:[1,18],11:[1,16],13:[1,17]},{21:[1,74]},{6:75,7:[1,15],8:[1,18],11:[1,16],13:[1,17]},{6:76,7:[1,15],8:[1,18],11:[1,16],13:[1,17]},{5:[2,18],20:[2,18],23:[2,18],26:[2,18],28:[2,18],29:[2,18]},{6:77,7:[1,15],8:[1,18],11:[1,16],13:[1,17]},{5:[2,16],20:[2,16],23:[2,16],26:[2,16],28:[2,16],29:[2,16]},{5:[2,17],20:[2,17],23:[2,17],26:[2,17],28:[2,17],29:[2,17]},{5:[2,15],20:[2,15],23:[2,15],26:[2,15],28:[2,15],29:[2,15]}],
defaultActions: {10:[2,1]},
parseError: function parseError(str,hash){if(hash.recoverable){this.trace(str)}else{throw new Error(str)}},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                this.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.2.1 */
var lexer = (function(){
var lexer = {

EOF:1,

parseError:function parseError(str,hash){if(this.yy.parser){this.yy.parser.parseError(str,hash)}else{throw new Error(str)}},

// resets the lexer, sets new input
setInput:function (input){this._input=input;this._more=this._backtrack=this.done=false;this.yylineno=this.yyleng=0;this.yytext=this.matched=this.match="";this.conditionStack=["INITIAL"];this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0};if(this.options.ranges){this.yylloc.range=[0,0]}this.offset=0;return this},

// consumes and returns one char from the input
input:function (){var ch=this._input[0];this.yytext+=ch;this.yyleng++;this.offset++;this.match+=ch;this.matched+=ch;var lines=ch.match(/(?:\r\n?|\n).*/g);if(lines){this.yylineno++;this.yylloc.last_line++}else{this.yylloc.last_column++}if(this.options.ranges){this.yylloc.range[1]++}this._input=this._input.slice(1);return ch},

// unshifts one char (or a string) into the input
unput:function (ch){var len=ch.length;var lines=ch.split(/(?:\r\n?|\n)/g);this._input=ch+this._input;this.yytext=this.yytext.substr(0,this.yytext.length-len-1);this.offset-=len;var oldLines=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1);this.matched=this.matched.substr(0,this.matched.length-1);if(lines.length-1){this.yylineno-=lines.length-1}var r=this.yylloc.range;this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:lines?(lines.length===oldLines.length?this.yylloc.first_column:0)+oldLines[oldLines.length-lines.length].length-lines[0].length:this.yylloc.first_column-len};if(this.options.ranges){this.yylloc.range=[r[0],r[0]+this.yyleng-len]}this.yyleng=this.yytext.length;return this},

// When called from action, caches matched text and appends it on next action
more:function (){this._more=true;return this},

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function (){if(this.options.backtrack_lexer){this._backtrack=true}else{return this.parseError("Lexical error on line "+(this.yylineno+1)+". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})}return this},

// retain first n characters of the match
less:function (n){this.unput(this.match.slice(n))},

// displays already matched input, i.e. for error messages
pastInput:function (){var past=this.matched.substr(0,this.matched.length-this.match.length);return(past.length>20?"...":"")+past.substr(-20).replace(/\n/g,"")},

// displays upcoming input, i.e. for error messages
upcomingInput:function (){var next=this.match;if(next.length<20){next+=this._input.substr(0,20-next.length)}return(next.substr(0,20)+(next.length>20?"...":"")).replace(/\n/g,"")},

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function (){var pre=this.pastInput();var c=new Array(pre.length+1).join("-");return pre+this.upcomingInput()+"\n"+c+"^"},

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match,indexed_rule){var token,lines,backup;if(this.options.backtrack_lexer){backup={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done};if(this.options.ranges){backup.yylloc.range=this.yylloc.range.slice(0)}}lines=match[0].match(/(?:\r\n?|\n).*/g);if(lines){this.yylineno+=lines.length}this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:lines?lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+match[0].length};this.yytext+=match[0];this.match+=match[0];this.matches=match;this.yyleng=this.yytext.length;if(this.options.ranges){this.yylloc.range=[this.offset,this.offset+=this.yyleng]}this._more=false;this._backtrack=false;this._input=this._input.slice(match[0].length);this.matched+=match[0];token=this.performAction.call(this,this.yy,this,indexed_rule,this.conditionStack[this.conditionStack.length-1]);if(this.done&&this._input){this.done=false}if(token){return token}else if(this._backtrack){for(var k in backup){this[k]=backup[k]}return false}return false},

// return next match in input
next:function (){if(this.done){return this.EOF}if(!this._input){this.done=true}var token,match,tempMatch,index;if(!this._more){this.yytext="";this.match=""}var rules=this._currentRules();for(var i=0;i<rules.length;i++){tempMatch=this._input.match(this.rules[rules[i]]);if(tempMatch&&(!match||tempMatch[0].length>match[0].length)){match=tempMatch;index=i;if(this.options.backtrack_lexer){token=this.test_match(tempMatch,rules[i]);if(token!==false){return token}else if(this._backtrack){match=false;continue}else{return false}}else if(!this.options.flex){break}}}if(match){token=this.test_match(match,rules[index]);if(token!==false){return token}return false}if(this._input===""){return this.EOF}else{return this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})}},

// return next match that has a token
lex:function lex(){var r=this.next();if(r){return r}else{return this.lex()}},

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition){this.conditionStack.push(condition)},

// pop the previously active lexer condition state off the condition stack
popState:function popState(){var n=this.conditionStack.length-1;if(n>0){return this.conditionStack.pop()}else{return this.conditionStack[0]}},

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules(){if(this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]){return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules}else{return this.conditions["INITIAL"].rules}},

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n){n=this.conditionStack.length-1-Math.abs(n||0);if(n>=0){return this.conditionStack[n]}else{return"INITIAL"}},

// alias for begin(condition)
pushState:function pushState(condition){this.begin(condition)},

// return the number of states currently on the stack
stateStackSize:function stateStackSize(){return this.conditionStack.length},
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 23
break;
case 2:return 20
break;
case 3:return 26
break;
case 4:return 29
break;
case 5:return 7
break;
case 6:return 12
break;
case 7:return 11
break;
case 8:return 13
break;
case 9:return 21
break;
case 10:return 14
break;
case 11:return 24
break;
case 12:return 17
break;
case 13:return 15
break;
case 14:return 8
break;
case 15:return 10
break;
case 16:return '['
break;
case 17:return ']'
break;
case 18:return 27
break;
case 19:return 28
break;
case 20:return 5
break;
case 21:return 'INVALID'
break;
}
},
rules: [/^(?:\s+)/,/^(?:let\b)/,/^(?:case\b)/,/^(?:func\b)/,/^(?:rule\b)/,/^(?:[a-z_]+)/,/^(?:[A-Z%][a-z_]*)/,/^(?:[0-9_]+)/,/^(?:[#][A-Z]+)/,/^(?:=>)/,/^(?:[-+<>*/])/,/^(?:=)/,/^(?::)/,/^(?:,)/,/^(?:\()/,/^(?:\))/,/^(?:\[)/,/^(?:\])/,/^(?:\{)/,/^(?:\})/,/^(?:$)/,/^(?:.)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21],"inclusive":true}}
};
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args){if(!args[1]){console.log("Usage: "+args[0]+" FILE");process.exit(1)}var source=require("fs").readFileSync(require("path").normalize(args[1]),"utf8");return exports.parser.parse(source)};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}