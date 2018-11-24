var gramatica = "start = ('a' / 'b' / 'c' /'\\n')+";
var parser = peg.generate(gramatica);

