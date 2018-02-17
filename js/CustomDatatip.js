/*
	Autor: 		Walter Alexandre A. de Oliveira
	Descrição: 	A função busca por elementos html que tenham o atributo data-tip e exibe o conteúdo deste atributo como um balão de informações.
	
	Utilização:
		- Inclua este script no início do documento html.
		- No final de <body>, chame a função CustomDatatip().
		- Altere a aparência do datatip no arquivo CustomDatatip.css e inclua-o no início do documento html.
	
	Criação:	24/11/2016
	
	Atualizações: 	1.0 (24/11/2016)
*/

// Chamar esta função após o Select()
function CustomDatatip() {
	var datatip = document.createElement("div");
	var tips 	= document.querySelectorAll('*[data-tip]');
		
	for (var i=0; i<tips.length; i++) {
		tips[i].onmouseover = function(e) {
			datatip.innerHTML 		= e.target.getAttribute('data-tip');
			datatip.style.display 	= "inline";
			
			var rect = e.target.getBoundingClientRect();
		
			if (e.target.tagName == "OPTION") {
				datatip.style.left = Math.round(rect.right+5) + "px";
				datatip.style.top  = Math.round(rect.top + 0) + "px";
			}
			else {
				datatip.style.left = Math.round(e.clientX + 15) + "px";
				datatip.style.top  = Math.round(e.pageY + 10) + "px";
			}
		}
		tips[i].onmouseout = function(e) {
			datatip.style.display = "none";
		}
		tips[i].style.cursor = "pointer";
	}
	
	datatip.className = 'CustomDatatip';
	document.body.appendChild(datatip);
}