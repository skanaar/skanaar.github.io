%lex
%%
\s+            /* skip whitespace */
"let"          return 'LET'
"case"         return 'CASE'
"func"         return 'FUNC'
"rule"         return 'RULE'
[a-z_]+        return 'ID'
[A-Z%][a-z_]*  return 'TYPE'
[-]?[0-9_]*\.?[0-9_]+        return 'NUMBER'
[#][A-Z0-9]+   return 'SYM'
"=>"           return 'RETURN'
[-+<>*/]       return 'OP'
"="            return '='
":"            return ':'
","            return ','
"("            return '('
")"            return ')'
"["            return '['
"]"            return ']'
"{"            return '{'
"}"            return '}'
<<EOF>>        return 'EOF'
.              return 'INVALID'
/lex

%start root
%% /* -------------------------------------- */

root
  : body EOF                 {
    $1.default = {node:'number', value:'noaction', type:'Command', loc:{}};
    return $1;
  };

exp
  : ID                       {$$ = {node:'deref', name:$1, loc:[@1,@1]}; }
  | ID '(' args ')'          {$$ = {node:'invoke', name:$1, args:$3, loc:[@1,@4]}; }
  | ID '(' ')'               {$$ = {node:'invoke', name:$1, args:[], loc:[@1,@3]}; }
  | NUMBER TYPE              {$$ = 
    {node:'number', value:($2==='%'?(+$1)/100:+$1), type:($2==='%'?'Factor':$2), loc:[@1,@2]};
  }
  | SYM                      {$$ = {node:'symbol', name:$1, type:'Stock', loc:[@1,@1]}; }
  | '(' exp OP exp ')'       {$$ = {node:'operator', lhs:$2, operator:$3, rhs:$4, loc:[@1,@5]}; };

args
  : exp                      {$$ = [$1]; }
  | args ',' exp             {$$ = $1.concat($3); };

param
  : ID ':' TYPE              {$$ = {node:'param', name:$1, type:$3, loc:[@1,@3]}; };

params
  : param                    {$$ = [$1]; }
  | params ',' param         {$$ = $1.concat($3); };

case
  : CASE exp RETURN exp      {$$ = {node:'case', predicate:$2, value: $4, loc:[@1,@4]}; };

let
  : LET ID ':' TYPE '=' exp  {$$ = {node:'let', name:$2, type:($4=='%'?'Factor':$4), value: $6, loc:[@1,@6]}; };

func
  : FUNC ID '(' params ')' ':' TYPE '{' body '}' RETURN exp
    {$$ = {node:'func', name:$2, type: $7, params: $4, body: $9, default: $12, loc:[@1,@5]}; $9.params=$4; $9.default=$12; }
  | FUNC ID '(' params ')' ':' TYPE '{' '}' RETURN exp 
    {$$ = {
      node:'func', name:$2, type: $7, params: $4,
      body: {node:'body', cases:[], lets:[], funcs:[], params:$4, default: $11},
      default: $11, loc:[@1,@5]};
    }
  | FUNC ID '(' ')' ':' TYPE '{' body '}' RETURN exp 
    {$$ = {node:'func', name:$2, type: $6, params: [], body: $8, default: $11, loc:[@1,@4]}; $8.default = $11; }
  | FUNC ID '(' ')' ':' TYPE '{' '}' RETURN exp 
    {$$ = {node:'func', name:$2, type: $6, params: [], body: {node:'body', cases:[], lets:[], funcs:[], params:[], default:$10}, default: $10, loc:[@1,@4]}; }
  | RULE ID '{' body '}' RETURN exp
    {$$ = {node:'func', name:$2, type: 'Command', params: [], body: $4, default: $7, loc:[@1,@2]}; $4.default = $7; }
  | RULE ID '{' '}' RETURN exp
    {$$ = {node:'func', name:$2, type: 'Command', params: [], body: {node:'body', cases:[], lets:[], funcs:[], params:[], default:$6}, default: $6, loc:[@1,@2]}; };

body 
  : case                     {$$ = {node:'body', cases:[$1], lets:[], funcs:[], params:[], loc:@1}; }
  | let                      {$$ = {node:'body', cases:[], lets:[$1], funcs:[], params:[], loc:@1}; }
  | func                     {$$ = {node:'body', cases:[], lets:[], funcs:[$1], params:[], loc:@1}; }
  | body case                {$$ = [$1.cases.push($2), $1][1]; }
  | body let                 {$$ = [$1.lets.push($2), $1][1]; }
  | body func                {$$ = [$1.funcs.push($2), $1][1]; };



