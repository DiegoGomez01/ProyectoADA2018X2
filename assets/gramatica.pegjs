/*Código javascript que se ejecuta antes del parsing. 
Variables y funciones declaradas aquí se pueden acceder después*/
{
  var globals = []; 

  function isInt(n) {
    return n % 1 === 0;
  }
  
  function extractList(list, index) {
    return list.map(function(element) { return element[index]; });
  }

  function buildList(head, tail, index) {
    return [head].concat(extractList(tail, index));
  }

  function getParams(paramsTokens) {
    var params = [];
    for (let index = 0; index < paramsTokens.length; index++) {
        const element = paramsTokens[index];
        if (typeof params[element.id] != "undefined") {
          error ("Ya existe un parametro con el id: " + element.id);
        }
        params[element.id] = {mode: element.mode, type: element.type}
    }
    return params;
  }

}

//---------- Gramática ----------

start =  programa 

programa = _ VariableStatement

// ----- Léxico -----
SourceCharacter = .
_ "salto" = (WhiteSpace / LineTerminator / Comment)*
WhiteSpace "espacio en blanco" = "\t" / "\v" / "\f" / " " / "\u00A0" / "\uFEFF"
LineTerminator "fin de línea" = "\n" / "\r\n" / "\r" / "\u2028" / "\u2029" 
Comment "comentario" = MultiLineComment / SingleLineComment
MultiLineComment = "/*" (!"*/" SourceCharacter)* "*/"
SingleLineComment = "//" (!LineTerminator SourceCharacter)*
Identifier "Id" = !ReservedWord [a-z] IdentifierPart* { return text();}
IdentifierPart = [a-zA-Z0-9_]
// Literales
NullLiteral = NullToken { return null; }
BooleanLiteral = TrueToken { return true; } / FalseToken { return false; }
NumericLiteral "número" = [+-]? DecimalIntegerLiteral ("." DecimalDigit*)? { return parseFloat(text());}
  / [+-]? "." DecimalDigit+ { return parseFloat(text());}
DecimalIntegerLiteral = "0" / NonZeroDigit DecimalDigit*
DecimalDigit = [0-9]
NonZeroDigit = [1-9]
StringLiteral "string" = '"' txt:DQString '"' { return txt;}
/ "'" txt:SQString "'" { return txt;}
DQString = (!('"') SourceCharacter)* {return text()}
SQString = (!("'") SourceCharacter)* {return text()}

// Palabras Reservadas
Literal = NullLiteral / BooleanLiteral / NumericLiteral / StringLiteral
ReservedWord = Keyword / NullLiteral / BooleanLiteral
TypesVar = IntToken / FloatToken / BooleanToken / CharToken / StringToken
ModePar = EntradaToken / SalidaToken / ESToken
Keyword = IfToken / ThenToken / ElseToken / EndIfToken / SwitchToken / CaseToken / OfToken / DefaultToken / 
  EndCaseToken / WhileToken / DoToken / EndWhileToken / RepeatToken / UntilToken / ForToken / ToToken /
  IncToken / DownToToken / EndForToken / FunctionToken / ProcedureToken / EntradaToken / SalidaToken /
  ESToken / IntToken / FloatToken / BooleanToken / CharToken / StringToken / TrueToken / FalseToken /
  NullLiteral / ReturnToken

// Tokens  
VarToken        = "var"           !IdentifierPart
IfToken         = "if"            !IdentifierPart
ThenToken       = "then"          !IdentifierPart
ElseToken       = "else"          !IdentifierPart
EndIfToken      = "endif"         !IdentifierPart
SwitchToken     = "switch"        !IdentifierPart
CaseToken       = "case"          !IdentifierPart
OfToken         = "of"            !IdentifierPart
DefaultToken    = "default"       !IdentifierPart
EndCaseToken    = "endcase"       !IdentifierPart
WhileToken      = "while"         !IdentifierPart
DoToken         = "do"            !IdentifierPart
EndWhileToken   = "endwhile"      !IdentifierPart
RepeatToken     = "repeat"        !IdentifierPart
UntilToken      = "until"         !IdentifierPart
ForToken        = "for"           !IdentifierPart
ToToken         = "to"            !IdentifierPart
IncToken        = "inc"           !IdentifierPart
DownToToken     = "downto"        !IdentifierPart
EndForToken     = "endfor"        !IdentifierPart
FunctionToken   = "function"      !IdentifierPart
ProcedureToken  = "procedure"     !IdentifierPart
EntradaToken    = "E"             !IdentifierPart
SalidaToken     = "S"             !IdentifierPart
ESToken         = "ES"            !IdentifierPart
IntToken        = "int"           !IdentifierPart
FloatToken      = "float"         !IdentifierPart
BooleanToken    = "boolean"       !IdentifierPart
CharToken       = "char"          !IdentifierPart
StringToken     = "string"        !IdentifierPart
TrueToken       = "true"          !IdentifierPart
FalseToken      = "false"         !IdentifierPart
NullToken       = "null"          !IdentifierPart
ReturnToken     = "return"        !IdentifierPart

// division = num1:NumericLiteral "/" num2:NumericLiteral { return { type: "Literal", value: (parseFloat(num1["value"]/parseFloat(num2["value"])))};}

// ----- Expresiones -----

// ----- Declaraciones -----
Statement = VariableStatement / ReturnStatement

// Retorno
ReturnStatement = _ ReturnToken WhiteSpace+ id:Identifier { return id;}

//Decraración de Variables 
VariableStatement = VarToken WhiteSpace* LineTerminator _ VariableDeclaration* {return undefined;}
VariableDeclaration = type:TypesVar _ head:Identifier _ tail:(_","_ Identifier)* _ valini:AssignmentVariable? _ {
      if (valini == undefined){
        switch (type[0]) {
          case "string":
          case "char":
            valini = "";                  
          break;
          case "float":
          case "int":
            valini = 0;                                               
          break;
          case "boolean":
            valini = true;                    
          break;
        }            
      } else {     
        switch (type[0]) {
          case "string":
            if (typeof valini != "string") {
              error ("El valor inicial debe ser String");
            }
          break;
          case "char":
            if (typeof valini != "string" || valini.length != 1) {
              error ("El valor inicial debe ser Char");
            }                    
          break;
          case "float":
            if (typeof valini != "number") {
              error ("El valor inicial debe ser Float");
            }                       
          break;
          case "int":
            if (typeof valini != "number" || !isInt(valini)) {
              error ("El valor inicial debe ser Integer");
            }                       
          break;
          case "boolean":
            if (typeof valini != "boolean") {
              error ("El valor inicial debe ser Boolean");
            }                      
          break;
        }
      }
      var listVars = buildList(head, tail, 3);
      for (let index = 0; index < listVars.length; index++) {
        const name = listVars[index];
        if (typeof globals[name] != "undefined") {
          error ("Ya existe una variable con el id: " + name);
        }
        globals[name] = {type: type[0],value: valini};
      }
      return undefined;
}
AssignmentVariable = "<-" _? valini:Literal { return valini;}

// ----- Funciones, Procedimientos y Programas -----
FunctionDeclaration = FunctionToken _ type:TypesVar _ id:Identifier _ "(" _ params:(FormalParameterList)? _ ")" _ 
    VariableStatement "{" _ body:FPBody _ ReturnStatement _"}" _ {
      return {
        params: getParams(params),
        id: id,
        type: type[0]
      };
}

ProcedureDeclaration = ProcedureToken _ id:Identifier _ "(" _ params:(FormalParameterList)? _ ")" _ 
    VariableStatement "{" _ body:FPBody _ "}" _ {
      return {
        params: getParams(params),
        id: id
      };
}

FormalParameterList = head:Parameter tail:(_ "," _ Parameter)* { return buildList(head, tail, 3);}
Parameter = mode:ModePar WhiteSpace+ type:TypesVar WhiteSpace+ id:Identifier { return {mode: mode[0], type: type[0], id: id};}
FPBody = ""