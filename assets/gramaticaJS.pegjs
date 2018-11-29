{
  var TYPES_TO_PROPERTY_NAMES = {
    CallExpression:   "callee",
    MemberExpression: "object",
  };

  function filledArray(count, value) {
    return Array.apply(null, new Array(count))
      .map(function() { return value; });
  }

  function extractOptional(optional, index) {
    return optional ? optional[index] : null;
  }

  function extractList(list, index) {
    return list.map(function(element) { return element[index]; });
  }

  function buildList(head, tail, index) {
    return [head].concat(extractList(tail, index));
  }

  function buildBinaryExpression(head, tail) {
    return tail.reduce(function(result, element) {
      return {
        type: "BinaryExpression",
        operator: element[1],
        left: result,
        right: element[3]
      };
    }, head);
  }

  function buildLogicalExpression(head, tail) {
    return tail.reduce(function(result, element) {
      return {
        type: "LogicalExpression",
        operator: element[1],
        left: result,
        right: element[3]
      };
    }, head);
  }

  function optionalList(value) {
    return value !== null ? value : [];
  }
}


// Tokens

// ----- A.3 Expressions -----

PrimaryExpression
  = ThisToken { return { type: "ThisExpression" }; }
  / Identifier
  / Literal
  / ArrayLiteral
  / ObjectLiteral
  / "(" __ expression:Expression __ ")" { return expression; }

ArrayLiteral
  = "[" __ elision:(Elision __)? "]" {
      return {
        type: "ArrayExpression",
        elements: optionalList(extractOptional(elision, 0))
      };
    }
  / "[" __ elements:ElementList __ "]" {
      return {
        type: "ArrayExpression",
        elements: elements
      };
    }
  / "[" __ elements:ElementList __ "," __ elision:(Elision __)? "]" {
      return {
        type: "ArrayExpression",
        elements: elements.concat(optionalList(extractOptional(elision, 0)))
      };
    }

ElementList
  = head:(
      elision:(Elision __)? element:AssignmentExpression {
        return optionalList(extractOptional(elision, 0)).concat(element);
      }
    )
    tail:(
      __ "," __ elision:(Elision __)? element:AssignmentExpression {
        return optionalList(extractOptional(elision, 0)).concat(element);
      }
    )*
    { return Array.prototype.concat.apply(head, tail); }

Elision
  = "," commas:(__ ",")* { return filledArray(commas.length + 1, null); }

ObjectLiteral
  = "{" __ "}" { return { type: "ObjectExpression", properties: [] }; }
  / "{" __ properties:PropertyNameAndValueList __ "}" {
       return { type: "ObjectExpression", properties: properties };
     }
  / "{" __ properties:PropertyNameAndValueList __ "," __ "}" {
       return { type: "ObjectExpression", properties: properties };
     }
PropertyNameAndValueList
  = head:PropertyAssignment tail:(__ "," __ PropertyAssignment)* {
      return buildList(head, tail, 3);
    }

PropertyAssignment
  = key:PropertyName __ ":" __ value:AssignmentExpression {
      return { type: "Property", key: key, value: value, kind: "init" };
    }
  / GetToken __ key:PropertyName __
    "(" __ ")" __
    "{" __ body:FunctionBody __ "}"
    {
      return {
        type: "Property",
        key: key,
        value: {
          type: "FunctionExpression",
          id: null,
          params: [],
          body: body
        },
        kind: "get"
      };
    }
  / SetToken __ key:PropertyName __
    "(" __ params:PropertySetParameterList __ ")" __
    "{" __ body:FunctionBody __ "}"
    {
      return {
        type: "Property",
        key: key,
        value: {
          type: "FunctionExpression",
          id: null,
          params: params,
          body: body
        },
        kind: "set"
      };
    }

PropertyName
  = IdentifierName
  / StringLiteral
  / NumericLiteral

PropertySetParameterList
  = id:Identifier { return [id]; }

MemberExpression
  = head:(
        PrimaryExpression
      / FunctionExpression
      / NewToken __ callee:MemberExpression __ args:Arguments {
          return { type: "NewExpression", callee: callee, arguments: args };
        }
    )
    tail:(
        __ "[" __ property:Expression __ "]" {
          return { property: property, computed: true };
        }
      / __ "." __ property:IdentifierName {
          return { property: property, computed: false };
        }
    )*
    {
      return tail.reduce(function(result, element) {
        return {
          type: "MemberExpression",
          object: result,
          property: element.property,
          computed: element.computed
        };
      }, head);
    }

NewExpression
  = MemberExpression
  / NewToken __ callee:NewExpression {
      return { type: "NewExpression", callee: callee, arguments: [] };
    }

CallExpression
  = head:(
      callee:MemberExpression __ args:Arguments {
        return { type: "CallExpression", callee: callee, arguments: args };
      }
    )
    tail:(
        __ args:Arguments {
          return { type: "CallExpression", arguments: args };
        }
      / __ "[" __ property:Expression __ "]" {
          return {
            type: "MemberExpression",
            property: property,
            computed: true
          };
        }
      / __ "." __ property:IdentifierName {
          return {
            type: "MemberExpression",
            property: property,
            computed: false
          };
        }
    )*
    {
      return tail.reduce(function(result, element) {
        element[TYPES_TO_PROPERTY_NAMES[element.type]] = result;

        return element;
      }, head);
    }

Arguments
  = "(" __ args:(ArgumentList __)? ")" {
      return optionalList(extractOptional(args, 0));
    }

ArgumentList
  = head:AssignmentExpression tail:(__ "," __ AssignmentExpression)* {
      return buildList(head, tail, 3);
    }

LeftHandSideExpression
  = CallExpression
  / NewExpression

PostfixExpression
  = argument:LeftHandSideExpression _ operator:PostfixOperator {
      return {
        type: "UpdateExpression",
        operator: operator,
        argument: argument,
        prefix: false
      };
    }
  / LeftHandSideExpression

PostfixOperator
  = "++"
  / "--"

UnaryExpression
  = PostfixExpression
  / operator:UnaryOperator __ argument:UnaryExpression {
      var type = (operator === "++" || operator === "--")
        ? "UpdateExpression"
        : "UnaryExpression";

      return {
        type: type,
        operator: operator,
        argument: argument,
        prefix: true
      };
    }

UnaryOperator
  = $DeleteToken
  / $VoidToken
  / $TypeofToken
  / "++"
  / "--"
  / $("+" !"=")
  / $("-" !"=")
  / "~"
  / "!"

MultiplicativeExpression
  = head:UnaryExpression
    tail:(__ MultiplicativeOperator __ UnaryExpression)*
    { return buildBinaryExpression(head, tail); }

MultiplicativeOperator
  = $("*" !"=")
  / $("/" !"=")
  / $("%" !"=")

AdditiveExpression
  = head:MultiplicativeExpression
    tail:(__ AdditiveOperator __ MultiplicativeExpression)*
    { return buildBinaryExpression(head, tail); }

AdditiveOperator
  = $("+" ![+=])
  / $("-" ![-=])

ShiftExpression
  = head:AdditiveExpression
    tail:(__ ShiftOperator __ AdditiveExpression)*
    { return buildBinaryExpression(head, tail); }

ShiftOperator
  = $("<<"  !"=")
  / $(">>>" !"=")
  / $(">>"  !"=")

RelationalExpression
  = head:ShiftExpression
    tail:(__ RelationalOperator __ ShiftExpression)*
    { return buildBinaryExpression(head, tail); }

RelationalOperator
  = "<="
  / ">="
  / $("<" !"<")
  / $(">" !">")
  / $InstanceofToken
  / $InToken

RelationalExpressionNoIn
  = head:ShiftExpression
    tail:(__ RelationalOperatorNoIn __ ShiftExpression)*
    { return buildBinaryExpression(head, tail); }

RelationalOperatorNoIn
  = "<="
  / ">="
  / $("<" !"<")
  / $(">" !">")
  / $InstanceofToken

EqualityExpression
  = head:RelationalExpression
    tail:(__ EqualityOperator __ RelationalExpression)*
    { return buildBinaryExpression(head, tail); }

EqualityExpressionNoIn
  = head:RelationalExpressionNoIn
    tail:(__ EqualityOperator __ RelationalExpressionNoIn)*
    { return buildBinaryExpression(head, tail); }

EqualityOperator
  = "==="
  / "!=="
  / "=="
  / "!="

BitwiseANDExpression
  = head:EqualityExpression
    tail:(__ BitwiseANDOperator __ EqualityExpression)*
    { return buildBinaryExpression(head, tail); }

BitwiseANDExpressionNoIn
  = head:EqualityExpressionNoIn
    tail:(__ BitwiseANDOperator __ EqualityExpressionNoIn)*
    { return buildBinaryExpression(head, tail); }

BitwiseANDOperator
  = $("&" ![&=])

BitwiseXORExpression
  = head:BitwiseANDExpression
    tail:(__ BitwiseXOROperator __ BitwiseANDExpression)*
    { return buildBinaryExpression(head, tail); }

BitwiseXORExpressionNoIn
  = head:BitwiseANDExpressionNoIn
    tail:(__ BitwiseXOROperator __ BitwiseANDExpressionNoIn)*
    { return buildBinaryExpression(head, tail); }

BitwiseXOROperator
  = $("^" !"=")

BitwiseORExpression
  = head:BitwiseXORExpression
    tail:(__ BitwiseOROperator __ BitwiseXORExpression)*
    { return buildBinaryExpression(head, tail); }

BitwiseORExpressionNoIn
  = head:BitwiseXORExpressionNoIn
    tail:(__ BitwiseOROperator __ BitwiseXORExpressionNoIn)*
    { return buildBinaryExpression(head, tail); }

BitwiseOROperator
  = $("|" ![|=])

LogicalANDExpression
  = head:BitwiseORExpression
    tail:(__ LogicalANDOperator __ BitwiseORExpression)*
    { return buildLogicalExpression(head, tail); }

LogicalANDExpressionNoIn
  = head:BitwiseORExpressionNoIn
    tail:(__ LogicalANDOperator __ BitwiseORExpressionNoIn)*
    { return buildLogicalExpression(head, tail); }

LogicalANDOperator
  = "&&"

LogicalORExpression
  = head:LogicalANDExpression
    tail:(__ LogicalOROperator __ LogicalANDExpression)*
    { return buildLogicalExpression(head, tail); }

LogicalORExpressionNoIn
  = head:LogicalANDExpressionNoIn
    tail:(__ LogicalOROperator __ LogicalANDExpressionNoIn)*
    { return buildLogicalExpression(head, tail); }

LogicalOROperator
  = "||"

ConditionalExpression
  = test:LogicalORExpression __
    "?" __ consequent:AssignmentExpression __
    ":" __ alternate:AssignmentExpression
    {
      return {
        type: "ConditionalExpression",
        test: test,
        consequent: consequent,
        alternate: alternate
      };
    }
  / LogicalORExpression

ConditionalExpressionNoIn
  = test:LogicalORExpressionNoIn __
    "?" __ consequent:AssignmentExpression __
    ":" __ alternate:AssignmentExpressionNoIn
    {
      return {
        type: "ConditionalExpression",
        test: test,
        consequent: consequent,
        alternate: alternate
      };
    }
  / LogicalORExpressionNoIn

AssignmentExpression
  = left:LeftHandSideExpression __
    "=" !"=" __
    right:AssignmentExpression
    {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: left,
        right: right
      };
    }
  / left:LeftHandSideExpression __
    operator:AssignmentOperator __
    right:AssignmentExpression
    {
      return {
        type: "AssignmentExpression",
        operator: operator,
        left: left,
        right: right
      };
    }
  / ConditionalExpression

AssignmentExpressionNoIn
  = left:LeftHandSideExpression __
    "=" !"=" __
    right:AssignmentExpressionNoIn
    {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: left,
        right: right
      };
    }
  / left:LeftHandSideExpression __
    operator:AssignmentOperator __
    right:AssignmentExpressionNoIn
    {
      return {
        type: "AssignmentExpression",
        operator: operator,
        left: left,
        right: right
      };
    }
  / ConditionalExpressionNoIn

AssignmentOperator
  = "*="
  / "/="
  / "%="
  / "+="
  / "-="
  / "<<="
  / ">>="
  / ">>>="
  / "&="
  / "^="
  / "|="

Expression
  = head:AssignmentExpression tail:(__ "," __ AssignmentExpression)* {
      return tail.length > 0
        ? { type: "SequenceExpression", expressions: buildList(head, tail, 3) }
        : head;
    }

ExpressionNoIn
  = head:AssignmentExpressionNoIn tail:(__ "," __ AssignmentExpressionNoIn)* {
      return tail.length > 0
        ? { type: "SequenceExpression", expressions: buildList(head, tail, 3) }
        : head;
    }

// ----- A.4 Statements -----

Statement
  = Block
  / VariableStatement
  / EmptyStatement
  / ExpressionStatement
  / IfStatement
  / IterationStatement
  / ContinueStatement
  / BreakStatement
  / ReturnStatement
  / WithStatement
  / LabelledStatement
  / SwitchStatement
  / ThrowStatement
  / TryStatement
  / DebuggerStatement

Block
  = "{" __ body:(StatementList __)? "}" {
      return {
        type: "BlockStatement",
        body: optionalList(extractOptional(body, 0))
      };
    }

StatementList
  = head:Statement tail:(__ Statement)* { return buildList(head, tail, 1); }

VariableStatement
  = VarToken __ declarations:VariableDeclarationList EOS {
      return {
        type: "VariableDeclaration",
        declarations: declarations,
        kind: "var"
      };
    }

VariableDeclarationList
  = head:VariableDeclaration tail:(__ "," __ VariableDeclaration)* {
      return buildList(head, tail, 3);
    }

VariableDeclarationListNoIn
  = head:VariableDeclarationNoIn tail:(__ "," __ VariableDeclarationNoIn)* {
      return buildList(head, tail, 3);
    }

VariableDeclaration
  = id:Identifier init:(__ Initialiser)? {
      return {
        type: "VariableDeclarator",
        id: id,
        init: extractOptional(init, 1)
      };
    }

VariableDeclarationNoIn
  = id:Identifier init:(__ InitialiserNoIn)? {
      return {
        type: "VariableDeclarator",
        id: id,
        init: extractOptional(init, 1)
      };
    }

Initialiser
  = "=" !"=" __ expression:AssignmentExpression { return expression; }

InitialiserNoIn
  = "=" !"=" __ expression:AssignmentExpressionNoIn { return expression; }

EmptyStatement
  = ";" { return { type: "EmptyStatement" }; }

ExpressionStatement
  = !("{" / FunctionToken) expression:Expression EOS {
      return {
        type: "ExpressionStatement",
        expression: expression
      };
    }

IfStatement
  = IfToken __ "(" __ test:Expression __ ")" __
    consequent:Statement __
    ElseToken __
    alternate:Statement
    {
      return {
        type: "IfStatement",
        test: test,
        consequent: consequent,
        alternate: alternate
      };
    }
  / IfToken __ "(" __ test:Expression __ ")" __
    consequent:Statement {
      return {
        type: "IfStatement",
        test: test,
        consequent: consequent,
        alternate: null
      };
    }

IterationStatement
  = DoToken __
    body:Statement __
    WhileToken __ "(" __ test:Expression __ ")" EOS
    { return { type: "DoWhileStatement", body: body, test: test }; }
  / WhileToken __ "(" __ test:Expression __ ")" __
    body:Statement
    { return { type: "WhileStatement", test: test, body: body }; }
  / ForToken __
    "(" __
    init:(ExpressionNoIn __)? ";" __
    test:(Expression __)? ";" __
    update:(Expression __)?
    ")" __
    body:Statement
    {
      return {
        type: "ForStatement",
        init: extractOptional(init, 0),
        test: extractOptional(test, 0),
        update: extractOptional(update, 0),
        body: body
      };
    }
  / ForToken __
    "(" __
    VarToken __ declarations:VariableDeclarationListNoIn __ ";" __
    test:(Expression __)? ";" __
    update:(Expression __)?
    ")" __
    body:Statement
    {
      return {
        type: "ForStatement",
        init: {
          type: "VariableDeclaration",
          declarations: declarations,
          kind: "var"
        },
        test: extractOptional(test, 0),
        update: extractOptional(update, 0),
        body: body
      };
    }
  / ForToken __
    "(" __
    left:LeftHandSideExpression __
    InToken __
    right:Expression __
    ")" __
    body:Statement
    {
      return {
        type: "ForInStatement",
        left: left,
        right: right,
        body: body
      };
    }
  / ForToken __
    "(" __
    VarToken __ declarations:VariableDeclarationListNoIn __
    InToken __
    right:Expression __
    ")" __
    body:Statement
    {
      return {
        type: "ForInStatement",
        left: {
          type: "VariableDeclaration",
          declarations: declarations,
          kind: "var"
        },
        right: right,
        body: body
      };
    }

ContinueStatement
  = ContinueToken EOS {
      return { type: "ContinueStatement", label: null };
    }
  / ContinueToken _ label:Identifier EOS {
      return { type: "ContinueStatement", label: label };
    }

BreakStatement
  = BreakToken EOS {
      return { type: "BreakStatement", label: null };
    }
  / BreakToken _ label:Identifier EOS {
      return { type: "BreakStatement", label: label };
    }

ReturnStatement
  = ReturnToken EOS {
      return { type: "ReturnStatement", argument: null };
    }
  / ReturnToken _ argument:Expression EOS {
      return { type: "ReturnStatement", argument: argument };
    }

WithStatement
  = WithToken __ "(" __ object:Expression __ ")" __
    body:Statement
    { return { type: "WithStatement", object: object, body: body }; }

SwitchStatement
  = SwitchToken __ "(" __ discriminant:Expression __ ")" __
    cases:CaseBlock
    {
      return {
        type: "SwitchStatement",
        discriminant: discriminant,
        cases: cases
      };
    }

CaseBlock
  = "{" __ clauses:(CaseClauses __)? "}" {
      return optionalList(extractOptional(clauses, 0));
    }
  / "{" __
    before:(CaseClauses __)?
    default_:DefaultClause __
    after:(CaseClauses __)? "}"
    {
      return optionalList(extractOptional(before, 0))
        .concat(default_)
        .concat(optionalList(extractOptional(after, 0)));
    }

CaseClauses
  = head:CaseClause tail:(__ CaseClause)* { return buildList(head, tail, 1); }

CaseClause
  = CaseToken __ test:Expression __ ":" consequent:(__ StatementList)? {
      return {
        type: "SwitchCase",
        test: test,
        consequent: optionalList(extractOptional(consequent, 1))
      };
    }

DefaultClause
  = DefaultToken __ ":" consequent:(__ StatementList)? {
      return {
        type: "SwitchCase",
        test: null,
        consequent: optionalList(extractOptional(consequent, 1))
      };
    }

LabelledStatement
  = label:Identifier __ ":" __ body:Statement {
      return { type: "LabeledStatement", label: label, body: body };
    }

ThrowStatement
  = ThrowToken _ argument:Expression EOS {
      return { type: "ThrowStatement", argument: argument };
    }

TryStatement
  = TryToken __ block:Block __ handler:Catch __ finalizer:Finally {
      return {
        type: "TryStatement",
        block: block,
        handler: handler,
        finalizer: finalizer
      };
    }
  / TryToken __ block:Block __ handler:Catch {
      return {
        type: "TryStatement",
        block: block,
        handler: handler,
        finalizer: null
      };
    }
  / TryToken __ block:Block __ finalizer:Finally {
      return {
        type: "TryStatement",
        block: block,
        handler: null,
        finalizer: finalizer
      };
    }

Catch
  = CatchToken __ "(" __ param:Identifier __ ")" __ body:Block {
      return {
        type: "CatchClause",
        param: param,
        body: body
      };
    }

Finally
  = FinallyToken __ block:Block { return block; }

DebuggerStatement
  = DebuggerToken EOS { return { type: "DebuggerStatement" }; }

// ----- A.5 Functions and Programs -----

FunctionDeclaration
  = FunctionToken __ id:Identifier __
    "(" __ params:(FormalParameterList __)? ")" __
    "{" __ body:FunctionBody __ "}"
    {
      return {
        type: "FunctionDeclaration",
        id: id,
        params: optionalList(extractOptional(params, 0)),
        body: body
      };
    }

FunctionExpression
  = FunctionToken __ id:(Identifier __)?
    "(" __ params:(FormalParameterList __)? ")" __
    "{" __ body:FunctionBody __ "}"
    {
      return {
        type: "FunctionExpression",
        id: extractOptional(id, 0),
        params: optionalList(extractOptional(params, 0)),
        body: body
      };
    }

FormalParameterList
  = head:Identifier tail:(__ "," __ Identifier)* {
      return buildList(head, tail, 3);
    }

FunctionBody
  = body:SourceElements? {
      return {
        type: "BlockStatement",
        body: optionalList(body)
      };
    }

Program
  = body:SourceElements? {
      return {
        type: "Program",
        body: optionalList(body)
      };
    }

SourceElements
  = head:SourceElement tail:(__ SourceElement)* {
      return buildList(head, tail, 1);
    }

SourceElement
  = Statement
  / FunctionDeclaration