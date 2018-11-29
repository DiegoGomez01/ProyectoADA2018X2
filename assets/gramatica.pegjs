/*Código javascript que se ejecuta antes del parsing. 
Variables y funciones declaradas aqui se pueden acceder despues*/
{
  var globals = []; 
}
//Gramatica

 start =  programa

programa = _ Identifier

// ----- Léxico -----
SourceCharacter = .
_ "salto" = (WhiteSpace / LineTerminator / Comment)*
WhiteSpace "espacio en blanco" = "\t" / "\v" / "\f" / " " / "\u00A0" / "\uFEFF"
LineTerminator "fin de línea" = "\n" / "\r\n" / "\r" / "\u2028" / "\u2029" 
Comment "comentario" = MultiLineComment / SingleLineComment
MultiLineComment = "/*" (!"*/" SourceCharacter)* "*/"
SingleLineComment = "//" (!LineTerminator SourceCharacter)*
Identifier "Id" = !ReservedWord inicio:[a-z] fin:([a-zA-Z0-9_])* { return { type: "Id", name: inicio + fin.join("")}; }
// Literals
NullLiteral = NullToken { return { type: "Literal", value: null }; }
BooleanLiteral = TrueToken { return { type: "Literal", value: true  }; } / FalseToken { return { type: "Literal", value: false }; }
NumericLiteral "número" = [+-]? DecimalIntegerLiteral ("." DecimalDigit*)? { return { type: "Literal", value: parseFloat(text()) };}
  / [+-]? "." DecimalDigit+ { return { type: "Literal", value: parseFloat(text()) };}
DecimalIntegerLiteral = "0" / NonZeroDigit DecimalDigit*
DecimalDigit = [0-9]
NonZeroDigit = [1-9]
StringLiteral "string" = '"' (!('"') SourceCharacter)* '"' { return { type: "Literal", value: text() };}
/ "'" (!("'") SourceCharacter)* "'" { return { type: "Literal", value: text() };}

ReservedWord = Keyword / NullLiteral / BooleanLiteral

Literal = NullLiteral / BooleanLiteral / NumericLiteral / StringLiteral

Keyword = IfToken / ThenToken / ElseToken / EndIfToken / SwitchToken / CaseToken / OfToken / DefaultToken / 
  EndCaseToken / WhileToken / DoToken / EndWhileToken / RepeatToken / UntilToken / ForToken / ToToken /
  IncToken / DownToToken / EndForToken / FunctionToken / ProcedureToken / EntradaToken / SalidaToken /
  EntradaSToken / IntToken / FloatToken / BooleanToken / CharToken / StringToken / TrueToken / FalseToken /
  NullLiteral / ReturnToken

// Tokens  
IfToken         = "if"  
ThenToken       = "then"    
ElseToken       = "else"       
EndIfToken      = "endif"
SwitchToken     = "switch"     
CaseToken       = "case"
OfToken         = "of"
DefaultToken    = "default"    
EndCaseToken    = "endcase"
WhileToken      = "while"      
DoToken         = "do"         
EndWhileToken   = "endwhile"   
RepeatToken     = "repeat"      
UntilToken      = "until"
ForToken        = "for"        
ToToken         = "to"        
IncToken        = "inc"
DownToToken     = "downto"
EndForToken     = "endfor"    
FunctionToken   = "function" 
ProcedureToken  = "procedure" 
EntradaToken    = "E"
SalidaToken     = "S"
EntradaSToken   = "ES"
IntToken        = "int"
FloatToken      = "float"
BooleanToken    = "boolean"
CharToken       = "char"
StringToken     = "string"
TrueToken       = "true"       
FalseToken      = "false"      
NullToken       = "null"       
ReturnToken     = "return"     

// division = num1:NumericLiteral "/" num2:NumericLiteral { return { type: "Literal", value: (parseFloat(num1["value"]/parseFloat(num2["value"])))};}