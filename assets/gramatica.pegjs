/*
------ Data Type (Tipado Fuerte) ------
"int" , "float" , "boolean" , "string", "char"
DataType[][] (Arreglos)
pila<DataType> (Pilas)
cola<DataType> (Colas)
lista<DataType> (Listas)
------ Data Structure ------
params = {id:{mode:"e|s|es",dataType:"",pos""}}
FormalParameterList = [{id:"", mode:"", dataType:""}]
literal = {type:"Literal", dataType:"", value:""}
variable = {type:"Variable", id:"", dataType:""}
expression = {type:"int|float|boolean", operator:"", left:"", right:""} | Variable | Literal | FunctionCall (CallExpression)
NegationExpression = {type:"boolean", operator: "not", argument: Expression (Boolean)}
callexpression = {type:"CallExpression", callee:id, arguments:arguments}
ArrayAccess = {type:"ArrayAccess", id:"", index:[], dataType:""}
arguments = [expression,expression...]
statements = [statement,statement...]
---Statements---
AssignmentStatement = {type:"AssignmentStatement", left:"", right:"", line:""}
IfStatement = {type:"IfStatement", test:"", consequent:"", *alternate:"", line:""}
SwitchStatement = {type:"SwitchStatement", exp: "", cases:[], *defaultCase:"", line:""}
defaultCase = {block:"", line:""}
cases = {caseVal:"", block:"", line:""}
RepeatUntilStatement = {type:"RepeatUntilStatement", body:"", test:"", line:""}
WhileStatement = {type:"WhileStatement", test:"", body:"", line:""}
ForStatement = {type:"ForStatement", varFor:"", iniValue:"", finValue:"", inc:"" ,body:"" , line:""}

GLOBALS =  {"idVar":{value:"", dataType:""}}
SUBPROGRAMS = {"idFunOrPro":{type:"procedure|function", params:params , *dataType:"", body:body}}
PARAMSACT = params -> Parametros de la función o procedimiento actual (Variables locales)

buscar: "Limited" para encontrar las acciones que no se pueden realizar en un programa
*/

/*Código javascript que se ejecuta antes del parsing. 
Variables y funciones declaradas aquí se pueden acceder en la gramática*/
{
  var GLOBALS = {};
  var SUBPROGRAMS = {};
  var PARAMSACT = undefined;

  function sizeObj(obj) {
    return Object.keys(obj).length;
  }

  function createArray(dimensions, value) {
    if (dimensions.length > 0) {
        var dim = dimensions[0];
        var rest = dimensions.slice(1);
        var newArray = new Array();
        for (var i = 0; i < dim; i++) {
            newArray[i] = createArray(rest, value);
        }
        return newArray;
     } else {
        return value;
     }
  }

  function checkArrayDimensions(array, dimensions) {
    var dim = dimensions[0];
    var rest = dimensions.slice(1);
    if (array.length != dim) {
      return false;
    }
    for (var i = 0; i < dim; i++) {
      if (rest.length > 0 && Array.isArray(array[i])) {
        if (!checkArrayDimensions(array[i], rest)) {
          return false;
        }
      } else if (Array.isArray(array[i])) {
        return false;
      }
    }    
    return true;
  }

  function cloneArray(arr) {
    if (Array.isArray(arr)) {
      var i, copy;
      copy = arr.slice(0);
      for (i = 0; i < copy.length; i++) {
          copy[i] = cloneArray(copy[i]);
      }
      return copy;
    } else {
      return arr;
    }
  }

  function getDataTypeofExpression(exp) {
    if (exp.dataType !== undefined) {
      return exp.dataType;
    }
    switch (exp.type) {
      case "CallExpression":
        return SUBPROGRAMS[exp.callee].dataType;
      break;
      case "CeilingFunction":
      case "FloorFunction":
        return "int";
      break;
      default:
        return exp.type;
      break;            
    }
  }

  function checkDataTypeExpressions(expLeftDataType, expRightDataType) {
    return ((expLeftDataType != expRightDataType) && !(expLeftDataType == "float" && expRightDataType == "int"));
  }
  
  function extractList(list, index) {
    return list.map(function(element) {return element[index];});
  }

  function buildList(head, tail, index) {
    return [head].concat(extractList(tail, index));
  }

  function createSubProgram(type, dataType, id, paramsTokens) {
    var params = {};
    for (let index = 0; index < paramsTokens.length; index++) {
        const element = paramsTokens[index];
        if (typeof params[element.id] != "undefined") {
          error("Ya existe un parametro con el id: " + element.id);
        }
        params[element.id] = {mode: element.mode, dataType: element.dataType, pos:index}
    }
    PARAMSACT = params;    
    SUBPROGRAMS[id] = {
      type: type,
      params: params,
    };
    if (dataType !== undefined) {
      SUBPROGRAMS[id].dataType = dataType;
    }
  }

  function buildNumericExpression(head, tail) {
    return tail.reduce(function(result, element) {
      let typeExp = "int";
      if (getDataTypeofExpression(result) == "float" || getDataTypeofExpression(element[3]) == "float") {
        typeExp = "float";
      }
      return {
        type: typeExp,
        operator: element[1],
        left: result,
        right: element[3]
      };
    }, head);
  }

  function buildLogicalExpression(head, tail) {
    return tail.reduce(function(result, element) {
      return {
        type: "boolean",
        operator: element[1],
        left: result,
        right: element[3]
      };
    }, head);
  }
}

//---------- Gramática ----------

// start = __ VariableDeclaration //Pruebas
start = __ SubProgramDeclaration (_f SubProgramDeclaration)* __ {
  return {
    GLOBALS:GLOBALS,
    SUBPROGRAMS:SUBPROGRAMS
  };
}

// ----- Léxico -----
SourceCharacter = .

__ = (WhiteSpace / LineTerminator / Comment)*

_f = _ LineTerminator __

_ = (WhiteSpace / Comment)*

WhiteSpace "espacio" = "\t" / "\v" / "\f" / " " / "\u00A0" / "\uFEFF"

LineTerminator "final de línea" = "\n" / "\r\n" / "\r" / "\u2028" / "\u2029" 

Comment "comentario" = MultiLineComment / SingleLineComment

MultiLineComment = "/*" (!"*/" SourceCharacter)* "*/"

SingleLineComment = "//" (!LineTerminator SourceCharacter)*

Identifier "Id" = !ReservedWord [a-z] IdentifierPart* {return text();}

IdentifierPart = [a-zA-Z0-9_]

// Literales
BooleanLiteral "boolean" = TrueToken {return {type:"Literal", dataType:"boolean", value:true};} 
  / FalseToken {return {type:"Literal", dataType:"boolean", value:false};}

InfinityLiteral = [+]? InfinitoToken {return {type:"Literal", dataType:"int", value:Infinity};}
  / [-] InfinitoToken {return {type:"Literal", dataType:"int", value:-Infinity};}

NumericLiteral = IntLiteral / FloatLiteral

IntLiteral "entero" = [+-]? DecimalIntegerLiteral !"." {return {type:"Literal", dataType:"int", value:parseInt(text())};}

FloatLiteral "real" = [+-]? DecimalIntegerLiteral "." DecimalDigit* {return {type:"Literal", dataType:"float", value:parseFloat(text())};}
  / [+-]? "." DecimalDigit+ {return {type:"Literal", dataType:"float", value:parseFloat(text())};}

DecimalIntegerLiteral = "0" / NonZeroDigit DecimalDigit*

DecimalDigit = [0-9]

NonZeroDigit = [1-9]

StringLiteral "string" = '"' txt:DQString '"' {return {type:"Literal", dataType:"string", value:txt};}

DQString = (!('"') SourceCharacter)* {return text();}

CharLiteral "char" = "'" txt:SQChar "'" {return {type:"Literal", dataType:"char", value:txt};}

SQChar = (!("'") SourceCharacter)? {return text();}

// Palabras Reservadas
ReservedWord = VarToken / IfToken / ThenToken / ElseToken / EndIfToken / CaseOfToken / DefaultToken / 
  EndCaseToken / WhileToken / DoToken / EndWhileToken / RepeatToken / UntilToken / ForToken / 
  ToToken / IncToken / DownToToken / EndForToken / FunctionToken / ProcedureToken / EntradaToken / 
  SalidaToken / ESToken / IntToken / FloatToken / BooleanToken / CharToken / StringToken / 
  TrueToken / FalseToken / PilaToken / ColaToken / ListaToken / NotToken / ReturnToken / 
  PisoToken / TechoToken / InfinitoToken / PushToken / PopToken / PeekToken / EnqueueToken / 
  DequeueToken / FrontToken / IsEmptyToken / LengthToken / SizeToken / SwapToken

// Tokens  
VarToken        = "var"i           !IdentifierPart 
IfToken         = "if"i            !IdentifierPart
ThenToken       = "then"i          !IdentifierPart
ElseToken       = "else"i          !IdentifierPart
EndIfToken      = "endif"i         !IdentifierPart
CaseOfToken     = "case of"i       !IdentifierPart
DefaultToken    = "default"i       !IdentifierPart
EndCaseToken    = "endcase"i       !IdentifierPart
WhileToken      = "while"i         !IdentifierPart
DoToken         = "do"i            !IdentifierPart
EndWhileToken   = "endwhile"i      !IdentifierPart
RepeatToken     = "repeat"i        !IdentifierPart
UntilToken      = "until"i         !IdentifierPart
ForToken        = "for"i           !IdentifierPart
ToToken         = "to"i            !IdentifierPart 
IncToken        = "inc"i           !IdentifierPart 
DownToToken     = "downto"i        !IdentifierPart 
EndForToken     = "endfor"i        !IdentifierPart 
FunctionToken   = "function"i      !IdentifierPart 
ProcedureToken  = "procedure"i     !IdentifierPart 
TrueToken       = "true"i          !IdentifierPart 
FalseToken      = "false"i         !IdentifierPart 
NotToken        = "not"i           !IdentifierPart
EntradaToken    = "E"i             !IdentifierPart {return text().toLowerCase();}
SalidaToken     = "S"i             !IdentifierPart {return text().toLowerCase();}
ESToken         = "ES"i            !IdentifierPart {return text().toLowerCase();}
IntToken        = "int"i           !IdentifierPart {return text().toLowerCase();}
FloatToken      = "float"i         !IdentifierPart {return text().toLowerCase();}
BooleanToken    = "boolean"i       !IdentifierPart {return text().toLowerCase();}
CharToken       = "char"i          !IdentifierPart {return text().toLowerCase();}
StringToken     = "string"i        !IdentifierPart {return text().toLowerCase();} 
PilaToken       = "pila"i          !IdentifierPart {return text();}
ColaToken       = "cola"i          !IdentifierPart {return text();}
ListaToken      = "lista"i         !IdentifierPart {return text();}
ReturnToken     = "return"i        !IdentifierPart 
PisoToken       = "piso"i          !IdentifierPart
TechoToken      = "techo"i         !IdentifierPart
InfinitoToken   = "infinito"i      !IdentifierPart
PushToken       = "apilar"i        !IdentifierPart//----------------------------------------------
PopToken        = "desapilar"i     !IdentifierPart
PeekToken       = "cima"i          !IdentifierPart
EnqueueToken    = "encolar"i       !IdentifierPart
DequeueToken    = "desencolar"i    !IdentifierPart
FrontToken      = "frente"i        !IdentifierPart
IsEmptyToken    = "isempty"i       !IdentifierPart
LengthToken     = "len"i           !IdentifierPart
SizeToken       = "size"i          !IdentifierPart
SwapToken       = "swap"i          !IdentifierPart

PrimitiveTypesVar = IntToken / FloatToken / BooleanToken / CharToken / StringToken

TypesVar = PrimitiveTypesVar ("[" "]" ("[" "]")?)? {return text();}
  / PilaToken "<" _ PrimitiveTypesVar _ ">" {return text().toLowerCase().replace(/\s/g,'');} 
  / ColaToken "<" _ PrimitiveTypesVar _ ">" {return text().toLowerCase().replace(/\s/g,'');} 
  / ListaToken "<" _ PrimitiveTypesVar _ ">"{return text().toLowerCase().replace(/\s/g,'');}     

ModePar = EntradaToken / SalidaToken / ESToken

// ----- Expresiones -----
Expression = BooleanExpression / NumericExpression / CharExpression / StringExpression / VariableAccessExpression

ExistingVariable = id:Identifier !"(" {
  if (PARAMSACT == undefined || typeof PARAMSACT[id] == "undefined") {
    if (typeof GLOBALS[id] == "undefined") {
      error("No existe una variable con el id: " + id);
    }
    return [id, GLOBALS[id]];
  }
  return [id, PARAMSACT[id]];
}

//Llamado a Variables
VariableAccessExpression = Var:ExistingVariable !{if (Var[1].mode === "s") {error("La variable " + Var[0] + " no se puede leer");}} VarAccess:(
!"[" {
  return {
    type:"Variable",
    id: Var[0],
    dataType: Var[1].dataType
  };
} 
/ index:ArrayIndex {
  var dataTypeReturn = Var[1].dataType;
  var varD = (dataTypeReturn.match(/\[\]/g) || []).length;
  if (varD == 0) {
    error("La variable " + Var[0] + " no es un arreglo");
  } else if (varD < index.length) {
    error("El arreglo " + Var[0] + " no es de " + index.length + " dimensiones");
  } else {
    dataTypeReturn = dataTypeReturn.slice(0,-(2 * index.length));
  }
  return {
    type:"ArrayAccess",
    id: Var[0],
    index: index,
    dataType: dataTypeReturn
  };    
}
) {return VarAccess;}

IntVariable "variable entera" = varN:VariableAccessExpression !"." &{return varN.dataType == "int";} {return varN;}

FloatVariable "variable real" = varN:VariableAccessExpression !"." &{return varN.dataType == "float";} {return varN;}

BooleanVariable "variable boolean" = varB:VariableAccessExpression !"." &{return varB.dataType == "boolean";} {return varB;}

StringVariable "variable string" = varS:VariableAccessExpression !"." &{return varS.dataType == "string";} {return varS;}

CharVariable "variable char" = varC:VariableAccessExpression !"." &{return varC.dataType == "char";} {return varC;}

//Expresiones según su tipo
CharExpression = CharLiteral / FunctionChar / CharVariable

StringExpression = StringLiteral / FunctionString / StringVariable

LeftHandSideNumericExpression = NumericLiteral / FunctionInt / FunctionFloat / IntVariable / FloatVariable
  / SpecialNumericFunctions / VariablesNumericFunctions
  / "(" _ numExp:NumericExpression _ ")" {return numExp;}

MultiplicativeNumericExpression = head:(LeftHandSideNumericExpression) tail:(_ MultiplicativeOperator _ LeftHandSideNumericExpression)*
{return buildNumericExpression(head, tail);}

MultiplicativeOperator = $("*") / $("/") / $("%")

NumericExpression = head:MultiplicativeNumericExpression tail:(_ AdditiveOperator _ MultiplicativeNumericExpression)*
{return buildNumericExpression(head, tail);}

IntExpression "expresión entera" = numExp:NumericExpression &{return getDataTypeofExpression(numExp) == "int";} {return numExp;}

AdditiveOperator = ($("+") / $("-")) {return text();}

RelationalExpression = head:NumericExpression tail:(_ RelationalOperator _ NumericExpression)+
{return buildLogicalExpression(head, tail);}

RelationalOperator = "<=" / ">=" / $("<") / $(">")

LeftHandSideEqualityLogExpression = BooleanLiteral / FunctionBoolean / BooleanVariable
  / "(" _ logExp:BooleanExpression _ ")" {return logExp;} 
  / RelationalExpression
  / NotToken _ argument:BooleanExpression { 
    return {
      type: "boolean",
      operator: "not",
      argument: argument
    };
  }

EqualityExpression = head:(LeftHandSideEqualityLogExpression) tail:(_ EqualityOperator _ LeftHandSideEqualityLogExpression)* {return buildLogicalExpression(head, tail);}
  / head:(NumericExpression) tail:(_ EqualityOperator _ NumericExpression)+
  {return buildLogicalExpression(head, tail);}
  / head:(StringExpression) tail:(_ EqualityOperator _ (StringExpression))+
  {return buildLogicalExpression(head, tail);}
  / head:(CharExpression) tail:(_ EqualityOperator _ (CharExpression))+
  {return buildLogicalExpression(head, tail);}
  / "(" _ equExp:EqualityExpression _ ")" 
  {return equExp;}

EqualityOperator = "===" / "!==" / "==" / "!="

LogicalANDExpression = head:EqualityExpression tail:(_ LogicalANDOperator _ EqualityExpression)*
{return buildLogicalExpression(head, tail);}

LogicalANDOperator = "and"i {return "and";}

BooleanExpression = head:LogicalANDExpression tail:(_ LogicalOROperator _ LogicalANDExpression)*
{return buildLogicalExpression(head, tail);}

LogicalOROperator = "or"i {return "or";}

//--- Funciones especiales (Numéricas) --- 

SpecialNumericFunctions = FloorFunction / CeilingFunction / InfinityLiteral

VariablesNumericFunctions = ArrayLengthFunction

FloorFunction = PisoToken "(" _ numExp:NumericExpression _ ")" {
  return {
    type: "FloorFunction",
    exp: numExp
  };
}

CeilingFunction = TechoToken "(" _ numExp:NumericExpression _ ")" {
  return {
    type: "CeilingFunction",
    exp: numExp
  };
}

ArrayLengthFunction = ArrVar:VariableAccessExpression "." LengthToken {
  if ((ArrVar.dataType.match(/\[\]/g) || []).length == 0) {
    if (ArrVar.index !== undefined) {
      ArrVar.id = text().slice(0,-4);
    }
    error(ArrVar.id + " no devuelve un arreglo");
  }
  return {
    type: "ArrayLengthFunction",
    dataType: "int",
    arrVar: ArrVar
  };  
}

//Llamado a un subprograma
CallExpression = callee:SubProgramID args:Arguments {
  var paramsCallee = SUBPROGRAMS[callee].params;
  if (sizeObj(paramsCallee) !== args.length) {
    error("El número de parametros es incorrecto");
  }
  for (var idparam in paramsCallee) {
    let parameterCallee = paramsCallee[idparam];
    if (checkDataTypeExpressions(parameterCallee.dataType, getDataTypeofExpression(args[parameterCallee.pos]))) {
      error("El parámetro " + (parameterCallee.pos + 1) + " debe ser un " + parameterCallee.dataType);
    }
  }
  return {type:"CallExpression", callee: callee, arguments: args};
}

SubProgramID "nombre del subprograma" = id:Identifier "(" {
  if (typeof SUBPROGRAMS[id] == "undefined") {
    error("No existe una función o procedimiento con el nombre: " + id);
  }
  return id;
}

Arguments = _ args:(ArgumentList)? _ ")" {
  return args;
}

ArgumentList = args:(head:Expression tail:(_ "," _ Expression)* {return buildList(head, tail, 3);})? {
  if (args==null) {return [];} else {return args};
}

//Llamado a una función
FunctionCall = callExp:CallExpression {
  if (SUBPROGRAMS[callExp.callee].type !== "function") {
    error(callExp.callee + " no es una función");
  }
  return callExp;
}

FunctionChar = callFun:FunctionCall &{return SUBPROGRAMS[callFun.callee].dataType == "char"} {return callFun;}

FunctionString = callFun:FunctionCall &{return SUBPROGRAMS[callFun.callee].dataType == "string"} {return callFun;}

FunctionBoolean = callFun:FunctionCall &{return SUBPROGRAMS[callFun.callee].dataType == "boolean"} {return callFun;}

FunctionInt = callFun:FunctionCall &{return SUBPROGRAMS[callFun.callee].dataType == "int"} {return callFun;}

FunctionFloat = callFun:FunctionCall &{return SUBPROGRAMS[callFun.callee].dataType == "float"} {return callFun;}

//LLamado a un procedimiento
ProcedureCallStatement = callExp:CallExpression {
  if (SUBPROGRAMS[callExp.callee].type !== "procedure") {
    error(callExp.callee + " es una función (debe utilizarse solo en una asignación o una expresión)");
  }
  callExp.line = location().start.line - 1;
  return callExp;
}

// ----- Sentencias -----
Statements = SList:(head:Statement tail:(_f Statement)* _f {return buildList(head, tail, 1);})? 
{if (SList == null) {return [];} else {return SList;}}

Statement = AssignmentStatement / IfStatement / IterationStatement / SwitchStatement / ProcedureCallStatement / SpecialFunctions

// Asignación de variables
AssignmentStatement = left:AssignableVariable _ AssignmentOperator _ right:Expression {
  if (["int", "float", "string", "char", "boolean"].indexOf(left.dataType) === -1) { //Limited
    error("No se pueden asignar estructuras de datos");
  }
  if (checkDataTypeExpressions(left.dataType, getDataTypeofExpression(right))) {
    error("En la asignación se esperaba un " + left.dataType);
  }
  return {
    type: "AssignmentStatement",
    left: left,
    right: right,
    line: location().start.line - 1
  };
}

AssignableVariable = Var:ExistingVariable !{if (Var[1].mode === "e") {error("En la variable " + Var[0] + " no se puede escribir");}} AssignableVar:(
!"[" {
  return {
    type:"Variable",
    id: Var[0],
    dataType: Var[1].dataType
  };
}
/ index:ArrayIndex {
  var dataTypeAssign = Var[1].dataType;
  var varD = (dataTypeAssign.match(/\[\]/g) || []).length;
  if (varD == 0) {
    error("La variable " + Var[0] + " no es un arreglo");
  } else if (varD < index.length) {
    error("El arreglo " + Var[0] + " no es de " + index.length + " dimensiones");
  } else {
      dataTypeAssign = dataTypeAssign.slice(0,-(2 * index.length));
  }
  return {
    type:"ArrayAccess",
    id: Var[0],
    index: index,
    dataType: dataTypeAssign
  };    
}
) {return AssignableVar;}

AssignmentOperator = "<-" !"<-"

IfStatement = IfToken _ "(" _ test:BooleanExpression _ ")" _ ThenToken _f consequent:Statements ElseToken _f alternate:Statements EndIfToken
{
  return {
    type: "IfStatement",
    test: test,
    consequent: consequent,
    alternate: alternate,
    line: location().start.line - 1
  };
}
/ IfToken _ "(" _ test:BooleanExpression _ ")" _ ThenToken _f consequent:Statements EndIfToken 
{
  return {
    type: "IfStatement",
    test: test,
    consequent: consequent,
    line: location().start.line - 1
  };
}

SwitchStatement = CaseOfToken _ Exp:IntExpression _f
cases:(caseVal:IntLiteral ":" _f block:Statements {return {caseVal:caseVal.value, block:block, line:location().start.line - 1}})*
defaultCase:(DefaultToken ":" _f block:Statements {return {block:block, line:location().start.line - 1}})? EndCaseToken {
  return {
    type: "SwitchStatement", 
    exp: Exp,
    cases:cases,
    defaultCase:defaultCase,
    line: location().start.line - 1      
  };
}
/CaseOfToken _ Exp:NumericExpression _f
cases:(caseVal:NumericLiteral ":" _f block:Statements {return {caseVal:caseVal.value, block:block, line:location().start.line - 1}})*
defaultCase:(DefaultToken ":" _f block:Statements {return {block:block, line:location().start.line - 1}})? EndCaseToken {
  return {
    type: "SwitchStatement", 
    exp: Exp,
    cases:cases,
    defaultCase:defaultCase,
    line: location().start.line - 1      
  };
}
/ CaseOfToken _ Exp:BooleanExpression _f
cases:(caseVal:BooleanLiteral ":" _f block:Statements {return {caseVal:caseVal.value, block:block, line:location().start.line - 1}})*
defaultCase:(DefaultToken ":" _f block:Statements {return {block:block, line:location().start.line - 1}})? EndCaseToken {
  return {
    type: "SwitchStatement", 
    exp: Exp,
    cases:cases,
    defaultCase:defaultCase,
    line: location().start.line - 1      
  };
}
/ CaseOfToken _ Exp:StringExpression _f
cases:(caseVal:StringLiteral ":" _f block:Statements {return {caseVal:caseVal.value, block:block, line:location().start.line - 1}})*
defaultCase:(DefaultToken ":" _f block:Statements {return {block:block, line:location().start.line - 1}})? EndCaseToken {
  return {
    type: "SwitchStatement", 
    exp: Exp,
    cases:cases,
    defaultCase:defaultCase,
    line: location().start.line - 1      
  };
}
/ CaseOfToken _ Exp:CharExpression _f
cases:(caseVal:CharLiteral ":" _f block:Statements {return {caseVal:caseVal.value, block:block, line:location().start.line - 1}})*
defaultCase:(DefaultToken ":" _f block:Statements {return {block:block, line:location().start.line - 1}})? EndCaseToken {
  return {
    type: "SwitchStatement", 
    exp: Exp,
    cases:cases,
    defaultCase:defaultCase,
    line: location().start.line - 1      
  };
}

IterationStatement = RepeatToken _f
    body:Statements
    UntilToken _ "(" _ test:BooleanExpression _ ")"
    { return { 
      type: "RepeatUntilStatement", 
      body: body, 
      test: test,
      line: location().end.line - 1
      }; 
    }
  / WhileToken _ "(" _ test:BooleanExpression _ ")" _ DoToken _f
    body:Statements EndWhileToken
    { return { 
      type: "WhileStatement", 
      test: test, 
      body: body,
      line: location().start.line - 1      
      }; 
    }
  / ForToken _ initFor:VarDeclarationFor _ finFor:FinalFor _ DoToken _f body:Statements EndForToken
    {
      return {
        type: "ForStatement",
        varFor: initFor.varFor,
        iniValue: initFor.iniValue,
        finValue: finFor.finValue,
        inc: finFor.inc,
        body: body,
        line: location().start.line - 1
      };
    } 

VarDeclarationFor = varFor:IntVariable _ AssignmentOperator _ iniValue:IntExpression {
  return {
    varFor: varFor,
    iniValue: iniValue
  };
}    

FinalFor = ToToken _ finExp:IntExpression valInc:(_ IncToken _ valInc:IntLiteral {return valInc;})? {
  if (valInc == null) {
    valInc = 1;
  } else if (valInc.value < 0) {
    error("El incremento debe ser positivo");
  } else {
    valInc = valInc.value;
  }
  return {
    finValue: finExp,
    inc: valInc
  };
} 
/ DownToToken _ finExp:IntExpression valInc:(_ IncToken _ valInc:IntLiteral {return valInc;})? {
  if (valInc == null) {
    valInc = -1;
  } else if (valInc.value > 0) {
    error("El incremento debe ser negativo");
  } else {
    valInc = valInc.value;
  }
  return {
    final: finExp,
    inc: valInc
  };
}

SpecialFunctions = SwapFunction

SwapFunction = SwapToken "(" _ vleft:VariableForSwap _ "," _ vright:VariableForSwap _ ")" {
  if (vleft.dataType !== vright.dataType) {
    error("No se pueden intercambiar variables de distinto tipo");
  }
  return {
    type: "SwapFunction",
    left: vleft,
    right: vright,
    line: location().start.line - 1
  };
}

VariableForSwap = Var:ExistingVariable !{if (Var[1].mode !== undefined && Var[1].mode !== "es") {error("La variable " + Var[0] + " se debe poder escribir y leer");}} VarAccess:(
!"[" {
  return {
    type:"Variable",
    id: Var[0],
    dataType: Var[1].dataType
  };
} 
/ index:ArrayIndex {
  var dataTypeReturn = Var[1].dataType;
  var varD = (dataTypeReturn.match(/\[\]/g) || []).length;
  if (varD == 0) {
    error("La variable " + Var[0] + " no es un arreglo");
  } else if (varD < index.length) {
    error("El arreglo " + Var[0] + " no es de " + index.length + " dimensiones");
  } else {
    dataTypeReturn = dataTypeReturn.slice(0,-(2 * index.length));
  }
  if ((dataTypeReturn.match(/\[\]/g) || []).length > 0) {//Limited
    error("no se pueden intercambiar arreglos");
  }
  return {
    type:"ArrayAccess",
    id: Var[0],
    index: index,
    dataType: dataTypeReturn
  };    
}
) {return VarAccess;}

//Declaración de Variables (solo globales)
VariableStatement = VarToken _f VariableDeclaration* {return undefined;}  //Limited

VariableDeclaration = dataType:PrimitiveTypesVar _ idList:IdentifierList _ valini:(AssignmentOperator _ valExp:(
    &{return dataType == "char";} L:CharLiteral {return L;}
  / &{return dataType == "string";} L:StringLiteral {return L;}
  / &{return dataType == "boolean";} L:BooleanLiteral {return L;}
  / &{return dataType == "int";} L:IntLiteral {return L;}
  / &{return dataType == "float";} L:NumericLiteral {return L;}) {return valExp.value;})? _f {
  if (valini == null) {
    switch (dataType) {
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
  }
  for (let index = 0; index < idList.length; index++) {
    const name = idList[index];
    if (typeof GLOBALS[name] != "undefined") {
      error("Ya existe una variable con el id: " + name);
    }
    GLOBALS[name] = {dataType: dataType, value: valini};
  }
  return undefined;
} 
/ dataType:PrimitiveTypesVar arrayD:arrayDimensionsDeclaration _ idList:IdentifierList _ valini:(AssignmentOperator _ valExp:(
    &{return dataType == "char";} array:ArrayLiteralChar {return array;}
  / &{return dataType == "string";} array:ArrayLiteralString {return array;}
  / &{return dataType == "boolean";} array:ArrayLiteralBoolean {return array;}
  / &{return dataType == "int";} array:ArrayLiteralInt {return array;}
  / &{return dataType == "float";} array:ArrayLiteralFloat {return array;}) 
  {return valExp;})? _f {
    if (valini == null) {
      switch (dataType) {
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
      valini = createArray(arrayD, valini);
    } else if (!checkArrayDimensions(valini, arrayD)) {
        error("Las dimensiones del arreglo no son correctas");
    }
    for (let i = 0; i < arrayD.length; i++) {
      dataType = dataType + "[]";        
    }    
    for (let index = 0; index < idList.length; index++) {
      const name = idList[index];
      if (typeof GLOBALS[name] != "undefined") {
        error("Ya existe una variable con el id: " + name);
      }
      GLOBALS[name] = {
      dataType: dataType, 
      d: arrayD,
      value: cloneArray(valini)};
    }
    return undefined;    
  }
/ PilaToken "<" _ dataType:PrimitiveTypesVar _ ">" _ idList:IdentifierList _f {
    for (let index = 0; index < idList.length; index++) {
      const name = idList[index];
      if (typeof GLOBALS[name] != "undefined") {
        error("Ya existe una variable con el id: " + name);
      }
      GLOBALS[name] = {
      dataType: "pila<" + dataType + ">",
      value: []};
    }
    return undefined; 
  }
/ ColaToken "<" _ dataType:PrimitiveTypesVar _ ">" _ idList:IdentifierList _f {
    for (let index = 0; index < idList.length; index++) {
      const name = idList[index];
      if (typeof GLOBALS[name] != "undefined") {
        error("Ya existe una variable con el id: " + name);
      }
      GLOBALS[name] = {
      dataType: "cola<" + dataType + ">",
      value: []};
    }
    return undefined; 
  }
/ ListaToken "<" _ dataType:PrimitiveTypesVar _ ">" _ idList:IdentifierList _f {
    for (let index = 0; index < idList.length; index++) {
      const name = idList[index];
      if (typeof GLOBALS[name] != "undefined") {
        error("Ya existe una variable con el id: " + name);
      }
      GLOBALS[name] = {
      dataType: "lista<" + dataType + ">",
      value: []};
    }
    return undefined; 
  }    

IdentifierList = head:Identifier _ tail:(_","_ Identifier)* {return buildList(head, tail, 3);};

arrayDimensionsDeclaration = index:("[" _ arrayId:ArrayN _ "]" {return arrayId;})+ !{
  if(index.length > 2) {
    error("Solo hay arreglos unidimensionales o bidimiensionales");
  }} {return index;}

ArrayN = NonZeroDigit DecimalDigit* {return parseInt(text());}

ArrayIndex = index:("[" _ arrayId:IntExpression _ "]" {return arrayId;})+ !{
  if(index.length > 2) { //Limited
    error("Solo hay arreglos unidimensionales o bidimiensionales");
  }} {return index;}

ArrayLiteralInt = "[" head:ArrayLiteralInt tail:(_ "," _ ArrayLiteralInt)* "]" {return buildList(head.value, tail, 3);}
  / LiteralIntList

LiteralIntList = "[" head:IntLiteral tail:(_ "," _ (L:IntLiteral {return L.value;}))* "]" {return buildList(head.value, tail, 3);}

ArrayLiteralFloat = "[" head:ArrayLiteralFloat tail:(_ "," _ ArrayLiteralFloat)* "]" {return buildList(head.value, tail, 3);}
  / LiteralFloatList

LiteralFloatList = "[" head:NumericLiteral tail:(_ "," _ (L:NumericLiteral {return L.value;}))* "]" {return buildList(head.value, tail, 3);}

ArrayLiteralChar = "[" head:ArrayLiteralChar tail:(_ "," _ ArrayLiteralChar)* "]" {return buildList(head.value, tail, 3);}
  / LiteralCharList

LiteralCharList = "[" head:CharLiteral tail:(_ "," _ (L:CharLiteral {return L.value;}))* "]" {return buildList(head.value, tail, 3);}

ArrayLiteralString = "[" head:ArrayLiteralString tail:(_ "," _ ArrayLiteralString)* "]" {return buildList(head.value, tail, 3);}
  / LiteralStringList

LiteralStringList = "[" head:StringLiteral tail:(_ "," _ (L:StringLiteral {return L.value;}))* "]" {return buildList(head.value, tail, 3);}

ArrayLiteralBoolean = "[" head:ArrayLiteralBoolean tail:(_ "," _ ArrayLiteralBoolean)* "]" {return buildList(head.value, tail, 3);}
  / LiteralBooleanList

LiteralBooleanList = "[" head:BooleanLiteral tail:(_ "," _ (L:BooleanLiteral {return L.value;}))* "]" {return buildList(head.value, tail, 3);}

// Retorno
ReturnStatement = ReturnToken _ expReturn:Expression { return expReturn;}

// ----- Funciones, Procedimientos y Programas -----
SubProgramDeclaration = 
FunctionToken _ dataType:TypesVar _ id:SubProgramCreationID "(" _ params:FormalParameterList _ ")" __
VariableStatement? "{" _f !{createSubProgram("function", dataType, id, params);} body:Statements expReturn:ReturnStatement _f"}" {
  if (checkDataTypeExpressions(dataType, getDataTypeofExpression(expReturn))) {
    error("Se debe retornar un " + dataType);
  }
  SUBPROGRAMS[id].body = body;
  SUBPROGRAMS[id].return = expReturn;
  PARAMSACT = undefined;
}
/ 
ProcedureToken _ id:SubProgramCreationID "(" _ params:FormalParameterList _ ")" __ 
VariableStatement? "{" _f !{createSubProgram("procedure", undefined, id, params);} body:Statements "}" {
  SUBPROGRAMS[id].body = body;
  PARAMSACT = undefined;
}

SubProgramCreationID "nombre del subprograma" = id:Identifier {
  if (typeof SUBPROGRAMS[id] != "undefined") {
    error("Ya existe una función o procedimiento con el nombre: " + id);
  }
  return id;
}

FormalParameterList = params:(head:Parameter tail:(__ "," __ Parameter)* {return buildList(head, tail, 3);})? 
{if (params == null) {return {};} else {return params;}}

Parameter = mode:ModePar _ dataType:TypesVar _ id:Identifier {return {mode: mode, dataType: dataType, id: id};}