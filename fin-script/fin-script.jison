%lex
%%
\s+            /* skip whitespace */
"let"          return 'LET'
"case"         return 'CASE'
"func"         return 'FUNC'
"rule"         return 'RULE'
[a-z_]+        return 'ID'
[A-Z%][a-z_]*  return 'TYPE'
[0-9_]+        return 'NUMBER'
[#][A-Z]+      return 'SYM'
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
  : lines EOF                { return $1; };

exp
  : ID                       {$$ = {node:'deref', name:$1}; }
  | ID '(' args ')'          {$$ = {node:'invoke', name:$1, args:$3}; }
  | ID '(' ')'               {$$ = {node:'invoke', name:$1, args:[]}; }
  | func_invoke              {$$ = $1; }
  | NUMBER TYPE              {$$ = {node: 'number', value:$1, unit:$2}; }
  | SYM                      {$$ = $1; }
  | '(' exp OP exp ')'       {$$ = {node:'expr', operator:$1, a:$2, b:$3}; };

args
  : exp                      {$$ = [$1]; }
  | args ',' exp             {$$ = $1.concat($3); };

param
  : ID ':' TYPE              {$$ = {node:'param', name:$1, type:$3}; };

params
  : param                    {$$ = [$1]; }
  | params ',' param         {$$ = $1.concat($3); };

case
  : CASE exp RETURN exp      {$$ = {node:'case', predicate:$2, value: $4}; };

let
  : LET ID ':' TYPE '=' exp  {$$ = {node:'let', name:$2, type:$4, value: $6}; };

func
  : FUNC ID '(' params ')' ':' TYPE '{' lines '}' RETURN exp
    {$$ = {node:'func', name:$2, type: $7, params: $4, body: $9, default: $12}; }
  | FUNC ID '(' params ')' ':' TYPE '{' '}' RETURN exp 
    {$$ = {node:'func', name:$2, type: $7, params: $4, body: [], default: $11}; }
  | FUNC ID '(' ')' ':' TYPE '{' lines '}' RETURN exp 
    {$$ = {node:'func', name:$2, type: $6, params: [], body: $8, default: $11}; }
  | FUNC ID '(' ')' ':' TYPE '{' '}' RETURN exp 
    {$$ = {node:'func', name:$2, type: $6, params: [], body: [], default: $10}; }
  | RULE ID '{' lines '}' RETURN exp
    {$$ = {node:'func', name:$2, type: 'Command', params: [], body: $4, default: $7}; }
  | RULE ID '{' '}' RETURN exp
    {$$ = {node:'func', name:$2, type: 'Command', params: [], body: [], default: $6}; };

lines 
  : case                     {$$ = {node:'body', cases: [$1], lets: [], funcs: []}; }
  | let                      {$$ = {node:'body', cases: [], lets: [$1], funcs: []}; }
  | func                     {$$ = {node:'body', cases: [], lets: [], funcs: [$1]}; }
  | lines case               {$$ = [$1.cases.push($2), $1][1]; }
  | lines let                {$$ = [$1.lets.push($2), $1][1]; }
  | lines func               {$$ = [$1.funcs.push($2), $1][1]; };




