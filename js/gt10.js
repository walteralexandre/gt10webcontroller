/*
	Autor:		Walter Alexandre A. de Oliveira
	Descrição:	Biblioteca de funções para controlar a pedaleira de guitarra BOSS GT-10 usando MIDI.
	
	Atualização:	05/11/2016
	
	Pendências:
		Corrigir o posicionamento vertical de data-tip.
*/

var GT10_CONTROLLER_LIB;			// indica se esta biblioteca foi carregada (evita re-inclusão desta biblioteca)
var DebugMode;						// mode debug: exibe informações no console do navegador
var DeviceId;						// número identificador da GT-10
var MidiAccess;						// objeto web midi
var MidiInput;						// GT-10 MIDI Out
var MidiOutput;						// GT-10 MIDI In
var OnMidiMessageDefaultFunction;	// função padrão que deve ser executada quando a gt10 enviar mensagens midi

//=================================================================================================
// WEB MIDI
//=================================================================================================

// Inicia Web Midi
function GT10Controller() {
	if (GT10_CONTROLLER_LIB) {
		return;
	}
	
	DebugMode   = true;
	DeviceId 	= 0x00;
	MidiAccess 	= null;
	MidiInput  	= null;
	MidiOutput 	= null;
	MidiMessage = null;
	OnMidiMessageDefaultFunction = OnMidiMessage;
	
	if (navigator.requestMIDIAccess) {
		navigator.requestMIDIAccess({sysex:true}).then(OnMidiSuccess, OnMidiFailure);
	}
	else {
		alert("Web MIDI is not supported in your browser. Please, try to use Google Chrome or Opera Browser.");
		return;
	}
	
	GT10_CONTROLLER_LIB = true;
	
	MenuCreate();
	CustomDatatip();
}

// Inicia execução do GT-10 Controller (se o browser suportar web midi).
function OnMidiSuccess(midiAccess){
	MidiAccess = midiAccess;
	if (DebugMode)
		console.log("Midi ready. DebugMode=on");
	else
		console.log("Midi ready. DebugMode=off.");
	
	MidiAccess.onstatechange = OnStateChange;
	
	DeviceList();
}

// Caso o Web Midi não tenha sido inicializado com sucesso.
function OnMidiFailure(msg){
	console.log("Error: Web Midi not connected.");
	if (DebugMode)
		console.log(msg);
	
	//MidiAccess.onstatechange = OnStateChange;
}

// Quando conectar ou desconectar
function OnStateChange(event) {
	var port = event.port;
	
	if (port.state == "connected")
		document.getElementById("favicon").href = "img/connected.png";
	else
		document.getElementById("favicon").href = "img/disconnected.png";
}

// Lista dos dispositivos midi disponíveis
function DeviceList(obj) {
	var input, output;
	
	for (var entry of MidiAccess.inputs) {
		input = entry[1];
		
		if (DebugMode)
			console.log( "Input port [type:'" + input.type + "'] id:'" + input.id +
			"' manufacturer:'" + input.manufacturer + "' name:'" + input.name +
			"' version:'" + input.version + "'" );
		
		if(input.name.match("BOSS GT-10") != null) {
			MidiInput = input;
			MidiInput.onmidimessage = OnMidiMessageDefaultFunction;
		}
	}

	for (var entry of MidiAccess.outputs) {
		output = entry[1];

		if (DebugMode)
			console.log( "Output port [type:'" + output.type + "'] id:'" + output.id +
			"' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
			"' version:'" + output.version + "'" );
		
		if (output.name.match("BOSS GT-10") != null)
			MidiOutput = output;
	}
	
	if (MidiInput == null) console.log("No input devices found.");
	if (MidiOutput == null)console.log("No output devices found.");
}

// Define o que fazer quando uma mensagem MIDI é recebida
function OnMidiMessage(midimsg) {
	MidiMessage = midimsg.data;
	
	if(DebugMode) {
		console.log("Midi Input:");
		console.log(MidiMessage);
	}
}

//=================================================================================================
// UTILITÁRIOS
//=================================================================================================

// Calcula e retorna checksum de dados midi
function CheckSum(bytes) {
	var check = 0;
	
	for (var i=7; i<bytes.length; i++)	// começa do bytes 7 (checksum considera apenas address e data)
		check += bytes[i];
	check %= 128;
	if (check > 0) check = 128 - check;
	
	return check;
}

// Retorna um número inteiro dentro intervalo fechaddo [min; max]
function rand(min, max) {
	return Math.floor(Math.random()*(max-min+1)) + min;
}

// Compara um subarray com um array verificando se possuem os mesmos elementos
function SubArrayCmp(array1, start, size, array2) {
	var n = start+size;
	var j = 0;
	
	if (array2.length != size)
		return false;
	
	for (var i=start; i<n; i++) {
		if (array1[i] != array2[j])
			return false;
		j++;
	}
	return true;
}

//=================================================================================================
// UTILITÁRIOS PARA HTML
//=================================================================================================

// Se um range for alterado, seu number associado será alterado também, e vice-versa.
// É necessário que o range e o number tenham id que diferenciam somente pelo case da primeira letra.
//   Exemplo:
//	 	<input type number="NomeDoParametro" /> id do number começa com letra maiúscula.
//		<input type range= "nomeDoParametro" />	id do range começa com letra minúscula (quase idêntico).
function SetValueRangeNumber(obj) {
	var id;
	if (obj.type == "range")
		id = obj.id.substring(0,1).toUpperCase() + obj.id.substring(1,obj.id.length);
	else
		id = obj.id.substring(0,1).toLowerCase() + obj.id.substring(1,obj.id.length);

	document.getElementById(id).value = obj.value;
}

// Faz o mesmo que a função SetValueRangeNumber(), porém para o caso quando label, number e select são 
// 	 mesclados num único elemento.
// O parâmetro max se refere ao maior valor numérico. O parâmetro table indica qual lista de nomes 
//   são utilizados após o valor de max.
function SetValueRangeNumberSelect(obj, max, table) {
			var id;
			var obj2;
			var label, range, number;
			
			label  = document.getElementById(obj.id.substring(0,1).toUpperCase() + obj.id.substring(1,obj.id.length)+'2');
			number = document.getElementById(obj.id.substring(0,1).toUpperCase() + obj.id.substring(1,obj.id.length));
			range  = document.getElementById(obj.id.substring(0,1).toLowerCase() + obj.id.substring(1,obj.id.length));

			if (obj == range) obj2 = number; else obj2 = range;
		
			if (table == 'bpm') 
				switch (obj.value) {
					case (max+01+""): label.innerHTML = '<strong>16th</strong>';			break;
					case (max+02+""): label.innerHTML = '<strong>8th 3</strong>';			break;
					case (max+03+""): label.innerHTML = '<strong>16th &bull;</strong>';		break;
					case (max+04+""): label.innerHTML = '<strong>8th</strong>';				break;
					case (max+05+""): label.innerHTML = '<strong>Quarter 3</strong>';		break;
					case (max+06+""): label.innerHTML = '<strong>8th &bull;</strong>';		break;
					case (max+07+""): label.innerHTML = '<strong>Quarter</strong>';			break;
					case (max+08+""): label.innerHTML = '<strong>Half 3</strong>';			break;
					case (max+09+""): label.innerHTML = '<strong>Quarter &bull;</strong>';	break;
					case (max+10+""): label.innerHTML = '<strong>Half</strong>';			break;
					case (max+11+""): label.innerHTML = '<strong>Whole 3</strong>';			break;
					case (max+12+""): label.innerHTML = '<strong>Half &bull;</strong>';		break;
					case (max+13+""): label.innerHTML = '<strong>Whole</strong>';			break;
					default:	 	  label.innerText = obj.value;
				}
			else if (table == 'bpm2') 
				switch (obj.value) {
					case (max+01+""): label.innerHTML = '<strong>Whole</strong>';			break;
					case (max+02+""): label.innerHTML = '<strong>Half &bull;</strong>';		break;
					case (max+03+""): label.innerHTML = '<strong>Whole 3</strong>';			break;
					case (max+04+""): label.innerHTML = '<strong>Half</strong>';			break;
					case (max+05+""): label.innerHTML = '<strong>Quarter &bull;</strong>';	break;
					case (max+06+""): label.innerHTML = '<strong>Half 3</strong>';			break;
					case (max+07+""): label.innerHTML = '<strong>Quarter</strong>';			break;
					case (max+08+""): label.innerHTML = '<strong>8th &bull;</strong>';		break;
					case (max+09+""): label.innerHTML = '<strong>Quarter 3</strong>';		break;
					case (max+10+""): label.innerHTML = '<strong>8th</strong>';				break;
					case (max+11+""): label.innerHTML = '<strong>16th &bull;</strong>';		break;
					case (max+12+""): label.innerHTML = '<strong>8th 3</strong>';			break;
					case (max+13+""): label.innerHTML = '<strong>16th</strong>';			break;
					default:	 	  label.innerText = obj.value;
				}
				
			obj2.value = obj.value;
		}

// Cria o menu html no cabeçalho da página (deve existir uma tag header)
function MenuCreate() {
	document.getElementsByTagName('header')[0].innerHTML = "\
		<h1 data-tip='<p>Please, use one of the following supported browsers: <ul><li>Google Chrome (v.52 or later)</li><li>Opera Browser (v.39 or later)</li></ul></p>'>BOSS GT-10 Controller <span data-tip='<p>Email:gt10webcontrol@hotmail.com</p>' style='font-size:12px; font-weight:normal;'>Developed by Walter Alexandre A. de Oliveira</span></h1>\
		<div class='formEdit'>\
			<h2>Menu</h2>\
			<a href='gt10-preset.html'>Patch Select</a>\
			<a href='gt10-chain.html'>Fx Chain</a>\
			<a href='gt10-sr.html'>Send/Return</a>\
			<a href='gt10-master.html'>Master</a>\
			<a href=''>*Assign</a>\
			<a href='gt10-ampctrl.html'>Amp Control</a>\
			<a href=''>*System</a>\
			<a href='gt10-eztone.html'>Ez Tone</a>\
			<a href='gt10-inout.html'>Input/Output</a>\
			<br/>\
			<a href='gt10-comp.html'>Compressor</a>\
			<a href='gt10-odds.html'>OD/DS</a>\
			<a href='gt10-preamp.html'>Preamp</a>\
			<a href='gt10-eq.html'>Equalizer</a>\
			<a href='gt10-fx.html'>FX-1/FX-2</a>\
			<a href='gt10-delay.html'>Delay</a>\
			<a href='gt10-chorus.html'>Chorus</a>\
			<a href='gt10-reverb.html'>Reverb</a>\
			<a href=''>*Pedal</a>\
			<a href='gt10-ns.html'>NS</a>\
		</div>\
	";
}

//=================================================================================================
// CONFIGURAÇÃO DE EFEITOS NA GT-10
//=================================================================================================

// Altera o FxChain da gt-10
function SetFxChain() {
	var message      = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x12,  0x60,0x00,0x0b,0x00];	// header + address
	var containerPre = document.getElementById('fxChainPre');
	var containerPos = document.getElementById('fxChainPos');
	var containerA 	 = document.getElementById('fxChainA');
	var containerB 	 = document.getElementById('fxChainB');
	var position, value;
	
	// Pre
	position = 1;
	for (var i=0; i<containerPre.children.length-1; i++) {
		value = parseInt(containerPre.children[i].id.substr(1,2));
		//SetParameter("fxchainposition"+position, value);
		message.push(value);
		
		if (DebugMode)
			console.log("pre="+position+" val="+value);
		
		position++;
	}
	
	// Separador
	//SetParameter("fxchainposition"+position, 0x10);
	message.push(0x10);
	if (DebugMode)
		console.log("split="+position)
	position++;
	
	// Canal A
	for (var i=0; i<containerA.children.length-1; i++) {
		value = parseInt(containerA.children[i].id.substr(1,2));
		// SetParameter("fxchainposition"+position, value);
		message.push(value);
		
		if (DebugMode)
			console.log("A="+position+" val="+value);
		
		position++;
	}
	
	// Canal B
	for (var i=0; i<containerB.children.length-1; i++) {
		value = parseInt(containerB.children[i].id.substr(1,2)) + 0x40;
		// SetParameter("fxchainposition"+position, value);
		message.push(value);
		
		if (DebugMode)
			console.log("B="+position+" val="+value);
		
		position++;
	}
	
	// Mixer
	// SetParameter("fxchainposition"+position, 0x11);
	message.push(0x11);
	if (DebugMode)
		console.log("mixer="+position);
	position++;
	
	// Pós
	for (var i=0; i<containerPos.children.length-1; i++) {
		value = parseInt(containerPos.children[i].id.substr(1,2));
		// SetParameter("fxchainposition"+position, value);
		message.push(value);
		
		if (DebugMode)
			console.log("pos="+position+" val="+value);
		
		position++;
	}
	
	message.push(CheckSum(message));
	message.push(0xf7);
	
	if (DebugMode) {
		console.log("FxChain");
		console.log("MIDI:"+message);
	}
	
	if (MidiOutput)
		MidiOutput.send(message);
}

// Altera o FxChain aleatoriamente na gt10
function RandomFxChain(level) {
	// containers do effect chain
	var containerPre = document.getElementById('fxChainPre');
	var containerPos = document.getElementById('fxChainPos');
	var containerA 	 = document.getElementById('fxChainA');
	var containerB 	 = document.getElementById('fxChainB');
	var pedals       = [];										// efeitos da effect chain
	
	var cPre = [], cA = [], cB = [], cPos = [];
	var c, aux;
	
	// salva componentes html correspondente aos efeitos (antes que sejam removidos)
	for (var i=0; i<16; i++)
		pedals.push(document.getElementById("p"+i));
	
	// cria uma lista aleatória de efeitos para cada container
	if (level == 2) {							// Totalmente aleatório (muda efeitos de containers)
		for (var i=0; i<16; i++) {
			
			if (i == 2) {						// Preamps A e B não podem mudar de containers
				cA.push(i);
				continue;
			}
			if (i == 3) {
				cB.push(i);
				continue;
			}
			
			c = rand(0,3);
			if (c == 0) cPre.push(i);
			else if (c == 1) cA.push(i);
			else if (c == 2) cB.push(i);
			else cPos.push(i);
		}
	}
	else {										// Parcialmente aleatório (efeitos permanecem em seus containers)
		for (var i=0; i<containerPre.children.length-1; i++)
			cPre.push(parseInt(containerPre.children[i].id.substr(1,2)));
		for (var i=0; i<containerA.children.length-1; i++)
			cA.push(parseInt(containerA.children[i].id.substr(1,2)));
		for (var i=0; i<containerB.children.length-1; i++)
			cB.push(parseInt(containerB.children[i].id.substr(1,2)));
		for (var i=0; i<containerPos.children.length-1; i++)
			cPos.push(parseInt(containerPos.children[i].id.substr(1,2)));
	}
	
	// altera a ordem dos efeitos em cada lista para uma ordem aleatória
	for (var i=0; i<cPre.length; i++) {
		c 		= rand(0,cPre.length-1);
		aux 	= cPre[i];
		cPre[i] = cPre[c];
		cPre[c] = aux;
	}
	for (var i=0; i<cA.length; i++) {
		c 		= rand(0,cA.length-1);
		aux 	= cA[i];
		cA[i] 	= cA[c];
		cA[c] 	= aux;
	}
	for (var i=0; i<cB.length; i++) {
		c 		= rand(0,cB.length-1);
		aux 	= cB[i];
		cB[i] 	= cB[c];
		cB[c] 	= aux;
	}
	for (var i=0; i<cPos.length; i++) {
		c 		= rand(0,cPos.length-1);
		aux 	= cPos[i];
		cPos[i] = cPos[c];
		cPos[c] = aux;
	}

	// remove todos os efeitos de cada container
	for (var i=containerPre.children.length-2; i>=0; i--)
		containerPre.children[i].remove();
	for (var i=containerA.children.length-2; i>=0; i--)
		containerA.children[i].remove();
	for (var i=containerB.children.length-2; i>=0; i--)
		containerB.children[i].remove();
	for (var i=containerPos.children.length-2; i>=0; i--)
		containerPos.children[i].remove();
	
	// insere os efeitos das listas aleatórias geradas para cada container
	for (var i=0; i<cPre.length; i++)
		containerPre.insertBefore(pedals[cPre[i]], containerPre.children[containerPre.children.length-1]);
	for (var i=0; i<cA.length; i++)
		containerA.insertBefore(pedals[cA[i]], containerA.children[containerA.children.length-1]);
	for (var i=0; i<cB.length; i++)
		containerB.insertBefore(pedals[cB[i]], containerB.children[containerB.children.length-1]);
	for (var i=0; i<cPos.length; i++)
		containerPos.insertBefore(pedals[cPos[i]], containerPos.children[containerPos.children.length-1]);

	SetFxChain();
}

//** Obtém parâmetros da gt10
function GetParameter(parameter) {
	var message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11];		// header midi message
	
	parameter = parameter.toLowerCase();
	
	switch(parameter) {
		case "inputoutput":		message = message.concat([0x00,0x00,0x00,0x22, 0x00,0x00,0x00,0x31]); GetParameter("PatchOutput"); break;
		case "patchoutput":		message = message.concat([0x60,0x00,0x00,0x11, 0x00,0x00,0x00,0x01]); break;
		case "compressor":		message = message.concat([0x60,0x00,0x00,0x40, 0x00,0x00,0x00,0x08]); break;
		case "odds":			message = message.concat([0x60,0x00,0x00,0x70, 0x00,0x00,0x00,0x0e]); break;
		case "preamp":			message = message.concat([0x60,0x00,0x01,0x00, 0x00,0x00,0x00,0x05]); break;
		case "preampa":			message = message.concat([0x60,0x00,0x01,0x10, 0x00,0x00,0x00,0x1d]); break;
		case "preampb":			message = message.concat([0x60,0x00,0x01,0x30, 0x00,0x00,0x00,0x1d]); break;
		case "equalizer":		message = message.concat([0x60,0x00,0x01,0x70, 0x00,0x00,0x00,0x0c]); break;
		case "fx1":				message = message.concat([0x60,0x00,0x02,0x00, 0x00,0x00,0x00,0x02]); break;
		case "fx1advcomp":		message = message.concat([0x60,0x00,0x02,0x02, 0x00,0x00,0x00,0x05]); break;
		case "fx1limiter":		message = message.concat([0x60,0x00,0x02,0x07, 0x00,0x00,0x00,0x06]); break;
		case "fx1twah":			message = message.concat([0x60,0x00,0x02,0x0d, 0x00,0x00,0x00,0x07]); break;
		case "fx1autowah":		message = message.concat([0x60,0x00,0x02,0x14, 0x00,0x00,0x00,0x07]); break;
		case "fx1tremolo":		message = message.concat([0x60,0x00,0x02,0x1b, 0x00,0x00,0x00,0x03]); break;
		case "fx1phaser":		message = message.concat([0x60,0x00,0x02,0x1e, 0x00,0x00,0x00,0x08]); break;
		case "fx1flanger":		message = message.concat([0x60,0x00,0x02,0x26, 0x00,0x00,0x00,0x08]); break;
		case "fx1pan":			message = message.concat([0x60,0x00,0x02,0x2e, 0x00,0x00,0x00,0x05]); break;
		case "fx1vibrato":		message = message.concat([0x60,0x00,0x02,0x33, 0x00,0x00,0x00,0x04]); break;
		case "fx1univ":			message = message.concat([0x60,0x00,0x02,0x37, 0x00,0x00,0x00,0x03]); break;
		case "fx1ringmod":		message = message.concat([0x60,0x00,0x02,0x3a, 0x00,0x00,0x00,0x04]); break;
		case "fx1slowgear":		message = message.concat([0x60,0x00,0x02,0x3e, 0x00,0x00,0x00,0x02]); break;
		case "fx1feedbacker":	message = message.concat([0x60,0x00,0x02,0x40, 0x00,0x00,0x00,0x07]); break;
		case "fx1antifeedback":	message = message.concat([0x60,0x00,0x02,0x47, 0x00,0x00,0x00,0x06]); break;
		case "fx1humanizer":	message = message.concat([0x60,0x00,0x02,0x4d, 0x00,0x00,0x00,0x08]); break;
		case "fx1slicer":		message = message.concat([0x60,0x00,0x02,0x55, 0x00,0x00,0x00,0x03]); break;
		case "fx1paraeq":		message = message.concat([0x60,0x00,0x02,0x58, 0x00,0x00,0x00,0x0b]); break;
		case "fx1harmonist":	message = message.concat([0x60,0x00,0x02,0x63, 0x00,0x00,0x00,0x23]); break;
		case "fx1pitchshifter":	message = message.concat([0x60,0x00,0x03,0x06, 0x00,0x00,0x00,0x0f]); break;
		case "fx1octave":		message = message.concat([0x60,0x00,0x03,0x15, 0x00,0x00,0x00,0x03]); break;
		case "fx1rotary":		message = message.concat([0x60,0x00,0x03,0x18, 0x00,0x00,0x00,0x06]); break;
		case "fx12x2chorus":	message = message.concat([0x60,0x00,0x03,0x1e, 0x00,0x00,0x00,0x09]); break;
		case "fx1subdelay":		message = message.concat([0x60,0x00,0x03,0x27, 0x00,0x00,0x00,0x06]); break;
		case "fx1defretter":	message = message.concat([0x60,0x00,0x03,0x2d, 0x00,0x00,0x00,0x07]); break;
		case "fx1sitarsim":		message = message.concat([0x60,0x00,0x03,0x34, 0x00,0x00,0x00,0x07]); break;
		case "fx1wavesynth":	message = message.concat([0x60,0x00,0x03,0x3b, 0x00,0x00,0x00,0x08]); break;
		case "fx1guitarsynth":	message = message.concat([0x60,0x00,0x03,0x43, 0x00,0x00,0x00,0x11]); break;
		case "fx1autoriff":		message = message.concat([0x60,0x00,0x03,0x54, 0x00,0x00,0x00,0xc8]); break;
		case "fx1soundhold":	message = message.concat([0x60,0x00,0x05,0x1c, 0x00,0x00,0x00,0x03]); break;
		case "fx1tonemodify":	message = message.concat([0x60,0x00,0x05,0x1f, 0x00,0x00,0x00,0x05]); break;
		case "fx1guitarsim":	message = message.concat([0x60,0x00,0x05,0x24, 0x00,0x00,0x00,0x05]); break;
		case "fx1acprocessor":	message = message.concat([0x60,0x00,0x05,0x29, 0x00,0x00,0x00,0x07]); break;
		case "fx1subwah":		message = message.concat([0x60,0x00,0x05,0x30, 0x00,0x00,0x00,0x06]); break;
		case "fx1graphiceq":	message = message.concat([0x60,0x00,0x05,0x36, 0x00,0x00,0x00,0x0b]); break;
		case "fx2":				message = message.concat([0x60,0x00,0x06,0x00, 0x00,0x00,0x00,0x02]); break;
		case "fx2advcomp":		message = message.concat([0x60,0x00,0x06,0x02, 0x00,0x00,0x00,0x05]); break;
		case "fx2limiter":		message = message.concat([0x60,0x00,0x06,0x07, 0x00,0x00,0x00,0x06]); break;
		case "fx2twah":			message = message.concat([0x60,0x00,0x06,0x0d, 0x00,0x00,0x00,0x07]); break;
		case "fx2autowah":		message = message.concat([0x60,0x00,0x06,0x14, 0x00,0x00,0x00,0x07]); break;
		case "fx2tremolo":		message = message.concat([0x60,0x00,0x06,0x1b, 0x00,0x00,0x00,0x03]); break;
		case "fx2phaser":		message = message.concat([0x60,0x00,0x06,0x1e, 0x00,0x00,0x00,0x08]); break;
		case "fx2flanger":		message = message.concat([0x60,0x00,0x06,0x26, 0x00,0x00,0x00,0x08]); break;
		case "fx2pan":			message = message.concat([0x60,0x00,0x06,0x2e, 0x00,0x00,0x00,0x05]); break;
		case "fx2vibrato":		message = message.concat([0x60,0x00,0x06,0x33, 0x00,0x00,0x00,0x04]); break;
		case "fx2univ":			message = message.concat([0x60,0x00,0x06,0x37, 0x00,0x00,0x00,0x03]); break;
		case "fx2ringmod":		message = message.concat([0x60,0x00,0x06,0x3a, 0x00,0x00,0x00,0x04]); break;
		case "fx2slowgear":		message = message.concat([0x60,0x00,0x06,0x3e, 0x00,0x00,0x00,0x02]); break;
		case "fx2feedbacker":	message = message.concat([0x60,0x00,0x06,0x40, 0x00,0x00,0x00,0x07]); break;
		case "fx2antifeedback":	message = message.concat([0x60,0x00,0x06,0x47, 0x00,0x00,0x00,0x06]); break;
		case "fx2humanizer":	message = message.concat([0x60,0x00,0x06,0x4d, 0x00,0x00,0x00,0x08]); break;
		case "fx2slicer":		message = message.concat([0x60,0x00,0x06,0x55, 0x00,0x00,0x00,0x03]); break;
		case "fx2paraeq":		message = message.concat([0x60,0x00,0x06,0x58, 0x00,0x00,0x00,0x0b]); break;
		case "fx2harmonist":	message = message.concat([0x60,0x00,0x06,0x63, 0x00,0x00,0x00,0x23]); break;
		case "fx2pitchshifter":	message = message.concat([0x60,0x00,0x07,0x06, 0x00,0x00,0x00,0x0f]); break;
		case "fx2octave":		message = message.concat([0x60,0x00,0x07,0x15, 0x00,0x00,0x00,0x03]); break;
		case "fx2rotary":		message = message.concat([0x60,0x00,0x07,0x18, 0x00,0x00,0x00,0x06]); break;
		case "fx22x2chorus":	message = message.concat([0x60,0x00,0x07,0x1e, 0x00,0x00,0x00,0x09]); break;
		case "fx2subdelay":		message = message.concat([0x60,0x00,0x07,0x27, 0x00,0x00,0x00,0x06]); break;
		case "fx2defretter":	message = message.concat([0x60,0x00,0x07,0x2d, 0x00,0x00,0x00,0x07]); break;
		case "fx2sitarsim":		message = message.concat([0x60,0x00,0x07,0x34, 0x00,0x00,0x00,0x07]); break;
		case "fx2wavesynth":	message = message.concat([0x60,0x00,0x07,0x3b, 0x00,0x00,0x00,0x08]); break;
		case "fx2guitarsynth":	message = message.concat([0x60,0x00,0x07,0x43, 0x00,0x00,0x00,0x11]); break;
		case "fx2autoriff":		message = message.concat([0x60,0x00,0x07,0x54, 0x00,0x00,0x00,0xc8]); break;
		case "fx2soundhold":	message = message.concat([0x60,0x00,0x09,0x1c, 0x00,0x00,0x00,0x03]); break;
		case "fx2tonemodify":	message = message.concat([0x60,0x00,0x09,0x1f, 0x00,0x00,0x00,0x05]); break;
		case "fx2guitarsim":	message = message.concat([0x60,0x00,0x09,0x24, 0x00,0x00,0x00,0x05]); break;
		case "fx2acprocessor":	message = message.concat([0x60,0x00,0x09,0x29, 0x00,0x00,0x00,0x07]); break;
		case "fx2subwah":		message = message.concat([0x60,0x00,0x09,0x30, 0x00,0x00,0x00,0x06]); break;
		case "fx2graphiceq":	message = message.concat([0x60,0x00,0x09,0x36, 0x00,0x00,0x00,0x0b]); break;
		case "delay":			message = message.concat([0x60,0x00,0x0a,0x00, 0x00,0x00,0x00,0x19]); break;
		case "chorus":			message = message.concat([0x60,0x00,0x0a,0x20, 0x00,0x00,0x00,0x08]); break;
		case "reverb":			message = message.concat([0x60,0x00,0x0a,0x30, 0x00,0x00,0x00,0x12]); break;
		case "master":			message = message.concat([0x60,0x00,0x0a,0x60, 0x00,0x00,0x00,0x09]); break;
		case "ampcontrol":		message = message.concat([0x60,0x00,0x0a,0x69, 0x00,0x00,0x00,0x01]); break;
		case "ns":				message = message.concat([0x60,0x00,0x0a,0x71, 0x00,0x00,0x00,0x08]); break;
		case "sendreturn":		message = message.concat([0x60,0x00,0x0a,0x79, 0x00,0x00,0x00,0x04]); break;
		case "fxchain":			message = message.concat([0x60,0x00,0x0b,0x00, 0x00,0x00,0x00,0x12]); break;
	}
	
	message.push(CheckSum(message));
	message.push(0xf7);
	
	if (DebugMode) {
		console.log(parameter+"?");
		console.log("MIDI:"+message);
	}
	
	if (MidiOutput) {
		MidiInput.onmidimessage = GetParameterValue;
		MidiOutput.send(message);
	}
}

//** Processa resposta pela requisição de um parâmetro. Veja a função GetParameter().
function GetParameterValue(message) {
	// Input/Output
	if (SubArrayCmp(message.data,7,4,[0x00,0x00,0x00,0x22])) {
		document.getElementById('InputOutputUsbDgtOutLev').value 	 = message.data[11]; 	document.getElementById('inputOutputUsbDgtOutLev').value 	 = message.data[11];
		document.getElementById('InputOutputUsbMixLev').value 	 	 = message.data[12]; 	document.getElementById('inputOutputUsbMixLev').value 	 	 = message.data[12];
		document.getElementById('InputOutputInputLev1').value 	 	 = message.data[41]; 	document.getElementById('inputOutputInputLev1').value 	 	 = message.data[41];
		document.getElementById('InputOutputInputPres1').value 	 	 = message.data[42]; 	document.getElementById('inputOutputInputPres1').value 	 	 = message.data[42];
		document.getElementById('InputOutputInputLev2').value 	 	 = message.data[43]; 	document.getElementById('inputOutputInputLev2').value 	 	 = message.data[43];
		document.getElementById('InputOutputInputPres2').value 	 	 = message.data[44]; 	document.getElementById('inputOutputInputPres2').value 	 	 = message.data[44];
		document.getElementById('InputOutputInputLev3').value 	 	 = message.data[45]; 	document.getElementById('inputOutputInputLev3').value 	 	 = message.data[45];
		document.getElementById('InputOutputInputPres3').value 	 	 = message.data[46]; 	document.getElementById('inputOutputInputPres3').value 	 	 = message.data[46];
		document.getElementById('InputOutputUsbInLev3').value 	 	 = message.data[47]; 	document.getElementById('inputOutputUsbInLev3').value 	 	 = message.data[47];
		document.getElementById('InputOutputUsbInPres3').value 	 	 = message.data[48]; 	document.getElementById('inputOutputUsbInPres3').value 	 	 = message.data[48];
		document.getElementById('InputOutputGlobalEqLowGain').value  = message.data[49]; 	document.getElementById('inputOutputGlobalEqLowGain').value  = message.data[49];
		document.getElementById('InputOutputGlobalEqMidGain').value  = message.data[50]; 	document.getElementById('inputOutputGlobalEqMidGain').value  = message.data[50];
		document.getElementById('InputOutputGlobalEqMidFreq').value  = message.data[51]; 	document.getElementById('inputOutputGlobalEqMidFreq').value  = message.data[51];
		document.getElementById('InputOutputGlobalEqMidQ').value 	 = message.data[52]; 	document.getElementById('inputOutputGlobalEqMidQ').value 	 = message.data[52];
		document.getElementById('InputOutputGlobalEqHighGain').value = message.data[53]; 	document.getElementById('inputOutputGlobalEqHighGain').value = message.data[53];
		switch(message.data[54]) {
			case 0:	document.getElementById('InputOutputInputSelectGt1').checked = true; break;
			case 1:	document.getElementById('InputOutputInputSelectGt2').checked = true; break;
			case 2:	document.getElementById('InputOutputInputSelectGt3').checked = true; break;
			case 3:	document.getElementById('InputOutputInputSelectUsb').checked = true; break;
		}
		switch(message.data[55]) {
			case 0: document.getElementById('OutputSelectModePatch').checked  = true;  break;
			case 1: document.getElementById('OutputSelectModeSystem').checked = true;  break;
		}
		document.getElementById('SystemOutputSelect').value = message.data[56];
		document.getElementById('InputOutputNsThreshold').value 	= message.data[57];		document.getElementById('inputOutputNsThreshold').value 	 = message.data[57];
		document.getElementById('InputOutputRevLevel').value 		= message.data[58];		document.getElementById('inputOutputRevLevel').value 		 = message.data[58];
		switch(message.data[59]) {
			case 0: document.getElementById('InputOutputMainOutLev10').checked = true;  break;
			case 1: document.getElementById('InputOutputMainOutLev4').checked  = true;  break;
		}
	}
	// Patch Output Select
	if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x00,0x11])) {
		document.getElementById('PatchOutputSelect').value = message.data[11];
	}
	
	// Compressor
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x00,0x40])) {
		document.getElementById('CompressorSw').checked 		= (message.data[11] == 1);
		if (message.data[12] == 0)
			document.getElementById('CompressorTypeCompressor').checked = true;
		else
			document.getElementById('CompressorTypeLimiter').checked = true;
		document.getElementById('CompressorSustain').value 		= message.data[13]; 	document.getElementById('compressorSustain').value 	 	= message.data[13];
		document.getElementById('CompressorAttack').value 		= message.data[14]; 	document.getElementById('compressorAttack').value 	 	= message.data[14];
		document.getElementById('CompressorThreshold').value 	= message.data[15]; 	document.getElementById('compressorThreshold').value 	= message.data[15];
		document.getElementById('CompressorRelease').value 		= message.data[16]; 	document.getElementById('compressorRelease').value 	 	= message.data[16];
		document.getElementById('CompressorTone').value 		= message.data[17]-50; 	document.getElementById('compressorTone').value 	 	= message.data[17]-50;
		document.getElementById('CompressorLevel').value 		= message.data[18]; 	document.getElementById('compressorLevel').value 	 	= message.data[18];
	}
	
	// OD/DS
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x00,0x70])) {
		document.getElementById('OddsSw').checked 			= (message.data[11] == 1);
		document.getElementById('OddsType').value 			= message.data[12];
		document.getElementById('OddsDrive').value 			= message.data[13]; 				document.getElementById('oddsDrive').value 			= message.data[13];
		document.getElementById('OddsBottom').value 		= message.data[14]-50; 				document.getElementById('oddsBottom').value 		= message.data[14]-50;
		document.getElementById('OddsTone').value 			= message.data[15]-50; 				document.getElementById('oddsTone').value 			= message.data[15]-50;
		document.getElementById('OddsEffectLev').value 		= message.data[16]; 				document.getElementById('oddsEffectLev').value 		= message.data[16];
		document.getElementById('OddsDirectLev').value		= message.data[17]; 				document.getElementById('oddsDirectLev').value 		= message.data[17];
		document.getElementById('OddsSoloSw').checked 		= (message.data[18] == 1);
		document.getElementById('OddsSoloLevel').value 		= message.data[19]; 				document.getElementById('oddsSoloLevel').value 		= message.data[19];
		document.getElementById('OddsCustomType').value 	= message.data[20];
		document.getElementById('OddsCustomBottom').value 	= 10 * (message.data[21] - 5);		document.getElementById('oddsCustomBottom').value 	= 10 * (message.data[21] - 5);
		document.getElementById('OddsCustomTop').value 		= 10 * (message.data[22] - 5);		document.getElementById('oddsCustomTop').value 		= 10 * (message.data[22] - 5);
		document.getElementById('OddsCustomLow').value 		= 10 * (message.data[23] - 5); 		document.getElementById('oddsCustomLow').value 		= 10 * (message.data[23] - 5);
		document.getElementById('OddsCustomHigh').value 	= 10 * (message.data[24] - 5); 		document.getElementById('oddsCustomHigh').value 	= 10 * (message.data[24] - 5);
	}

	// Preamp Common
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x01,0x00])) {
		document.getElementById('PreampSw').checked = (message.data[11] == 1);
		switch (message.data[12]) {
			case 0: document.getElementById('PreampChModeSingle').checked = true; 	break;
			case 1: document.getElementById('PreampChModeDualMono').checked = true; break;
			case 2: document.getElementById('PreampChModeDualLR').checked = true; 	break;
			case 3: document.getElementById('PreampChModeDynamic').checked = true; 	break;
		}
		switch (message.data[13]) {
			case 0: document.getElementById('PreampChSelectA').checked = true; break;
			case 1: document.getElementById('PreampChSelectB').checked = true; break;
		}
		document.getElementById('PreampChDlyTim').value = message.data[14]; document.getElementById('preampChDlyTim').value = message.data[14];
		document.getElementById('PreampDynaSens').value = message.data[15];	document.getElementById('preampDynaSens').value = message.data[15];
	}

	// Preamp A
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x01,0x10])) {
		document.getElementById('PreampAType').value 	 = message.data[11];
		document.getElementById('PreampAGain').value 	 = message.data[12];			document.getElementById('preampAGain').value 	 = message.data[12];
		document.getElementById('PreampABass').value 	 = message.data[13];			document.getElementById('preampABass').value 	 = message.data[13];
		document.getElementById('PreampAMiddle').value 	 = message.data[14];			document.getElementById('preampAMiddle').value 	 = message.data[14];
		document.getElementById('PreampATreble').value 	 = message.data[15];			document.getElementById('preampATreble').value   = message.data[15];
		document.getElementById('PreampAPresence').value = message.data[16];			document.getElementById('preampAPresence').value = message.data[16];
		document.getElementById('PreampALevel').value 	 = message.data[17];			document.getElementById('preampALevel').value 	 = message.data[17];
		document.getElementById('PreampABright').checked = (message.data[18] == 1);
		switch(message.data[19]) {
			case 0: document.getElementById('PreampAGainSwLow').checked 	= true; break;
			case 1: document.getElementById('PreampAGainSwMiddle').checked 	= true; break;
			case 2: document.getElementById('PreampAGainSwHigh').checked 	= true; break;
		}
		document.getElementById('PreampASoloSw').checked  = (message.data[20] == 1);
		document.getElementById('PreampASoloLevel').value = message.data[21];			document.getElementById('preampASoloLevel').value = message.data[21];
		document.getElementById('SpeakerASpType').value   = message.data[22];
		document.getElementById('SpeakerAMicType').value  = message.data[23];
		switch(message.data[24]) {
			case 0: document.getElementById('SpeakerAMicDisOff').checked = true; break;
			case 1: document.getElementById('SpeakerAMicDisOn').checked  = true; break;
		}
		document.getElementById('SpeakerAMicPos').value 		 = message.data[25];				document.getElementById('speakerAMicPos').value 		 = message.data[25];
		document.getElementById('SpeakerAMicLevel').value 		 = message.data[26];				document.getElementById('speakerAMicLevel').value 		 = message.data[26];
		document.getElementById('SpeakerADirectLev').value 		 = message.data[27];				document.getElementById('speakerADirectLev').value 		 = message.data[27];
		document.getElementById('PreampCustomAType').value 		 = message.data[28];
		document.getElementById('PreampCustomABottom').value 	 = 10 * (message.data[29] - 5);		document.getElementById('preampCustomABottom').value 	 = 10 * (message.data[29] - 5);
		document.getElementById('PreampCustomAEdge').value 	 	 = 10 * (message.data[30] - 5);		document.getElementById('preampCustomAEdge').value 		 = 10 * (message.data[30] - 5);
		document.getElementById('PreampCustomABassFreq').value 	 = 10 * (message.data[31] - 5);		document.getElementById('preampCustomABassFreq').value 	 = 10 * (message.data[31] - 5);
		document.getElementById('PreampCustomATreFreq').value 	 = 10 * (message.data[32] - 5);		document.getElementById('preampCustomATreFreq').value 	 = 10 * (message.data[32] - 5);
		document.getElementById('PreampCustomAPreampLow').value  = 10 * (message.data[33] - 5);		document.getElementById('preampCustomAPreampLow').value  = 10 * (message.data[33] - 5);
		document.getElementById('PreampCustomAPreampHi').value 	 = 10 * (message.data[34] - 5);		document.getElementById('preampCustomAPreampHi').value 	 = 10 * (message.data[34] - 5);
		document.getElementById('SpeakerCustomASpSize').value 	 = message.data[35] + 5;			document.getElementById('speakerCustomASpSize').value 	 = message.data[35] + 5;
		document.getElementById('SpeakerCustomAColorLow').value  = message.data[36] - 10;			document.getElementById('speakerCustomAColorLow').value  = message.data[36] - 10;
		document.getElementById('SpeakerCustomAColorHigh').value = message.data[37] - 10;			document.getElementById('speakerCustomAColorHigh').value = message.data[37] - 10;
		switch(message.data[38]) {
			case 0: document.getElementById('SpeakerCustomASpNumberX1').checked = true; break;
			case 1: document.getElementById('SpeakerCustomASpNumberX2').checked = true; break;
			case 2: document.getElementById('SpeakerCustomASpNumberX4').checked = true; break;
			case 3: document.getElementById('SpeakerCustomASpNumberX8').checked = true; break;
		}
		switch(message.data[39]) {
			case 0: document.getElementById('SpeakerCustomACabinetOpen').checked  = true; break;
			case 0: document.getElementById('SpeakerCustomACabinetClose').checked = true; break;
		}
	}
	
	// Preamp B
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x01,0x30])) {
		document.getElementById('PreampBType').value 	 = message.data[11];
		document.getElementById('PreampBGain').value 	 = message.data[12];			document.getElementById('preampBGain').value 	 = message.data[12];
		document.getElementById('PreampBBass').value 	 = message.data[13];			document.getElementById('preampBBass').value 	 = message.data[13];
		document.getElementById('PreampBMiddle').value 	 = message.data[14];			document.getElementById('preampBMiddle').value 	 = message.data[14];
		document.getElementById('PreampBTreble').value 	 = message.data[15];			document.getElementById('preampBTreble').value   = message.data[15];
		document.getElementById('PreampBPresence').value = message.data[16];			document.getElementById('preampBPresence').value = message.data[16];
		document.getElementById('PreampBLevel').value 	 = message.data[17];			document.getElementById('preampBLevel').value 	 = message.data[17];
		document.getElementById('PreampBBright').checked = (message.data[18] == 1);
		switch(message.data[19]) {
			case 0: document.getElementById('PreampBGainSwLow').checked 	= true; break;
			case 1: document.getElementById('PreampBGainSwMiddle').checked 	= true; break;
			case 2: document.getElementById('PreampBGainSwHigh').checked 	= true; break;
		}
		document.getElementById('PreampBSoloSw').checked  = (message.data[20] == 1);
		document.getElementById('PreampBSoloLevel').value = message.data[21];			document.getElementById('preampBSoloLevel').value = message.data[21];
		document.getElementById('SpeakerBSpType').value   = message.data[22];
		document.getElementById('SpeakerBMicType').value  = message.data[23];
		switch(message.data[24]) {
			case 0: document.getElementById('SpeakerBMicDisOff').checked = true; break;
			case 1: document.getElementById('SpeakerBMicDisOn').checked  = true; break;
		}
		document.getElementById('SpeakerBMicPos').value 		 = message.data[25];				document.getElementById('speakerBMicPos').value 		 = message.data[25];
		document.getElementById('SpeakerBMicLevel').value 		 = message.data[26];				document.getElementById('speakerBMicLevel').value 		 = message.data[26];
		document.getElementById('SpeakerBDirectLev').value 		 = message.data[27];				document.getElementById('speakerBDirectLev').value 		 = message.data[27];
		document.getElementById('PreampCustomBType').value 		 = message.data[28];
		document.getElementById('PreampCustomBBottom').value 	 = 10 * (message.data[29] - 5);		document.getElementById('preampCustomBBottom').value 	 = 10 * (message.data[29] - 5);
		document.getElementById('PreampCustomBEdge').value 	 	 = 10 * (message.data[30] - 5);		document.getElementById('preampCustomBEdge').value 		 = 10 * (message.data[30] - 5);
		document.getElementById('PreampCustomBBassFreq').value 	 = 10 * (message.data[31] - 5);		document.getElementById('preampCustomBBassFreq').value 	 = 10 * (message.data[31] - 5);
		document.getElementById('PreampCustomBTreFreq').value 	 = 10 * (message.data[32] - 5);		document.getElementById('preampCustomBTreFreq').value 	 = 10 * (message.data[32] - 5);
		document.getElementById('PreampCustomBPreampLow').value  = 10 * (message.data[33] - 5);		document.getElementById('preampCustomBPreampLow').value  = 10 * (message.data[33] - 5);
		document.getElementById('PreampCustomBPreampHi').value 	 = 10 * (message.data[34] - 5);		document.getElementById('preampCustomBPreampHi').value 	 = 10 * (message.data[34] - 5);
		document.getElementById('SpeakerCustomBSpSize').value 	 = message.data[35] + 5;			document.getElementById('speakerCustomBSpSize').value 	 = message.data[35] + 5;
		document.getElementById('SpeakerCustomBColorLow').value  = message.data[36] - 10;			document.getElementById('speakerCustomBColorLow').value  = message.data[36] - 10;
		document.getElementById('SpeakerCustomBColorHigh').value = message.data[37] - 10;			document.getElementById('speakerCustomBColorHigh').value = message.data[37] - 10;
		switch(message.data[38]) {
			case 0: document.getElementById('SpeakerCustomBSpNumberX1').checked = true; break;
			case 1: document.getElementById('SpeakerCustomBSpNumberX2').checked = true; break;
			case 2: document.getElementById('SpeakerCustomBSpNumberX4').checked = true; break;
			case 3: document.getElementById('SpeakerCustomBSpNumberX8').checked = true; break;
		}
		switch(message.data[39]) {
			case 0: document.getElementById('SpeakerCustomBCabinetOpen').checked  = true; break;
			case 0: document.getElementById('SpeakerCustomBCabinetClose').checked = true; break;
		}
	}

	// Equalizer
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x01,0x70])) {
		document.getElementById('EqualizerSw').checked 	 	 = (message.data[11] == 1);
		document.getElementById('EqualizerLowCut').value 	 = message.data[12];    	document.getElementById('equalizerLowCut').value 	 = message.data[12];
		document.getElementById('EqualizerLowGain').value 	 = message.data[13]-20;     document.getElementById('equalizerLowGain').value 	 = message.data[13]-20;
		document.getElementById('EqualizerLoMidf').value 	 = message.data[14];    	document.getElementById('equalizerLoMidf').value 	 = message.data[14];
		document.getElementById('EqualizerLoMidQ').value 	 = message.data[15];    	document.getElementById('equalizerLoMidQ').value 	 = message.data[15];
		document.getElementById('EqualizerLoMidG').value 	 = message.data[16]-20;     document.getElementById('equalizerLoMidG').value 	 = message.data[16]-20;
		document.getElementById('EqualizerHiMidf').value 	 = message.data[17];    	document.getElementById('equalizerHiMidf').value 	 = message.data[17];
		document.getElementById('EqualizerHiMidQ').value 	 = message.data[18];    	document.getElementById('equalizerHiMidQ').value 	 = message.data[18];
		document.getElementById('EqualizerHiMidG').value 	 = message.data[19]-20;     document.getElementById('equalizerHiMidG').value 	 = message.data[19]-20;
		document.getElementById('EqualizerHighGain').value 	 = message.data[20]-20;     document.getElementById('equalizerHighGain').value 	 = message.data[20]-20;
		document.getElementById('EqualizerHighCut').value 	 = message.data[21];    	document.getElementById('equalizerHighCut').value 	 = message.data[21];
		document.getElementById('EqualizerLevel').value 	 = message.data[22]-20;     document.getElementById('equalizerLevel').value 	 = message.data[22]-20;
	}
	
	
	
	// Fx1
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x00])) {
		document.getElementById('Fx1Sw').checked 	= (message.data[11] == 1);
		document.getElementById('Fx1Select').value  = message.data[12];
	}
	
	// Fx1 Touch Wah
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x0d])) {
		document.getElementById('Fx1TWahMode').value 		= message.data[11];		document.getElementById('fx1TWahMode').value 		= message.data[11];
		document.getElementById('Fx1TWahPolarity').value 	= message.data[12];     document.getElementById('fx1TWahPolarity').value 	= message.data[12];
		document.getElementById('Fx1TWahSens').value 		= message.data[13];     document.getElementById('fx1TWahSens').value 		= message.data[13];
		document.getElementById('Fx1TWahFrequency').value 	= message.data[14];     document.getElementById('fx1TWahFrequency').value 	= message.data[14];
		document.getElementById('Fx1TWahPeak').value 		= message.data[15];     document.getElementById('fx1TWahPeak').value 		= message.data[15];
		document.getElementById('Fx1TWahDirectLev').value 	= message.data[16];     document.getElementById('fx1TWahDirectLev').value 	= message.data[16];
		document.getElementById('Fx1TWahEffectLev').value 	= message.data[17];     document.getElementById('fx1TWahEffectLev').value 	= message.data[17];
	}
	
	// Fx1 Auto Wah
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x14])) {
		document.getElementById('Fx1AutoWahMode').value 		= message.data[11];		document.getElementById('fx1AutoWahMode').value 		= message.data[11];
		document.getElementById('Fx1AutoWahFrequency').value 	= message.data[12];	    document.getElementById('fx1AutoWahFrequency').value 	= message.data[12];
		document.getElementById('Fx1AutoWahPeak').value 		= message.data[13];	    document.getElementById('fx1AutoWahPeak').value 		= message.data[13];
		document.getElementById('fx1AutoWahRate').value 		= message.data[14];	    document.getElementById('fx1AutoWahRate').value 		= message.data[14];		SetValueRangeNumberSelect(document.getElementById('fx1AutoWahRate'),100,'bpm2');
		document.getElementById('Fx1AutoWahDepth').value 		= message.data[15];	    document.getElementById('fx1AutoWahDepth').value 		= message.data[15];
		document.getElementById('Fx1AutoWahDirectLev').value 	= message.data[16];	    document.getElementById('fx1AutoWahDirectLev').value 	= message.data[16];
		document.getElementById('Fx1AutoWahEffectLev').value 	= message.data[17];	    document.getElementById('fx1AutoWahEffectLev').value 	= message.data[17];
	}
	
	// Fx1 SubWah
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x05,0x30])) {
		document.getElementById('Fx1SubWahType').value   	= message.data[11];		document.getElementById('fx1SubWahType').value   	= message.data[11];
		document.getElementById('Fx1SubWahPedalPos').value  = message.data[12];     document.getElementById('fx1SubWahPedalPos').value  = message.data[12];
		document.getElementById('Fx1SubWahPedalMin').value  = message.data[13];     document.getElementById('fx1SubWahPedalMin').value  = message.data[13];
		document.getElementById('Fx1SubWahPedalMax').value  = message.data[14];     document.getElementById('fx1SubWahPedalMax').value  = message.data[14];
		document.getElementById('Fx1SubWahEffectLev').value	= message.data[15];     document.getElementById('fx1SubWahEffectLev').value	= message.data[15];
		document.getElementById('Fx1SubWahDirectLev').value	= message.data[16];     document.getElementById('fx1SubWahDirectLev').value	= message.data[16];
	}
		
	// Fx1 Advanced compressor
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x02])) {
		document.getElementById('Fx1AdvCompType').value 	= message.data[11];		document.getElementById('fx1AdvCompType').value 	= message.data[11];
		document.getElementById('Fx1AdvCompSustain').value 	= message.data[12];		document.getElementById('fx1AdvCompSustain').value 	= message.data[12];
		document.getElementById('Fx1AdvCompAttack').value 	= message.data[13];		document.getElementById('fx1AdvCompAttack').value 	= message.data[13];
		document.getElementById('Fx1AdvCompTone').value 	= message.data[14]-50;	document.getElementById('fx1AdvCompTone').value 	= message.data[14]-50;
		document.getElementById('Fx1AdvCompLevel').value 	= message.data[15];		document.getElementById('fx1AdvCompLevel').value 	= message.data[15];
	}
	
	// Fx1 Limiter
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x07])) {
		document.getElementById('Fx1LimiterType').value 		= message.data[11];		document.getElementById('fx1LimiterType').value 		= message.data[11];
		document.getElementById('Fx1LimiterAttack').value 		= message.data[12];     document.getElementById('fx1LimiterAttack').value 		= message.data[12];
		document.getElementById('Fx1LimiterThreshold').value 	= message.data[13];     document.getElementById('fx1LimiterThreshold').value 	= message.data[13];
		document.getElementById('Fx1LimiterRatio').value 		= message.data[14];     document.getElementById('fx1LimiterRatio').value 		= message.data[14];
		document.getElementById('Fx1LimiterRelease').value 		= message.data[15];     document.getElementById('fx1LimiterRelease').value 		= message.data[15];
		document.getElementById('Fx1LimiterLevel').value 		= message.data[16];     document.getElementById('fx1LimiterLevel').value 		= message.data[16];
	}
	
	// Fx1 Graphic Eq
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x05,0x36])) {
		document.getElementById('Fx1GraphicEqLevel').value 	 = message.data[11]-12;    	document.getElementById('fx1GraphicEqLevel').value 	 = message.data[11]-12;
		document.getElementById('Fx1GraphicEq31').value 	 = message.data[12]-12;    	document.getElementById('fx1GraphicEq31').value 	 = message.data[12]-12;
		document.getElementById('Fx1GraphicEq62').value 	 = message.data[13]-12;    	document.getElementById('fx1GraphicEq62').value 	 = message.data[13]-12;
		document.getElementById('Fx1GraphicEq125').value 	 = message.data[14]-12;    	document.getElementById('fx1GraphicEq125').value 	 = message.data[14]-12;
		document.getElementById('Fx1GraphicEq250').value 	 = message.data[15]-12;    	document.getElementById('fx1GraphicEq250').value 	 = message.data[15]-12;
		document.getElementById('Fx1GraphicEq500').value 	 = message.data[16]-12;    	document.getElementById('fx1GraphicEq500').value 	 = message.data[16]-12;
		document.getElementById('Fx1GraphicEq1k').value 	 = message.data[17]-12;    	document.getElementById('fx1GraphicEq1k').value 	 = message.data[17]-12;
		document.getElementById('Fx1GraphicEq2k').value 	 = message.data[18]-12;    	document.getElementById('fx1GraphicEq2k').value 	 = message.data[18]-12;
		document.getElementById('Fx1GraphicEq4k').value 	 = message.data[19]-12;    	document.getElementById('fx1GraphicEq4k').value 	 = message.data[19]-12;
		document.getElementById('Fx1GraphicEq8k').value 	 = message.data[20]-12;    	document.getElementById('fx1GraphicEq8k').value 	 = message.data[20]-12;
		document.getElementById('Fx1GraphicEq16k').value 	 = message.data[21]-12;    	document.getElementById('fx1GraphicEq16k').value 	 = message.data[21]-12;
	}
	
	// Fx1 Parametric Eq
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x58])) {
		document.getElementById('Fx1ParaEqLowCut').value 	 = message.data[11];    	document.getElementById('fx1ParaEqLowCut').value 	 = message.data[11];
		document.getElementById('Fx1ParaEqLowGain').value 	 = message.data[12]-20;    	document.getElementById('fx1ParaEqLowGain').value 	 = message.data[12]-20;
		document.getElementById('Fx1ParaEqLoMidf').value 	 = message.data[13];    	document.getElementById('fx1ParaEqLoMidf').value 	 = message.data[13];
		document.getElementById('Fx1ParaEqLoMidQ').value 	 = message.data[14];    	document.getElementById('fx1ParaEqLoMidQ').value 	 = message.data[14];
		document.getElementById('Fx1ParaEqLoMidG').value 	 = message.data[15]-20;    	document.getElementById('fx1ParaEqLoMidG').value 	 = message.data[15]-20;
		document.getElementById('Fx1ParaEqHiMidf').value 	 = message.data[16];    	document.getElementById('fx1ParaEqHiMidf').value 	 = message.data[16];
		document.getElementById('Fx1ParaEqHiMidQ').value 	 = message.data[17];    	document.getElementById('fx1ParaEqHiMidQ').value 	 = message.data[17];
		document.getElementById('Fx1ParaEqHiMidG').value 	 = message.data[18]-20;    	document.getElementById('fx1ParaEqHiMidG').value 	 = message.data[18]-20;
		document.getElementById('Fx1ParaEqHiGain').value 	 = message.data[19]-20;    	document.getElementById('fx1ParaEqHiGain').value 	 = message.data[19]-20;
		document.getElementById('Fx1ParaEqHiCut').value 	 = message.data[20];    	document.getElementById('fx1ParaEqHiCut').value 	 = message.data[20];
		document.getElementById('Fx1ParaEqLevel').value 	 = message.data[21]-20;    	document.getElementById('fx1ParaEqLevel').value 	 = message.data[21]-20;
	}
	
	// Fx1 Tone Modify
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x05,0x1f])) {
		document.getElementById('Fx1ToneModifyType').value      = message.data[11];
		document.getElementById('Fx1ToneModifyResonance').value = message.data[12]; 	document.getElementById('fx1ToneModifyResonance').value = message.data[12];
		document.getElementById('Fx1ToneModifyLow').value     	= message.data[13]-50; 	document.getElementById('fx1ToneModifyLow').value     	= message.data[13]-50; 
		document.getElementById('Fx1ToneModifyHigh').value    	= message.data[14]-50; 	document.getElementById('fx1ToneModifyHigh').value    	= message.data[14]-50; 
		document.getElementById('Fx1ToneModifyLevel').value 	= message.data[15]; 	document.getElementById('fx1ToneModifyLevel').value 	= message.data[15]; 
	}
	
	// Fx1 Guitar Sim
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x05,0x24])) {
		document.getElementById('Fx1GuitarSimType').value      	= message.data[11];			document.getElementById('fx1GuitarSimType').value      	= message.data[11];		
		document.getElementById('Fx1GuitarSimLow').value      	= message.data[12]-50;      document.getElementById('fx1GuitarSimLow').value      	= message.data[12]-50;
		document.getElementById('Fx1GuitarSimHigh').value      	= message.data[13]-50;      document.getElementById('fx1GuitarSimHigh').value      	= message.data[13]-50;
		document.getElementById('Fx1GuitarSimLevel').value      = message.data[14];         document.getElementById('fx1GuitarSimLevel').value      = message.data[14];
		document.getElementById('Fx1GuitarSimBody').value  		= message.data[15];         document.getElementById('fx1GuitarSimBody').value  		= message.data[15];
	}
			
	// Fx1 Slow Gear
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x3e])) {
		document.getElementById('Fx1SlowGearSens').value 		= message.data[11];		document.getElementById('fx1SlowGearSens').value 		= message.data[11];
		document.getElementById('Fx1SlowGearRiseTime').value 	= message.data[12];     document.getElementById('fx1SlowGearRiseTime').value 	= message.data[12];
	}
	
	// Fx1 Defretter
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x03,0x2d])) {
		document.getElementById('Fx1DefretterTone').value 	 	= message.data[11]-50;	document.getElementById('fx1DefretterTone').value 	 	= message.data[11]-50;
		document.getElementById('Fx1DefretterSens').value 	 	= message.data[12];     document.getElementById('fx1DefretterSens').value 	 	= message.data[12];
		document.getElementById('Fx1DefretterAttack').value  	= message.data[13];     document.getElementById('fx1DefretterAttack').value 	= message.data[13];
		document.getElementById('Fx1DefretterDepth').value 	 	= message.data[14];     document.getElementById('fx1DefretterDepth').value 	 	= message.data[14];
		document.getElementById('Fx1DefretterResonance').value 	= message.data[15];     document.getElementById('fx1DefretterResonance').value 	= message.data[15];
		document.getElementById('Fx1DefretterEffectLev').value 	= message.data[16];     document.getElementById('fx1DefretterEffectLev').value 	= message.data[16];
		document.getElementById('Fx1DefretterDirectLev').value 	= message.data[17];     document.getElementById('fx1DefretterDirectLev').value 	= message.data[17];
	}

	// Fx1 Wave Synth
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x03,0x3b])) {
		document.getElementById('Fx1WaveSynthWave').value 	 	= message.data[11];		document.getElementById('fx1WaveSynthWave').value 	 	= message.data[11];
		document.getElementById('Fx1WaveSynthCutoff').value 	= message.data[12];     document.getElementById('fx1WaveSynthCutoff').value 	= message.data[12];
		document.getElementById('Fx1WaveSynthResonance').value 	= message.data[13];     document.getElementById('fx1WaveSynthResonance').value 	= message.data[13];
		document.getElementById('Fx1WaveSynthFltSens').value 	= message.data[14];     document.getElementById('fx1WaveSynthFltSens').value 	= message.data[14];
		document.getElementById('Fx1WaveSynthFltDecay').value 	= message.data[15];     document.getElementById('fx1WaveSynthFltDecay').value 	= message.data[15];
		document.getElementById('Fx1WaveSynthFltDepth').value 	= message.data[16];     document.getElementById('fx1WaveSynthFltDepth').value 	= message.data[16];
		document.getElementById('Fx1WaveSynthSynthLev').value 	= message.data[17];     document.getElementById('fx1WaveSynthSynthLev').value 	= message.data[17];
		document.getElementById('Fx1WaveSynthDirectLev').value 	= message.data[18];     document.getElementById('fx1WaveSynthDirectLev').value 	= message.data[18];
	}
	
	// Fx1 Guitar Synth
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x03,0x43])) {
		document.getElementById('Fx1GuitarSynthWave').value 	 	= message.data[11];		document.getElementById('fx1GuitarSynthWave').value 	 	= message.data[11];
		document.getElementById('Fx1GuitarSynthSens').value 	 	= message.data[12];     document.getElementById('fx1GuitarSynthSens').value 	 	= message.data[12];
		document.getElementById('Fx1GuitarSynthChromatic').value 	= message.data[13];     document.getElementById('fx1GuitarSynthChromatic').value 	= message.data[13];
		document.getElementById('Fx1GuitarSynthOctShift').value 	= -message.data[14];    document.getElementById('fx1GuitarSynthOctShift').value 	= -message.data[14];
		document.getElementById('Fx1GuitarSynthPwmRate').value 	 	= message.data[15];     document.getElementById('fx1GuitarSynthPwmRate').value 	 	= message.data[15];
		document.getElementById('Fx1GuitarSynthPwmDepth').value 	= message.data[16];     document.getElementById('fx1GuitarSynthPwmDepth').value 	= message.data[16];
		document.getElementById('Fx1GuitarSynthCutoff').value 	 	= message.data[17];     document.getElementById('fx1GuitarSynthCutoff').value 	 	= message.data[17];
		document.getElementById('Fx1GuitarSynthResonance').value 	= message.data[18];     document.getElementById('fx1GuitarSynthResonance').value 	= message.data[18];
		document.getElementById('Fx1GuitarSynthFltSens').value 	 	= message.data[19];     document.getElementById('fx1GuitarSynthFltSens').value 	 	= message.data[19];
		document.getElementById('Fx1GuitarSynthFltDecay').value 	= message.data[20];     document.getElementById('fx1GuitarSynthFltDecay').value 	= message.data[20];
		document.getElementById('Fx1GuitarSynthFltDepth').value 	= message.data[21];     document.getElementById('fx1GuitarSynthFltDepth').value 	= message.data[21];
		document.getElementById('Fx1GuitarSynthAttack').value 	 	= message.data[22];     document.getElementById('fx1GuitarSynthAttack').value 	 	= message.data[22];
		document.getElementById('Fx1GuitarSynthRelease').value 	 	= message.data[23];     document.getElementById('fx1GuitarSynthRelease').value 	 	= message.data[23];
		document.getElementById('Fx1GuitarSynthVelocity').value 	= message.data[24];     document.getElementById('fx1GuitarSynthVelocity').value 	= message.data[24];
		document.getElementById('Fx1GuitarSynthHold').value 	 	= message.data[25];     document.getElementById('fx1GuitarSynthHold').value 	 	= message.data[25];
		document.getElementById('Fx1GuitarSynthSynthLev').value 	= message.data[26];     document.getElementById('fx1GuitarSynthSynthLev').value 	= message.data[26];
		document.getElementById('Fx1GuitarSynthDirectLev').value 	= message.data[27];     document.getElementById('fx1GuitarSynthDirectLev').value 	= message.data[27];
	}
	
	// Fx1 Sitar Sim
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x03,0x34])) {
		document.getElementById('Fx1SitarSimTone').value 	 	= message.data[11]-50;		document.getElementById('fx1SitarSimTone').value 	 	= message.data[11]-50;
		document.getElementById('Fx1SitarSimSens').value 	 	= message.data[12];         document.getElementById('fx1SitarSimSens').value 	 	= message.data[12];
		document.getElementById('Fx1SitarSimDepth').value 	 	= message.data[13];         document.getElementById('fx1SitarSimDepth').value 	 	= message.data[13];
		document.getElementById('Fx1SitarSimResonance').value 	= message.data[14];         document.getElementById('fx1SitarSimResonance').value 	= message.data[14];
		document.getElementById('Fx1SitarSimBuzz').value 	 	= message.data[15];         document.getElementById('fx1SitarSimBuzz').value 	 	= message.data[15];
		document.getElementById('Fx1SitarSimEffectLev').value 	= message.data[16];         document.getElementById('fx1SitarSimEffectLev').value 	= message.data[16];
		document.getElementById('Fx1SitarSimDirectLev').value 	= message.data[17];         document.getElementById('fx1SitarSimDirectLev').value 	= message.data[17];
	}
	
	// Fx1 Octave
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x03,0x15])) {
		document.getElementById('Fx1OctaveRange').value 	 	= message.data[11];		document.getElementById('fx1OctaveRange').value 	 	= message.data[11];
		document.getElementById('Fx1OctaveOctLevel').value 	 	= message.data[12];     document.getElementById('fx1OctaveOctLevel').value 	 	= message.data[12];
		document.getElementById('Fx1OctaveDirectLev').value 	= message.data[13];     document.getElementById('fx1OctaveDirectLev').value 	= message.data[13];
	}
	
	// Fx1 Pitch Shifter
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x03,0x06])) {
		document.getElementById('Fx1PitchShifterVoice').value 	 	= message.data[11];							document.getElementById('fx1PitchShifterVoice').value 	 	= message.data[11];
		document.getElementById('Fx1PitchShifterPs1Mode').value 	= message.data[12];                         document.getElementById('fx1PitchShifterPs1Mode').value 	= message.data[12];
		document.getElementById('Fx1PitchShifterPs1Pitch').value 	= message.data[13];                         document.getElementById('fx1PitchShifterPs1Pitch').value 	= message.data[13];
		document.getElementById('Fx1PitchShifterPs1Fine').value 	= message.data[14];                         document.getElementById('fx1PitchShifterPs1Fine').value 	= message.data[14];
		document.getElementById('Fx1PitchShifterPs1PreDly').value 	= message.data[15]*0x80+message.data[16];   document.getElementById('fx1PitchShifterPs1PreDly').value 	= message.data[15]*0x80+message.data[16];	SetValueRangeNumberSelect(document.getElementById('fx1PitchShifterPs1PreDly'),300,'bpm');
		document.getElementById('Fx1PitchShifterPs1Level').value 	= message.data[17];                         document.getElementById('fx1PitchShifterPs1Level').value 	= message.data[17];
		document.getElementById('Fx1PitchShifterPs2Mode').value 	= message.data[18];                         document.getElementById('fx1PitchShifterPs2Mode').value 	= message.data[18];
		document.getElementById('Fx1PitchShifterPs2Pitch').value 	= message.data[19];                         document.getElementById('fx1PitchShifterPs2Pitch').value 	= message.data[19];
		document.getElementById('Fx1PitchShifterPs2Fine').value 	= message.data[20];                         document.getElementById('fx1PitchShifterPs2Fine').value 	= message.data[20];
		document.getElementById('Fx1PitchShifterPs2PreDl').value 	= message.data[21]*0x80+message.data[22];   document.getElementById('fx1PitchShifterPs2PreDl').value 	= message.data[21]*0x80+message.data[22];	SetValueRangeNumberSelect(document.getElementById('fx1PitchShifterPs2PreDl'),300,'bpm');
		document.getElementById('Fx1PitchShifterPs2Level').value 	= message.data[23];                         document.getElementById('fx1PitchShifterPs2Level').value 	= message.data[23];
		document.getElementById('Fx1PitchShifterPs1Fbk').value 	 	= message.data[24];                         document.getElementById('fx1PitchShifterPs1Fbk').value 	 	= message.data[24];
		document.getElementById('Fx1PitchShifterDirectLev').value 	= message.data[25];                         document.getElementById('fx1PitchShifterDirectLev').value 	= message.data[25];
	}
	
	// Fx1 Harmonist
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x63])) {
		document.getElementById('Fx1HarmonistVoice').value 	 			= message.data[11];							document.getElementById('fx1HarmonistVoice').value 	 			= message.data[11];
		document.getElementById('Fx1HarmonistHr1Harm').value 	 		= message.data[12];     					document.getElementById('fx1HarmonistHr1Harm').value 	 		= message.data[12];
		document.getElementById('Fx1HarmonistHr1PreDl').value 	 		= message.data[13]*0x80+message.data[14];   document.getElementById('fx1HarmonistHr1PreDl').value 	 		= message.data[13]*0x80+message.data[14];		SetValueRangeNumberSelect(document.getElementById('fx1HarmonistHr1PreDl'),300,'bpm');
		document.getElementById('Fx1HarmonistHr1Level').value 	 		= message.data[15];     					document.getElementById('fx1HarmonistHr1Level').value 	 		= message.data[15];
		document.getElementById('Fx1HarmonistHr2Harm').value 	 		= message.data[16];     					document.getElementById('fx1HarmonistHr2Harm').value 	 		= message.data[16];
		document.getElementById('Fx1HarmonistHr2PreDl').value 	 		= message.data[17]*0x80+message.data[18];   document.getElementById('fx1HarmonistHr2PreDl').value 	 		= message.data[17]*0x80+message.data[18];		SetValueRangeNumberSelect(document.getElementById('fx1HarmonistHr2PreDl'),300,'bpm');
		document.getElementById('Fx1HarmonistHr2Level').value 	 		= message.data[19];     					document.getElementById('fx1HarmonistHr2Level').value 	 		= message.data[19];
		document.getElementById('Fx1HarmonistHr1Fbk').value 	 		= message.data[20];     					document.getElementById('fx1HarmonistHr1Fbk').value 	 		= message.data[20];
		document.getElementById('Fx1HarmonistDirectLev').value 	 		= message.data[21];     					document.getElementById('fx1HarmonistDirectLev').value 	 		= message.data[21];
		document.getElementById('Fx1HarmonistHr1UserScaleKeyC').value 	= message.data[22]-24;  					document.getElementById('fx1HarmonistHr1UserScaleKeyC').value 	= message.data[22]-24;
		document.getElementById('Fx1HarmonistHr1UserScaleKeyDb').value 	= message.data[23]-24;  					document.getElementById('fx1HarmonistHr1UserScaleKeyDb').value 	= message.data[23]-24;
		document.getElementById('Fx1HarmonistHr1UserScaleKeyD').value 	= message.data[24]-24;  					document.getElementById('fx1HarmonistHr1UserScaleKeyD').value 	= message.data[24]-24;
		document.getElementById('Fx1HarmonistHr1UserScaleKeyEb').value 	= message.data[25]-24;  					document.getElementById('fx1HarmonistHr1UserScaleKeyEb').value 	= message.data[25]-24;
		document.getElementById('Fx1HarmonistHr1UserScaleKeyE').value 	= message.data[26]-24;  					document.getElementById('fx1HarmonistHr1UserScaleKeyE').value 	= message.data[26]-24;
		document.getElementById('Fx1HarmonistHr1UserScaleKeyF').value 	= message.data[27]-24;  					document.getElementById('fx1HarmonistHr1UserScaleKeyF').value 	= message.data[27]-24;
		document.getElementById('Fx1HarmonistHr1UserScaleKeyFs').value 	= message.data[28]-24;  					document.getElementById('fx1HarmonistHr1UserScaleKeyFs').value 	= message.data[28]-24;
		document.getElementById('Fx1HarmonistHr1UserScaleKeyG').value 	= message.data[29]-24;  					document.getElementById('fx1HarmonistHr1UserScaleKeyG').value 	= message.data[29]-24;
		document.getElementById('Fx1HarmonistHr1UserScaleKeyAb').value 	= message.data[30]-24;  					document.getElementById('fx1HarmonistHr1UserScaleKeyAb').value 	= message.data[30]-24;
		document.getElementById('Fx1HarmonistHr1UserScaleKeyA').value 	= message.data[31]-24;  					document.getElementById('fx1HarmonistHr1UserScaleKeyA').value 	= message.data[31]-24;
		document.getElementById('Fx1HarmonistHr1UserScaleKeyBb').value 	= message.data[32]-24;  					document.getElementById('fx1HarmonistHr1UserScaleKeyBb').value 	= message.data[32]-24;
		document.getElementById('Fx1HarmonistHr1UserScaleKeyB').value 	= message.data[33]-24;  					document.getElementById('fx1HarmonistHr1UserScaleKeyB').value 	= message.data[33]-24;
		document.getElementById('Fx1HarmonistHr2UserScaleKeyC').value 	= message.data[34]-24;  					document.getElementById('fx1HarmonistHr2UserScaleKeyC').value 	= message.data[34]-24;
		document.getElementById('Fx1HarmonistHr2UserScaleKeyDb').value 	= message.data[35]-24;  					document.getElementById('fx1HarmonistHr2UserScaleKeyDb').value 	= message.data[35]-24;
		document.getElementById('Fx1HarmonistHr2UserScaleKeyD').value 	= message.data[36]-24;  					document.getElementById('fx1HarmonistHr2UserScaleKeyD').value 	= message.data[36]-24;
		document.getElementById('Fx1HarmonistHr2UserScaleKeyEb').value 	= message.data[37]-24;  					document.getElementById('fx1HarmonistHr2UserScaleKeyEb').value 	= message.data[37]-24;
		document.getElementById('Fx1HarmonistHr2UserScaleKeyE').value 	= message.data[38]-24;  					document.getElementById('fx1HarmonistHr2UserScaleKeyE').value 	= message.data[38]-24;
		document.getElementById('Fx1HarmonistHr2UserScaleKeyF').value 	= message.data[39]-24;  					document.getElementById('fx1HarmonistHr2UserScaleKeyF').value 	= message.data[39]-24;
		document.getElementById('Fx1HarmonistHr2UserScaleKeyFs').value 	= message.data[40]-24;  					document.getElementById('fx1HarmonistHr2UserScaleKeyFs').value 	= message.data[40]-24;
		document.getElementById('Fx1HarmonistHr2UserScaleKeyG').value 	= message.data[41]-24;  					document.getElementById('fx1HarmonistHr2UserScaleKeyG').value 	= message.data[41]-24;
		document.getElementById('Fx1HarmonistHr2UserScaleKeyAb').value 	= message.data[42]-24;  					document.getElementById('fx1HarmonistHr2UserScaleKeyAb').value 	= message.data[42]-24;
		document.getElementById('Fx1HarmonistHr2UserScaleKeyA').value 	= message.data[43]-24;  					document.getElementById('fx1HarmonistHr2UserScaleKeyA').value 	= message.data[43]-24;
		document.getElementById('Fx1HarmonistHr2UserScaleKeyBb').value 	= message.data[44]-24;  					document.getElementById('fx1HarmonistHr2UserScaleKeyBb').value 	= message.data[44]-24;
		document.getElementById('Fx1HarmonistHr2UserScaleKeyB').value 	= message.data[45]-24;  					document.getElementById('fx1HarmonistHr2UserScaleKeyB').value 	= message.data[45]-24;
	}
	
	// Fx1 Auto Riff
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x03,0x54])) {
		document.getElementById('Fx1AutoRiffPhrase').value 	 				= message.data[11];			document.getElementById('fx1AutoRiffPhrase').value 	 				= message.data[11];
		document.getElementById('Fx1AutoRiffLoop').value 	 				= message.data[12];         document.getElementById('fx1AutoRiffLoop').value 	 				= message.data[12];
		document.getElementById('Fx1AutoRiffTempo').value 	 				= message.data[13];         document.getElementById('fx1AutoRiffTempo').value 	 				= message.data[13];			SetValueRangeNumberSelect(document.getElementById('fx1SubDelayDlyTime'),100,'bpm2');
		document.getElementById('Fx1AutoRiffSens').value 	 				= message.data[14];         document.getElementById('fx1AutoRiffSens').value 	 				= message.data[14];
		document.getElementById('Fx1AutoRiffAttack').value 	 				= message.data[15];         document.getElementById('fx1AutoRiffAttack').value 	 				= message.data[15];
		document.getElementById('Fx1AutoRiffHold').value 	 				= message.data[16];         document.getElementById('fx1AutoRiffHold').value 	 				= message.data[16];
		document.getElementById('Fx1AutoRiffEffectLev').value 	 			= message.data[17];         document.getElementById('fx1AutoRiffEffectLev').value 	 			= message.data[17];
		document.getElementById('Fx1AutoRiffDirectLev').value 	 			= message.data[18];         document.getElementById('fx1AutoRiffDirectLev').value 	 			= message.data[18];
		document.getElementById('Fx1AutoRiffUserPhraseSetting1C').value 	= message.data[19]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting1C').value 	= message.data[19]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting2C').value 	= message.data[20]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting2C').value 	= message.data[20]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting3C').value 	= message.data[21]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting3C').value 	= message.data[21]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting4C').value 	= message.data[22]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting4C').value 	= message.data[22]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting5C').value 	= message.data[23]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting5C').value 	= message.data[23]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting6C').value 	= message.data[24]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting6C').value 	= message.data[24]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting7C').value 	= message.data[25]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting7C').value 	= message.data[25]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting8C').value 	= message.data[26]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting8C').value 	= message.data[26]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting9C').value 	= message.data[27]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting9C').value 	= message.data[27]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting10C').value	= message.data[28]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting10C').value	= message.data[28]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting11C').value	= message.data[29]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting11C').value	= message.data[29]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting12C').value	= message.data[30]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting12C').value	= message.data[30]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting13C').value	= message.data[31]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting13C').value	= message.data[31]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting14C').value	= message.data[32]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting14C').value	= message.data[32]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting15C').value	= message.data[33]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting15C').value	= message.data[33]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting16C').value	= message.data[34]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting16C').value	= message.data[34]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting1Db').value 	= message.data[35]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting1Db').value 	= message.data[35]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting2Db').value 	= message.data[36]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting2Db').value 	= message.data[36]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting3Db').value 	= message.data[37]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting3Db').value 	= message.data[37]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting4Db').value 	= message.data[38]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting4Db').value 	= message.data[38]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting5Db').value 	= message.data[39]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting5Db').value 	= message.data[39]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting6Db').value 	= message.data[40]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting6Db').value 	= message.data[40]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting7Db').value 	= message.data[41]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting7Db').value 	= message.data[41]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting8Db').value 	= message.data[42]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting8Db').value 	= message.data[42]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting9Db').value 	= message.data[43]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting9Db').value 	= message.data[43]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting10Db').value	= message.data[44]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting10Db').value	= message.data[44]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting11Db').value	= message.data[45]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting11Db').value	= message.data[45]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting12Db').value	= message.data[46]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting12Db').value	= message.data[46]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting13Db').value	= message.data[47]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting13Db').value	= message.data[47]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting14Db').value	= message.data[48]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting14Db').value	= message.data[48]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting15Db').value	= message.data[49]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting15Db').value	= message.data[49]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting16Db').value	= message.data[50]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting16Db').value	= message.data[50]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting1D').value 	= message.data[51]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting1D').value 	= message.data[51]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting2D').value 	= message.data[52]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting2D').value 	= message.data[52]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting3D').value 	= message.data[53]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting3D').value 	= message.data[53]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting4D').value 	= message.data[54]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting4D').value 	= message.data[54]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting5D').value 	= message.data[55]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting5D').value 	= message.data[55]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting6D').value 	= message.data[56]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting6D').value 	= message.data[56]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting7D').value 	= message.data[57]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting7D').value 	= message.data[57]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting8D').value 	= message.data[58]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting8D').value 	= message.data[58]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting9D').value 	= message.data[59]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting9D').value 	= message.data[59]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting10D').value	= message.data[60]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting10D').value	= message.data[60]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting11D').value	= message.data[61]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting11D').value	= message.data[61]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting12D').value	= message.data[62]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting12D').value	= message.data[62]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting13D').value	= message.data[63]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting13D').value	= message.data[63]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting14D').value	= message.data[64]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting14D').value	= message.data[64]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting15D').value	= message.data[65]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting15D').value	= message.data[65]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting16D').value	= message.data[66]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting16D').value	= message.data[66]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting1Eb').value 	= message.data[67]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting1Eb').value 	= message.data[67]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting2Eb').value 	= message.data[68]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting2Eb').value 	= message.data[68]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting3Eb').value 	= message.data[69]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting3Eb').value 	= message.data[69]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting4Eb').value 	= message.data[70]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting4Eb').value 	= message.data[70]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting5Eb').value 	= message.data[71]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting5Eb').value 	= message.data[71]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting6Eb').value 	= message.data[72]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting6Eb').value 	= message.data[72]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting7Eb').value 	= message.data[73]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting7Eb').value 	= message.data[73]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting8Eb').value 	= message.data[74]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting8Eb').value 	= message.data[74]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting9Eb').value 	= message.data[75]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting9Eb').value 	= message.data[75]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting10Eb').value	= message.data[76]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting10Eb').value	= message.data[76]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting11Eb').value	= message.data[77]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting11Eb').value	= message.data[77]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting12Eb').value	= message.data[78]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting12Eb').value	= message.data[78]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting13Eb').value	= message.data[79]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting13Eb').value	= message.data[79]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting14Eb').value	= message.data[80]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting14Eb').value	= message.data[80]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting15Eb').value	= message.data[81]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting15Eb').value	= message.data[81]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting16Eb').value	= message.data[82]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting16Eb').value	= message.data[82]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting1E').value 	= message.data[83]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting1E').value 	= message.data[83]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting2E').value 	= message.data[84]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting2E').value 	= message.data[84]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting3E').value 	= message.data[85]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting3E').value 	= message.data[85]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting4E').value 	= message.data[86]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting4E').value 	= message.data[86]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting5E').value 	= message.data[87]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting5E').value 	= message.data[87]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting6E').value 	= message.data[88]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting6E').value 	= message.data[88]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting7E').value 	= message.data[89]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting7E').value 	= message.data[89]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting8E').value 	= message.data[90]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting8E').value 	= message.data[90]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting9E').value 	= message.data[91]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting9E').value 	= message.data[91]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting10E').value	= message.data[92]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting10E').value	= message.data[92]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting11E').value	= message.data[93]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting11E').value	= message.data[93]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting12E').value	= message.data[94]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting12E').value	= message.data[94]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting13E').value	= message.data[95]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting13E').value	= message.data[95]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting14E').value	= message.data[96]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting14E').value	= message.data[96]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting15E').value	= message.data[97]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting15E').value	= message.data[97]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting16E').value	= message.data[98]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting16E').value	= message.data[98]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting1F').value 	= message.data[99]  -24;    document.getElementById('fx1AutoRiffUserPhraseSetting1F').value 	= message.data[99]  -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting2F').value 	= message.data[100] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting2F').value 	= message.data[100] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting3F').value 	= message.data[101] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting3F').value 	= message.data[101] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting4F').value 	= message.data[102] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting4F').value 	= message.data[102] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting5F').value 	= message.data[103] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting5F').value 	= message.data[103] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting6F').value 	= message.data[104] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting6F').value 	= message.data[104] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting7F').value 	= message.data[105] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting7F').value 	= message.data[105] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting8F').value 	= message.data[106] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting8F').value 	= message.data[106] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting9F').value 	= message.data[107] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting9F').value 	= message.data[107] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting10F').value	= message.data[108] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting10F').value	= message.data[108] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting11F').value	= message.data[109] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting11F').value	= message.data[109] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting12F').value	= message.data[110] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting12F').value	= message.data[110] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting13F').value	= message.data[111] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting13F').value	= message.data[111] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting14F').value	= message.data[112] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting14F').value	= message.data[112] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting15F').value	= message.data[113] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting15F').value	= message.data[113] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting16F').value	= message.data[114] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting16F').value	= message.data[114] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting1Fs').value 	= message.data[115] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting1Fs').value 	= message.data[115] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting2Fs').value 	= message.data[116] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting2Fs').value 	= message.data[116] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting3Fs').value 	= message.data[117] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting3Fs').value 	= message.data[117] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting4Fs').value 	= message.data[118] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting4Fs').value 	= message.data[118] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting5Fs').value 	= message.data[119] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting5Fs').value 	= message.data[119] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting6Fs').value 	= message.data[120] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting6Fs').value 	= message.data[120] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting7Fs').value 	= message.data[121] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting7Fs').value 	= message.data[121] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting8Fs').value 	= message.data[122] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting8Fs').value 	= message.data[122] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting9Fs').value 	= message.data[123] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting9Fs').value 	= message.data[123] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting10Fs').value	= message.data[124] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting10Fs').value	= message.data[124] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting11Fs').value	= message.data[125] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting11Fs').value	= message.data[125] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting12Fs').value	= message.data[126] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting12Fs').value	= message.data[126] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting13Fs').value	= message.data[127] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting13Fs').value	= message.data[127] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting14Fs').value	= message.data[128] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting14Fs').value	= message.data[128] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting15Fs').value	= message.data[129] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting15Fs').value	= message.data[129] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting16Fs').value	= message.data[130] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting16Fs').value	= message.data[130] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting1G').value 	= message.data[131] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting1G').value 	= message.data[131] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting2G').value 	= message.data[132] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting2G').value 	= message.data[132] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting3G').value 	= message.data[133] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting3G').value 	= message.data[133] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting4G').value 	= message.data[134] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting4G').value 	= message.data[134] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting5G').value 	= message.data[135] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting5G').value 	= message.data[135] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting6G').value 	= message.data[136] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting6G').value 	= message.data[136] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting7G').value 	= message.data[137] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting7G').value 	= message.data[137] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting8G').value 	= message.data[138] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting8G').value 	= message.data[138] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting9G').value 	= message.data[139] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting9G').value 	= message.data[139] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting10G').value	= message.data[140] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting10G').value	= message.data[140] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting11G').value	= message.data[141] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting11G').value	= message.data[141] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting12G').value	= message.data[142] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting12G').value	= message.data[142] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting13G').value	= message.data[143] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting13G').value	= message.data[143] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting14G').value	= message.data[144] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting14G').value	= message.data[144] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting15G').value	= message.data[145] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting15G').value	= message.data[145] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting16G').value	= message.data[146] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting16G').value	= message.data[146] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting1Ab').value 	= message.data[147] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting1Ab').value 	= message.data[147] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting2Ab').value 	= message.data[148] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting2Ab').value 	= message.data[148] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting3Ab').value 	= message.data[149] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting3Ab').value 	= message.data[149] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting4Ab').value 	= message.data[150] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting4Ab').value 	= message.data[150] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting5Ab').value 	= message.data[151] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting5Ab').value 	= message.data[151] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting6Ab').value 	= message.data[152] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting6Ab').value 	= message.data[152] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting7Ab').value 	= message.data[153] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting7Ab').value 	= message.data[153] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting8Ab').value 	= message.data[154] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting8Ab').value 	= message.data[154] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting9Ab').value 	= message.data[155] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting9Ab').value 	= message.data[155] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting10Ab').value	= message.data[156] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting10Ab').value	= message.data[156] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting11Ab').value	= message.data[157] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting11Ab').value	= message.data[157] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting12Ab').value	= message.data[158] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting12Ab').value	= message.data[158] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting13Ab').value	= message.data[159] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting13Ab').value	= message.data[159] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting14Ab').value	= message.data[160] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting14Ab').value	= message.data[160] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting15Ab').value	= message.data[161] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting15Ab').value	= message.data[161] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting16Ab').value	= message.data[162] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting16Ab').value	= message.data[162] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting1A').value 	= message.data[163] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting1A').value 	= message.data[163] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting2A').value 	= message.data[164] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting2A').value 	= message.data[164] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting3A').value 	= message.data[165] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting3A').value 	= message.data[165] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting4A').value 	= message.data[166] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting4A').value 	= message.data[166] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting5A').value 	= message.data[167] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting5A').value 	= message.data[167] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting6A').value 	= message.data[168] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting6A').value 	= message.data[168] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting7A').value 	= message.data[169] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting7A').value 	= message.data[169] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting8A').value 	= message.data[170] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting8A').value 	= message.data[170] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting9A').value 	= message.data[171] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting9A').value 	= message.data[171] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting10A').value	= message.data[172] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting10A').value	= message.data[172] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting11A').value	= message.data[173] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting11A').value	= message.data[173] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting12A').value	= message.data[174] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting12A').value	= message.data[174] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting13A').value	= message.data[175] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting13A').value	= message.data[175] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting14A').value	= message.data[176] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting14A').value	= message.data[176] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting15A').value	= message.data[177] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting15A').value	= message.data[177] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting16A').value	= message.data[178] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting16A').value	= message.data[178] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting1Bb').value 	= message.data[179] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting1Bb').value 	= message.data[179] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting2Bb').value 	= message.data[180] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting2Bb').value 	= message.data[180] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting3Bb').value 	= message.data[181] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting3Bb').value 	= message.data[181] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting4Bb').value 	= message.data[182] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting4Bb').value 	= message.data[182] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting5Bb').value 	= message.data[183] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting5Bb').value 	= message.data[183] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting6Bb').value 	= message.data[184] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting6Bb').value 	= message.data[184] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting7Bb').value 	= message.data[185] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting7Bb').value 	= message.data[185] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting8Bb').value 	= message.data[186] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting8Bb').value 	= message.data[186] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting9Bb').value 	= message.data[187] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting9Bb').value 	= message.data[187] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting10Bb').value	= message.data[188] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting10Bb').value	= message.data[188] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting11Bb').value	= message.data[189] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting11Bb').value	= message.data[189] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting12Bb').value	= message.data[190] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting12Bb').value	= message.data[190] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting13Bb').value	= message.data[191] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting13Bb').value	= message.data[191] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting14Bb').value	= message.data[192] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting14Bb').value	= message.data[192] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting15Bb').value	= message.data[193] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting15Bb').value	= message.data[193] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting16Bb').value	= message.data[194] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting16Bb').value	= message.data[194] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting1B').value 	= message.data[195] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting1B').value 	= message.data[195] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting2B').value 	= message.data[196] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting2B').value 	= message.data[196] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting3B').value 	= message.data[197] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting3B').value 	= message.data[197] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting4B').value 	= message.data[198] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting4B').value 	= message.data[198] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting5B').value 	= message.data[199] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting5B').value 	= message.data[199] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting6B').value 	= message.data[200] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting6B').value 	= message.data[200] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting7B').value 	= message.data[201] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting7B').value 	= message.data[201] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting8B').value 	= message.data[202] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting8B').value 	= message.data[202] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting9B').value 	= message.data[203] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting9B').value 	= message.data[203] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting10B').value	= message.data[204] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting10B').value	= message.data[204] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting11B').value	= message.data[205] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting11B').value	= message.data[205] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting12B').value	= message.data[206] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting12B').value	= message.data[206] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting13B').value	= message.data[207] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting13B').value	= message.data[207] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting14B').value	= message.data[208] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting14B').value	= message.data[208] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting15B').value	= message.data[209] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting15B').value	= message.data[209] -24;
		document.getElementById('Fx1AutoRiffUserPhraseSetting16B').value	= message.data[210] -24;    document.getElementById('fx1AutoRiffUserPhraseSetting16B').value	= message.data[210] -24;
	}
	
	// Fx1 Sound Hold
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x05,0x1c])) {
		document.getElementById('Fx1SoundHoldHold').value 	 		= message.data[11];		document.getElementById('Fx1SoundHoldHold').value 	 		= message.data[11];
		document.getElementById('Fx1SoundHoldRiseTime').value 	 	= message.data[12];     document.getElementById('Fx1SoundHoldRiseTime').value 	 	= message.data[12];
		document.getElementById('Fx1SoundHoldEffectLev').value 	 	= message.data[13];     document.getElementById('Fx1SoundHoldEffectLev').value 	 	= message.data[13];
	}
	
	// Fx1 Ac.Processor
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x05,0x29])) {
		document.getElementById('Fx1AcProcessorType').value   	= message.data[11];
		document.getElementById('Fx1AcProcessorBass').value 	= message.data[12]; 	document.getElementById('fx1AcProcessorBass').value 	= message.data[12];
		document.getElementById('Fx1AcProcessorMiddle').value 	= message.data[13]; 	document.getElementById('fx1AcProcessorMiddle').value 	= message.data[13];
		document.getElementById('Fx1AcProcessorMiddleF').value 	= message.data[14]; 	document.getElementById('fx1AcProcessorMiddleF').value 	= message.data[14];
		document.getElementById('Fx1AcProcessorTreble').value 	= message.data[15]; 	document.getElementById('fx1AcProcessorTreble').value 	= message.data[15];
		document.getElementById('Fx1AcProcessorPresence').value = message.data[16]; 	document.getElementById('fx1AcProcessorPresence').value = message.data[16];
		document.getElementById('Fx1AcProcessorLevel').value 	= message.data[17]; 	document.getElementById('fx1AcProcessorLevel').value 	= message.data[17];
	}
	
	// Fx1 Feedbacker
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x40])) {
		document.getElementById('Fx1FeedbackerMode').value 		= message.data[11];		document.getElementById('fx1FeedbackerMode').value 		= message.data[11];
		document.getElementById('Fx1FeedbackerRiseTime').value 	= message.data[12];     document.getElementById('fx1FeedbackerRiseTime').value 	= message.data[12];
		document.getElementById('Fx1FeedbackerRiseTUp').value 	= message.data[13];     document.getElementById('fx1FeedbackerRiseTUp').value 	= message.data[13];
		document.getElementById('Fx1FeedbackerFBLevel').value 	= message.data[14];     document.getElementById('fx1FeedbackerFBLevel').value 	= message.data[14];
		document.getElementById('Fx1FeedbackerFBLvUp').value 	= message.data[15];     document.getElementById('fx1FeedbackerFBLvUp').value 	= message.data[15];
		document.getElementById('Fx1FeedbackerVibRate').value 	= message.data[16];     document.getElementById('fx1FeedbackerVibRate').value 	= message.data[16];		SetValueRangeNumberSelect(document.getElementById('fx1FeedbackerVibRate'),100,'bpm2');
		document.getElementById('Fx1FeedbackerDepth').value 	= message.data[17];     document.getElementById('fx1FeedbackerDepth').value 	= message.data[17];
	}
	
	// Fx1 Anti Feedback
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x47])) {
		document.getElementById('Fx1AntiFeedbackFreq1').value 	= message.data[11];		document.getElementById('fx1AntiFeedbackFreq1').value 	= message.data[11];
		document.getElementById('Fx1AntiFeedbackDepth1').value 	= message.data[12];     document.getElementById('fx1AntiFeedbackDepth1').value 	= message.data[12];
		document.getElementById('Fx1AntiFeedbackFreq2').value 	= message.data[13];     document.getElementById('fx1AntiFeedbackFreq2').value 	= message.data[13];
		document.getElementById('Fx1AntiFeedbackDepth2').value 	= message.data[14];     document.getElementById('fx1AntiFeedbackDepth2').value 	= message.data[14];
		document.getElementById('Fx1AntiFeedbackFreq3').value 	= message.data[15];     document.getElementById('fx1AntiFeedbackFreq3').value 	= message.data[15];
		document.getElementById('Fx1AntiFeedbackDepth3').value 	= message.data[16];     document.getElementById('fx1AntiFeedbackDepth3').value 	= message.data[16];
	}
	
	// Fx1 Phaser
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x1e])) {
		document.getElementById('Fx1PhaserType').value      = message.data[11];
		document.getElementById('Fx1PhaserRate').value      = message.data[12]; 	document.getElementById('fx1PhaserRate').value      = message.data[12]; 	SetValueRangeNumberSelect(document.getElementById('fx1PhaserRate'),100,'bpm2');
		document.getElementById('Fx1PhaserDepth').value     = message.data[13]; 	document.getElementById('fx1PhaserDepth').value     = message.data[13]; 
		document.getElementById('Fx1PhaserManual').value    = message.data[14]; 	document.getElementById('fx1PhaserManual').value    = message.data[14]; 
		document.getElementById('Fx1PhaserResonance').value = message.data[15]; 	document.getElementById('fx1PhaserResonance').value = message.data[15]; 
		document.getElementById('Fx1PhaserStepRate').value  = message.data[16]; 	document.getElementById('fx1PhaserStepRate').value  = message.data[16]; 	SetValueRangeNumberSelect(document.getElementById('fx1PhaserStepRate'),100,'bpm2');
		document.getElementById('Fx1PhaserEffectLev').value = message.data[17]; 	document.getElementById('fx1PhaserEffectLev').value = message.data[17]; 
		document.getElementById('Fx1PhaserDirectLev').value = message.data[18]; 	document.getElementById('fx1PhaserDirectLev').value = message.data[18]; 
	}
	
	// Fx1 Flanger
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x26])) {
		document.getElementById('Fx1FlangerRate').value      	= message.data[11]; 	document.getElementById('fx1FlangerRate').value      	= message.data[11]; 	SetValueRangeNumberSelect(document.getElementById('fx1FlangerRate'),100,'bpm2');
		document.getElementById('Fx1FlangerDepth').value     	= message.data[12]; 	document.getElementById('fx1FlangerDepth').value     	= message.data[12]; 
		document.getElementById('Fx1FlangerManual').value     	= message.data[13]; 	document.getElementById('fx1FlangerManual').value     	= message.data[13]; 
		document.getElementById('Fx1FlangerResonance').value    = message.data[14]; 	document.getElementById('fx1FlangerResonance').value    = message.data[14]; 
		document.getElementById('Fx1FlangerSeparation').value   = message.data[15]; 	document.getElementById('fx1FlangerSeparation').value   = message.data[15]; 
		document.getElementById('Fx1FlangerLowCut').value     	= message.data[16]; 	document.getElementById('fx1FlangerLowCut').value     	= message.data[16]; 
		document.getElementById('Fx1FlangerEffectLev').value    = message.data[17]; 	document.getElementById('fx1FlangerEffectLev').value    = message.data[17]; 
		document.getElementById('Fx1FlangerDirectLev').value    = message.data[18]; 	document.getElementById('fx1FlangerDirectLev').value    = message.data[18]; 
	}
	
	// Fx1 Tremolo
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x1b])) {
		document.getElementById('Fx1TremoloWaveShape').value = message.data[11];    	document.getElementById('fx1TremoloWaveShape').value = message.data[11];
		document.getElementById('Fx1TremoloRate').value 	 = message.data[12];    	document.getElementById('fx1TremoloRate').value 	 = message.data[12];	SetValueRangeNumberSelect(document.getElementById('fx1TremoloRate'),100,'bpm2');
		document.getElementById('Fx1TremoloDepth').value 	 = message.data[13];    	document.getElementById('fx1TremoloDepth').value 	 = message.data[13];
	}
	
	// Fx1 Rotary
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x03,0x18])) {
		document.getElementById('Fx1RotarySpeedSel').value 	 = message.data[11];	 document.getElementById('fx1RotarySpeedSel').value 	= message.data[11];
		document.getElementById('Fx1RotaryRateSlow').value 	 = message.data[12];     document.getElementById('fx1RotaryRateSlow').value 	= message.data[12];		SetValueRangeNumberSelect(document.getElementById('fx1RotaryRateSlow'),100,'bpm2');
		document.getElementById('Fx1RotaryRateFast').value 	 = message.data[13];     document.getElementById('fx1RotaryRateFast').value 	= message.data[13];		SetValueRangeNumberSelect(document.getElementById('fx1RotaryRateFast'),100,'bpm2');
		document.getElementById('Fx1RotaryRiseTime').value 	 = message.data[14];     document.getElementById('fx1RotaryRiseTime').value 	= message.data[14];
		document.getElementById('Fx1RotaryFallTime').value 	 = message.data[15];     document.getElementById('fx1RotaryFallTime').value 	= message.data[15];
		document.getElementById('Fx1RotaryDepth').value 	 = message.data[16];     document.getElementById('fx1RotaryDepth').value 	 	= message.data[16];
	}
	
	// Fx1 Uni-V
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x37])) {
		document.getElementById('Fx1UniVRate').value 	= message.data[11];		document.getElementById('fx1UniVRate').value 	= message.data[11];		SetValueRangeNumberSelect(document.getElementById('fx1UniVRate'),100,'bpm2');
		document.getElementById('Fx1UniVDepth').value 	= message.data[12];     document.getElementById('fx1UniVDepth').value 	= message.data[12];
		document.getElementById('Fx1UniVLevel').value 	= message.data[13];     document.getElementById('fx1UniVLevel').value 	= message.data[13];
	}
	
	// Fx1 Pan
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x2e])) {
		document.getElementById('Fx1PanType').value 		= message.data[11];			document.getElementById('fx1PanType').value 		= message.data[11];
		document.getElementById('Fx1PanPosition').value 	= message.data[12]-32;      document.getElementById('fx1PanPosition').value 	= message.data[12]-32;
		document.getElementById('Fx1PanWaveShape').value 	= message.data[13];         document.getElementById('fx1PanWaveShape').value 	= message.data[13];
		document.getElementById('Fx1PanRate').value 		= message.data[14];         document.getElementById('fx1PanRate').value 		= message.data[14];		SetValueRangeNumberSelect(document.getElementById('fx1PanRate'),100,'bpm2');
		document.getElementById('Fx1PanDepth').value 		= message.data[15];         document.getElementById('fx1PanDepth').value 		= message.data[15];
	}
	
	// Fx1 Slicer
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x55])) {
		document.getElementById('Fx1SlicerPattern').value 	= message.data[11];		document.getElementById('fx1SlicerPattern').value 	= message.data[11];
		document.getElementById('Fx1SlicerRate').value 		= message.data[12];     document.getElementById('fx1SlicerRate').value 		= message.data[12];		SetValueRangeNumberSelect(document.getElementById('fx1SlicerRate'),100,'bpm2');
		document.getElementById('Fx1SlicerTrigSens').value 	= message.data[13];     document.getElementById('fx1SlicerTrigSens').value 	= message.data[13];
	}
	
	// Fx1 Vibrato
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x33])) {
		document.getElementById('Fx1VibratoRate').value 	= message.data[11];		document.getElementById('fx1VibratoRate').value 	= message.data[11];		SetValueRangeNumberSelect(document.getElementById('fx1VibratoRate'),100,'bpm2');
		document.getElementById('Fx1VibratoDepth').value 	= message.data[12];     document.getElementById('fx1VibratoDepth').value 	= message.data[12];
		document.getElementById('Fx1VibratoTrigger').value 	= message.data[13];     document.getElementById('fx1VibratoTrigger').value 	= message.data[13];
		document.getElementById('Fx1VibratoRiseTime').value = message.data[14];     document.getElementById('fx1VibratoRiseTime').value = message.data[14];
	}
	
	// Fx1 Ring Mod
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x3a])) {
		document.getElementById('Fx1RingModMode').value 		= message.data[11];		document.getElementById('fx1RingModMode').value 		= message.data[11];
		document.getElementById('Fx1RingModFrequency').value 	= message.data[12];     document.getElementById('fx1RingModFrequency').value 	= message.data[12];
		document.getElementById('Fx1RingModDirectLev').value 	= message.data[13];     document.getElementById('fx1RingModDirectLev').value 	= message.data[13];
		document.getElementById('Fx1RingModEffectLev').value 	= message.data[14];     document.getElementById('fx1RingModEffectLev').value 	= message.data[14];
	}
	
	// Fx1 Humanizer
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x4d])) {
		document.getElementById('Fx1HumanizerMode').value 	= message.data[11];		document.getElementById('fx1HumanizerMode').value 	= message.data[11];
		document.getElementById('Fx1HumanizerVowel1').value = message.data[12];     document.getElementById('fx1HumanizerVowel1').value = message.data[12];
		document.getElementById('Fx1HumanizerVowel2').value = message.data[13];     document.getElementById('fx1HumanizerVowel2').value = message.data[13];
		document.getElementById('Fx1HumanizerSens').value 	= message.data[14];     document.getElementById('fx1HumanizerSens').value 	= message.data[14];
		document.getElementById('Fx1HumanizerRate').value 	= message.data[15];     document.getElementById('fx1HumanizerRate').value 	= message.data[15];		SetValueRangeNumberSelect(document.getElementById('fx1HumanizerRate'),100,'bpm2');
		document.getElementById('Fx1HumanizerDepth').value 	= message.data[16];     document.getElementById('fx1HumanizerDepth').value 	= message.data[16];
		document.getElementById('Fx1HumanizerManual').value = message.data[17];     document.getElementById('fx1HumanizerManual').value = message.data[17];
		document.getElementById('Fx1HumanizerLevel').value 	= message.data[18];     document.getElementById('fx1HumanizerLevel').value 	= message.data[18];
	}
	
	// Fx1 2x2 Chorus
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x03,0x1e])) {
		document.getElementById('Fx12x2ChorusXoverF').value 	 = message.data[11];	document.getElementById('fx12x2ChorusXoverF').value 	 = message.data[11];
		document.getElementById('Fx12x2ChorusLoRate').value 	 = message.data[12];    document.getElementById('fx12x2ChorusLoRate').value 	 = message.data[12];	SetValueRangeNumberSelect(document.getElementById('fx12x2ChorusLoRate'),100,'bpm2');
		document.getElementById('Fx12x2ChorusLoDepth').value 	 = message.data[13];    document.getElementById('fx12x2ChorusLoDepth').value 	 = message.data[13];
		document.getElementById('Fx12x2ChorusLoPreDly').value 	 = message.data[14];    document.getElementById('fx12x2ChorusLoPreDly').value 	 = message.data[14];
		document.getElementById('Fx12x2ChorusLoLevel').value 	 = message.data[15];    document.getElementById('fx12x2ChorusLoLevel').value 	 = message.data[15];
		document.getElementById('Fx12x2ChorusHiRate').value 	 = message.data[16];    document.getElementById('fx12x2ChorusHiRate').value 	 = message.data[16];	SetValueRangeNumberSelect(document.getElementById('fx12x2ChorusHiRate'),100,'bpm2');
		document.getElementById('Fx12x2ChorusHiDepth').value 	 = message.data[17];    document.getElementById('fx12x2ChorusHiDepth').value 	 = message.data[17];
		document.getElementById('Fx12x2ChorusHiPreDly').value 	 = message.data[18];    document.getElementById('fx12x2ChorusHiPreDly').value 	 = message.data[18];
		document.getElementById('Fx12x2ChorusHiLevel').value 	 = message.data[19];    document.getElementById('fx12x2ChorusHiLevel').value 	 = message.data[19];
	}
	
	// Fx1 SubDelay 
	// VERIFICAR O INTERVALO DOS BYTES DO PRIMEIRO PARÂMETRO <<<<<<<<<<<<<<<<<<<<<<<<<
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x03,0x27])) {
		document.getElementById('Fx1SubDelayDlyTime').value 	= message.data[11]*0x80+message.data[12];	document.getElementById('fx1SubDelayDlyTime').value 	= message.data[11]*0x80+message.data[12];	SetValueRangeNumberSelect(document.getElementById('fx1SubDelayDlyTime'),1000,'bpm');
		document.getElementById('Fx1SubDelayFeedback').value 	= message.data[13];                         document.getElementById('fx1SubDelayFeedback').value 	= message.data[13]; 
		document.getElementById('Fx1SubDelayHiCut').value 	 	= message.data[14];                         document.getElementById('fx1SubDelayHiCut').value 	 	= message.data[14];
		document.getElementById('Fx1SubDelayEffectLev').value 	= message.data[15];                         document.getElementById('fx1SubDelayEffectLev').value 	= message.data[15];
		document.getElementById('Fx1SubDelayDirectLev').value 	= message.data[16];                         document.getElementById('fx1SubDelayDirectLev').value 	= message.data[16];
	}
	
	
	
	// Fx2
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x00])) {
		document.getElementById('Fx2Sw').checked 	= (message.data[11] == 1);
		document.getElementById('Fx2Select').value  = message.data[12];
	}
	
	// Fx2 Touch Wah
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x0d])) {
		document.getElementById('Fx2TWahMode').value 		= message.data[11];		document.getElementById('fx2TWahMode').value 		= message.data[11];
		document.getElementById('Fx2TWahPolarity').value 	= message.data[12];     document.getElementById('fx2TWahPolarity').value 	= message.data[12];
		document.getElementById('Fx2TWahSens').value 		= message.data[13];     document.getElementById('fx2TWahSens').value 		= message.data[13];
		document.getElementById('Fx2TWahFrequency').value 	= message.data[14];     document.getElementById('fx2TWahFrequency').value 	= message.data[14];
		document.getElementById('Fx2TWahPeak').value 		= message.data[15];     document.getElementById('fx2TWahPeak').value 		= message.data[15];
		document.getElementById('Fx2TWahDirectLev').value 	= message.data[16];     document.getElementById('fx2TWahDirectLev').value 	= message.data[16];
		document.getElementById('Fx2TWahEffectLev').value 	= message.data[17];     document.getElementById('fx2TWahEffectLev').value 	= message.data[17];
	}
	
	// Fx2 Auto Wah
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x14])) {
		document.getElementById('Fx2AutoWahMode').value 		= message.data[11];		document.getElementById('fx2AutoWahMode').value 		= message.data[11];
		document.getElementById('Fx2AutoWahFrequency').value 	= message.data[12];	    document.getElementById('fx2AutoWahFrequency').value 	= message.data[12];
		document.getElementById('Fx2AutoWahPeak').value 		= message.data[13];	    document.getElementById('fx2AutoWahPeak').value 		= message.data[13];
		document.getElementById('Fx2AutoWahRate').value 		= message.data[14];	    document.getElementById('fx2AutoWahRate').value 		= message.data[14];	SetValueRangeNumberSelect(document.getElementById('fx2AutoWahRate'),100,'bpm2');
		document.getElementById('Fx2AutoWahDepth').value 		= message.data[15];	    document.getElementById('fx2AutoWahDepth').value 		= message.data[15];
		document.getElementById('Fx2AutoWahDirectLev').value 	= message.data[16];	    document.getElementById('fx2AutoWahDirectLev').value 	= message.data[16];
		document.getElementById('Fx2AutoWahEffectLev').value 	= message.data[17];	    document.getElementById('fx2AutoWahEffectLev').value 	= message.data[17];
	}
	
	// Fx2 SubWah
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x09,0x30])) {
		document.getElementById('Fx2SubWahType').value   	= message.data[11];		document.getElementById('fx2SubWahType').value   	= message.data[11];
		document.getElementById('Fx2SubWahPos').value   	= message.data[12];     document.getElementById('fx2SubWahPos').value   	= message.data[12];
		document.getElementById('Fx2SubWahMin').value   	= message.data[13];     document.getElementById('fx2SubWahMin').value   	= message.data[13];
		document.getElementById('Fx2SubWahMax').value   	= message.data[14];     document.getElementById('fx2SubWahMax').value   	= message.data[14];
		document.getElementById('Fx2SubWahEffectLev').value	= message.data[15];     document.getElementById('fx2SubWahEffectLev').value	= message.data[15];
		document.getElementById('Fx2SubWahDirectLev').value	= message.data[16];     document.getElementById('fx2SubWahDirectLev').value	= message.data[16];
	}
		
	// Fx2 Advanced compressor
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x02])) {
		document.getElementById('Fx2AdvCompType').value 	= message.data[11];		document.getElementById('fx2AdvCompType').value 	= message.data[11];
		document.getElementById('Fx2AdvCompSustain').value 	= message.data[12];		document.getElementById('fx2AdvCompSustain').value 	= message.data[12];
		document.getElementById('Fx2AdvCompAttack').value 	= message.data[13];		document.getElementById('fx2AdvCompAttack').value 	= message.data[13];
		document.getElementById('Fx2AdvCompTone').value 	= message.data[14]-50;	document.getElementById('fx2AdvCompTone').value 	= message.data[14]-50;
		document.getElementById('Fx2AdvCompLevel').value 	= message.data[15];		document.getElementById('fx2AdvCompLevel').value 	= message.data[15];
	}
	
	// Fx2 Limiter
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x07])) {
		document.getElementById('Fx2LimiterType').value 		= message.data[11];		document.getElementById('fx2LimiterType').value 		= message.data[11];
		document.getElementById('Fx2LimiterAttack').value 		= message.data[12];     document.getElementById('fx2LimiterAttack').value 		= message.data[12];
		document.getElementById('Fx2LimiterThreshold').value 	= message.data[13];     document.getElementById('fx2LimiterThreshold').value 	= message.data[13];
		document.getElementById('Fx2LimiterRatio').value 		= message.data[14];     document.getElementById('fx2LimiterRatio').value 		= message.data[14];
		document.getElementById('Fx2LimiterRelease').value 		= message.data[15];     document.getElementById('fx2LimiterRelease').value 		= message.data[15];
		document.getElementById('Fx2LimiterLevel').value 		= message.data[16];     document.getElementById('fx2LimiterLevel').value 		= message.data[16];
	}
	
	// Fx2 Graphic Eq
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x09,0x36])) {
		document.getElementById('Fx2GraphicEqLevel').value 	 = message.data[11]-12;    	document.getElementById('fx2GraphicEqLevel').value 	 = message.data[11]-12;
		document.getElementById('Fx2GraphicEq31').value 	 = message.data[12]-12;    	document.getElementById('fx2GraphicEq31').value 	 = message.data[12]-12;
		document.getElementById('Fx2GraphicEq62').value 	 = message.data[13]-12;    	document.getElementById('fx2GraphicEq62').value 	 = message.data[13]-12;
		document.getElementById('Fx2GraphicEq125').value 	 = message.data[14]-12;    	document.getElementById('fx2GraphicEq125').value 	 = message.data[14]-12;
		document.getElementById('Fx2GraphicEq250').value 	 = message.data[15]-12;    	document.getElementById('fx2GraphicEq250').value 	 = message.data[15]-12;
		document.getElementById('Fx2GraphicEq500').value 	 = message.data[16]-12;    	document.getElementById('fx2GraphicEq500').value 	 = message.data[16]-12;
		document.getElementById('Fx2GraphicEq1k').value 	 = message.data[17]-12;    	document.getElementById('fx2GraphicEq1k').value 	 = message.data[17]-12;
		document.getElementById('Fx2GraphicEq2k').value 	 = message.data[18]-12;    	document.getElementById('fx2GraphicEq2k').value 	 = message.data[18]-12;
		document.getElementById('Fx2GraphicEq4k').value 	 = message.data[19]-12;    	document.getElementById('fx2GraphicEq4k').value 	 = message.data[19]-12;
		document.getElementById('Fx2GraphicEq8k').value 	 = message.data[20]-12;    	document.getElementById('fx2GraphicEq8k').value 	 = message.data[20]-12;
		document.getElementById('Fx2GraphicEq16k').value 	 = message.data[21]-12;    	document.getElementById('fx2GraphicEq16k').value 	 = message.data[21]-12;
	}
	
	// Fx2 Parametric Eq
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x58])) {
		document.getElementById('Fx2ParaEqLowCut').value 	 = message.data[11];    	document.getElementById('fx2ParaEqLowCut').value 	 = message.data[11];
		document.getElementById('Fx2ParaEqLowGain').value 	 = message.data[12]-20;    	document.getElementById('fx2ParaEqLowGain').value 	 = message.data[12]-20;
		document.getElementById('Fx2ParaEqLoMidf').value 	 = message.data[13];    	document.getElementById('fx2ParaEqLoMidf').value 	 = message.data[13];
		document.getElementById('Fx2ParaEqLoMidQ').value 	 = message.data[14];    	document.getElementById('fx2ParaEqLoMidQ').value 	 = message.data[14];
		document.getElementById('Fx2ParaEqLoMidG').value 	 = message.data[15]-20;    	document.getElementById('fx2ParaEqLoMidG').value 	 = message.data[15]-20;
		document.getElementById('Fx2ParaEqHiMidf').value 	 = message.data[16];    	document.getElementById('fx2ParaEqHiMidf').value 	 = message.data[16];
		document.getElementById('Fx2ParaEqHiMidQ').value 	 = message.data[17];    	document.getElementById('fx2ParaEqHiMidQ').value 	 = message.data[17];
		document.getElementById('Fx2ParaEqHiMidG').value 	 = message.data[18]-20;    	document.getElementById('fx2ParaEqHiMidG').value 	 = message.data[18]-20;
		document.getElementById('Fx2ParaEqHiGain').value 	 = message.data[19]-20;    	document.getElementById('fx2ParaEqHiGain').value 	 = message.data[19]-20;
		document.getElementById('Fx2ParaEqHiCut').value 	 = message.data[20];    	document.getElementById('fx2ParaEqHiCut').value 	 = message.data[20];
		document.getElementById('Fx2ParaEqLevel').value 	 = message.data[21]-20;    	document.getElementById('fx2ParaEqLevel').value 	 = message.data[21]-20;
	}
	
	// Fx2 Tone Modify
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x09,0x1f])) {
		document.getElementById('Fx2ToneModifyType').value      = message.data[11];
		document.getElementById('Fx2ToneModifyResonance').value = message.data[12]; 	document.getElementById('fx2ToneModifyResonance').value = message.data[12];
		document.getElementById('Fx2ToneModifyLow').value     	= message.data[13]-50; 	document.getElementById('fx2ToneModifyLow').value     	= message.data[13]-50; 
		document.getElementById('Fx2ToneModifyHigh').value    	= message.data[14]-50; 	document.getElementById('fx2ToneModifyHigh').value    	= message.data[14]-50; 
		document.getElementById('Fx2ToneModifyLevel').value 	= message.data[15]; 	document.getElementById('fx2ToneModifyLevel').value 	= message.data[15]; 
	}
	
	// Fx2 Guitar Sim
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x09,0x24])) {
		document.getElementById('Fx2GuitarSimType').value      	= message.data[11];			document.getElementById('fx2GuitarSimType').value      	= message.data[11];		
		document.getElementById('Fx2GuitarSimResonance').value  = message.data[12];         document.getElementById('fx2GuitarSimResonance').value  = message.data[12];
		document.getElementById('Fx2GuitarSimLow').value      	= message.data[13]-50;      document.getElementById('fx2GuitarSimLow').value      	= message.data[13]-50;
		document.getElementById('Fx2GuitarSimHigh').value      	= message.data[14]-50;      document.getElementById('fx2GuitarSimHigh').value      	= message.data[14]-50;
		document.getElementById('Fx2GuitarSimLevel').value      = message.data[15];         document.getElementById('fx2GuitarSimLevel').value      = message.data[15];
	}
	
	// Fx2 Slow Gear
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x3e])) {
		document.getElementById('Fx2SlowGearSens').value 		= message.data[11];		document.getElementById('fx2SlowGearSens').value 		= message.data[11];
		document.getElementById('Fx2SlowGearRiseTime').value 	= message.data[12];     document.getElementById('fx2SlowGearRiseTime').value 	= message.data[12];
	}
	
	// Fx2 Defretter
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x07,0x2d])) {
		document.getElementById('Fx2DefretterTone').value 	 	= message.data[11]-50;	document.getElementById('fx2DefretterTone').value 	 	= message.data[11]-50;
		document.getElementById('Fx2DefretterSens').value 	 	= message.data[12];     document.getElementById('fx2DefretterSens').value 	 	= message.data[12];
		document.getElementById('Fx2DefretterAttack').value  	= message.data[13];     document.getElementById('fx2DefretterAttack').value 	= message.data[13];
		document.getElementById('Fx2DefretterDepth').value 	 	= message.data[14];     document.getElementById('fx2DefretterDepth').value 	 	= message.data[14];
		document.getElementById('Fx2DefretterResonance').value 	= message.data[15];     document.getElementById('fx2DefretterResonance').value 	= message.data[15];
		document.getElementById('Fx2DefretterEffectLev').value 	= message.data[16];     document.getElementById('fx2DefretterEffectLev').value 	= message.data[16];
		document.getElementById('Fx2DefretterDirectLev').value 	= message.data[17];     document.getElementById('fx2DefretterDirectLev').value 	= message.data[17];
	}

	// Fx2 Wave Synth
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x07,0x3b])) {
		document.getElementById('Fx2WaveSynthWave').value 	 	= message.data[11];		document.getElementById('fx2WaveSynthWave').value 	 	= message.data[11];
		document.getElementById('Fx2WaveSynthCutoff').value 	= message.data[11];     document.getElementById('fx2WaveSynthCutoff').value 	= message.data[11];
		document.getElementById('Fx2WaveSynthResonance').value 	= message.data[11];     document.getElementById('fx2WaveSynthResonance').value 	= message.data[11];
		document.getElementById('Fx2WaveSynthFltSens').value 	= message.data[11];     document.getElementById('fx2WaveSynthFltSens').value 	= message.data[11];
		document.getElementById('Fx2WaveSynthFltDecay').value 	= message.data[11];     document.getElementById('fx2WaveSynthFltDecay').value 	= message.data[11];
		document.getElementById('Fx2WaveSynthFltDepth').value 	= message.data[11];     document.getElementById('fx2WaveSynthFltDepth').value 	= message.data[11];
		document.getElementById('Fx2WaveSynthSynthLev').value 	= message.data[11];     document.getElementById('fx2WaveSynthSynthLev').value 	= message.data[11];
		document.getElementById('Fx2WaveSynthDirectLev').value 	= message.data[11];     document.getElementById('fx2WaveSynthDirectLev').value 	= message.data[11];
	}
	
	// Fx2 Guitar Synth
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x07,0x43])) {
		document.getElementById('Fx2GuitarSynthWave').value 	 	= message.data[11];		document.getElementById('fx2GuitarSynthWave').value 	 	= message.data[11];
		document.getElementById('Fx2GuitarSynthSens').value 	 	= message.data[12];     document.getElementById('fx2GuitarSynthSens').value 	 	= message.data[12];
		document.getElementById('Fx2GuitarSynthChromatic').value 	= message.data[13];     document.getElementById('fx2GuitarSynthChromatic').value 	= message.data[13];
		document.getElementById('Fx2GuitarSynthOctShift').value 	= -message.data[14];    document.getElementById('fx2GuitarSynthOctShift').value 	= -message.data[14];
		document.getElementById('Fx2GuitarSynthPwmRate').value 	 	= message.data[15];     document.getElementById('fx2GuitarSynthPwmRate').value 	 	= message.data[15];
		document.getElementById('Fx2GuitarSynthPwmDepth').value 	= message.data[16];     document.getElementById('fx2GuitarSynthPwmDepth').value 	= message.data[16];
		document.getElementById('Fx2GuitarSynthCutoff').value 	 	= message.data[17];     document.getElementById('fx2GuitarSynthCutoff').value 	 	= message.data[17];
		document.getElementById('Fx2GuitarSynthResonance').value 	= message.data[18];     document.getElementById('fx2GuitarSynthResonance').value 	= message.data[18];
		document.getElementById('Fx2GuitarSynthFltSens').value 	 	= message.data[19];     document.getElementById('fx2GuitarSynthFltSens').value 	 	= message.data[19];
		document.getElementById('Fx2GuitarSynthFltDecay').value 	= message.data[20];     document.getElementById('fx2GuitarSynthFltDecay').value 	= message.data[20];
		document.getElementById('Fx2GuitarSynthFltDepth').value 	= message.data[21];     document.getElementById('fx2GuitarSynthFltDepth').value 	= message.data[21];
		document.getElementById('Fx2GuitarSynthAttack').value 	 	= message.data[22];     document.getElementById('fx2GuitarSynthAttack').value 	 	= message.data[22];
		document.getElementById('Fx2GuitarSynthRelease').value 	 	= message.data[23];     document.getElementById('fx2GuitarSynthRelease').value 	 	= message.data[23];
		document.getElementById('Fx2GuitarSynthVelocity').value 	= message.data[24];     document.getElementById('fx2GuitarSynthVelocity').value 	= message.data[24];
		document.getElementById('Fx2GuitarSynthHold').value 	 	= message.data[25];     document.getElementById('fx2GuitarSynthHold').value 	 	= message.data[25];
		document.getElementById('Fx2GuitarSynthSynthLev').value 	= message.data[26];     document.getElementById('fx2GuitarSynthSynthLev').value 	= message.data[26];
		document.getElementById('Fx2GuitarSynthDirectLev').value 	= message.data[27];     document.getElementById('fx2GuitarSynthDirectLev').value 	= message.data[27];
	}
	
	// Fx2 Sitar Sim
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x07,0x34])) {
		document.getElementById('Fx2SitarSimTone').value 	 	= message.data[11]-50;		document.getElementById('fx2SitarSimTone').value 	 	= message.data[11]-50;
		document.getElementById('Fx2SitarSimSens').value 	 	= message.data[12];         document.getElementById('fx2SitarSimSens').value 	 	= message.data[12];
		document.getElementById('Fx2SitarSimDepth').value 	 	= message.data[13];         document.getElementById('fx2SitarSimDepth').value 	 	= message.data[13];
		document.getElementById('Fx2SitarSimResonance').value 	= message.data[14];         document.getElementById('fx2SitarSimResonance').value 	= message.data[14];
		document.getElementById('Fx2SitarSimBuzz').value 	 	= message.data[15];         document.getElementById('fx2SitarSimBuzz').value 	 	= message.data[15];
		document.getElementById('Fx2SitarSimEffectLev').value 	= message.data[16];         document.getElementById('fx2SitarSimEffectLev').value 	= message.data[16];
		document.getElementById('Fx2SitarSimDirectLev').value 	= message.data[17];         document.getElementById('fx2SitarSimDirectLev').value 	= message.data[17];
	}
	
	// Fx2 Octave
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x07,0x15])) {
		document.getElementById('Fx2OctaveRange').value 	 	= message.data[11];		document.getElementById('fx2OctaveRange').value 	 	= message.data[11];
		document.getElementById('Fx2OctaveOctLevel').value 	 	= message.data[12];     document.getElementById('fx2OctaveOctLevel').value 	 	= message.data[12];
		document.getElementById('Fx2OctaveDirectLev').value 	= message.data[13];     document.getElementById('fx2OctaveDirectLev').value 	= message.data[13];
	}
	
	// Fx2 Pitch Shifter
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x07,0x06])) {
		document.getElementById('Fx2PitchShifterVoice').value 	 	= message.data[11];							document.getElementById('fx2PitchShifterVoice').value 	 	= message.data[11];
		document.getElementById('Fx2PitchShifterPs1Mode').value 	= message.data[12];                         document.getElementById('fx2PitchShifterPs1Mode').value 	= message.data[12];
		document.getElementById('Fx2PitchShifterPs1Pitch').value 	= message.data[13];                         document.getElementById('fx2PitchShifterPs1Pitch').value 	= message.data[13];
		document.getElementById('Fx2PitchShifterPs1Fine').value 	= message.data[14];                         document.getElementById('fx2PitchShifterPs1Fine').value 	= message.data[14];
		document.getElementById('Fx2PitchShifterPs1PreDly').value 	= message.data[15]*0x80+message.data[16];   document.getElementById('fx2PitchShifterPs1PreDly').value 	= message.data[15]*0x80+message.data[16];	SetValueRangeNumberSelect(document.getElementById('fx2PitchShifterPs1PreDly'),300,'bpm');
		document.getElementById('Fx2PitchShifterPs1Level').value 	= message.data[17];                         document.getElementById('fx2PitchShifterPs1Level').value 	= message.data[17];
		document.getElementById('Fx2PitchShifterPs2Mode').value 	= message.data[18];                         document.getElementById('fx2PitchShifterPs2Mode').value 	= message.data[18];
		document.getElementById('Fx2PitchShifterPs2Pitch').value 	= message.data[19];                         document.getElementById('fx2PitchShifterPs2Pitch').value 	= message.data[19];
		document.getElementById('Fx2PitchShifterPs2Fine').value 	= message.data[20];                         document.getElementById('fx2PitchShifterPs2Fine').value 	= message.data[20];
		document.getElementById('Fx2PitchShifterPs2PreDly').value 	= message.data[21]*0x80+message.data[22];   document.getElementById('fx2PitchShifterPs2PreDly').value 	= message.data[21]*0x80+message.data[22];	SetValueRangeNumberSelect(document.getElementById('fx2PitchShifterPs2PreDly'),300,'bpm');
		document.getElementById('Fx2PitchShifterPs2Level').value 	= message.data[23];                         document.getElementById('fx2PitchShifterPs2Level').value 	= message.data[23];
		document.getElementById('Fx2PitchShifterPs1Fbk').value 	 	= message.data[24];                         document.getElementById('fx2PitchShifterPs1Fbk').value 	 	= message.data[24];
		document.getElementById('Fx2PitchShifterDirectLev').value 	= message.data[25];                         document.getElementById('fx2PitchShifterDirectLev').value 	= message.data[25];
	}
	
	// Fx2 Harmonist
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x63])) {
		document.getElementById('Fx2HarmonistVoice').value 	 			= message.data[11];							document.getElementById('fx2HarmonistVoice').value 	 			= message.data[11];
		document.getElementById('Fx2HarmonistHr1Harm').value 	 		= message.data[12];     					document.getElementById('fx2HarmonistHr1Harm').value 	 		= message.data[12];
		document.getElementById('Fx2HarmonistHr1PreDl').value 	 		= message.data[13]*0x80+message.data[14];   document.getElementById('fx2HarmonistHr1PreDl').value 	 		= message.data[13]*0x80+message.data[14];		SetValueRangeNumberSelect(document.getElementById('fx2HarmonistHr1PreDl'),300,'bpm');
		document.getElementById('Fx2HarmonistHr1Level').value 	 		= message.data[15];     					document.getElementById('fx2HarmonistHr1Level').value 	 		= message.data[15];
		document.getElementById('Fx2HarmonistHr2Harm').value 	 		= message.data[16];     					document.getElementById('fx2HarmonistHr2Harm').value 	 		= message.data[16];
		document.getElementById('Fx2HarmonistHr2PreDl').value 	 		= message.data[17]*0x80+message.data[18];   document.getElementById('fx2HarmonistHr2PreDl').value 	 		= message.data[17]*0x80+message.data[18];		SetValueRangeNumberSelect(document.getElementById('fx2HarmonistHr2PreDl'),300,'bpm');
		document.getElementById('Fx2HarmonistHr2Level').value 	 		= message.data[19];     					document.getElementById('fx2HarmonistHr2Level').value 	 		= message.data[19];
		document.getElementById('Fx2HarmonistHr1Fbk').value 	 		= message.data[20];     					document.getElementById('fx2HarmonistHr1Fbk').value 	 		= message.data[20];
		document.getElementById('Fx2HarmonistDirectLev').value 	 		= message.data[21];     					document.getElementById('fx2HarmonistDirectLev').value 	 		= message.data[21];
		document.getElementById('Fx2HarmonistHr1UserScaleKeyC').value 	= message.data[22]-24;  					document.getElementById('fx2HarmonistHr1UserScaleKeyC').value 	= message.data[22]-24;
		document.getElementById('Fx2HarmonistHr1UserScaleKeyDb').value 	= message.data[23]-24;  					document.getElementById('fx2HarmonistHr1UserScaleKeyDb').value 	= message.data[23]-24;
		document.getElementById('Fx2HarmonistHr1UserScaleKeyD').value 	= message.data[24]-24;  					document.getElementById('fx2HarmonistHr1UserScaleKeyD').value 	= message.data[24]-24;
		document.getElementById('Fx2HarmonistHr1UserScaleKeyEb').value 	= message.data[25]-24;  					document.getElementById('fx2HarmonistHr1UserScaleKeyEb').value 	= message.data[25]-24;
		document.getElementById('Fx2HarmonistHr1UserScaleKeyE').value 	= message.data[26]-24;  					document.getElementById('fx2HarmonistHr1UserScaleKeyE').value 	= message.data[26]-24;
		document.getElementById('Fx2HarmonistHr1UserScaleKeyF').value 	= message.data[27]-24;  					document.getElementById('fx2HarmonistHr1UserScaleKeyF').value 	= message.data[27]-24;
		document.getElementById('Fx2HarmonistHr1UserScaleKeyFs').value 	= message.data[28]-24;  					document.getElementById('fx2HarmonistHr1UserScaleKeyFs').value 	= message.data[28]-24;
		document.getElementById('Fx2HarmonistHr1UserScaleKeyG').value 	= message.data[29]-24;  					document.getElementById('fx2HarmonistHr1UserScaleKeyG').value 	= message.data[29]-24;
		document.getElementById('Fx2HarmonistHr1UserScaleKeyAb').value 	= message.data[30]-24;  					document.getElementById('fx2HarmonistHr1UserScaleKeyAb').value 	= message.data[30]-24;
		document.getElementById('Fx2HarmonistHr1UserScaleKeyA').value 	= message.data[31]-24;  					document.getElementById('fx2HarmonistHr1UserScaleKeyA').value 	= message.data[31]-24;
		document.getElementById('Fx2HarmonistHr1UserScaleKeyBb').value 	= message.data[32]-24;  					document.getElementById('fx2HarmonistHr1UserScaleKeyBb').value 	= message.data[32]-24;
		document.getElementById('Fx2HarmonistHr1UserScaleKeyB').value 	= message.data[33]-24;  					document.getElementById('fx2HarmonistHr1UserScaleKeyB').value 	= message.data[33]-24;
		document.getElementById('Fx2HarmonistHr2UserScaleKeyC').value 	= message.data[34]-24;  					document.getElementById('fx2HarmonistHr2UserScaleKeyC').value 	= message.data[34]-24;
		document.getElementById('Fx2HarmonistHr2UserScaleKeyDb').value 	= message.data[35]-24;  					document.getElementById('fx2HarmonistHr2UserScaleKeyDb').value 	= message.data[35]-24;
		document.getElementById('Fx2HarmonistHr2UserScaleKeyD').value 	= message.data[36]-24;  					document.getElementById('fx2HarmonistHr2UserScaleKeyD').value 	= message.data[36]-24;
		document.getElementById('Fx2HarmonistHr2UserScaleKeyEb').value 	= message.data[37]-24;  					document.getElementById('fx2HarmonistHr2UserScaleKeyEb').value 	= message.data[37]-24;
		document.getElementById('Fx2HarmonistHr2UserScaleKeyE').value 	= message.data[38]-24;  					document.getElementById('fx2HarmonistHr2UserScaleKeyE').value 	= message.data[38]-24;
		document.getElementById('Fx2HarmonistHr2UserScaleKeyF').value 	= message.data[39]-24;  					document.getElementById('fx2HarmonistHr2UserScaleKeyF').value 	= message.data[39]-24;
		document.getElementById('Fx2HarmonistHr2UserScaleKeyFs').value 	= message.data[40]-24;  					document.getElementById('fx2HarmonistHr2UserScaleKeyFs').value 	= message.data[40]-24;
		document.getElementById('Fx2HarmonistHr2UserScaleKeyG').value 	= message.data[41]-24;  					document.getElementById('fx2HarmonistHr2UserScaleKeyG').value 	= message.data[41]-24;
		document.getElementById('Fx2HarmonistHr2UserScaleKeyAb').value 	= message.data[42]-24;  					document.getElementById('fx2HarmonistHr2UserScaleKeyAb').value 	= message.data[42]-24;
		document.getElementById('Fx2HarmonistHr2UserScaleKeyA').value 	= message.data[43]-24;  					document.getElementById('fx2HarmonistHr2UserScaleKeyA').value 	= message.data[43]-24;
		document.getElementById('Fx2HarmonistHr2UserScaleKeyBb').value 	= message.data[44]-24;  					document.getElementById('fx2HarmonistHr2UserScaleKeyBb').value 	= message.data[44]-24;
		document.getElementById('Fx2HarmonistHr2UserScaleKeyB').value 	= message.data[45]-24;  					document.getElementById('fx2HarmonistHr2UserScaleKeyB').value 	= message.data[45]-24;
	}
	
	// Fx2 Auto Riff
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x07,0x54])) {
		document.getElementById('Fx2AutoRiffPhrase').value 	 				= message.data[11];			document.getElementById('fx2AutoRiffPhrase').value 	 				= message.data[11];
		document.getElementById('Fx2AutoRiffLoop').value 	 				= message.data[12];         document.getElementById('fx2AutoRiffLoop').value 	 				= message.data[12];
		document.getElementById('Fx2AutoRiffTempo').value 	 				= message.data[13];         document.getElementById('fx2AutoRiffTempo').value 	 				= message.data[13];			SetValueRangeNumberSelect(document.getElementById('fx2SubDelayDlyTime'),100,'bpm2');
		document.getElementById('Fx2AutoRiffSens').value 	 				= message.data[14];         document.getElementById('fx2AutoRiffSens').value 	 				= message.data[14];
		document.getElementById('Fx2AutoRiffAttack').value 	 				= message.data[15];         document.getElementById('fx2AutoRiffAttack').value 	 				= message.data[15];
		document.getElementById('Fx2AutoRiffHold').value 	 				= message.data[16];         document.getElementById('fx2AutoRiffHold').value 	 				= message.data[16];
		document.getElementById('Fx2AutoRiffEffectLev').value 	 			= message.data[17];         document.getElementById('fx2AutoRiffEffectLev').value 	 			= message.data[17];
		document.getElementById('Fx2AutoRiffDirectLev').value 	 			= message.data[18];         document.getElementById('fx2AutoRiffDirectLev').value 	 			= message.data[18];
		document.getElementById('Fx2AutoRiffUserPhraseSetting1C').value 	= message.data[19]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting1C').value 	= message.data[19]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting2C').value 	= message.data[20]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting2C').value 	= message.data[20]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting3C').value 	= message.data[21]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting3C').value 	= message.data[21]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting4C').value 	= message.data[22]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting4C').value 	= message.data[22]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting5C').value 	= message.data[23]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting5C').value 	= message.data[23]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting6C').value 	= message.data[24]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting6C').value 	= message.data[24]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting7C').value 	= message.data[25]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting7C').value 	= message.data[25]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting8C').value 	= message.data[26]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting8C').value 	= message.data[26]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting9C').value 	= message.data[27]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting9C').value 	= message.data[27]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting10C').value	= message.data[28]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting10C').value	= message.data[28]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting11C').value	= message.data[29]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting11C').value	= message.data[29]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting12C').value	= message.data[30]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting12C').value	= message.data[30]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting13C').value	= message.data[31]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting13C').value	= message.data[31]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting14C').value	= message.data[32]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting14C').value	= message.data[32]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting15C').value	= message.data[33]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting15C').value	= message.data[33]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting16C').value	= message.data[34]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting16C').value	= message.data[34]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting1Db').value 	= message.data[35]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting1Db').value 	= message.data[35]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting2Db').value 	= message.data[36]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting2Db').value 	= message.data[36]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting3Db').value 	= message.data[37]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting3Db').value 	= message.data[37]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting4Db').value 	= message.data[38]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting4Db').value 	= message.data[38]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting5Db').value 	= message.data[39]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting5Db').value 	= message.data[39]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting6Db').value 	= message.data[40]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting6Db').value 	= message.data[40]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting7Db').value 	= message.data[41]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting7Db').value 	= message.data[41]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting8Db').value 	= message.data[42]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting8Db').value 	= message.data[42]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting9Db').value 	= message.data[43]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting9Db').value 	= message.data[43]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting10Db').value	= message.data[44]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting10Db').value	= message.data[44]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting11Db').value	= message.data[45]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting11Db').value	= message.data[45]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting12Db').value	= message.data[46]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting12Db').value	= message.data[46]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting13Db').value	= message.data[47]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting13Db').value	= message.data[47]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting14Db').value	= message.data[48]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting14Db').value	= message.data[48]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting15Db').value	= message.data[49]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting15Db').value	= message.data[49]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting16Db').value	= message.data[50]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting16Db').value	= message.data[50]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting1D').value 	= message.data[51]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting1D').value 	= message.data[51]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting2D').value 	= message.data[52]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting2D').value 	= message.data[52]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting3D').value 	= message.data[53]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting3D').value 	= message.data[53]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting4D').value 	= message.data[54]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting4D').value 	= message.data[54]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting5D').value 	= message.data[55]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting5D').value 	= message.data[55]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting6D').value 	= message.data[56]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting6D').value 	= message.data[56]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting7D').value 	= message.data[57]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting7D').value 	= message.data[57]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting8D').value 	= message.data[58]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting8D').value 	= message.data[58]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting9D').value 	= message.data[59]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting9D').value 	= message.data[59]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting10D').value	= message.data[60]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting10D').value	= message.data[60]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting11D').value	= message.data[61]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting11D').value	= message.data[61]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting12D').value	= message.data[62]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting12D').value	= message.data[62]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting13D').value	= message.data[63]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting13D').value	= message.data[63]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting14D').value	= message.data[64]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting14D').value	= message.data[64]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting15D').value	= message.data[65]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting15D').value	= message.data[65]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting16D').value	= message.data[66]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting16D').value	= message.data[66]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting1Eb').value 	= message.data[67]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting1Eb').value 	= message.data[67]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting2Eb').value 	= message.data[68]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting2Eb').value 	= message.data[68]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting3Eb').value 	= message.data[69]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting3Eb').value 	= message.data[69]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting4Eb').value 	= message.data[70]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting4Eb').value 	= message.data[70]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting5Eb').value 	= message.data[71]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting5Eb').value 	= message.data[71]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting6Eb').value 	= message.data[72]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting6Eb').value 	= message.data[72]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting7Eb').value 	= message.data[73]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting7Eb').value 	= message.data[73]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting8Eb').value 	= message.data[74]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting8Eb').value 	= message.data[74]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting9Eb').value 	= message.data[75]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting9Eb').value 	= message.data[75]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting10Eb').value	= message.data[76]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting10Eb').value	= message.data[76]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting11Eb').value	= message.data[77]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting11Eb').value	= message.data[77]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting12Eb').value	= message.data[78]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting12Eb').value	= message.data[78]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting13Eb').value	= message.data[79]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting13Eb').value	= message.data[79]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting14Eb').value	= message.data[80]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting14Eb').value	= message.data[80]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting15Eb').value	= message.data[81]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting15Eb').value	= message.data[81]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting16Eb').value	= message.data[82]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting16Eb').value	= message.data[82]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting1E').value 	= message.data[83]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting1E').value 	= message.data[83]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting2E').value 	= message.data[84]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting2E').value 	= message.data[84]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting3E').value 	= message.data[85]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting3E').value 	= message.data[85]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting4E').value 	= message.data[86]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting4E').value 	= message.data[86]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting5E').value 	= message.data[87]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting5E').value 	= message.data[87]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting6E').value 	= message.data[88]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting6E').value 	= message.data[88]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting7E').value 	= message.data[89]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting7E').value 	= message.data[89]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting8E').value 	= message.data[90]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting8E').value 	= message.data[90]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting9E').value 	= message.data[91]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting9E').value 	= message.data[91]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting10E').value	= message.data[92]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting10E').value	= message.data[92]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting11E').value	= message.data[93]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting11E').value	= message.data[93]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting12E').value	= message.data[94]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting12E').value	= message.data[94]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting13E').value	= message.data[95]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting13E').value	= message.data[95]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting14E').value	= message.data[96]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting14E').value	= message.data[96]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting15E').value	= message.data[97]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting15E').value	= message.data[97]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting16E').value	= message.data[98]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting16E').value	= message.data[98]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting1F').value 	= message.data[99]  -24;    document.getElementById('fx2AutoRiffUserPhraseSetting1F').value 	= message.data[99]  -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting2F').value 	= message.data[100] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting2F').value 	= message.data[100] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting3F').value 	= message.data[101] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting3F').value 	= message.data[101] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting4F').value 	= message.data[102] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting4F').value 	= message.data[102] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting5F').value 	= message.data[103] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting5F').value 	= message.data[103] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting6F').value 	= message.data[104] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting6F').value 	= message.data[104] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting7F').value 	= message.data[105] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting7F').value 	= message.data[105] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting8F').value 	= message.data[106] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting8F').value 	= message.data[106] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting9F').value 	= message.data[107] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting9F').value 	= message.data[107] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting10F').value	= message.data[108] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting10F').value	= message.data[108] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting11F').value	= message.data[109] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting11F').value	= message.data[109] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting12F').value	= message.data[110] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting12F').value	= message.data[110] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting13F').value	= message.data[111] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting13F').value	= message.data[111] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting14F').value	= message.data[112] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting14F').value	= message.data[112] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting15F').value	= message.data[113] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting15F').value	= message.data[113] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting16F').value	= message.data[114] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting16F').value	= message.data[114] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting1Fs').value 	= message.data[115] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting1Fs').value 	= message.data[115] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting2Fs').value 	= message.data[116] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting2Fs').value 	= message.data[116] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting3Fs').value 	= message.data[117] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting3Fs').value 	= message.data[117] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting4Fs').value 	= message.data[118] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting4Fs').value 	= message.data[118] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting5Fs').value 	= message.data[119] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting5Fs').value 	= message.data[119] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting6Fs').value 	= message.data[120] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting6Fs').value 	= message.data[120] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting7Fs').value 	= message.data[121] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting7Fs').value 	= message.data[121] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting8Fs').value 	= message.data[122] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting8Fs').value 	= message.data[122] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting9Fs').value 	= message.data[123] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting9Fs').value 	= message.data[123] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting10Fs').value	= message.data[124] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting10Fs').value	= message.data[124] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting11Fs').value	= message.data[125] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting11Fs').value	= message.data[125] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting12Fs').value	= message.data[126] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting12Fs').value	= message.data[126] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting13Fs').value	= message.data[127] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting13Fs').value	= message.data[127] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting14Fs').value	= message.data[128] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting14Fs').value	= message.data[128] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting15Fs').value	= message.data[129] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting15Fs').value	= message.data[129] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting16Fs').value	= message.data[130] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting16Fs').value	= message.data[130] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting1G').value 	= message.data[131] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting1G').value 	= message.data[131] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting2G').value 	= message.data[132] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting2G').value 	= message.data[132] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting3G').value 	= message.data[133] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting3G').value 	= message.data[133] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting4G').value 	= message.data[134] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting4G').value 	= message.data[134] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting5G').value 	= message.data[135] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting5G').value 	= message.data[135] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting6G').value 	= message.data[136] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting6G').value 	= message.data[136] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting7G').value 	= message.data[137] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting7G').value 	= message.data[137] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting8G').value 	= message.data[138] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting8G').value 	= message.data[138] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting9G').value 	= message.data[139] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting9G').value 	= message.data[139] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting10G').value	= message.data[140] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting10G').value	= message.data[140] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting11G').value	= message.data[141] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting11G').value	= message.data[141] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting12G').value	= message.data[142] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting12G').value	= message.data[142] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting13G').value	= message.data[143] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting13G').value	= message.data[143] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting14G').value	= message.data[144] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting14G').value	= message.data[144] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting15G').value	= message.data[145] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting15G').value	= message.data[145] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting16G').value	= message.data[146] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting16G').value	= message.data[146] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting1Ab').value 	= message.data[147] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting1Ab').value 	= message.data[147] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting2Ab').value 	= message.data[148] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting2Ab').value 	= message.data[148] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting3Ab').value 	= message.data[149] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting3Ab').value 	= message.data[149] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting4Ab').value 	= message.data[150] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting4Ab').value 	= message.data[150] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting5Ab').value 	= message.data[151] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting5Ab').value 	= message.data[151] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting6Ab').value 	= message.data[152] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting6Ab').value 	= message.data[152] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting7Ab').value 	= message.data[153] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting7Ab').value 	= message.data[153] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting8Ab').value 	= message.data[154] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting8Ab').value 	= message.data[154] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting9Ab').value 	= message.data[155] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting9Ab').value 	= message.data[155] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting10Ab').value	= message.data[156] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting10Ab').value	= message.data[156] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting11Ab').value	= message.data[157] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting11Ab').value	= message.data[157] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting12Ab').value	= message.data[158] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting12Ab').value	= message.data[158] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting13Ab').value	= message.data[159] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting13Ab').value	= message.data[159] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting14Ab').value	= message.data[160] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting14Ab').value	= message.data[160] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting15Ab').value	= message.data[161] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting15Ab').value	= message.data[161] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting16Ab').value	= message.data[162] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting16Ab').value	= message.data[162] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting1A').value 	= message.data[163] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting1A').value 	= message.data[163] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting2A').value 	= message.data[164] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting2A').value 	= message.data[164] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting3A').value 	= message.data[165] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting3A').value 	= message.data[165] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting4A').value 	= message.data[166] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting4A').value 	= message.data[166] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting5A').value 	= message.data[167] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting5A').value 	= message.data[167] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting6A').value 	= message.data[168] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting6A').value 	= message.data[168] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting7A').value 	= message.data[169] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting7A').value 	= message.data[169] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting8A').value 	= message.data[170] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting8A').value 	= message.data[170] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting9A').value 	= message.data[171] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting9A').value 	= message.data[171] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting10A').value	= message.data[172] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting10A').value	= message.data[172] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting11A').value	= message.data[173] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting11A').value	= message.data[173] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting12A').value	= message.data[174] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting12A').value	= message.data[174] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting13A').value	= message.data[175] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting13A').value	= message.data[175] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting14A').value	= message.data[176] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting14A').value	= message.data[176] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting15A').value	= message.data[177] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting15A').value	= message.data[177] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting16A').value	= message.data[178] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting16A').value	= message.data[178] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting1Bb').value 	= message.data[179] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting1Bb').value 	= message.data[179] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting2Bb').value 	= message.data[180] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting2Bb').value 	= message.data[180] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting3Bb').value 	= message.data[181] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting3Bb').value 	= message.data[181] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting4Bb').value 	= message.data[182] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting4Bb').value 	= message.data[182] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting5Bb').value 	= message.data[183] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting5Bb').value 	= message.data[183] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting6Bb').value 	= message.data[184] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting6Bb').value 	= message.data[184] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting7Bb').value 	= message.data[185] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting7Bb').value 	= message.data[185] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting8Bb').value 	= message.data[186] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting8Bb').value 	= message.data[186] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting9Bb').value 	= message.data[187] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting9Bb').value 	= message.data[187] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting10Bb').value	= message.data[188] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting10Bb').value	= message.data[188] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting11Bb').value	= message.data[189] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting11Bb').value	= message.data[189] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting12Bb').value	= message.data[190] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting12Bb').value	= message.data[190] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting13Bb').value	= message.data[191] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting13Bb').value	= message.data[191] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting14Bb').value	= message.data[192] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting14Bb').value	= message.data[192] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting15Bb').value	= message.data[193] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting15Bb').value	= message.data[193] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting16Bb').value	= message.data[194] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting16Bb').value	= message.data[194] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting1B').value 	= message.data[195] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting1B').value 	= message.data[195] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting2B').value 	= message.data[196] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting2B').value 	= message.data[196] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting3B').value 	= message.data[197] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting3B').value 	= message.data[197] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting4B').value 	= message.data[198] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting4B').value 	= message.data[198] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting5B').value 	= message.data[199] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting5B').value 	= message.data[199] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting6B').value 	= message.data[200] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting6B').value 	= message.data[200] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting7B').value 	= message.data[201] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting7B').value 	= message.data[201] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting8B').value 	= message.data[202] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting8B').value 	= message.data[202] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting9B').value 	= message.data[203] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting9B').value 	= message.data[203] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting10B').value	= message.data[204] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting10B').value	= message.data[204] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting11B').value	= message.data[205] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting11B').value	= message.data[205] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting12B').value	= message.data[206] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting12B').value	= message.data[206] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting13B').value	= message.data[207] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting13B').value	= message.data[207] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting14B').value	= message.data[208] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting14B').value	= message.data[208] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting15B').value	= message.data[209] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting15B').value	= message.data[209] -24;
		document.getElementById('Fx2AutoRiffUserPhraseSetting16B').value	= message.data[210] -24;    document.getElementById('fx2AutoRiffUserPhraseSetting16B').value	= message.data[210] -24;
	}
	
	// Fx2 Sound Hold
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x09,0x1c])) {
		document.getElementById('Fx2SoundHoldHold').value 	 		= message.data[11];		document.getElementById('Fx2SoundHoldHold').value 	 		= message.data[11];
		document.getElementById('Fx2SoundHoldRiseTime').value 	 	= message.data[12];     document.getElementById('Fx2SoundHoldRiseTime').value 	 	= message.data[12];
		document.getElementById('Fx2SoundHoldEffectLev').value 	 	= message.data[13];     document.getElementById('Fx2SoundHoldEffectLev').value 	 	= message.data[13];
	}
	
	// Fx1 Ac.Processor
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x09,0x29])) {
		document.getElementById('Fx2AcProcessorType').value   	= message.data[11];
		document.getElementById('Fx2AcProcessorBass').value 	= message.data[12]; 	document.getElementById('fx2AcProcessorBass').value 	= message.data[12];
		document.getElementById('Fx2AcProcessorMiddle').value 	= message.data[13]; 	document.getElementById('fx2AcProcessorMiddle').value 	= message.data[13];
		document.getElementById('Fx2AcProcessorMiddleF').value 	= message.data[14]; 	document.getElementById('fx2AcProcessorMiddleF').value 	= message.data[14];
		document.getElementById('Fx2AcProcessorTreble').value 	= message.data[15]; 	document.getElementById('fx2AcProcessorTreble').value 	= message.data[15];
		document.getElementById('Fx2AcProcessorPresence').value = message.data[16]; 	document.getElementById('fx2AcProcessorPresence').value = message.data[16];
		document.getElementById('Fx2AcProcessorLevel').value 	= message.data[17]; 	document.getElementById('fx2AcProcessorLevel').value 	= message.data[17];
	}
	
	// Fx2 Feedbacker
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x40])) {
		document.getElementById('Fx2FeedbackerMode').value 		= message.data[11];		document.getElementById('fx2FeedbackerMode').value 		= message.data[11];
		document.getElementById('Fx2FeedbackerRiseTime').value 	= message.data[12];     document.getElementById('fx2FeedbackerRiseTime').value 	= message.data[12];
		document.getElementById('Fx2FeedbackerRiseTUp').value 	= message.data[13];     document.getElementById('fx2FeedbackerRiseTUp').value 	= message.data[13];
		document.getElementById('Fx2FeedbackerFBLevel').value 	= message.data[14];     document.getElementById('fx2FeedbackerFBLevel').value 	= message.data[14];
		document.getElementById('Fx2FeedbackerFBLvUp').value 	= message.data[15];     document.getElementById('fx2FeedbackerFBLvUp').value 	= message.data[15];
		document.getElementById('Fx2FeedbackerVibRate').value 	= message.data[16];     document.getElementById('fx2FeedbackerVibRate').value 	= message.data[16];		SetValueRangeNumberSelect(document.getElementById('fx2FeedbackerVibRate'),100,'bpm2');
		document.getElementById('Fx2FeedbackerDepth').value 	= message.data[17];     document.getElementById('fx2FeedbackerDepth').value 	= message.data[17];
	}
	
	// Fx2 Anti Feedback
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x47])) {
		document.getElementById('Fx2AntiFeedbackFreq1').value 	= message.data[11];		document.getElementById('fx2AntiFeedbackFreq1').value 	= message.data[11];
		document.getElementById('Fx2AntiFeedbackDepth1').value 	= message.data[12];     document.getElementById('fx2AntiFeedbackDepth1').value 	= message.data[12];
		document.getElementById('Fx2AntiFeedbackFreq2').value 	= message.data[13];     document.getElementById('fx2AntiFeedbackFreq2').value 	= message.data[13];
		document.getElementById('Fx2AntiFeedbackDepth2').value 	= message.data[14];     document.getElementById('fx2AntiFeedbackDepth2').value 	= message.data[14];
		document.getElementById('Fx2AntiFeedbackFreq3').value 	= message.data[15];     document.getElementById('fx2AntiFeedbackFreq3').value 	= message.data[15];
		document.getElementById('Fx2AntiFeedbackDepth3').value 	= message.data[16];     document.getElementById('fx2AntiFeedbackDepth3').value 	= message.data[16];
	}
	
	// Fx2 Phaser
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x1e])) {
		document.getElementById('Fx2PhaserType').value      = message.data[11];
		document.getElementById('Fx2PhaserRate').value      = message.data[12]; 	document.getElementById('fx2PhaserRate').value      = message.data[12]; 	SetValueRangeNumberSelect(document.getElementById('fx2PhaserRate'),100,'bpm2');
		document.getElementById('Fx2PhaserDepth').value     = message.data[13]; 	document.getElementById('fx2PhaserDepth').value     = message.data[13]; 
		document.getElementById('Fx2PhaserManual').value    = message.data[14]; 	document.getElementById('fx2PhaserManual').value    = message.data[14]; 
		document.getElementById('Fx2PhaserResonance').value = message.data[15]; 	document.getElementById('fx2PhaserResonance').value = message.data[15]; 
		document.getElementById('Fx2PhaserStepRate').value  = message.data[16]; 	document.getElementById('fx2PhaserStepRate').value  = message.data[16]; 	SetValueRangeNumberSelect(document.getElementById('fx2PhaserStepRate'),100,'bpm2');
		document.getElementById('Fx2PhaserEffectLev').value = message.data[17]; 	document.getElementById('fx2PhaserEffectLev').value = message.data[17]; 
		document.getElementById('Fx2PhaserDirectLev').value = message.data[18]; 	document.getElementById('fx2PhaserDirectLev').value = message.data[18]; 
	}
	
	// Fx2 Flanger
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x26])) {
		document.getElementById('Fx2FlangerRate').value      	= message.data[11]; 	document.getElementById('fx2FlangerRate').value      	= message.data[11]; 	SetValueRangeNumberSelect(document.getElementById('fx2FlangerRate'),100,'bpm2');
		document.getElementById('Fx2FlangerDepth').value     	= message.data[12]; 	document.getElementById('fx2FlangerDepth').value     	= message.data[12]; 
		document.getElementById('Fx2FlangerManual').value     	= message.data[13]; 	document.getElementById('fx2FlangerManual').value     	= message.data[13]; 
		document.getElementById('Fx2FlangerResonance').value    = message.data[14]; 	document.getElementById('fx2FlangerResonance').value    = message.data[14]; 
		document.getElementById('Fx2FlangerSeparation').value   = message.data[15]; 	document.getElementById('fx2FlangerSeparation').value   = message.data[15]; 
		document.getElementById('Fx2FlangerLowCut').value     	= message.data[16]; 	document.getElementById('fx2FlangerLowCut').value     	= message.data[16]; 
		document.getElementById('Fx2FlangerEffectLev').value    = message.data[17]; 	document.getElementById('fx2FlangerEffectLev').value    = message.data[17]; 
		document.getElementById('Fx2FlangerDirectLev').value    = message.data[18]; 	document.getElementById('fx2FlangerDirectLev').value    = message.data[18]; 
	}
	
	// Fx2 Tremolo
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x1b])) {
		document.getElementById('Fx2TremoloWaveShape').value = message.data[11];    	document.getElementById('fx2TremoloWaveShape').value = message.data[11];
		document.getElementById('Fx2TremoloRate').value 	 = message.data[12];    	document.getElementById('fx2TremoloRate').value 	 = message.data[12];	SetValueRangeNumberSelect(document.getElementById('fx2TremoloRate'),100,'bpm2');
		document.getElementById('Fx2TremoloDepth').value 	 = message.data[13];    	document.getElementById('fx2TremoloDepth').value 	 = message.data[13];
	}
	
	// Fx2 Rotary
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x07,0x18])) {
		document.getElementById('Fx2RotarySpeedSel').value 	 = message.data[11];	 document.getElementById('fx2RotarySpeedSel').value 	= message.data[11];
		document.getElementById('Fx2RotaryRateSlow').value 	 = message.data[12];     document.getElementById('fx2RotaryRateSlow').value 	= message.data[12];		SetValueRangeNumberSelect(document.getElementById('fx2RotaryRateSlow'),100,'bpm2');
		document.getElementById('Fx2RotaryRateFast').value 	 = message.data[13];     document.getElementById('fx2RotaryRateFast').value 	= message.data[13];		SetValueRangeNumberSelect(document.getElementById('fx2RotaryRateFast'),100,'bpm2');
		document.getElementById('Fx2RotaryRiseTime').value 	 = message.data[14];     document.getElementById('fx2RotaryRiseTime').value 	= message.data[14];
		document.getElementById('Fx2RotaryFallTime').value 	 = message.data[15];     document.getElementById('fx2RotaryFallTime').value 	= message.data[15];
		document.getElementById('Fx2RotaryDepth').value 	 = message.data[16];     document.getElementById('fx2RotaryDepth').value 	 	= message.data[16];
	}
	
	// Fx2 Uni-V
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x37])) {
		document.getElementById('Fx2UniVRate').value 	= message.data[11];		document.getElementById('fx2UniVRate').value 	= message.data[11];		SetValueRangeNumberSelect(document.getElementById('fx2UniVRate'),100,'bpm2');
		document.getElementById('Fx2UniVDepth').value 	= message.data[12];     document.getElementById('fx2UniVDepth').value 	= message.data[12];
		document.getElementById('Fx2UniVLevel').value 	= message.data[13];     document.getElementById('fx2UniVLevel').value 	= message.data[13];
	}
	
	// Fx2 Pan
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x2e])) {
		document.getElementById('Fx2PanType').value 		= message.data[11];			document.getElementById('fx2PanType').value 		= message.data[11];
		document.getElementById('Fx2PanPosition').value 	= message.data[12]-32;      document.getElementById('fx2PanPosition').value 	= message.data[12]-32;
		document.getElementById('Fx2PanWaveShape').value 	= message.data[13];         document.getElementById('fx2PanWaveShape').value 	= message.data[13];
		document.getElementById('Fx2PanRate').value 		= message.data[14];         document.getElementById('fx2PanRate').value 		= message.data[14];		SetValueRangeNumberSelect(document.getElementById('fx2PanRate'),100,'bpm2');
		document.getElementById('Fx2PanDepth').value 		= message.data[15];         document.getElementById('fx2PanDepth').value 		= message.data[15];
	}
	
	// Fx2 Slicer
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x55])) {
		document.getElementById('Fx2SlicerPattern').value 	= message.data[11];		document.getElementById('fx2SlicerPattern').value 	= message.data[11];
		document.getElementById('Fx2SlicerRate').value 		= message.data[12];     document.getElementById('fx2SlicerRate').value 		= message.data[12];		SetValueRangeNumberSelect(document.getElementById('fx2SlicerRate'),100,'bpm2');
		document.getElementById('Fx2SlicerTrigSens').value 	= message.data[13];     document.getElementById('fx2SlicerTrigSens').value 	= message.data[13];
	}
	
	// Fx2 Vibrato
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x33])) {
		document.getElementById('Fx2VibratoRate').value 	= message.data[11];		document.getElementById('fx2VibratoRate').value 	= message.data[11];		SetValueRangeNumberSelect(document.getElementById('fx2VibratoRate'),100,'bpm2');
		document.getElementById('Fx2VibratoDepth').value 	= message.data[12];     document.getElementById('fx2VibratoDepth').value 	= message.data[12];
		document.getElementById('Fx2VibratoTrigger').value 	= message.data[13];     document.getElementById('fx2VibratoTrigger').value 	= message.data[13];
		document.getElementById('Fx2VibratoRiseTime').value = message.data[14];     document.getElementById('fx2VibratoRiseTime').value = message.data[14];
	}
	
	// Fx2 Ring Mod
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x3a])) {
		document.getElementById('Fx2RingModMode').value 		= message.data[11];		document.getElementById('fx2RingModMode').value 		= message.data[11];
		document.getElementById('Fx2RingModFrequency').value 	= message.data[12];     document.getElementById('fx2RingModFrequency').value 	= message.data[12];
		document.getElementById('Fx2RingModDirectLev').value 	= message.data[13];     document.getElementById('fx2RingModDirectLev').value 	= message.data[13];
		document.getElementById('Fx2RingModEffectLev').value 	= message.data[14];     document.getElementById('fx2RingModEffectLev').value 	= message.data[14];
	}
	
	// Fx2 Humanizer
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x4d])) {
		document.getElementById('Fx2HumanizerMode').value 	= message.data[11];		document.getElementById('fx2HumanizerMode').value 	= message.data[11];
		document.getElementById('Fx2HumanizerVowel1').value = message.data[12];     document.getElementById('fx2HumanizerVowel1').value = message.data[12];
		document.getElementById('Fx2HumanizerVowel2').value = message.data[13];     document.getElementById('fx2HumanizerVowel2').value = message.data[13];
		document.getElementById('Fx2HumanizerSens').value 	= message.data[14];     document.getElementById('fx2HumanizerSens').value 	= message.data[14];
		document.getElementById('Fx2HumanizerRate').value 	= message.data[15];     document.getElementById('fx2HumanizerRate').value 	= message.data[15];		SetValueRangeNumberSelect(document.getElementById('fx2HumanizerRate'),100,'bpm2');
		document.getElementById('Fx2HumanizerDepth').value 	= message.data[16];     document.getElementById('fx2HumanizerDepth').value 	= message.data[16];
	}

	// Fx2 2x2 Chorus
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x07,0x1e])) {
		document.getElementById('Fx22x2ChorusXoverF').value 	 = message.data[11];	document.getElementById('fx22x2ChorusXoverF').value 	 = message.data[11];
		document.getElementById('Fx22x2ChorusLoRate').value 	 = message.data[12];    document.getElementById('fx22x2ChorusLoRate').value 	 = message.data[12];	SetValueRangeNumberSelect(document.getElementById('fx22x2ChorusLoRate'),100,'bpm2');
		document.getElementById('Fx22x2ChorusLoDepth').value 	 = message.data[13];    document.getElementById('fx22x2ChorusLoDepth').value 	 = message.data[13];
		document.getElementById('Fx22x2ChorusLoPreDly').value 	 = message.data[14];    document.getElementById('fx22x2ChorusLoPreDly').value 	 = message.data[14];
		document.getElementById('Fx22x2ChorusLoLevel').value 	 = message.data[15];    document.getElementById('fx22x2ChorusLoLevel').value 	 = message.data[15];
		document.getElementById('Fx22x2ChorusHiRate').value 	 = message.data[16];    document.getElementById('fx22x2ChorusHiRate').value 	 = message.data[16];	SetValueRangeNumberSelect(document.getElementById('fx22x2ChorusHiRate'),100,'bpm2');
		document.getElementById('Fx22x2ChorusHiDepth').value 	 = message.data[17];    document.getElementById('fx22x2ChorusHiDepth').value 	 = message.data[17];
		document.getElementById('Fx22x2ChorusHiPreDly').value 	 = message.data[18];    document.getElementById('fx22x2ChorusHiPreDly').value 	 = message.data[18];
		document.getElementById('Fx22x2ChorusHiLevel').value 	 = message.data[19];    document.getElementById('fx22x2ChorusHiLevel').value 	 = message.data[19];
	}
	
	// Fx2 SubDelay 
	// VERIFICAR O INTERVALO DOS BYTES DO PRIMEIRO PARÂMETRO <<<<<<<<<<<<<<<<<<<<<<<<<
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x07,0x27])) {
		document.getElementById('Fx2SubDelayDlyTime').value 	= message.data[11]*0x80+message.data[12];	document.getElementById('fx2SubDelayDlyTime').value 	= message.data[11]*0x80+message.data[12];	SetValueRangeNumberSelect(document.getElementById('fx2SubDelayDlyTime'),1000,'bpm');
		document.getElementById('Fx2SubDelayFeedback').value 	= message.data[13];                         document.getElementById('fx2SubDelayFeedback').value 	= message.data[13]; 
		document.getElementById('Fx2SubDelayHiCut').value 	 	= message.data[14];                         document.getElementById('fx2SubDelayHiCut').value 	 	= message.data[14];
		document.getElementById('Fx2SubDelayEffectLev').value 	= message.data[15];                         document.getElementById('fx2SubDelayEffectLev').value 	= message.data[15];
		document.getElementById('Fx2SubDelayDirectLev').value 	= message.data[16];                         document.getElementById('fx2SubDelayDirectLev').value 	= message.data[16];
	}
	
	
	
	// Delay
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0a,0x00])){
		document.getElementById('DelaySw').checked 	 	 = (message.data[11] == 1);
		document.getElementById('DelayType').value 	 	 = message.data[12]; 
		document.getElementById('DelayDlyTime').value 	 = message.data[13]*128 + message.data[14];    	document.getElementById('delayDlyTime').value 	 = message.data[13]*128 + message.data[14];		SetValueRangeNumberSelect(document.getElementById('delayDlyTime'),3400,'bpm');
		document.getElementById('DelayTapTime').value 	 = message.data[15];    						document.getElementById('delayTapTime').value 	 = message.data[15];
		document.getElementById('DelayFeedback').value 	 = message.data[16];    						document.getElementById('delayFeedback').value 	 = message.data[16];
		document.getElementById('DelayHighCut').value 	 = message.data[17];    						document.getElementById('delayHighCut').value 	 = message.data[17];
		document.getElementById('DelayD1Time').value 	 = message.data[18]*128 + message.data[19];    	document.getElementById('delayD1Time').value 	 = message.data[18]*128 + message.data[19];		SetValueRangeNumberSelect(document.getElementById('delayD1Time'),1700,'bpm');
		document.getElementById('DelayD1Fbk').value 	 = message.data[20];    						document.getElementById('delayD1Fbk').value 	 = message.data[20];
		document.getElementById('DelayD1HiCut').value 	 = message.data[21];    						document.getElementById('delayD1HiCut').value 	 = message.data[21];
		document.getElementById('DelayD1Level').value 	 = message.data[22];    						document.getElementById('delayD1Level').value 	 = message.data[22];
		document.getElementById('DelayD2Time').value 	 = message.data[23]*128 + message.data[24];    	document.getElementById('delayD2Time').value 	 = message.data[23]*128 + message.data[24];		SetValueRangeNumberSelect(document.getElementById('delayD2Time'),1700,'bpm');
		document.getElementById('DelayD2Fbk').value 	 = message.data[25];    						document.getElementById('delayD2Fbk').value 	 = message.data[25];
		document.getElementById('DelayD2HiCut').value 	 = message.data[26];    						document.getElementById('delayD2HiCut').value 	 = message.data[26];
		document.getElementById('DelayD2Level').value 	 = message.data[27];    						document.getElementById('delayD2Level').value 	 = message.data[27];
		document.getElementById('DelayWarpSw').value 	 = message.data[28];
		document.getElementById('DelayRiseTime').value 	 = message.data[29];    						document.getElementById('delayRiseTime').value 	 = message.data[29];
		document.getElementById('DelayFBDepth').value 	 = message.data[30];    						document.getElementById('delayFBDepth').value 	 = message.data[30];
		document.getElementById('DelayLevelDep').value 	 = message.data[31];    						document.getElementById('delayLevelDep').value 	 = message.data[31];
		document.getElementById('DelayModRate').value 	 = message.data[32];    						document.getElementById('delayModRate').value 	 = message.data[32];
		document.getElementById('DelayModDepth').value 	 = message.data[33];    						document.getElementById('delayModDepth').value 	 = message.data[33];
		document.getElementById('DelayEffectLev').value  = message.data[34];    						document.getElementById('delayEffectLev').value  = message.data[34];
		document.getElementById('DelayDirectLev').value  = message.data[35];    						document.getElementById('delayDirectLev').value  = message.data[35];
	}
	
	// Chorus
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0a,0x20])){
		document.getElementById('ChorusSw').checked  	 = (message.data[11] == 1);
		document.getElementById('ChorusMode').value 	 = message.data[12];
		document.getElementById('ChorusRate').value 	 = message.data[13];	document.getElementById('chorusRate').value 	 = message.data[13];	SetValueRangeNumberSelect(document.getElementById('chorusRate'),100,'bpm2');
		document.getElementById('ChorusDepth').value 	 = message.data[14];	document.getElementById('chorusDepth').value 	 = message.data[14];
		document.getElementById('ChorusPreDelay').value  = message.data[15]/2;	document.getElementById('chorusPreDelay').value  = message.data[15]/2;
		document.getElementById('ChorusLowCut').value 	 = message.data[16];	document.getElementById('chorusLowCut').value 	 = message.data[16];
		document.getElementById('ChorusHighCut').value 	 = message.data[17];	document.getElementById('chorusHighCut').value 	 = message.data[17];
		document.getElementById('ChorusEffectLev').value = message.data[18];	document.getElementById('chorusEffectLev').value = message.data[18];
	}
	
	// Reverb
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0a,0x30])){
		document.getElementById('ReverbSw').checked  	 = (message.data[11] == 1);
		document.getElementById('ReverbType').value 	 = message.data[12];
		document.getElementById('ReverbTime').value 	 = message.data[13]/10+0.1;						document.getElementById('reverbTime').value 	 = message.data[13]/10+0.1;
		document.getElementById('ReverbLowCut').value 	 = message.data[15];							document.getElementById('reverbLowCut').value 	 = message.data[15];
		document.getElementById('ReverbHighCut').value 	 = message.data[16];							document.getElementById('reverbHighCut').value 	 = message.data[16];
		document.getElementById('ReverbDensity').value 	 = message.data[17];							document.getElementById('reverbDensity').value 	 = message.data[17];
		document.getElementById('ReverbEffectLev').value = message.data[18];							document.getElementById('reverbEffectLev').value = message.data[18];
		document.getElementById('ReverbDirectLev').value = message.data[19];							document.getElementById('reverbDirectLev').value = message.data[19];
		document.getElementById('ReverbSprgSens').value  = message.data[20];							document.getElementById('reverbSprgSens').value  = message.data[20];
		document.getElementById('ReverbPreDelay').value  = message.data[21]*128 + message.data[22];		document.getElementById('reverbPreDelay').value  = message.data[21]*128 + message.data[22];
	}
	
	// Master
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0a,0x60])){
		document.getElementById("MasterPatchLevel").value 	= message.data[11]*2; 							document.getElementById("masterPatchLevel").value 	= message.data[11]*2;
		document.getElementById("MasterLow").value 	 		= message.data[12]-12; 							document.getElementById("masterLow").value 	 		= message.data[12]-12;
		document.getElementById("MasterMidG").value  		= message.data[13]-12; 							document.getElementById("masterMidG").value  		= message.data[13]-12;
		document.getElementById("MasterMidQ").value  		= message.data[14]; 							document.getElementById("masterMidQ").value  		= message.data[14];
		document.getElementById("MasterMidF").value  		= message.data[15]; 							document.getElementById("masterMidF").value  		= message.data[15];
		document.getElementById("MasterHigh").value  		= message.data[16]-12; 							document.getElementById("masterHigh").value  		= message.data[16]-12;
		document.getElementById("MasterBPM").value 	 		= message.data[17]*128 + message.data[18]; 		document.getElementById("masterBPM").value 	 		= message.data[17]*128 + message.data[18];
		document.getElementById("MasterKey").value 	 		= message.data[19]; 							document.getElementById("masterKey").value 	 		= message.data[19];
	}
	
	// Amp control
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0a,0x69])){
		document.getElementById("AmpControl").checked = (message.data[11] == 1);
	}
	
	// Noise Supressor
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0a,0x71])){
		document.getElementById('NoiseSupressor1Sw').checked 		= (message.data[11] == 1);
		document.getElementById('NoiseSupressor1Threshold').value 	= message.data[12];				document.getElementById('noiseSupressor1Threshold').value 	= message.data[12];
		document.getElementById('NoiseSupressor1Release').value 	= message.data[13];           	document.getElementById('noiseSupressor1Release').value 	= message.data[13];
		switch(message.data[14]) {
			case 0: document.getElementById('NoiseSupressor1DetectInput').click(); 		break;
			case 1: document.getElementById('NoiseSupressor1DetectNSInput').click(); 	break;
			case 2: document.getElementById('NoiseSupressor1DetectFVOut').click(); 		break;
		}
		document.getElementById('NoiseSupressor2Sw').checked 		= (message.data[15] == 1);
		document.getElementById('NoiseSupressor2Threshold').value 	= message.data[16];				document.getElementById('noiseSupressor2Threshold').value 	= message.data[16];
		document.getElementById('NoiseSupressor2Release').value 	= message.data[17];           	document.getElementById('noiseSupressor2Release').value 	= message.data[17];
		switch(message.data[18]) {
			case 0: document.getElementById('NoiseSupressor2DetectInput').click(); 		break;
			case 1: document.getElementById('NoiseSupressor2DetectNSInput').click(); 	break;
			case 2: document.getElementById('NoiseSupressor2DetectFVOut').click(); 		break;
		}
	}
	
	// Send/Return
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0a,0x79])){
		document.getElementById('SendReturnSw').checked = (message.data[11] == 1);
		switch(message.data[12]) {
			case 0: document.getElementById('SendReturnModeNormal').click(); 	break;
			case 1: document.getElementById('SendReturnModeDirectMix').click(); break;
			case 2: document.getElementById('SendReturnModeBranchOut').click(); break;
		}
		document.getElementById('SendReturnSendLev').value   = message.data[13]*2;	document.getElementById('sendReturnSendLev').value   = message.data[13]*2;
		document.getElementById('SendReturnReturnLev').value = message.data[14]*2;	document.getElementById('sendReturnReturnLev').value = message.data[14]*2;
	}
	
	// FxChain
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0b,0x00])) {
		var effects = [];
		var container;
		var containerPre = document.getElementById('fxChainPre');
		var containerA   = document.getElementById('fxChainA');
		var containerB   = document.getElementById('fxChainB');
		var containerPos = document.getElementById('fxChainPos');
		var fx, ps;
		
		for (var i=0; i<16; i++)										// Backups dos elementos dos container
			effects.push(document.getElementById('p'+i));

		// Esvazia containers
		while (containerPre.children.length > 1)	containerPre.children[0].remove();
		while (containerA.children.length > 1)		containerA.children[0].remove();
		while (containerB.children.length > 1)		containerB.children[0].remove();
		while (containerPos.children.length > 1)	containerPos.children[0].remove();

		container = containerPre;
		ps        = container.children[0];
		for (var i=0, j=0; i<18; i++) {
			if (message.data[11+i] == 0x10) {
				container = containerA;
				ps        = container.children[0];
				continue;
			}
			else if (message.data[11+i] == 0x11) {
				container = containerPos;
				ps        = container.children[0];
				j         = 0;
				continue;
			}
			else if (message.data[11+i] >= 0x40 && j == 0) {
				container = containerB;
				ps        = container.children[0];
				j         = 0x40;
			}
			fx = message.data[11+i]-j;
			container.insertBefore(effects[fx], ps);
		}

		if (MidiOutput) {
			MidiInput.onmidimessage = GetParameterValue2;
			
			message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11, 0x60,0x00,0x00,0x40, 0x00,0x00,0x00,0x01];	message.push(CheckSum(message));  message.push(0xf7);	MidiOutput.send(message); 	// comp
			message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11, 0x60,0x00,0x00,0x70, 0x00,0x00,0x00,0x01];	message.push(CheckSum(message));  message.push(0xf7);	MidiOutput.send(message); 	// odds
			message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11, 0x60,0x00,0x01,0x00, 0x00,0x00,0x00,0x01];	message.push(CheckSum(message));  message.push(0xf7);	MidiOutput.send(message); 	// preamp
			message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11, 0x60,0x00,0x01,0x70, 0x00,0x00,0x00,0x01];	message.push(CheckSum(message));  message.push(0xf7);	MidiOutput.send(message); 	// eq
			message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11, 0x60,0x00,0x02,0x00, 0x00,0x00,0x00,0x01];	message.push(CheckSum(message));  message.push(0xf7);	MidiOutput.send(message); 	// fx1
			message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11, 0x60,0x00,0x06,0x00, 0x00,0x00,0x00,0x01];	message.push(CheckSum(message));  message.push(0xf7);	MidiOutput.send(message); 	// fx2
			message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11, 0x60,0x00,0x0a,0x00, 0x00,0x00,0x00,0x01];	message.push(CheckSum(message));  message.push(0xf7);	MidiOutput.send(message); 	// delay
			message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11, 0x60,0x00,0x0a,0x20, 0x00,0x00,0x00,0x01];	message.push(CheckSum(message));  message.push(0xf7);	MidiOutput.send(message); 	// chorus
			message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11, 0x60,0x00,0x0a,0x30, 0x00,0x00,0x00,0x01];	message.push(CheckSum(message));  message.push(0xf7);	MidiOutput.send(message); 	// reverb
			message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11, 0x60,0x00,0x0a,0x40, 0x00,0x00,0x00,0x01];	message.push(CheckSum(message));  message.push(0xf7);	MidiOutput.send(message); 	// pedal
			message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11, 0x60,0x00,0x0a,0x71, 0x00,0x00,0x00,0x01];	message.push(CheckSum(message));  message.push(0xf7);	MidiOutput.send(message); 	// ns1
			message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11, 0x60,0x00,0x0a,0x75, 0x00,0x00,0x00,0x01];	message.push(CheckSum(message));  message.push(0xf7);	MidiOutput.send(message); 	// ns2
			message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11, 0x60,0x00,0x0a,0x79, 0x00,0x00,0x00,0x01];	message.push(CheckSum(message));  message.push(0xf7);	MidiOutput.send(message); 	// sr
		}
	}
	
	//MidiInput.onmidimessage = OnMidiMessageDefaultFunction;
}

// Processa resposta pela requisição de parâmetros do effect chain (estados de ligado/desligado de cada efeito). 
// Veja a função GetParameterValue().
function GetParameterValue2(message) {
	if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x00,0x40])) {				// comp
		if (message.data[11] == 0) 
			document.getElementById('p0').className  = 'fxChainOff'; 
		else 
			document.getElementById('p0').className  = 'fxChainOn'; 
	}
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x00,0x70])) {			// odds
		if (message.data[11] == 0) 
			document.getElementById('p1').className  = 'fxChainOff'; 
		else 
			document.getElementById('p1').className  = 'fxChainOn'; 
	}
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x01,0x00])) {			// preamp
		if (message.data[11] == 0) {
			document.getElementById('p2').className  = 'fxChainOff'; 
			document.getElementById('p3').className  = 'fxChainOff'; 
		}
		else {
			document.getElementById('p2').className  = 'fxChainOn'; 
			document.getElementById('p3').className  = 'fxChainOn'; 
		}
	}
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x01,0x70])) {			// eq
		if (message.data[11] == 0) 
			document.getElementById('p4').className  = 'fxChainOff'; 
		else 
			document.getElementById('p4').className  = 'fxChainOn'; 
	}
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x02,0x00])) {			// fx1
		if (message.data[11] == 0) 
			document.getElementById('p5').className  = 'fxChainOff'; 
		else 
			document.getElementById('p5').className  = 'fxChainOn'; 
	}
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x06,0x00])) {			// fx2
		if (message.data[11] == 0) 
			document.getElementById('p6').className  = 'fxChainOff'; 
		else 
			document.getElementById('p6').className  = 'fxChainOn'; 
	}
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0a,0x00])) {			// delay
		if (message.data[11] == 0) 
			document.getElementById('p7').className  = 'fxChainOff'; 
		else 
			document.getElementById('p7').className  = 'fxChainOn'; 
	}
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0a,0x20])) {			// chorus
		if (message.data[11] == 0) 
			document.getElementById('p8').className  = 'fxChainOff'; 
		else 
			document.getElementById('p8').className  = 'fxChainOn'; 
	}
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0a,0x30])) {			// rever
		if (message.data[11] == 0) 
			document.getElementById('p9').className  = 'fxChainOff'; 
		else 
			document.getElementById('p9').className  = 'fxChainOn'; 
	}
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0a,0x40])) {			// pedal
		if (message.data[11] == 0) {
			document.getElementById('p10').className = 'fxChainOff'; 
			document.getElementById('p11').className = 'fxChainOn'; 
		}
		else {
			document.getElementById('p10').className = 'fxChainOn'; 
			document.getElementById('p11').className = 'fxChainOff'; 
		}
	}
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0a,0x71])) {			// ns1
		if (message.data[11] == 0) 
			document.getElementById('p12').className = 'fxChainOff'; 
		else 
			document.getElementById('p12').className = 'fxChainOn'; 
	}
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0a,0x75])) {			// ns2
		if (message.data[11] == 0) 
			document.getElementById('p13').className = 'fxChainOff'; 
		else 
			document.getElementById('p13').className = 'fxChainOn'; 
	}
	else if (SubArrayCmp(message.data,7,4,[0x60,0x00,0x0a,0x79])) {			// send/return
		if (message.data[11] == 0) 
			document.getElementById('p14').className = 'fxChainOff'; 
		else 
			document.getElementById('p14').className = 'fxChainOn'; 
	}
}

//** Altera parametro na gt10
function SetParameter(parameter, value) {
	var message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x12];		// header midi message
	var value2;													// Para os casos onde valor é definido usando 2 bytes
	
	parameter = parameter.toLowerCase();
	value     = parseInt(value);
	
	switch(parameter) {
		//
		// Input/Output
		//
		case "inputoutputusbdgtoutlev":     message = message.concat([0x00,0x00,0x00,0x22, value]); break;
		case "inputoutputusbmixlev":        message = message.concat([0x00,0x00,0x00,0x23, value]); break;
		case "inputoutputinputlev1":        message = message.concat([0x00,0x00,0x00,0x40, value]); break;
		case "inputoutputinputpres1":       message = message.concat([0x00,0x00,0x00,0x41, value]); break;
		case "inputoutputinputlev2":		message = message.concat([0x00,0x00,0x00,0x42, value]); break;
		case "inputoutputinputpres2":		message = message.concat([0x00,0x00,0x00,0x43, value]); break;
		case "inputoutputinputlev3":		message = message.concat([0x00,0x00,0x00,0x44, value]); break;
		case "inputoutputinputpres3":		message = message.concat([0x00,0x00,0x00,0x45, value]); break;
		case "inputoutputusbinlev3":		message = message.concat([0x00,0x00,0x00,0x46, value]); break;
		case "inputoutputusbinpres3":		message = message.concat([0x00,0x00,0x00,0x47, value]); break;
		case "inputoutputglobaleqlowgain":	message = message.concat([0x00,0x00,0x00,0x48, value]); break;
		case "inputoutputglobaleqmidgain":	message = message.concat([0x00,0x00,0x00,0x49, value]); break;
		case "inputoutputglobaleqmidfreq":	message = message.concat([0x00,0x00,0x00,0x4a, value]); break;
		case "inputoutputglobaleqmidq":		message = message.concat([0x00,0x00,0x00,0x4b, value]); break;
		case "inputoutputglobaleqhighgain":	message = message.concat([0x00,0x00,0x00,0x4c, value]); break;
		case "inputoutputinputselect":		message = message.concat([0x00,0x00,0x00,0x4d, value]); break;
		case "outputselectmode":			message = message.concat([0x00,0x00,0x00,0x4e, value]); break;
		case "systemoutputselect":			message = message.concat([0x00,0x00,0x00,0x4f, value]); break;
		case "inputoutputnsthreshold":		message = message.concat([0x00,0x00,0x00,0x50, value]); break;
		case "inputoutputrevlevel":			message = message.concat([0x00,0x00,0x00,0x51, value]); break;
		case "inputoutputmainoutlev":		message = message.concat([0x00,0x00,0x00,0x52, value]); break;
		case "patchoutputselect":			message = message.concat([0x60,0x00,0x00,0x11, value]); break;
		
		//
		// Compressor
		//
		case "compressorsw": 			message = message.concat([0x60,0x00,0x00,0x40, value]); break;
		case "compressortype": 			message = message.concat([0x60,0x00,0x00,0x41, value]); break;
		case "compressorsustain": 		message = message.concat([0x60,0x00,0x00,0x42, value]); break;
		case "compressorattack": 		message = message.concat([0x60,0x00,0x00,0x43, value]); break;
		case "compressorthreshold": 	message = message.concat([0x60,0x00,0x00,0x44, value]); break;
		case "compressorrelease": 		message = message.concat([0x60,0x00,0x00,0x45, value]); break;
		case "compressortone": 			message = message.concat([0x60,0x00,0x00,0x46, value]); break;
		case "compressorlevel": 		message = message.concat([0x60,0x00,0x00,0x47, value]); break;
		//
		// OD/DS
		//
		case "oddssw": 					message = message.concat([0x60,0x00,0x00,0x70, value]); break;
		case "oddstype": 				message = message.concat([0x60,0x00,0x00,0x71, value]); break;
		case "oddsdrive": 				message = message.concat([0x60,0x00,0x00,0x72, value]); break;
		case "oddsbottom": 				message = message.concat([0x60,0x00,0x00,0x73, value]); break;
		case "oddstone": 				message = message.concat([0x60,0x00,0x00,0x74, value]); break;
		case "oddseffectlev": 			message = message.concat([0x60,0x00,0x00,0x75, value]); break;
		case "oddsdirectlev": 			message = message.concat([0x60,0x00,0x00,0x76, value]); break;
		case "oddssolosw": 				message = message.concat([0x60,0x00,0x00,0x77, value]); break;
		case "oddssololevel": 			message = message.concat([0x60,0x00,0x00,0x78, value]); break;
		case "oddscustomtype": 			message = message.concat([0x60,0x00,0x00,0x79, value]); break;
		case "oddscustombottom": 		message = message.concat([0x60,0x00,0x00,0x7a, value]); break;
		case "oddscustomtop": 			message = message.concat([0x60,0x00,0x00,0x7b, value]); break;
		case "oddscustomlow": 			message = message.concat([0x60,0x00,0x00,0x7c, value]); break;
		case "oddscustomhigh": 			message = message.concat([0x60,0x00,0x00,0x7d, value]); break;
		//
		// Preamp Common
		//
		case "preampsw": 				message = message.concat([0x60,0x00,0x01,0x00, value]); break;
		case "preampchmode":			message = message.concat([0x60,0x00,0x01,0x01, value]); break;
		case "preampchselect":			message = message.concat([0x60,0x00,0x01,0x02, value]); break;
		case "preampchdlytim":			message = message.concat([0x60,0x00,0x01,0x03, value]); break;
		case "preampdynasens":			message = message.concat([0x60,0x00,0x01,0x04, value]); break;
		//
		// PREAMP A
		//
		case "preampatype":				message = message.concat([0x60,0x00,0x01,0x10, value]); break;
		case "preampagain":				message = message.concat([0x60,0x00,0x01,0x11, value]); break;
		case "preampabass":				message = message.concat([0x60,0x00,0x01,0x12, value]); break;
		case "preampamiddle":			message = message.concat([0x60,0x00,0x01,0x13, value]); break; 
		case "preampatreble":			message = message.concat([0x60,0x00,0x01,0x14, value]); break; 
		case "preampapresence":			message = message.concat([0x60,0x00,0x01,0x15, value]); break; 
		case "preampalevel":			message = message.concat([0x60,0x00,0x01,0x16, value]); break;
		case "preampabright":			message = message.concat([0x60,0x00,0x01,0x17, value]); break;
		case "preampagainsw":			message = message.concat([0x60,0x00,0x01,0x18, value]); break;
		case "preampasolosw":			message = message.concat([0x60,0x00,0x01,0x19, value]); break; 
		case "preampasololevel":		message = message.concat([0x60,0x00,0x01,0x1a, value]); break;
		case "speakerasptype":			message = message.concat([0x60,0x00,0x01,0x1b, value]); break;
		case "speakeramictype":			message = message.concat([0x60,0x00,0x01,0x1c, value]); break;
		case "speakeramicdis":			message = message.concat([0x60,0x00,0x01,0x1d, value]); break;
		case "speakeramicpos":			message = message.concat([0x60,0x00,0x01,0x1e, value]); break;
		case "speakeramiclevel":		message = message.concat([0x60,0x00,0x01,0x1f, value]); break;
		case "speakeradirectlev":		message = message.concat([0x60,0x00,0x01,0x20, value]); break; 
		case "preampcustomatype":		message = message.concat([0x60,0x00,0x01,0x21, value]); break;
		case "preampcustomabottom":		message = message.concat([0x60,0x00,0x01,0x22, value]); break;
		case "preampcustomaedge":		message = message.concat([0x60,0x00,0x01,0x23, value]); break;
		case "preampcustomabassfreq":	message = message.concat([0x60,0x00,0x01,0x24, value]); break;
		case "preampcustomatrefreq":	message = message.concat([0x60,0x00,0x01,0x25, value]); break;
		case "preampcustomapreamplow":	message = message.concat([0x60,0x00,0x01,0x26, value]); break;
		case "preampcustomapreamphi":	message = message.concat([0x60,0x00,0x01,0x27, value]); break;
		case "speakercustomaspsize":	message = message.concat([0x60,0x00,0x01,0x28, value]); break;
		case "speakercustomacolorlow":	message = message.concat([0x60,0x00,0x01,0x29, value]); break;
		case "speakercustomacolorhigh":	message = message.concat([0x60,0x00,0x01,0x2a, value]); break;
		case "speakercustomaspnumber":	message = message.concat([0x60,0x00,0x01,0x2b, value]); break;
		case "speakercustomacabinet":	message = message.concat([0x60,0x00,0x01,0x2c, value]); break;
		//
		// PREAMP B
		//
		case "preampbtype":				message = message.concat([0x60,0x00,0x01,0x30, value]); break;
		case "preampbgain":				message = message.concat([0x60,0x00,0x01,0x31, value]); break;
		case "preampbbass":				message = message.concat([0x60,0x00,0x01,0x32, value]); break;
		case "preampbmiddle":			message = message.concat([0x60,0x00,0x01,0x33, value]); break;
		case "preampbtreble":			message = message.concat([0x60,0x00,0x01,0x34, value]); break;
		case "preampbpresence":			message = message.concat([0x60,0x00,0x01,0x35, value]); break;
		case "preampblevel":			message = message.concat([0x60,0x00,0x01,0x36, value]); break;
		case "preampbbright":			message = message.concat([0x60,0x00,0x01,0x37, value]); break;
		case "preampbgainsw":			message = message.concat([0x60,0x00,0x01,0x38, value]); break;
		case "preampbsolosw":			message = message.concat([0x60,0x00,0x01,0x39, value]); break;
		case "preampbsololevel":		message = message.concat([0x60,0x00,0x01,0x3a, value]); break;
		case "speakerbsptype":			message = message.concat([0x60,0x00,0x01,0x3b, value]); break;
		case "speakerbmictype":			message = message.concat([0x60,0x00,0x01,0x3c, value]); break;
		case "speakerbmicdis":			message = message.concat([0x60,0x00,0x01,0x3d, value]); break;
		case "speakerbmicpos":			message = message.concat([0x60,0x00,0x01,0x3e, value]); break;
		case "speakerbmiclevel":		message = message.concat([0x60,0x00,0x01,0x3f, value]); break;
		case "speakerbdirectlev":		message = message.concat([0x60,0x00,0x01,0x40, value]); break;
		case "preampcustombtype":		message = message.concat([0x60,0x00,0x01,0x41, value]); break;
		case "preampcustombbottom":		message = message.concat([0x60,0x00,0x01,0x42, value]); break;
		case "preampcustombedge":		message = message.concat([0x60,0x00,0x01,0x43, value]); break;
		case "preampcustombbassfreq":	message = message.concat([0x60,0x00,0x01,0x44, value]); break;
		case "preampcustombtrefreq":	message = message.concat([0x60,0x00,0x01,0x45, value]); break;
		case "preampcustombpreamplow":	message = message.concat([0x60,0x00,0x01,0x46, value]); break;
		case "preampcustombpreamphi":	message = message.concat([0x60,0x00,0x01,0x47, value]); break;
		case "speakercustombspsize":	message = message.concat([0x60,0x00,0x01,0x48, value]); break;
		case "speakercustombcolorlow":	message = message.concat([0x60,0x00,0x01,0x49, value]); break;
		case "speakercustombcolorhigh":	message = message.concat([0x60,0x00,0x01,0x4a, value]); break;
		case "speakercustombspnumber":	message = message.concat([0x60,0x00,0x01,0x4b, value]); break;
		case "speakercustombcabinet":	message = message.concat([0x60,0x00,0x01,0x4c, value]); break;
		
		//
		// Equalizer
		//
		case "equalizersw":				message = message.concat([0x60,0x00,0x01,0x70, value]); break;
		case "equalizerlowcut":			message = message.concat([0x60,0x00,0x01,0x71, value]); break;
		case "equalizerlowgain":		message = message.concat([0x60,0x00,0x01,0x72, value]); break;
		case "equalizerlomidf":			message = message.concat([0x60,0x00,0x01,0x73, value]); break;
		case "equalizerlomidq":			message = message.concat([0x60,0x00,0x01,0x74, value]); break;
		case "equalizerlomidg":			message = message.concat([0x60,0x00,0x01,0x75, value]); break;
		case "equalizerhimidf":			message = message.concat([0x60,0x00,0x01,0x76, value]); break;
		case "equalizerhimidq":			message = message.concat([0x60,0x00,0x01,0x77, value]); break;
		case "equalizerhimidg":			message = message.concat([0x60,0x00,0x01,0x78, value]); break;
		case "equalizerhighgain":		message = message.concat([0x60,0x00,0x01,0x79, value]); break;
		case "equalizerhighcut":		message = message.concat([0x60,0x00,0x01,0x7a, value]); break;
		case "equalizerlevel":			message = message.concat([0x60,0x00,0x01,0x7b, value]); break;

		
		//
		// FX-1
		//
		case "fx1sw":					message = message.concat([0x60,0x00,0x02,0x00, value]); break;
		case "fx1select":				message = message.concat([0x60,0x00,0x02,0x01, value]); break;
		
		case "fx1advcomptype": 			message = message.concat([0x60,0x00,0x02,0x02, value]); break;
		case "fx1advcompsustain": 		message = message.concat([0x60,0x00,0x02,0x03, value]); break;
		case "fx1advcompattack": 		message = message.concat([0x60,0x00,0x02,0x04, value]); break;
		case "fx1advcomptone": 			message = message.concat([0x60,0x00,0x02,0x05, value]); break;
		case "fx1advcomplevel": 		message = message.concat([0x60,0x00,0x02,0x06, value]); break;
		
		case "fx1limitertype": 			message = message.concat([0x60,0x00,0x02,0x07, value]); break;
		case "fx1limiterattack": 		message = message.concat([0x60,0x00,0x02,0x08, value]); break;
		case "fx1limiterthreshold": 	message = message.concat([0x60,0x00,0x02,0x09, value]); break;
		case "fx1limiterratio": 		message = message.concat([0x60,0x00,0x02,0x0a, value]); break;
		case "fx1limiterrelease": 		message = message.concat([0x60,0x00,0x02,0x0b, value]); break;
		case "fx1limiterlevel": 		message = message.concat([0x60,0x00,0x02,0x0c, value]); break;
		
		case "fx1twahmode": 			message = message.concat([0x60,0x00,0x02,0x0d, value]); break;
		case "fx1twahpolarity": 		message = message.concat([0x60,0x00,0x02,0x0e, value]); break;
		case "fx1twahsens": 			message = message.concat([0x60,0x00,0x02,0x11, value]); break;
		case "fx1twahfrequency": 		message = message.concat([0x60,0x00,0x02,0x10, value]); break;
		case "fx1twahpeak": 			message = message.concat([0x60,0x00,0x02,0x0f, value]); break;
		case "fx1twahdirectlev": 		message = message.concat([0x60,0x00,0x02,0x12, value]); break;
		case "fx1twaheffectlev": 		message = message.concat([0x60,0x00,0x02,0x13, value]); break;
		
		case "fx1autowahmode": 			message = message.concat([0x60,0x00,0x02,0x14, value]); break;
		case "fx1autowahfrequency": 	message = message.concat([0x60,0x00,0x02,0x15, value]); break;
		case "fx1autowahpeak": 			message = message.concat([0x60,0x00,0x02,0x16, value]); break;
		case "fx1autowahrate": 			message = message.concat([0x60,0x00,0x02,0x17, value]); break;
		case "fx1autowahdepth": 		message = message.concat([0x60,0x00,0x02,0x18, value]); break;
		case "fx1autowahdirectlev": 	message = message.concat([0x60,0x00,0x02,0x19, value]); break;
		case "fx1autowaheffectlev": 	message = message.concat([0x60,0x00,0x02,0x1a, value]); break;
		
		case "fx1tremolowaveshape":		message = message.concat([0x60,0x00,0x02,0x1b, value]); break;
		case "fx1tremolorate":			message = message.concat([0x60,0x00,0x02,0x1c, value]); break;
		case "fx1tremolodepth":			message = message.concat([0x60,0x00,0x02,0x1d, value]); break;
		
		case "fx1phasertype":			message = message.concat([0x60,0x00,0x02,0x1e, value]); break;
		case "fx1phaserrate":			message = message.concat([0x60,0x00,0x02,0x1f, value]); break;
		case "fx1phaserdepth":			message = message.concat([0x60,0x00,0x02,0x20, value]); break;
		case "fx1phasermanual":			message = message.concat([0x60,0x00,0x02,0x21, value]); break;
		case "fx1phaserresonance":		message = message.concat([0x60,0x00,0x02,0x22, value]); break;
		case "fx1phasersteprate":		message = message.concat([0x60,0x00,0x02,0x23, value]); break;
		case "fx1phasereffectlev":		message = message.concat([0x60,0x00,0x02,0x24, value]); break;
		case "fx1phaserdirectlev":		message = message.concat([0x60,0x00,0x02,0x25, value]); break;
		
		case "fx1flangerrate":			message = message.concat([0x60,0x00,0x02,0x26, value]); break;
		case "fx1flangerdepth":			message = message.concat([0x60,0x00,0x02,0x27, value]); break;
		case "fx1flangermanual":		message = message.concat([0x60,0x00,0x02,0x28, value]); break;
		case "fx1flangerresonance":		message = message.concat([0x60,0x00,0x02,0x29, value]); break;
		case "fx1flangerseparation":	message = message.concat([0x60,0x00,0x02,0x2a, value]); break;
		case "fx1flangerlowcut":		message = message.concat([0x60,0x00,0x02,0x2b, value]); break;
		case "fx1flangereffectlev":		message = message.concat([0x60,0x00,0x02,0x2c, value]); break;
		case "fx1flangerdirectlev":		message = message.concat([0x60,0x00,0x02,0x2d, value]); break;
		
		case "fx1pantype": 				message = message.concat([0x60,0x00,0x02,0x2e, value]); break;
		case "fx1panposition": 			message = message.concat([0x60,0x00,0x02,0x2f, value]); break;
		case "fx1panwaveshape": 		message = message.concat([0x60,0x00,0x02,0x30, value]); break;
		case "fx1panrate": 				message = message.concat([0x60,0x00,0x02,0x31, value]); break;
		case "fx1pandepth": 			message = message.concat([0x60,0x00,0x02,0x32, value]); break;
		
		case "fx1vibratorate": 			message = message.concat([0x60,0x00,0x02,0x33, value]); break;
		case "fx1vibratodepth": 		message = message.concat([0x60,0x00,0x02,0x34, value]); break;
		case "fx1vibratotrigger": 		message = message.concat([0x60,0x00,0x02,0x35, value]); break;
		case "fx1vibratorisetime": 		message = message.concat([0x60,0x00,0x02,0x36, value]); break;
		
		case "fx1univrate": 			message = message.concat([0x60,0x00,0x02,0x37, value]); break;
		case "fx1univdepth": 			message = message.concat([0x60,0x00,0x02,0x38, value]); break;
		case "fx1univlevel": 			message = message.concat([0x60,0x00,0x02,0x39, value]); break;
		
		case "fx1ringmodmode": 			message = message.concat([0x60,0x00,0x02,0x3a, value]); break;
		case "fx1ringmodfrequency": 	message = message.concat([0x60,0x00,0x02,0x3b, value]); break;
		case "fx1ringmoddirectlev": 	message = message.concat([0x60,0x00,0x02,0x3c, value]); break;
		case "fx1ringmodeffectlev": 	message = message.concat([0x60,0x00,0x02,0x3d, value]); break;
		
		case "fx1slowgearsens": 		message = message.concat([0x60,0x00,0x02,0x3e, value]); break;
		case "fx1slowgearrisetime": 	message = message.concat([0x60,0x00,0x02,0x3f, value]); break;
		
		case "fx1feedbackermode": 		message = message.concat([0x60,0x00,0x02,0x40, value]); break;
		case "fx1feedbackerrisetime": 	message = message.concat([0x60,0x00,0x02,0x41, value]); break;
		case "fx1feedbackerrisetup": 	message = message.concat([0x60,0x00,0x02,0x42, value]); break;
		case "fx1feedbackerfblevel": 	message = message.concat([0x60,0x00,0x02,0x43, value]); break;
		case "fx1feedbackerfblvup": 	message = message.concat([0x60,0x00,0x02,0x44, value]); break;
		case "fx1feedbackervibrate": 	message = message.concat([0x60,0x00,0x02,0x45, value]); break;
		case "fx1feedbackerdepth": 		message = message.concat([0x60,0x00,0x02,0x46, value]); break;
		
		case "fx1antifeedbackfreq1": 	message = message.concat([0x60,0x00,0x02,0x47, value]); break;
		case "fx1antifeedbackdepth1": 	message = message.concat([0x60,0x00,0x02,0x48, value]); break;
		case "fx1antifeedbackfreq2": 	message = message.concat([0x60,0x00,0x02,0x49, value]); break;
		case "fx1antifeedbackdepth2": 	message = message.concat([0x60,0x00,0x02,0x4a, value]); break;
		case "fx1antifeedbackfreq3": 	message = message.concat([0x60,0x00,0x02,0x4b, value]); break;
		case "fx1antifeedbackdepth3": 	message = message.concat([0x60,0x00,0x02,0x4c, value]); break;
		
		case "fx1humanizermode": 		message = message.concat([0x60,0x00,0x02,0x4d, value]); break;
		case "fx1humanizervowel1": 		message = message.concat([0x60,0x00,0x02,0x4e, value]); break;
		case "fx1humanizervowel2": 		message = message.concat([0x60,0x00,0x02,0x4f, value]); break;
		case "fx1humanizersens": 		message = message.concat([0x60,0x00,0x02,0x50, value]); break;
		case "fx1humanizerrate": 		message = message.concat([0x60,0x00,0x02,0x51, value]); break;
		case "fx1humanizerdepth": 		message = message.concat([0x60,0x00,0x02,0x52, value]); break;
		case "fx1humanizermanual": 		message = message.concat([0x60,0x00,0x02,0x53, value]); break;
		case "fx1humanizerlevel": 		message = message.concat([0x60,0x00,0x02,0x54, value]); break;
		
		case "fx1slicerpattern": 		message = message.concat([0x60,0x00,0x02,0x55, value]); break;
		case "fx1slicerrate": 			message = message.concat([0x60,0x00,0x02,0x56, value]); break;
		case "fx1slicertrigsens": 		message = message.concat([0x60,0x00,0x02,0x57, value]); break;
		
		case "fx1paraeqlowcut":			message = message.concat([0x60,0x00,0x02,0x58, value]); break;
		case "fx1paraeqlowgain":		message = message.concat([0x60,0x00,0x02,0x59, value]); break;
		case "fx1paraeqlomidf":			message = message.concat([0x60,0x00,0x02,0x5a, value]); break;
		case "fx1paraeqlomidq":			message = message.concat([0x60,0x00,0x02,0x5b, value]); break;
		case "fx1paraeqlomidg":			message = message.concat([0x60,0x00,0x02,0x5c, value]); break;
		case "fx1paraeqhimidf":			message = message.concat([0x60,0x00,0x02,0x5d, value]); break;
		case "fx1paraeqhimidq":			message = message.concat([0x60,0x00,0x02,0x5e, value]); break;
		case "fx1paraeqhimidg":			message = message.concat([0x60,0x00,0x02,0x5f, value]); break;
		case "fx1paraeqhigain":			message = message.concat([0x60,0x00,0x02,0x60, value]); break;
		case "fx1paraeqhicut":			message = message.concat([0x60,0x00,0x02,0x61, value]); break;
		case "fx1paraeqlevel":			message = message.concat([0x60,0x00,0x02,0x62, value]); break;
		
		case "fx1harmonistvoice": 				message = message.concat([0x60,0x00,0x02,0x63, value]); 		break;
		case "fx1harmonisthr1harm": 			message = message.concat([0x60,0x00,0x02,0x64, value]); 		break;
		case "fx1harmonisthr1predl": 
			value2 	= value >> 7; 
			value  	= value & 0x7f;
												message = message.concat([0x60,0x00,0x02,0x65, value2,value]); 	break;
		case "fx1harmonisthr1level": 			message = message.concat([0x60,0x00,0x02,0x67, value]); 		break;
		case "fx1harmonisthr2harm": 			message = message.concat([0x60,0x00,0x02,0x68, value]); 		break;
		case "fx1harmonisthr2predl":
			value2 	= value >> 7; 
			value  	= value & 0x7f;
												message = message.concat([0x60,0x00,0x02,0x69, value2,value]);	break;
		case "fx1harmonisthr2level": 			message = message.concat([0x60,0x00,0x02,0x6b, value]); 		break;
		case "fx1harmonisthr1fbk": 				message = message.concat([0x60,0x00,0x02,0x6c, value]); 		break;
		case "fx1harmonistdirectlev": 			message = message.concat([0x60,0x00,0x02,0x6d, value]); 		break;
		case "fx1harmonisthr1userscalekeyc": 	message = message.concat([0x60,0x00,0x02,0x6e, value]); 		break;
		case "fx1harmonisthr1userscalekeydb": 	message = message.concat([0x60,0x00,0x02,0x6f, value]); 		break;
		case "fx1harmonisthr1userscalekeyd": 	message = message.concat([0x60,0x00,0x02,0x70, value]); 		break;
		case "fx1harmonisthr1userscalekeyeb": 	message = message.concat([0x60,0x00,0x02,0x71, value]); 		break;
		case "fx1harmonisthr1userscalekeye": 	message = message.concat([0x60,0x00,0x02,0x72, value]); 		break;
		case "fx1harmonisthr1userscalekeyf": 	message = message.concat([0x60,0x00,0x02,0x73, value]); 		break;
		case "fx1harmonisthr1userscalekeyfs": 	message = message.concat([0x60,0x00,0x02,0x74, value]); 		break;
		case "fx1harmonisthr1userscalekeyg": 	message = message.concat([0x60,0x00,0x02,0x75, value]); 		break;
		case "fx1harmonisthr1userscalekeyab": 	message = message.concat([0x60,0x00,0x02,0x76, value]); 		break;
		case "fx1harmonisthr1userscalekeya": 	message = message.concat([0x60,0x00,0x02,0x77, value]); 		break;
		case "fx1harmonisthr1userscalekeybb": 	message = message.concat([0x60,0x00,0x02,0x78, value]); 		break;
		case "fx1harmonisthr1userscalekeyb": 	message = message.concat([0x60,0x00,0x02,0x79, value]); 		break;
		case "fx1harmonisthr2userscalekeyc": 	message = message.concat([0x60,0x00,0x02,0x7a, value]); 		break;
		case "fx1harmonisthr2userscalekeydb": 	message = message.concat([0x60,0x00,0x02,0x7b, value]); 		break;
		case "fx1harmonisthr2userscalekeyd": 	message = message.concat([0x60,0x00,0x02,0x7c, value]); 		break;
		case "fx1harmonisthr2userscalekeyeb": 	message = message.concat([0x60,0x00,0x02,0x7d, value]); 		break;
		case "fx1harmonisthr2userscalekeye": 	message = message.concat([0x60,0x00,0x02,0x7e, value]); 		break;
		case "fx1harmonisthr2userscalekeyf": 	message = message.concat([0x60,0x00,0x02,0x7f, value]); 		break;
		case "fx1harmonisthr2userscalekeyfs": 	message = message.concat([0x60,0x00,0x03,0x00, value]); 		break;
		case "fx1harmonisthr2userscalekeyg": 	message = message.concat([0x60,0x00,0x03,0x01, value]); 		break;
		case "fx1harmonisthr2userscalekeyab": 	message = message.concat([0x60,0x00,0x03,0x02, value]); 		break;
		case "fx1harmonisthr2userscalekeya": 	message = message.concat([0x60,0x00,0x03,0x03, value]); 		break;
		case "fx1harmonisthr2userscalekeybb": 	message = message.concat([0x60,0x00,0x03,0x04, value]); 		break;
		case "fx1harmonisthr2userscalekeyb": 	message = message.concat([0x60,0x00,0x03,0x05, value]); 		break;
		
		case "fx1pitchshiftervoice": 			message = message.concat([0x60,0x00,0x03,0x06, value]); break;
		case "fx1pitchshifterps1mode": 			message = message.concat([0x60,0x00,0x03,0x07, value]); break;
		case "fx1pitchshifterps1pitch": 		message = message.concat([0x60,0x00,0x03,0x08, value]); break;
		case "fx1pitchshifterps1fine": 			message = message.concat([0x60,0x00,0x03,0x09, value]); break;
		case "fx1pitchshifterps1predly":
			value2 	= value >> 7; 
			value  	= value & 0x7f;
												message = message.concat([0x60,0x00,0x03,0x0a, value2,value]); break;
		case "fx1pitchshifterps1level": 		message = message.concat([0x60,0x00,0x03,0x0c, value]); break;
		case "fx1pitchshifterps2mode": 			message = message.concat([0x60,0x00,0x03,0x0d, value]); break;
		case "fx1pitchshifterps2pitch": 		message = message.concat([0x60,0x00,0x03,0x0e, value]); break;
		case "fx1pitchshifterps2fine": 			message = message.concat([0x60,0x00,0x03,0x0f, value]); break;
		case "fx1pitchshifterps2predl":
			value2 	= value >> 7; 
			value  	= value & 0x7f;
												message = message.concat([0x60,0x00,0x03,0x10, value2,value]); break;
		case "fx1pitchshifterps2level": 		message = message.concat([0x60,0x00,0x03,0x12, value]); break;
		case "fx1pitchshifterps1fbk": 			message = message.concat([0x60,0x00,0x03,0x13, value]); break;
		case "fx1pitchshifterdirectlev": 		message = message.concat([0x60,0x00,0x03,0x14, value]); break;
		
		case "fx1octaverange": 					message = message.concat([0x60,0x00,0x03,0x15, value]); break;
		case "fx1octaveoctlevel": 				message = message.concat([0x60,0x00,0x03,0x16, value]); break;
		case "fx1octavedirectlev": 				message = message.concat([0x60,0x00,0x03,0x17, value]); break;
		
		case "fx1rotaryspeedsel": 				message = message.concat([0x60,0x00,0x03,0x18, value]); break;
		case "fx1rotaryrateslow": 				message = message.concat([0x60,0x00,0x03,0x19, value]); break;
		case "fx1rotaryratefast": 				message = message.concat([0x60,0x00,0x03,0x1a, value]); break;
		case "fx1rotaryrisetime": 				message = message.concat([0x60,0x00,0x03,0x1b, value]); break;
		case "fx1rotaryfalltime": 				message = message.concat([0x60,0x00,0x03,0x1c, value]); break;
		case "fx1rotarydepth": 					message = message.concat([0x60,0x00,0x03,0x1d, value]); break;
		
		case "fx12x2chorusxoverf": 				message = message.concat([0x60,0x00,0x03,0x1e, value]); break;
		case "fx12x2choruslorate": 				message = message.concat([0x60,0x00,0x03,0x1f, value]); break;
		case "fx12x2choruslodepth": 			message = message.concat([0x60,0x00,0x03,0x20, value]); break;
		case "fx12x2choruslopredly": 			message = message.concat([0x60,0x00,0x03,0x21, value]); break;
		case "fx12x2choruslolevel": 			message = message.concat([0x60,0x00,0x03,0x22, value]); break;
		case "fx12x2chorushirate": 				message = message.concat([0x60,0x00,0x03,0x23, value]); break;
		case "fx12x2chorushidepth": 			message = message.concat([0x60,0x00,0x03,0x24, value]); break;
		case "fx12x2chorushipredly": 			message = message.concat([0x60,0x00,0x03,0x25, value]); break;
		case "fx12x2chorushilevel": 			message = message.concat([0x60,0x00,0x03,0x26, value]); break;
		
		// VERIFICAR O INTERVALO DOS BYTES DO PRIMEIRO PARÂMETRO <<<<<<<<<<<<<<<<<<<<<<<<<
		case "fx1subdelaydlytime":
			value2 	= value >> 7; 
			value  	= value & 0x7f;
												message = message.concat([0x60,0x00,0x03,0x27, value2,value]); break;
		case "fx1subdelayfeedback": 			message = message.concat([0x60,0x00,0x03,0x29, value]); break;
		case "fx1subdelayhicut": 				message = message.concat([0x60,0x00,0x03,0x2a, value]); break;
		case "fx1subdelayeffectlev": 			message = message.concat([0x60,0x00,0x03,0x2b, value]); break;
		case "fx1subdelaydirectlev": 			message = message.concat([0x60,0x00,0x03,0x2c, value]); break;
		
		case "fx1defrettertone": 				message = message.concat([0x60,0x00,0x03,0x2d, value]); break;
		case "fx1defrettersens": 				message = message.concat([0x60,0x00,0x03,0x2e, value]); break;
		case "fx1defretterattack": 				message = message.concat([0x60,0x00,0x03,0x2f, value]); break;
		case "fx1defretterdepth": 				message = message.concat([0x60,0x00,0x03,0x30, value]); break;
		case "fx1defretterresonance": 			message = message.concat([0x60,0x00,0x03,0x31, value]); break;
		case "fx1defrettereffectlev": 			message = message.concat([0x60,0x00,0x03,0x32, value]); break;
		case "fx1defretterdirectlev": 			message = message.concat([0x60,0x00,0x03,0x33, value]); break;
		
		case "fx1sitarsimtone": 				message = message.concat([0x60,0x00,0x03,0x34, value]); break;
		case "fx1sitarsimsens": 				message = message.concat([0x60,0x00,0x03,0x35, value]); break;
		case "fx1sitarsimdepth": 				message = message.concat([0x60,0x00,0x03,0x36, value]); break;
		case "fx1sitarsimresonance": 			message = message.concat([0x60,0x00,0x03,0x37, value]); break;
		case "fx1sitarsimbuzz": 				message = message.concat([0x60,0x00,0x03,0x38, value]); break;
		case "fx1sitarsimeffectlev": 			message = message.concat([0x60,0x00,0x03,0x39, value]); break;
		case "fx1sitarsimdirectlev": 			message = message.concat([0x60,0x00,0x03,0x3a, value]); break;
		
		case "fx1wavesynthwave": 				message = message.concat([0x60,0x00,0x03,0x3b, value]); break;
		case "fx1wavesynthcutoff": 				message = message.concat([0x60,0x00,0x03,0x3c, value]); break;
		case "fx1wavesynthresonance": 			message = message.concat([0x60,0x00,0x03,0x3d, value]); break;
		case "fx1wavesynthfltsens": 			message = message.concat([0x60,0x00,0x03,0x3e, value]); break;
		case "fx1wavesynthfltdecay": 			message = message.concat([0x60,0x00,0x03,0x3f, value]); break;
		case "fx1wavesynthfltdepth": 			message = message.concat([0x60,0x00,0x03,0x40, value]); break;
		case "fx1wavesynthsynthlev": 			message = message.concat([0x60,0x00,0x03,0x41, value]); break;
		case "fx1wavesynthdirectlev": 			message = message.concat([0x60,0x00,0x03,0x42, value]); break;
		
		case "fx1guitarsynthwave": 				message = message.concat([0x60,0x00,0x03,0x43, value]); break;
		case "fx1guitarsynthsens": 				message = message.concat([0x60,0x00,0x03,0x44, value]); break;
		case "fx1guitarsynthchromatic": 		message = message.concat([0x60,0x00,0x03,0x45, value]); break;
		case "fx1guitarsynthoctshift": 			message = message.concat([0x60,0x00,0x03,0x46, value]); break;
		case "fx1guitarsynthpwmrate": 			message = message.concat([0x60,0x00,0x03,0x47, value]); break;
		case "fx1guitarsynthpwmdepth": 			message = message.concat([0x60,0x00,0x03,0x48, value]); break;
		case "fx1guitarsynthcutoff": 			message = message.concat([0x60,0x00,0x03,0x49, value]); break;
		case "fx1guitarsynthresonance": 		message = message.concat([0x60,0x00,0x03,0x4a, value]); break;
		case "fx1guitarsynthfltsens": 			message = message.concat([0x60,0x00,0x03,0x4b, value]); break;
		case "fx1guitarsynthfltdecay": 			message = message.concat([0x60,0x00,0x03,0x4c, value]); break;
		case "fx1guitarsynthfltdepth": 			message = message.concat([0x60,0x00,0x03,0x4d, value]); break;
		case "fx1guitarsynthattack": 			message = message.concat([0x60,0x00,0x03,0x4e, value]); break;
		case "fx1guitarsynthrelease": 			message = message.concat([0x60,0x00,0x03,0x4f, value]); break;
		case "fx1guitarsynthvelocity": 			message = message.concat([0x60,0x00,0x03,0x50, value]); break;
		case "fx1guitarsynthhold": 				message = message.concat([0x60,0x00,0x03,0x51, value]); break;
		case "fx1guitarsynthsynthlev": 			message = message.concat([0x60,0x00,0x03,0x52, value]); break;
		case "fx1guitarsynthdirectlev": 		message = message.concat([0x60,0x00,0x03,0x53, value]); break;
		
		case "fx1autoriffphrase": 					message = message.concat([0x60,0x00,0x03,0x54, value]); break;
		case "fx1autoriffloop": 					message = message.concat([0x60,0x00,0x03,0x55, value]); break;
		case "fx1autorifftempo": 					message = message.concat([0x60,0x00,0x03,0x56, value]); break;
		case "fx1autoriffsens": 					message = message.concat([0x60,0x00,0x03,0x57, value]); break;
		case "fx1autoriffattack": 					message = message.concat([0x60,0x00,0x03,0x58, value]); break;
		case "fx1autoriffhold": 					message = message.concat([0x60,0x00,0x03,0x59, value]); break;
		case "fx1autoriffeffectlev": 				message = message.concat([0x60,0x00,0x03,0x5a, value]); break;
		case "fx1autoriffdirectlev": 				message = message.concat([0x60,0x00,0x03,0x5b, value]); break;
		case "fx1autoriffuserphrasesetting1c": 		message = message.concat([0x60,0x00,0x03,0x5c, value]); break;
		case "fx1autoriffuserphrasesetting2c": 		message = message.concat([0x60,0x00,0x03,0x5d, value]); break;
		case "fx1autoriffuserphrasesetting3c": 		message = message.concat([0x60,0x00,0x03,0x5e, value]); break;
		case "fx1autoriffuserphrasesetting4c": 		message = message.concat([0x60,0x00,0x03,0x5f, value]); break;
		case "fx1autoriffuserphrasesetting5c": 		message = message.concat([0x60,0x00,0x03,0x60, value]); break;
		case "fx1autoriffuserphrasesetting6c": 		message = message.concat([0x60,0x00,0x03,0x61, value]); break;
		case "fx1autoriffuserphrasesetting7c": 		message = message.concat([0x60,0x00,0x03,0x62, value]); break;
		case "fx1autoriffuserphrasesetting8c": 		message = message.concat([0x60,0x00,0x03,0x63, value]); break;
		case "fx1autoriffuserphrasesetting9c": 		message = message.concat([0x60,0x00,0x03,0x64, value]); break;
		case "fx1autoriffuserphrasesetting10c": 	message = message.concat([0x60,0x00,0x03,0x65, value]); break;
		case "fx1autoriffuserphrasesetting11c": 	message = message.concat([0x60,0x00,0x03,0x66, value]); break;
		case "fx1autoriffuserphrasesetting12c": 	message = message.concat([0x60,0x00,0x03,0x67, value]); break;
		case "fx1autoriffuserphrasesetting13c": 	message = message.concat([0x60,0x00,0x03,0x68, value]); break;
		case "fx1autoriffuserphrasesetting14c": 	message = message.concat([0x60,0x00,0x03,0x69, value]); break;
		case "fx1autoriffuserphrasesetting15c": 	message = message.concat([0x60,0x00,0x03,0x6a, value]); break;
		case "fx1autoriffuserphrasesetting16c": 	message = message.concat([0x60,0x00,0x03,0x6b, value]); break;
		case "fx1autoriffuserphrasesetting1db": 	message = message.concat([0x60,0x00,0x03,0x6c, value]); break;
		case "fx1autoriffuserphrasesetting2db": 	message = message.concat([0x60,0x00,0x03,0x6d, value]); break;
		case "fx1autoriffuserphrasesetting3db": 	message = message.concat([0x60,0x00,0x03,0x6e, value]); break;
		case "fx1autoriffuserphrasesetting4db": 	message = message.concat([0x60,0x00,0x03,0x6f, value]); break;
		case "fx1autoriffuserphrasesetting5db": 	message = message.concat([0x60,0x00,0x03,0x70, value]); break;
		case "fx1autoriffuserphrasesetting6db": 	message = message.concat([0x60,0x00,0x03,0x71, value]); break;
		case "fx1autoriffuserphrasesetting7db": 	message = message.concat([0x60,0x00,0x03,0x72, value]); break;
		case "fx1autoriffuserphrasesetting8db": 	message = message.concat([0x60,0x00,0x03,0x73, value]); break;
		case "fx1autoriffuserphrasesetting9db": 	message = message.concat([0x60,0x00,0x03,0x74, value]); break;
		case "fx1autoriffuserphrasesetting10db": 	message = message.concat([0x60,0x00,0x03,0x75, value]); break;
		case "fx1autoriffuserphrasesetting11db": 	message = message.concat([0x60,0x00,0x03,0x76, value]); break;
		case "fx1autoriffuserphrasesetting12db": 	message = message.concat([0x60,0x00,0x03,0x77, value]); break;
		case "fx1autoriffuserphrasesetting13db": 	message = message.concat([0x60,0x00,0x03,0x78, value]); break;
		case "fx1autoriffuserphrasesetting14db": 	message = message.concat([0x60,0x00,0x03,0x79, value]); break;
		case "fx1autoriffuserphrasesetting15db": 	message = message.concat([0x60,0x00,0x03,0x7a, value]); break;
		case "fx1autoriffuserphrasesetting16db": 	message = message.concat([0x60,0x00,0x03,0x7b, value]); break;
		case "fx1autoriffuserphrasesetting1d": 		message = message.concat([0x60,0x00,0x03,0x7c, value]); break;
		case "fx1autoriffuserphrasesetting2d": 		message = message.concat([0x60,0x00,0x03,0x7d, value]); break;
		case "fx1autoriffuserphrasesetting3d": 		message = message.concat([0x60,0x00,0x03,0x7e, value]); break;
		case "fx1autoriffuserphrasesetting4d": 		message = message.concat([0x60,0x00,0x03,0x7f, value]); break;
		case "fx1autoriffuserphrasesetting5d": 		message = message.concat([0x60,0x00,0x04,0x00, value]); break;
		case "fx1autoriffuserphrasesetting6d": 		message = message.concat([0x60,0x00,0x04,0x01, value]); break;
		case "fx1autoriffuserphrasesetting7d": 		message = message.concat([0x60,0x00,0x04,0x02, value]); break;
		case "fx1autoriffuserphrasesetting8d": 		message = message.concat([0x60,0x00,0x04,0x03, value]); break;
		case "fx1autoriffuserphrasesetting9d": 		message = message.concat([0x60,0x00,0x04,0x04, value]); break;
		case "fx1autoriffuserphrasesetting10d": 	message = message.concat([0x60,0x00,0x04,0x05, value]); break;
		case "fx1autoriffuserphrasesetting11d": 	message = message.concat([0x60,0x00,0x04,0x06, value]); break;
		case "fx1autoriffuserphrasesetting12d": 	message = message.concat([0x60,0x00,0x04,0x07, value]); break;
		case "fx1autoriffuserphrasesetting13d": 	message = message.concat([0x60,0x00,0x04,0x08, value]); break;
		case "fx1autoriffuserphrasesetting14d": 	message = message.concat([0x60,0x00,0x04,0x09, value]); break;
		case "fx1autoriffuserphrasesetting15d": 	message = message.concat([0x60,0x00,0x04,0x0a, value]); break;
		case "fx1autoriffuserphrasesetting16d": 	message = message.concat([0x60,0x00,0x04,0x0b, value]); break;
		case "fx1autoriffuserphrasesetting1eb": 	message = message.concat([0x60,0x00,0x04,0x0c, value]); break;
		case "fx1autoriffuserphrasesetting2eb": 	message = message.concat([0x60,0x00,0x04,0x0d, value]); break;
		case "fx1autoriffuserphrasesetting3eb": 	message = message.concat([0x60,0x00,0x04,0x0e, value]); break;
		case "fx1autoriffuserphrasesetting4eb": 	message = message.concat([0x60,0x00,0x04,0x0f, value]); break;
		case "fx1autoriffuserphrasesetting5eb": 	message = message.concat([0x60,0x00,0x04,0x10, value]); break;
		case "fx1autoriffuserphrasesetting6eb": 	message = message.concat([0x60,0x00,0x04,0x11, value]); break;
		case "fx1autoriffuserphrasesetting7eb": 	message = message.concat([0x60,0x00,0x04,0x12, value]); break;
		case "fx1autoriffuserphrasesetting8eb": 	message = message.concat([0x60,0x00,0x04,0x13, value]); break;
		case "fx1autoriffuserphrasesetting9eb": 	message = message.concat([0x60,0x00,0x04,0x14, value]); break;
		case "fx1autoriffuserphrasesetting10eb": 	message = message.concat([0x60,0x00,0x04,0x15, value]); break;
		case "fx1autoriffuserphrasesetting11eb": 	message = message.concat([0x60,0x00,0x04,0x16, value]); break;
		case "fx1autoriffuserphrasesetting12eb": 	message = message.concat([0x60,0x00,0x04,0x17, value]); break;
		case "fx1autoriffuserphrasesetting13eb": 	message = message.concat([0x60,0x00,0x04,0x18, value]); break;
		case "fx1autoriffuserphrasesetting14eb": 	message = message.concat([0x60,0x00,0x04,0x19, value]); break;
		case "fx1autoriffuserphrasesetting15eb": 	message = message.concat([0x60,0x00,0x04,0x1a, value]); break;
		case "fx1autoriffuserphrasesetting16eb": 	message = message.concat([0x60,0x00,0x04,0x1b, value]); break;
		case "fx1autoriffuserphrasesetting1e": 		message = message.concat([0x60,0x00,0x04,0x1c, value]); break;
		case "fx1autoriffuserphrasesetting2e": 		message = message.concat([0x60,0x00,0x04,0x1d, value]); break;
		case "fx1autoriffuserphrasesetting3e": 		message = message.concat([0x60,0x00,0x04,0x1e, value]); break;
		case "fx1autoriffuserphrasesetting4e": 		message = message.concat([0x60,0x00,0x04,0x1f, value]); break;
		case "fx1autoriffuserphrasesetting5e": 		message = message.concat([0x60,0x00,0x04,0x20, value]); break;
		case "fx1autoriffuserphrasesetting6e": 		message = message.concat([0x60,0x00,0x04,0x21, value]); break;
		case "fx1autoriffuserphrasesetting7e": 		message = message.concat([0x60,0x00,0x04,0x22, value]); break;
		case "fx1autoriffuserphrasesetting8e": 		message = message.concat([0x60,0x00,0x04,0x23, value]); break;
		case "fx1autoriffuserphrasesetting9e": 		message = message.concat([0x60,0x00,0x04,0x24, value]); break;
		case "fx1autoriffuserphrasesetting10e": 	message = message.concat([0x60,0x00,0x04,0x25, value]); break;
		case "fx1autoriffuserphrasesetting11e": 	message = message.concat([0x60,0x00,0x04,0x26, value]); break;
		case "fx1autoriffuserphrasesetting12e": 	message = message.concat([0x60,0x00,0x04,0x27, value]); break;
		case "fx1autoriffuserphrasesetting13e": 	message = message.concat([0x60,0x00,0x04,0x28, value]); break;
		case "fx1autoriffuserphrasesetting14e": 	message = message.concat([0x60,0x00,0x04,0x29, value]); break;
		case "fx1autoriffuserphrasesetting15e": 	message = message.concat([0x60,0x00,0x04,0x2a, value]); break;
		case "fx1autoriffuserphrasesetting16e": 	message = message.concat([0x60,0x00,0x04,0x2b, value]); break;
		case "fx1autoriffuserphrasesetting1f": 		message = message.concat([0x60,0x00,0x04,0x2c, value]); break;
		case "fx1autoriffuserphrasesetting2f": 		message = message.concat([0x60,0x00,0x04,0x2d, value]); break;
		case "fx1autoriffuserphrasesetting3f": 		message = message.concat([0x60,0x00,0x04,0x2e, value]); break;
		case "fx1autoriffuserphrasesetting4f": 		message = message.concat([0x60,0x00,0x04,0x2f, value]); break;
		case "fx1autoriffuserphrasesetting5f": 		message = message.concat([0x60,0x00,0x04,0x30, value]); break;
		case "fx1autoriffuserphrasesetting6f": 		message = message.concat([0x60,0x00,0x04,0x31, value]); break;
		case "fx1autoriffuserphrasesetting7f": 		message = message.concat([0x60,0x00,0x04,0x32, value]); break;
		case "fx1autoriffuserphrasesetting8f": 		message = message.concat([0x60,0x00,0x04,0x33, value]); break;
		case "fx1autoriffuserphrasesetting9f": 		message = message.concat([0x60,0x00,0x04,0x34, value]); break;
		case "fx1autoriffuserphrasesetting10f": 	message = message.concat([0x60,0x00,0x04,0x35, value]); break;
		case "fx1autoriffuserphrasesetting11f": 	message = message.concat([0x60,0x00,0x04,0x36, value]); break;
		case "fx1autoriffuserphrasesetting12f": 	message = message.concat([0x60,0x00,0x04,0x37, value]); break;
		case "fx1autoriffuserphrasesetting13f": 	message = message.concat([0x60,0x00,0x04,0x38, value]); break;
		case "fx1autoriffuserphrasesetting14f": 	message = message.concat([0x60,0x00,0x04,0x39, value]); break;
		case "fx1autoriffuserphrasesetting15f": 	message = message.concat([0x60,0x00,0x04,0x3a, value]); break;
		case "fx1autoriffuserphrasesetting16f": 	message = message.concat([0x60,0x00,0x04,0x3b, value]); break;
		case "fx1autoriffuserphrasesetting1fs": 	message = message.concat([0x60,0x00,0x04,0x3c, value]); break;
		case "fx1autoriffuserphrasesetting2fs": 	message = message.concat([0x60,0x00,0x04,0x3d, value]); break;
		case "fx1autoriffuserphrasesetting3fs": 	message = message.concat([0x60,0x00,0x04,0x3e, value]); break;
		case "fx1autoriffuserphrasesetting4fs": 	message = message.concat([0x60,0x00,0x04,0x3f, value]); break;
		case "fx1autoriffuserphrasesetting5fs": 	message = message.concat([0x60,0x00,0x04,0x40, value]); break;
		case "fx1autoriffuserphrasesetting6fs": 	message = message.concat([0x60,0x00,0x04,0x41, value]); break;
		case "fx1autoriffuserphrasesetting7fs": 	message = message.concat([0x60,0x00,0x04,0x42, value]); break;
		case "fx1autoriffuserphrasesetting8fs": 	message = message.concat([0x60,0x00,0x04,0x43, value]); break;
		case "fx1autoriffuserphrasesetting9fs": 	message = message.concat([0x60,0x00,0x04,0x44, value]); break;
		case "fx1autoriffuserphrasesetting10fs": 	message = message.concat([0x60,0x00,0x04,0x45, value]); break;
		case "fx1autoriffuserphrasesetting11fs": 	message = message.concat([0x60,0x00,0x04,0x46, value]); break;
		case "fx1autoriffuserphrasesetting12fs": 	message = message.concat([0x60,0x00,0x04,0x47, value]); break;
		case "fx1autoriffuserphrasesetting13fs": 	message = message.concat([0x60,0x00,0x04,0x48, value]); break;
		case "fx1autoriffuserphrasesetting14fs": 	message = message.concat([0x60,0x00,0x04,0x49, value]); break;
		case "fx1autoriffuserphrasesetting15fs": 	message = message.concat([0x60,0x00,0x04,0x4a, value]); break;
		case "fx1autoriffuserphrasesetting16fs": 	message = message.concat([0x60,0x00,0x04,0x4b, value]); break;
		case "fx1autoriffuserphrasesetting1g": 		message = message.concat([0x60,0x00,0x04,0x4c, value]); break;
		case "fx1autoriffuserphrasesetting2g": 		message = message.concat([0x60,0x00,0x04,0x4d, value]); break;
		case "fx1autoriffuserphrasesetting3g": 		message = message.concat([0x60,0x00,0x04,0x4e, value]); break;
		case "fx1autoriffuserphrasesetting4g": 		message = message.concat([0x60,0x00,0x04,0x4f, value]); break;
		case "fx1autoriffuserphrasesetting5g": 		message = message.concat([0x60,0x00,0x04,0x50, value]); break;
		case "fx1autoriffuserphrasesetting6g": 		message = message.concat([0x60,0x00,0x04,0x51, value]); break;
		case "fx1autoriffuserphrasesetting7g": 		message = message.concat([0x60,0x00,0x04,0x52, value]); break;
		case "fx1autoriffuserphrasesetting8g": 		message = message.concat([0x60,0x00,0x04,0x53, value]); break;
		case "fx1autoriffuserphrasesetting9g": 		message = message.concat([0x60,0x00,0x04,0x54, value]); break;
		case "fx1autoriffuserphrasesetting10g": 	message = message.concat([0x60,0x00,0x04,0x55, value]); break;
		case "fx1autoriffuserphrasesetting11g": 	message = message.concat([0x60,0x00,0x04,0x56, value]); break;
		case "fx1autoriffuserphrasesetting12g": 	message = message.concat([0x60,0x00,0x04,0x57, value]); break;
		case "fx1autoriffuserphrasesetting13g": 	message = message.concat([0x60,0x00,0x04,0x58, value]); break;
		case "fx1autoriffuserphrasesetting14g": 	message = message.concat([0x60,0x00,0x04,0x59, value]); break;
		case "fx1autoriffuserphrasesetting15g": 	message = message.concat([0x60,0x00,0x04,0x5a, value]); break;
		case "fx1autoriffuserphrasesetting16g": 	message = message.concat([0x60,0x00,0x04,0x5b, value]); break;
		case "fx1autoriffuserphrasesetting1ab": 	message = message.concat([0x60,0x00,0x04,0x5c, value]); break;
		case "fx1autoriffuserphrasesetting2ab": 	message = message.concat([0x60,0x00,0x04,0x5d, value]); break;
		case "fx1autoriffuserphrasesetting3ab": 	message = message.concat([0x60,0x00,0x04,0x5e, value]); break;
		case "fx1autoriffuserphrasesetting4ab": 	message = message.concat([0x60,0x00,0x04,0x5f, value]); break;
		case "fx1autoriffuserphrasesetting5ab": 	message = message.concat([0x60,0x00,0x04,0x60, value]); break;
		case "fx1autoriffuserphrasesetting6ab": 	message = message.concat([0x60,0x00,0x04,0x61, value]); break;
		case "fx1autoriffuserphrasesetting7ab": 	message = message.concat([0x60,0x00,0x04,0x62, value]); break;
		case "fx1autoriffuserphrasesetting8ab": 	message = message.concat([0x60,0x00,0x04,0x63, value]); break;
		case "fx1autoriffuserphrasesetting9ab": 	message = message.concat([0x60,0x00,0x04,0x64, value]); break;
		case "fx1autoriffuserphrasesetting10ab": 	message = message.concat([0x60,0x00,0x04,0x65, value]); break;
		case "fx1autoriffuserphrasesetting11ab": 	message = message.concat([0x60,0x00,0x04,0x66, value]); break;
		case "fx1autoriffuserphrasesetting12ab": 	message = message.concat([0x60,0x00,0x04,0x67, value]); break;
		case "fx1autoriffuserphrasesetting13ab": 	message = message.concat([0x60,0x00,0x04,0x68, value]); break;
		case "fx1autoriffuserphrasesetting14ab": 	message = message.concat([0x60,0x00,0x04,0x69, value]); break;
		case "fx1autoriffuserphrasesetting15ab": 	message = message.concat([0x60,0x00,0x04,0x6a, value]); break;
		case "fx1autoriffuserphrasesetting16ab": 	message = message.concat([0x60,0x00,0x04,0x6b, value]); break;
		case "fx1autoriffuserphrasesetting1a": 		message = message.concat([0x60,0x00,0x04,0x6c, value]); break;
		case "fx1autoriffuserphrasesetting2a": 		message = message.concat([0x60,0x00,0x04,0x6d, value]); break;
		case "fx1autoriffuserphrasesetting3a": 		message = message.concat([0x60,0x00,0x04,0x6e, value]); break;
		case "fx1autoriffuserphrasesetting4a": 		message = message.concat([0x60,0x00,0x04,0x6f, value]); break;
		case "fx1autoriffuserphrasesetting5a": 		message = message.concat([0x60,0x00,0x04,0x70, value]); break;
		case "fx1autoriffuserphrasesetting6a": 		message = message.concat([0x60,0x00,0x04,0x71, value]); break;
		case "fx1autoriffuserphrasesetting7a": 		message = message.concat([0x60,0x00,0x04,0x72, value]); break;
		case "fx1autoriffuserphrasesetting8a": 		message = message.concat([0x60,0x00,0x04,0x73, value]); break;
		case "fx1autoriffuserphrasesetting9a": 		message = message.concat([0x60,0x00,0x04,0x74, value]); break;
		case "fx1autoriffuserphrasesetting10a": 	message = message.concat([0x60,0x00,0x04,0x75, value]); break;
		case "fx1autoriffuserphrasesetting11a": 	message = message.concat([0x60,0x00,0x04,0x76, value]); break;
		case "fx1autoriffuserphrasesetting12a": 	message = message.concat([0x60,0x00,0x04,0x77, value]); break;
		case "fx1autoriffuserphrasesetting13a": 	message = message.concat([0x60,0x00,0x04,0x78, value]); break;
		case "fx1autoriffuserphrasesetting14a": 	message = message.concat([0x60,0x00,0x04,0x79, value]); break;
		case "fx1autoriffuserphrasesetting15a": 	message = message.concat([0x60,0x00,0x04,0x7a, value]); break;
		case "fx1autoriffuserphrasesetting16a": 	message = message.concat([0x60,0x00,0x04,0x7b, value]); break;
		case "fx1autoriffuserphrasesetting1bb": 	message = message.concat([0x60,0x00,0x04,0x7c, value]); break;
		case "fx1autoriffuserphrasesetting2bb": 	message = message.concat([0x60,0x00,0x04,0x7d, value]); break;
		case "fx1autoriffuserphrasesetting3bb": 	message = message.concat([0x60,0x00,0x04,0x7e, value]); break;
		case "fx1autoriffuserphrasesetting4bb": 	message = message.concat([0x60,0x00,0x04,0x7f, value]); break;
		case "fx1autoriffuserphrasesetting5bb": 	message = message.concat([0x60,0x00,0x05,0x00, value]); break;
		case "fx1autoriffuserphrasesetting6bb": 	message = message.concat([0x60,0x00,0x05,0x01, value]); break;
		case "fx1autoriffuserphrasesetting7bb": 	message = message.concat([0x60,0x00,0x05,0x02, value]); break;
		case "fx1autoriffuserphrasesetting8bb": 	message = message.concat([0x60,0x00,0x05,0x03, value]); break;
		case "fx1autoriffuserphrasesetting9bb": 	message = message.concat([0x60,0x00,0x05,0x04, value]); break;
		case "fx1autoriffuserphrasesetting10bb": 	message = message.concat([0x60,0x00,0x05,0x05, value]); break;
		case "fx1autoriffuserphrasesetting11bb": 	message = message.concat([0x60,0x00,0x05,0x06, value]); break;
		case "fx1autoriffuserphrasesetting12bb": 	message = message.concat([0x60,0x00,0x05,0x07, value]); break;
		case "fx1autoriffuserphrasesetting13bb": 	message = message.concat([0x60,0x00,0x05,0x08, value]); break;
		case "fx1autoriffuserphrasesetting14bb": 	message = message.concat([0x60,0x00,0x05,0x09, value]); break;
		case "fx1autoriffuserphrasesetting15bb": 	message = message.concat([0x60,0x00,0x05,0x0a, value]); break;
		case "fx1autoriffuserphrasesetting16bb": 	message = message.concat([0x60,0x00,0x05,0x0b, value]); break;
		case "fx1autoriffuserphrasesetting1b": 		message = message.concat([0x60,0x00,0x05,0x0c, value]); break;
		case "fx1autoriffuserphrasesetting2b": 		message = message.concat([0x60,0x00,0x05,0x0d, value]); break;
		case "fx1autoriffuserphrasesetting3b": 		message = message.concat([0x60,0x00,0x05,0x0e, value]); break;
		case "fx1autoriffuserphrasesetting4b": 		message = message.concat([0x60,0x00,0x05,0x0f, value]); break;
		case "fx1autoriffuserphrasesetting5b": 		message = message.concat([0x60,0x00,0x05,0x10, value]); break;
		case "fx1autoriffuserphrasesetting6b": 		message = message.concat([0x60,0x00,0x05,0x11, value]); break;
		case "fx1autoriffuserphrasesetting7b": 		message = message.concat([0x60,0x00,0x05,0x12, value]); break;
		case "fx1autoriffuserphrasesetting8b": 		message = message.concat([0x60,0x00,0x05,0x13, value]); break;
		case "fx1autoriffuserphrasesetting9b": 		message = message.concat([0x60,0x00,0x05,0x14, value]); break;
		case "fx1autoriffuserphrasesetting10b": 	message = message.concat([0x60,0x00,0x05,0x15, value]); break;
		case "fx1autoriffuserphrasesetting11b": 	message = message.concat([0x60,0x00,0x05,0x16, value]); break;
		case "fx1autoriffuserphrasesetting12b": 	message = message.concat([0x60,0x00,0x05,0x17, value]); break;
		case "fx1autoriffuserphrasesetting13b": 	message = message.concat([0x60,0x00,0x05,0x18, value]); break;
		case "fx1autoriffuserphrasesetting14b": 	message = message.concat([0x60,0x00,0x05,0x19, value]); break;
		case "fx1autoriffuserphrasesetting15b": 	message = message.concat([0x60,0x00,0x05,0x1a, value]); break;
		case "fx1autoriffuserphrasesetting16b": 	message = message.concat([0x60,0x00,0x05,0x1b, value]); break;
		
		case "fx1soundholdhold": 					message = message.concat([0x60,0x00,0x05,0x1c, value]); break;
		case "fx1soundholdrisetime": 				message = message.concat([0x60,0x00,0x05,0x1d, value]); break;
		case "fx1soundholdeffectlev": 				message = message.concat([0x60,0x00,0x05,0x1e, value]); break;
		
		case "fx1tonemodifytype":		message = message.concat([0x60,0x00,0x05,0x1f, value]); break;
		case "fx1tonemodifyresonance":	message = message.concat([0x60,0x00,0x05,0x20, value]); break;
		case "fx1tonemodifylow":		message = message.concat([0x60,0x00,0x05,0x21, value]); break;
		case "fx1tonemodifyhigh":		message = message.concat([0x60,0x00,0x05,0x22, value]); break;
		case "fx1tonemodifylevel":		message = message.concat([0x60,0x00,0x05,0x23, value]); break;

		case "fx1guitarsimtype": 		message = message.concat([0x60,0x00,0x05,0x24, value]); break;
		case "fx1guitarsimlow": 		message = message.concat([0x60,0x00,0x05,0x25, value]); break;
		case "fx1guitarsimhigh": 		message = message.concat([0x60,0x00,0x05,0x26, value]); break;
		case "fx1guitarsimlevel": 		message = message.concat([0x60,0x00,0x05,0x27, value]); break;
		case "fx1guitarsimbody": 		message = message.concat([0x60,0x00,0x05,0x28, value]); break;
		
		case "fx1acprocessortype":		message = message.concat([0x60,0x00,0x05,0x29, value]); break;
		case "fx1acprocessorbass":		message = message.concat([0x60,0x00,0x05,0x2a, value]); break;
		case "fx1acprocessormiddle":	message = message.concat([0x60,0x00,0x05,0x2b, value]); break;
		case "fx1acprocessormiddlef":	message = message.concat([0x60,0x00,0x05,0x2c, value]); break;
		case "fx1acprocessortreble":	message = message.concat([0x60,0x00,0x05,0x2d, value]); break;
		case "fx1acprocessorpresence":	message = message.concat([0x60,0x00,0x05,0x2e, value]); break;
		case "fx1acprocessorlevel":		message = message.concat([0x60,0x00,0x05,0x2f, value]); break;
		
		case "fx1subwahtype": 			message = message.concat([0x60,0x00,0x05,0x30, value]); break;
		case "fx1subwahpedalpos": 		message = message.concat([0x60,0x00,0x05,0x31, value]); break;
		case "fx1subwahpedalmin": 		message = message.concat([0x60,0x00,0x05,0x32, value]); break;
		case "fx1subwahpedalmax": 		message = message.concat([0x60,0x00,0x05,0x33, value]); break;
		case "fx1subwaheffectlev": 		message = message.concat([0x60,0x00,0x05,0x34, value]); break;
		case "fx1subwahdirectlev": 		message = message.concat([0x60,0x00,0x05,0x35, value]); break;

		case "fx1graphiceqlevel":		message = message.concat([0x60,0x00,0x05,0x36, value]); break;
		case "fx1graphiceq31":			message = message.concat([0x60,0x00,0x05,0x37, value]); break;
		case "fx1graphiceq62":			message = message.concat([0x60,0x00,0x05,0x38, value]); break;
		case "fx1graphiceq125":			message = message.concat([0x60,0x00,0x05,0x39, value]); break;
		case "fx1graphiceq250":			message = message.concat([0x60,0x00,0x05,0x3a, value]); break;
		case "fx1graphiceq500":			message = message.concat([0x60,0x00,0x05,0x3b, value]); break;
		case "fx1graphiceq1k":			message = message.concat([0x60,0x00,0x05,0x3c, value]); break;
		case "fx1graphiceq2k":			message = message.concat([0x60,0x00,0x05,0x3d, value]); break;
		case "fx1graphiceq4k":			message = message.concat([0x60,0x00,0x05,0x3e, value]); break;
		case "fx1graphiceq8k":			message = message.concat([0x60,0x00,0x05,0x3f, value]); break;
		case "fx1graphiceq16k":			message = message.concat([0x60,0x00,0x05,0x40, value]); break;
		
		
		//
		// FX-2
		//
		case "fx2sw":					message = message.concat([0x60,0x00,0x06,0x00, value]); break;
		case "fx2select":				message = message.concat([0x60,0x00,0x06,0x01, value]); break;
		
		case "fx2advcomptype": 			message = message.concat([0x60,0x00,0x06,0x02, value]); break;
		case "fx2advcompsustain": 		message = message.concat([0x60,0x00,0x06,0x03, value]); break;
		case "fx2advcompattack": 		message = message.concat([0x60,0x00,0x06,0x04, value]); break;
		case "fx2advcomptone": 			message = message.concat([0x60,0x00,0x06,0x05, value]); break;
		case "fx2advcomplevel": 		message = message.concat([0x60,0x00,0x06,0x06, value]); break;
		
		case "fx2limitertype": 			message = message.concat([0x60,0x00,0x06,0x07, value]); break;
		case "fx2limiterattack": 		message = message.concat([0x60,0x00,0x06,0x08, value]); break;
		case "fx2limiterthreshold": 	message = message.concat([0x60,0x00,0x06,0x09, value]); break;
		case "fx2limiterratio": 		message = message.concat([0x60,0x00,0x06,0x0a, value]); break;
		case "fx2limiterrelease": 		message = message.concat([0x60,0x00,0x06,0x0b, value]); break;
		case "fx2limiterlevel": 		message = message.concat([0x60,0x00,0x06,0x0c, value]); break;
		
		case "fx2twahmode": 			message = message.concat([0x60,0x00,0x06,0x0d, value]); break;
		case "fx2twahpolarity": 		message = message.concat([0x60,0x00,0x06,0x0e, value]); break;
		case "fx2twahsens": 			message = message.concat([0x60,0x00,0x06,0x0f, value]); break;
		case "fx2twahfrequency": 		message = message.concat([0x60,0x00,0x06,0x10, value]); break;
		case "fx2twahpeak": 			message = message.concat([0x60,0x00,0x06,0x11, value]); break;
		case "fx2twahdirectlev": 		message = message.concat([0x60,0x00,0x06,0x12, value]); break;
		case "fx2twaheffectlev": 		message = message.concat([0x60,0x00,0x06,0x13, value]); break;
		
		case "fx2autowahmode": 			message = message.concat([0x60,0x00,0x06,0x14, value]); break;
		case "fx2autowahfrequency": 	message = message.concat([0x60,0x00,0x06,0x15, value]); break;
		case "fx2autowahpeak": 			message = message.concat([0x60,0x00,0x06,0x16, value]); break;
		case "fx2autowahrate": 			message = message.concat([0x60,0x00,0x06,0x17, value]); break;
		case "fx2autowahdepth": 		message = message.concat([0x60,0x00,0x06,0x18, value]); break;
		case "fx2autowahdirectlev": 	message = message.concat([0x60,0x00,0x06,0x19, value]); break;
		case "fx2autowaheffectlev": 	message = message.concat([0x60,0x00,0x06,0x1a, value]); break;
		
		case "fx2tremolowaveshape":		message = message.concat([0x60,0x00,0x06,0x1b, value]); break;
		case "fx2tremolorate":			message = message.concat([0x60,0x00,0x06,0x1c, value]); break;
		case "fx2tremolodepth":			message = message.concat([0x60,0x00,0x06,0x1d, value]); break;
		
		case "fx2phasertype":			message = message.concat([0x60,0x00,0x06,0x1e, value]); break;
		case "fx2phaserrate":			message = message.concat([0x60,0x00,0x06,0x1f, value]); break;
		case "fx2phaserdepth":			message = message.concat([0x60,0x00,0x06,0x20, value]); break;
		case "fx2phasermanual":			message = message.concat([0x60,0x00,0x06,0x21, value]); break;
		case "fx2phaserresonance":		message = message.concat([0x60,0x00,0x06,0x22, value]); break;
		case "fx2phasersteprate":		message = message.concat([0x60,0x00,0x06,0x23, value]); break;
		case "fx2phasereffectlev":		message = message.concat([0x60,0x00,0x06,0x24, value]); break;
		case "fx2phaserdirectlev":		message = message.concat([0x60,0x00,0x06,0x25, value]); break;
		
		case "fx2flangerrate":			message = message.concat([0x60,0x00,0x06,0x26, value]); break;
		case "fx2flangerdepth":			message = message.concat([0x60,0x00,0x06,0x27, value]); break;
		case "fx2flangermanual":		message = message.concat([0x60,0x00,0x06,0x28, value]); break;
		case "fx2flangerresonance":		message = message.concat([0x60,0x00,0x06,0x29, value]); break;
		case "fx2flangerseparation":	message = message.concat([0x60,0x00,0x06,0x2a, value]); break;
		case "fx2flangerlowcut":		message = message.concat([0x60,0x00,0x06,0x2b, value]); break;
		case "fx2flangereffectlev":		message = message.concat([0x60,0x00,0x06,0x2c, value]); break;
		case "fx2flangerdirectlev":		message = message.concat([0x60,0x00,0x06,0x2d, value]); break;
		
		case "fx2pantype": 				message = message.concat([0x60,0x00,0x06,0x2e, value]); break;
		case "fx2panposition": 			message = message.concat([0x60,0x00,0x06,0x2f, value]); break;
		case "fx2panwaveshape": 		message = message.concat([0x60,0x00,0x06,0x30, value]); break;
		case "fx2panrate": 				message = message.concat([0x60,0x00,0x06,0x31, value]); break;
		case "fx2pandepth": 			message = message.concat([0x60,0x00,0x06,0x32, value]); break;
		
		case "fx2vibratorate": 			message = message.concat([0x60,0x00,0x06,0x33, value]); break;
		case "fx2vibratodepth": 		message = message.concat([0x60,0x00,0x06,0x34, value]); break;
		case "fx2vibratotrigger": 		message = message.concat([0x60,0x00,0x06,0x35, value]); break;
		case "fx2vibratorisetime": 		message = message.concat([0x60,0x00,0x06,0x36, value]); break;
		
		case "fx2univrate": 			message = message.concat([0x60,0x00,0x06,0x37, value]); break;
		case "fx2univdepth": 			message = message.concat([0x60,0x00,0x06,0x38, value]); break;
		case "fx2univlevel": 			message = message.concat([0x60,0x00,0x06,0x39, value]); break;
		
		case "fx2ringmodmode": 			message = message.concat([0x60,0x00,0x06,0x3a, value]); break;
		case "fx2ringmodfrequency": 	message = message.concat([0x60,0x00,0x06,0x3b, value]); break;
		case "fx2ringmoddirectlev": 	message = message.concat([0x60,0x00,0x06,0x3c, value]); break;
		case "fx2ringmodeffectlev": 	message = message.concat([0x60,0x00,0x06,0x3d, value]); break;
		
		case "fx2slowgearsens": 		message = message.concat([0x60,0x00,0x06,0x3e, value]); break;
		case "fx2slowgearrisetime": 	message = message.concat([0x60,0x00,0x06,0x3f, value]); break;
		
		case "fx2feedbackermode": 		message = message.concat([0x60,0x00,0x06,0x40, value]); break;
		case "fx2feedbackerrisetime": 	message = message.concat([0x60,0x00,0x06,0x41, value]); break;
		case "fx2feedbackerrisetup": 	message = message.concat([0x60,0x00,0x06,0x42, value]); break;
		case "fx2feedbackerfblevel": 	message = message.concat([0x60,0x00,0x06,0x43, value]); break;
		case "fx2feedbackerfblvup": 	message = message.concat([0x60,0x00,0x06,0x44, value]); break;
		case "fx2feedbackervibrate": 	message = message.concat([0x60,0x00,0x06,0x45, value]); break;
		case "fx2feedbackerdepth": 		message = message.concat([0x60,0x00,0x06,0x46, value]); break;
		
		case "fx2antifeedbackfreq1": 	message = message.concat([0x60,0x00,0x06,0x47, value]); break;
		case "fx2antifeedbackdepth1": 	message = message.concat([0x60,0x00,0x06,0x48, value]); break;
		case "fx2antifeedbackfreq2": 	message = message.concat([0x60,0x00,0x06,0x49, value]); break;
		case "fx2antifeedbackdepth2": 	message = message.concat([0x60,0x00,0x06,0x4a, value]); break;
		case "fx2antifeedbackfreq3": 	message = message.concat([0x60,0x00,0x06,0x4b, value]); break;
		case "fx2antifeedbackdepth3": 	message = message.concat([0x60,0x00,0x06,0x4c, value]); break;
		
		case "fx2humanizermode": 		message = message.concat([0x60,0x00,0x06,0x4d, value]); break;
		case "fx2humanizervowel1": 		message = message.concat([0x60,0x00,0x06,0x4e, value]); break;
		case "fx2humanizervowel2": 		message = message.concat([0x60,0x00,0x06,0x4f, value]); break;
		case "fx2humanizersens": 		message = message.concat([0x60,0x00,0x06,0x50, value]); break;
		case "fx2humanizerrate": 		message = message.concat([0x60,0x00,0x06,0x51, value]); break;
		case "fx2humanizerdepth": 		message = message.concat([0x60,0x00,0x06,0x52, value]); break;
		case "fx2humanizermanual": 		message = message.concat([0x60,0x00,0x06,0x53, value]); break;
		case "fx2humanizerlevel": 		message = message.concat([0x60,0x00,0x06,0x54, value]); break;
		
		case "fx2slicerpattern": 		message = message.concat([0x60,0x00,0x06,0x55, value]); break;
		case "fx2slicerrate": 			message = message.concat([0x60,0x00,0x06,0x56, value]); break;
		case "fx2slicertrigsens": 		message = message.concat([0x60,0x00,0x06,0x57, value]); break;
		
		case "fx2paraeqlowcut":			message = message.concat([0x60,0x00,0x06,0x58, value]); break;
		case "fx2paraeqlowgain":		message = message.concat([0x60,0x00,0x06,0x59, value]); break;
		case "fx2paraeqlomidf":			message = message.concat([0x60,0x00,0x06,0x5a, value]); break;
		case "fx2paraeqlomidq":			message = message.concat([0x60,0x00,0x06,0x5b, value]); break;
		case "fx2paraeqlomidg":			message = message.concat([0x60,0x00,0x06,0x5c, value]); break;
		case "fx2paraeqhimidf":			message = message.concat([0x60,0x00,0x06,0x5d, value]); break;
		case "fx2paraeqhimidq":			message = message.concat([0x60,0x00,0x06,0x5e, value]); break;
		case "fx2paraeqhimidg":			message = message.concat([0x60,0x00,0x06,0x5f, value]); break;
		case "fx2paraeqhigain":			message = message.concat([0x60,0x00,0x06,0x60, value]); break;
		case "fx2paraeqhicut":			message = message.concat([0x60,0x00,0x06,0x61, value]); break;
		case "fx2paraeqlevel":			message = message.concat([0x60,0x00,0x06,0x62, value]); break;
		
		case "fx2harmonistvoice": 				message = message.concat([0x60,0x00,0x06,0x63, value]); 		break;
		case "fx2harmonisthr1harm": 			message = message.concat([0x60,0x00,0x06,0x64, value]); 		break;
		case "fx2harmonisthr1predl": 
			value2 	= value >> 7; 
			value  	= value & 0x7f;
												message = message.concat([0x60,0x00,0x06,0x65, value2,value]); 	break;
		case "fx2harmonisthr1level": 			message = message.concat([0x60,0x00,0x06,0x67, value]); 		break;
		case "fx2harmonisthr2harm": 			message = message.concat([0x60,0x00,0x06,0x68, value]); 		break;
		case "fx2harmonisthr2predl":
			value2 	= value >> 7; 
			value  	= value & 0x7f;
												message = message.concat([0x60,0x00,0x06,0x69, value2,value]);	break;
		case "fx2harmonisthr2level": 			message = message.concat([0x60,0x00,0x06,0x6b, value]); 		break;
		case "fx2harmonisthr1fbk": 				message = message.concat([0x60,0x00,0x06,0x6c, value]); 		break;
		case "fx2harmonistdirectlev": 			message = message.concat([0x60,0x00,0x06,0x6d, value]); 		break;
		case "fx2harmonisthr1userscalekeyc": 	message = message.concat([0x60,0x00,0x06,0x6e, value]); 		break;
		case "fx2harmonisthr1userscalekeydb": 	message = message.concat([0x60,0x00,0x06,0x6f, value]); 		break;
		case "fx2harmonisthr1userscalekeyd": 	message = message.concat([0x60,0x00,0x06,0x70, value]); 		break;
		case "fx2harmonisthr1userscalekeyeb": 	message = message.concat([0x60,0x00,0x06,0x71, value]); 		break;
		case "fx2harmonisthr1userscalekeye": 	message = message.concat([0x60,0x00,0x06,0x72, value]); 		break;
		case "fx2harmonisthr1userscalekeyf": 	message = message.concat([0x60,0x00,0x06,0x73, value]); 		break;
		case "fx2harmonisthr1userscalekeyfs": 	message = message.concat([0x60,0x00,0x06,0x74, value]); 		break;
		case "fx2harmonisthr1userscalekeyg": 	message = message.concat([0x60,0x00,0x06,0x75, value]); 		break;
		case "fx2harmonisthr1userscalekeyab": 	message = message.concat([0x60,0x00,0x06,0x76, value]); 		break;
		case "fx2harmonisthr1userscalekeya": 	message = message.concat([0x60,0x00,0x06,0x77, value]); 		break;
		case "fx2harmonisthr1userscalekeybb": 	message = message.concat([0x60,0x00,0x06,0x78, value]); 		break;
		case "fx2harmonisthr1userscalekeyb": 	message = message.concat([0x60,0x00,0x06,0x79, value]); 		break;
		case "fx2harmonisthr2userscalekeyc": 	message = message.concat([0x60,0x00,0x06,0x7a, value]); 		break;
		case "fx2harmonisthr2userscalekeydb": 	message = message.concat([0x60,0x00,0x06,0x7b, value]); 		break;
		case "fx2harmonisthr2userscalekeyd": 	message = message.concat([0x60,0x00,0x06,0x7c, value]); 		break;
		case "fx2harmonisthr2userscalekeyeb": 	message = message.concat([0x60,0x00,0x06,0x7d, value]); 		break;
		case "fx2harmonisthr2userscalekeye": 	message = message.concat([0x60,0x00,0x06,0x7e, value]); 		break;
		case "fx2harmonisthr2userscalekeyf": 	message = message.concat([0x60,0x00,0x06,0x7f, value]); 		break;
		case "fx2harmonisthr2userscalekeyfs": 	message = message.concat([0x60,0x00,0x07,0x00, value]); 		break;
		case "fx2harmonisthr2userscalekeyg": 	message = message.concat([0x60,0x00,0x07,0x01, value]); 		break;
		case "fx2harmonisthr2userscalekeyab": 	message = message.concat([0x60,0x00,0x07,0x02, value]); 		break;
		case "fx2harmonisthr2userscalekeya": 	message = message.concat([0x60,0x00,0x07,0x03, value]); 		break;
		case "fx2harmonisthr2userscalekeybb": 	message = message.concat([0x60,0x00,0x07,0x04, value]); 		break;
		case "fx2harmonisthr2userscalekeyb": 	message = message.concat([0x60,0x00,0x07,0x05, value]); 		break;
		
		case "fx2pitchshiftervoice": 			message = message.concat([0x60,0x00,0x07,0x06, value]); break;
		case "fx2pitchshifterps1mode": 			message = message.concat([0x60,0x00,0x07,0x07, value]); break;
		case "fx2pitchshifterps1pitch": 		message = message.concat([0x60,0x00,0x07,0x08, value]); break;
		case "fx2pitchshifterps1fine": 			message = message.concat([0x60,0x00,0x07,0x09, value]); break;
		case "fx2pitchshifterps1predly":
			value2 	= value >> 7; 
			value  	= value & 0x7f;
												message = message.concat([0x60,0x00,0x07,0x0a, value2,value]); break;
		case "fx2pitchshifterps1level": 		message = message.concat([0x60,0x00,0x07,0x0c, value]); break;
		case "fx2pitchshifterps2mode": 			message = message.concat([0x60,0x00,0x07,0x0d, value]); break;
		case "fx2pitchshifterps2pitch": 		message = message.concat([0x60,0x00,0x07,0x0e, value]); break;
		case "fx2pitchshifterps2fine": 			message = message.concat([0x60,0x00,0x07,0x0f, value]); break;
		case "fx2pitchshifterps2predl":
			value2 	= value >> 7; 
			value  	= value & 0x7f;
												message = message.concat([0x60,0x00,0x07,0x10, value2,value]); break;
		case "fx2pitchshifterps2level": 		message = message.concat([0x60,0x00,0x07,0x12, value]); break;
		case "fx2pitchshifterps1fbk": 			message = message.concat([0x60,0x00,0x07,0x13, value]); break;
		case "fx2pitchshifterdirectlev": 		message = message.concat([0x60,0x00,0x07,0x14, value]); break;
		
		case "fx2octaverange": 					message = message.concat([0x60,0x00,0x07,0x15, value]); break;
		case "fx2octaveoctlevel": 				message = message.concat([0x60,0x00,0x07,0x16, value]); break;
		case "fx2octavedirectlev": 				message = message.concat([0x60,0x00,0x07,0x17, value]); break;
		
		case "fx2rotaryspeedsel": 				message = message.concat([0x60,0x00,0x07,0x18, value]); break;
		case "fx2rotaryrateslow": 				message = message.concat([0x60,0x00,0x07,0x19, value]); break;
		case "fx2rotaryratefast": 				message = message.concat([0x60,0x00,0x07,0x1a, value]); break;
		case "fx2rotaryrisetime": 				message = message.concat([0x60,0x00,0x07,0x1b, value]); break;
		case "fx2rotaryfalltime": 				message = message.concat([0x60,0x00,0x07,0x1c, value]); break;
		case "fx2rotarydepth": 					message = message.concat([0x60,0x00,0x07,0x1d, value]); break;
		
		case "fx22x2chorusxoverf": 				message = message.concat([0x60,0x00,0x07,0x1e, value]); break;
		case "fx22x2choruslorate": 				message = message.concat([0x60,0x00,0x07,0x1f, value]); break;
		case "fx22x2choruslodepth": 			message = message.concat([0x60,0x00,0x07,0x20, value]); break;
		case "fx22x2choruslopredly": 			message = message.concat([0x60,0x00,0x07,0x21, value]); break;
		case "fx22x2choruslolevel": 			message = message.concat([0x60,0x00,0x07,0x22, value]); break;
		case "fx22x2chorushirate": 				message = message.concat([0x60,0x00,0x07,0x23, value]); break;
		case "fx22x2chorushidepth": 			message = message.concat([0x60,0x00,0x07,0x24, value]); break;
		case "fx22x2chorushipredly": 			message = message.concat([0x60,0x00,0x07,0x25, value]); break;
		case "fx22x2chorushilevel": 			message = message.concat([0x60,0x00,0x07,0x26, value]); break;
		
		// VERIFICAR O INTERVALO DOS BYTES DO PRIMEIRO PARÂMETRO <<<<<<<<<<<<<<<<<<<<<<<<<
		case "fx2subdelaydlytime":
			value2 	= value >> 7; 
			value  	= value & 0x7f;
												message = message.concat([0x60,0x00,0x07,0x27, value2,value]); break;
		case "fx2subdelayfeedback": 			message = message.concat([0x60,0x00,0x07,0x29, value]); break;
		case "fx2subdelayhicut": 				message = message.concat([0x60,0x00,0x07,0x2a, value]); break;
		case "fx2subdelayeffectlev": 			message = message.concat([0x60,0x00,0x07,0x2b, value]); break;
		case "fx2subdelaydirectlev": 			message = message.concat([0x60,0x00,0x07,0x2c, value]); break;
		
		case "fx2defrettertone": 				message = message.concat([0x60,0x00,0x07,0x2d, value]); break;
		case "fx2defrettersens": 				message = message.concat([0x60,0x00,0x07,0x2e, value]); break;
		case "fx2defretterattack": 				message = message.concat([0x60,0x00,0x07,0x2f, value]); break;
		case "fx2defretterdepth": 				message = message.concat([0x60,0x00,0x07,0x30, value]); break;
		case "fx2defretterresonance": 			message = message.concat([0x60,0x00,0x07,0x31, value]); break;
		case "fx2defrettereffectlev": 			message = message.concat([0x60,0x00,0x07,0x32, value]); break;
		case "fx2defretterdirectlev": 			message = message.concat([0x60,0x00,0x07,0x33, value]); break;
		
		case "fx2sitarsimtone": 				message = message.concat([0x60,0x00,0x07,0x34, value]); break;
		case "fx2sitarsimsens": 				message = message.concat([0x60,0x00,0x07,0x35, value]); break;
		case "fx2sitarsimdepth": 				message = message.concat([0x60,0x00,0x07,0x36, value]); break;
		case "fx2sitarsimresonance": 			message = message.concat([0x60,0x00,0x07,0x37, value]); break;
		case "fx2sitarsimbuzz": 				message = message.concat([0x60,0x00,0x07,0x38, value]); break;
		case "fx2sitarsimeffectlev": 			message = message.concat([0x60,0x00,0x07,0x39, value]); break;
		case "fx2sitarsimdirectlev": 			message = message.concat([0x60,0x00,0x07,0x3a, value]); break;
		
		case "fx2wavesynthwave": 				message = message.concat([0x60,0x00,0x07,0x3b, value]); break;
		case "fx2wavesynthcutoff": 				message = message.concat([0x60,0x00,0x07,0x3c, value]); break;
		case "fx2wavesynthresonance": 			message = message.concat([0x60,0x00,0x07,0x3d, value]); break;
		case "fx2wavesynthfltsens": 			message = message.concat([0x60,0x00,0x07,0x3e, value]); break;
		case "fx2wavesynthfltdecay": 			message = message.concat([0x60,0x00,0x07,0x3f, value]); break;
		case "fx2wavesynthfltdepth": 			message = message.concat([0x60,0x00,0x07,0x40, value]); break;
		case "fx2wavesynthsynthlev": 			message = message.concat([0x60,0x00,0x07,0x41, value]); break;
		case "fx2wavesynthdirectlev": 			message = message.concat([0x60,0x00,0x07,0x42, value]); break;
		
		case "fx2guitarsynthwave": 				message = message.concat([0x60,0x00,0x07,0x43, value]); break;
		case "fx2guitarsynthsens": 				message = message.concat([0x60,0x00,0x07,0x44, value]); break;
		case "fx2guitarsynthchromatic": 		message = message.concat([0x60,0x00,0x07,0x45, value]); break;
		case "fx2guitarsynthoctshift": 			message = message.concat([0x60,0x00,0x07,0x46, value]); break;
		case "fx2guitarsynthpwmrate": 			message = message.concat([0x60,0x00,0x07,0x47, value]); break;
		case "fx2guitarsynthpwmdepth": 			message = message.concat([0x60,0x00,0x07,0x48, value]); break;
		case "fx2guitarsynthcutoff": 			message = message.concat([0x60,0x00,0x07,0x49, value]); break;
		case "fx2guitarsynthresonance": 		message = message.concat([0x60,0x00,0x07,0x4a, value]); break;
		case "fx2guitarsynthfltsens": 			message = message.concat([0x60,0x00,0x07,0x4b, value]); break;
		case "fx2guitarsynthfltdecay": 			message = message.concat([0x60,0x00,0x07,0x4c, value]); break;
		case "fx2guitarsynthfltdepth": 			message = message.concat([0x60,0x00,0x07,0x4d, value]); break;
		case "fx2guitarsynthattack": 			message = message.concat([0x60,0x00,0x07,0x4e, value]); break;
		case "fx2guitarsynthrelease": 			message = message.concat([0x60,0x00,0x07,0x4f, value]); break;
		case "fx2guitarsynthvelocity": 			message = message.concat([0x60,0x00,0x07,0x50, value]); break;
		case "fx2guitarsynthhold": 				message = message.concat([0x60,0x00,0x07,0x51, value]); break;
		case "fx2guitarsynthsynthlev": 			message = message.concat([0x60,0x00,0x07,0x52, value]); break;
		case "fx2guitarsynthdirectlev": 		message = message.concat([0x60,0x00,0x07,0x53, value]); break;
		
		case "fx2autoriffphrase": 					message = message.concat([0x60,0x00,0x07,0x54, value]); break;
		case "fx2autoriffloop": 					message = message.concat([0x60,0x00,0x07,0x55, value]); break;
		case "fx2autorifftempo": 					message = message.concat([0x60,0x00,0x07,0x56, value]); break;
		case "fx2autoriffsens": 					message = message.concat([0x60,0x00,0x07,0x57, value]); break;
		case "fx2autoriffattack": 					message = message.concat([0x60,0x00,0x07,0x58, value]); break;
		case "fx2autoriffhold": 					message = message.concat([0x60,0x00,0x07,0x59, value]); break;
		case "fx2autoriffeffectlev": 				message = message.concat([0x60,0x00,0x07,0x5a, value]); break;
		case "fx2autoriffdirectlev": 				message = message.concat([0x60,0x00,0x07,0x5b, value]); break;
		case "fx2autoriffuserphrasesetting1c": 		message = message.concat([0x60,0x00,0x07,0x5c, value]); break;
		case "fx2autoriffuserphrasesetting2c": 		message = message.concat([0x60,0x00,0x07,0x5d, value]); break;
		case "fx2autoriffuserphrasesetting3c": 		message = message.concat([0x60,0x00,0x07,0x5e, value]); break;
		case "fx2autoriffuserphrasesetting4c": 		message = message.concat([0x60,0x00,0x07,0x5f, value]); break;
		case "fx2autoriffuserphrasesetting5c": 		message = message.concat([0x60,0x00,0x07,0x60, value]); break;
		case "fx2autoriffuserphrasesetting6c": 		message = message.concat([0x60,0x00,0x07,0x61, value]); break;
		case "fx2autoriffuserphrasesetting7c": 		message = message.concat([0x60,0x00,0x07,0x62, value]); break;
		case "fx2autoriffuserphrasesetting8c": 		message = message.concat([0x60,0x00,0x07,0x63, value]); break;
		case "fx2autoriffuserphrasesetting9c": 		message = message.concat([0x60,0x00,0x07,0x64, value]); break;
		case "fx2autoriffuserphrasesetting10c": 	message = message.concat([0x60,0x00,0x07,0x65, value]); break;
		case "fx2autoriffuserphrasesetting11c": 	message = message.concat([0x60,0x00,0x07,0x66, value]); break;
		case "fx2autoriffuserphrasesetting12c": 	message = message.concat([0x60,0x00,0x07,0x67, value]); break;
		case "fx2autoriffuserphrasesetting13c": 	message = message.concat([0x60,0x00,0x07,0x68, value]); break;
		case "fx2autoriffuserphrasesetting14c": 	message = message.concat([0x60,0x00,0x07,0x69, value]); break;
		case "fx2autoriffuserphrasesetting15c": 	message = message.concat([0x60,0x00,0x07,0x6a, value]); break;
		case "fx2autoriffuserphrasesetting16c": 	message = message.concat([0x60,0x00,0x07,0x6b, value]); break;
		case "fx2autoriffuserphrasesetting1db": 	message = message.concat([0x60,0x00,0x07,0x6c, value]); break;
		case "fx2autoriffuserphrasesetting2db": 	message = message.concat([0x60,0x00,0x07,0x6d, value]); break;
		case "fx2autoriffuserphrasesetting3db": 	message = message.concat([0x60,0x00,0x07,0x6e, value]); break;
		case "fx2autoriffuserphrasesetting4db": 	message = message.concat([0x60,0x00,0x07,0x6f, value]); break;
		case "fx2autoriffuserphrasesetting5db": 	message = message.concat([0x60,0x00,0x07,0x70, value]); break;
		case "fx2autoriffuserphrasesetting6db": 	message = message.concat([0x60,0x00,0x07,0x71, value]); break;
		case "fx2autoriffuserphrasesetting7db": 	message = message.concat([0x60,0x00,0x07,0x72, value]); break;
		case "fx2autoriffuserphrasesetting8db": 	message = message.concat([0x60,0x00,0x07,0x73, value]); break;
		case "fx2autoriffuserphrasesetting9db": 	message = message.concat([0x60,0x00,0x07,0x74, value]); break;
		case "fx2autoriffuserphrasesetting10db": 	message = message.concat([0x60,0x00,0x07,0x75, value]); break;
		case "fx2autoriffuserphrasesetting11db": 	message = message.concat([0x60,0x00,0x07,0x76, value]); break;
		case "fx2autoriffuserphrasesetting12db": 	message = message.concat([0x60,0x00,0x07,0x77, value]); break;
		case "fx2autoriffuserphrasesetting13db": 	message = message.concat([0x60,0x00,0x07,0x78, value]); break;
		case "fx2autoriffuserphrasesetting14db": 	message = message.concat([0x60,0x00,0x07,0x79, value]); break;
		case "fx2autoriffuserphrasesetting15db": 	message = message.concat([0x60,0x00,0x07,0x7a, value]); break;
		case "fx2autoriffuserphrasesetting16db": 	message = message.concat([0x60,0x00,0x07,0x7b, value]); break;
		case "fx2autoriffuserphrasesetting1d": 		message = message.concat([0x60,0x00,0x07,0x7c, value]); break;
		case "fx2autoriffuserphrasesetting2d": 		message = message.concat([0x60,0x00,0x07,0x7d, value]); break;
		case "fx2autoriffuserphrasesetting3d": 		message = message.concat([0x60,0x00,0x07,0x7e, value]); break;
		case "fx2autoriffuserphrasesetting4d": 		message = message.concat([0x60,0x00,0x07,0x7f, value]); break;
		case "fx2autoriffuserphrasesetting5d": 		message = message.concat([0x60,0x00,0x08,0x00, value]); break;
		case "fx2autoriffuserphrasesetting6d": 		message = message.concat([0x60,0x00,0x08,0x01, value]); break;
		case "fx2autoriffuserphrasesetting7d": 		message = message.concat([0x60,0x00,0x08,0x02, value]); break;
		case "fx2autoriffuserphrasesetting8d": 		message = message.concat([0x60,0x00,0x08,0x03, value]); break;
		case "fx2autoriffuserphrasesetting9d": 		message = message.concat([0x60,0x00,0x08,0x04, value]); break;
		case "fx2autoriffuserphrasesetting10d": 	message = message.concat([0x60,0x00,0x08,0x05, value]); break;
		case "fx2autoriffuserphrasesetting11d": 	message = message.concat([0x60,0x00,0x08,0x06, value]); break;
		case "fx2autoriffuserphrasesetting12d": 	message = message.concat([0x60,0x00,0x08,0x07, value]); break;
		case "fx2autoriffuserphrasesetting13d": 	message = message.concat([0x60,0x00,0x08,0x08, value]); break;
		case "fx2autoriffuserphrasesetting14d": 	message = message.concat([0x60,0x00,0x08,0x09, value]); break;
		case "fx2autoriffuserphrasesetting15d": 	message = message.concat([0x60,0x00,0x08,0x0a, value]); break;
		case "fx2autoriffuserphrasesetting16d": 	message = message.concat([0x60,0x00,0x08,0x0b, value]); break;
		case "fx2autoriffuserphrasesetting1eb": 	message = message.concat([0x60,0x00,0x08,0x0c, value]); break;
		case "fx2autoriffuserphrasesetting2eb": 	message = message.concat([0x60,0x00,0x08,0x0d, value]); break;
		case "fx2autoriffuserphrasesetting3eb": 	message = message.concat([0x60,0x00,0x08,0x0e, value]); break;
		case "fx2autoriffuserphrasesetting4eb": 	message = message.concat([0x60,0x00,0x08,0x0f, value]); break;
		case "fx2autoriffuserphrasesetting5eb": 	message = message.concat([0x60,0x00,0x08,0x10, value]); break;
		case "fx2autoriffuserphrasesetting6eb": 	message = message.concat([0x60,0x00,0x08,0x11, value]); break;
		case "fx2autoriffuserphrasesetting7eb": 	message = message.concat([0x60,0x00,0x08,0x12, value]); break;
		case "fx2autoriffuserphrasesetting8eb": 	message = message.concat([0x60,0x00,0x08,0x13, value]); break;
		case "fx2autoriffuserphrasesetting9eb": 	message = message.concat([0x60,0x00,0x08,0x14, value]); break;
		case "fx2autoriffuserphrasesetting10eb": 	message = message.concat([0x60,0x00,0x08,0x15, value]); break;
		case "fx2autoriffuserphrasesetting11eb": 	message = message.concat([0x60,0x00,0x08,0x16, value]); break;
		case "fx2autoriffuserphrasesetting12eb": 	message = message.concat([0x60,0x00,0x08,0x17, value]); break;
		case "fx2autoriffuserphrasesetting13eb": 	message = message.concat([0x60,0x00,0x08,0x18, value]); break;
		case "fx2autoriffuserphrasesetting14eb": 	message = message.concat([0x60,0x00,0x08,0x19, value]); break;
		case "fx2autoriffuserphrasesetting15eb": 	message = message.concat([0x60,0x00,0x08,0x1a, value]); break;
		case "fx2autoriffuserphrasesetting16eb": 	message = message.concat([0x60,0x00,0x08,0x1b, value]); break;
		case "fx2autoriffuserphrasesetting1e": 		message = message.concat([0x60,0x00,0x08,0x1c, value]); break;
		case "fx2autoriffuserphrasesetting2e": 		message = message.concat([0x60,0x00,0x08,0x1d, value]); break;
		case "fx2autoriffuserphrasesetting3e": 		message = message.concat([0x60,0x00,0x08,0x1e, value]); break;
		case "fx2autoriffuserphrasesetting4e": 		message = message.concat([0x60,0x00,0x08,0x1f, value]); break;
		case "fx2autoriffuserphrasesetting5e": 		message = message.concat([0x60,0x00,0x08,0x20, value]); break;
		case "fx2autoriffuserphrasesetting6e": 		message = message.concat([0x60,0x00,0x08,0x21, value]); break;
		case "fx2autoriffuserphrasesetting7e": 		message = message.concat([0x60,0x00,0x08,0x22, value]); break;
		case "fx2autoriffuserphrasesetting8e": 		message = message.concat([0x60,0x00,0x08,0x23, value]); break;
		case "fx2autoriffuserphrasesetting9e": 		message = message.concat([0x60,0x00,0x08,0x24, value]); break;
		case "fx2autoriffuserphrasesetting10e": 	message = message.concat([0x60,0x00,0x08,0x25, value]); break;
		case "fx2autoriffuserphrasesetting11e": 	message = message.concat([0x60,0x00,0x08,0x26, value]); break;
		case "fx2autoriffuserphrasesetting12e": 	message = message.concat([0x60,0x00,0x08,0x27, value]); break;
		case "fx2autoriffuserphrasesetting13e": 	message = message.concat([0x60,0x00,0x08,0x28, value]); break;
		case "fx2autoriffuserphrasesetting14e": 	message = message.concat([0x60,0x00,0x08,0x29, value]); break;
		case "fx2autoriffuserphrasesetting15e": 	message = message.concat([0x60,0x00,0x08,0x2a, value]); break;
		case "fx2autoriffuserphrasesetting16e": 	message = message.concat([0x60,0x00,0x08,0x2b, value]); break;
		case "fx2autoriffuserphrasesetting1f": 		message = message.concat([0x60,0x00,0x08,0x2c, value]); break;
		case "fx2autoriffuserphrasesetting2f": 		message = message.concat([0x60,0x00,0x08,0x2d, value]); break;
		case "fx2autoriffuserphrasesetting3f": 		message = message.concat([0x60,0x00,0x08,0x2e, value]); break;
		case "fx2autoriffuserphrasesetting4f": 		message = message.concat([0x60,0x00,0x08,0x2f, value]); break;
		case "fx2autoriffuserphrasesetting5f": 		message = message.concat([0x60,0x00,0x08,0x30, value]); break;
		case "fx2autoriffuserphrasesetting6f": 		message = message.concat([0x60,0x00,0x08,0x31, value]); break;
		case "fx2autoriffuserphrasesetting7f": 		message = message.concat([0x60,0x00,0x08,0x32, value]); break;
		case "fx2autoriffuserphrasesetting8f": 		message = message.concat([0x60,0x00,0x08,0x33, value]); break;
		case "fx2autoriffuserphrasesetting9f": 		message = message.concat([0x60,0x00,0x08,0x34, value]); break;
		case "fx2autoriffuserphrasesetting10f": 	message = message.concat([0x60,0x00,0x08,0x35, value]); break;
		case "fx2autoriffuserphrasesetting11f": 	message = message.concat([0x60,0x00,0x08,0x36, value]); break;
		case "fx2autoriffuserphrasesetting12f": 	message = message.concat([0x60,0x00,0x08,0x37, value]); break;
		case "fx2autoriffuserphrasesetting13f": 	message = message.concat([0x60,0x00,0x08,0x38, value]); break;
		case "fx2autoriffuserphrasesetting14f": 	message = message.concat([0x60,0x00,0x08,0x39, value]); break;
		case "fx2autoriffuserphrasesetting15f": 	message = message.concat([0x60,0x00,0x08,0x3a, value]); break;
		case "fx2autoriffuserphrasesetting16f": 	message = message.concat([0x60,0x00,0x08,0x3b, value]); break;
		case "fx2autoriffuserphrasesetting1fs": 	message = message.concat([0x60,0x00,0x08,0x3c, value]); break;
		case "fx2autoriffuserphrasesetting2fs": 	message = message.concat([0x60,0x00,0x08,0x3d, value]); break;
		case "fx2autoriffuserphrasesetting3fs": 	message = message.concat([0x60,0x00,0x08,0x3e, value]); break;
		case "fx2autoriffuserphrasesetting4fs": 	message = message.concat([0x60,0x00,0x08,0x3f, value]); break;
		case "fx2autoriffuserphrasesetting5fs": 	message = message.concat([0x60,0x00,0x08,0x40, value]); break;
		case "fx2autoriffuserphrasesetting6fs": 	message = message.concat([0x60,0x00,0x08,0x41, value]); break;
		case "fx2autoriffuserphrasesetting7fs": 	message = message.concat([0x60,0x00,0x08,0x42, value]); break;
		case "fx2autoriffuserphrasesetting8fs": 	message = message.concat([0x60,0x00,0x08,0x43, value]); break;
		case "fx2autoriffuserphrasesetting9fs": 	message = message.concat([0x60,0x00,0x08,0x44, value]); break;
		case "fx2autoriffuserphrasesetting10fs": 	message = message.concat([0x60,0x00,0x08,0x45, value]); break;
		case "fx2autoriffuserphrasesetting11fs": 	message = message.concat([0x60,0x00,0x08,0x46, value]); break;
		case "fx2autoriffuserphrasesetting12fs": 	message = message.concat([0x60,0x00,0x08,0x47, value]); break;
		case "fx2autoriffuserphrasesetting13fs": 	message = message.concat([0x60,0x00,0x08,0x48, value]); break;
		case "fx2autoriffuserphrasesetting14fs": 	message = message.concat([0x60,0x00,0x08,0x49, value]); break;
		case "fx2autoriffuserphrasesetting15fs": 	message = message.concat([0x60,0x00,0x08,0x4a, value]); break;
		case "fx2autoriffuserphrasesetting16fs": 	message = message.concat([0x60,0x00,0x08,0x4b, value]); break;
		case "fx2autoriffuserphrasesetting1g": 		message = message.concat([0x60,0x00,0x08,0x4c, value]); break;
		case "fx2autoriffuserphrasesetting2g": 		message = message.concat([0x60,0x00,0x08,0x4d, value]); break;
		case "fx2autoriffuserphrasesetting3g": 		message = message.concat([0x60,0x00,0x08,0x4e, value]); break;
		case "fx2autoriffuserphrasesetting4g": 		message = message.concat([0x60,0x00,0x08,0x4f, value]); break;
		case "fx2autoriffuserphrasesetting5g": 		message = message.concat([0x60,0x00,0x08,0x50, value]); break;
		case "fx2autoriffuserphrasesetting6g": 		message = message.concat([0x60,0x00,0x08,0x51, value]); break;
		case "fx2autoriffuserphrasesetting7g": 		message = message.concat([0x60,0x00,0x08,0x52, value]); break;
		case "fx2autoriffuserphrasesetting8g": 		message = message.concat([0x60,0x00,0x08,0x53, value]); break;
		case "fx2autoriffuserphrasesetting9g": 		message = message.concat([0x60,0x00,0x08,0x54, value]); break;
		case "fx2autoriffuserphrasesetting10g": 	message = message.concat([0x60,0x00,0x08,0x55, value]); break;
		case "fx2autoriffuserphrasesetting11g": 	message = message.concat([0x60,0x00,0x08,0x56, value]); break;
		case "fx2autoriffuserphrasesetting12g": 	message = message.concat([0x60,0x00,0x08,0x57, value]); break;
		case "fx2autoriffuserphrasesetting13g": 	message = message.concat([0x60,0x00,0x08,0x58, value]); break;
		case "fx2autoriffuserphrasesetting14g": 	message = message.concat([0x60,0x00,0x08,0x59, value]); break;
		case "fx2autoriffuserphrasesetting15g": 	message = message.concat([0x60,0x00,0x08,0x5a, value]); break;
		case "fx2autoriffuserphrasesetting16g": 	message = message.concat([0x60,0x00,0x08,0x5b, value]); break;
		case "fx2autoriffuserphrasesetting1ab": 	message = message.concat([0x60,0x00,0x08,0x5c, value]); break;
		case "fx2autoriffuserphrasesetting2ab": 	message = message.concat([0x60,0x00,0x08,0x5d, value]); break;
		case "fx2autoriffuserphrasesetting3ab": 	message = message.concat([0x60,0x00,0x08,0x5e, value]); break;
		case "fx2autoriffuserphrasesetting4ab": 	message = message.concat([0x60,0x00,0x08,0x5f, value]); break;
		case "fx2autoriffuserphrasesetting5ab": 	message = message.concat([0x60,0x00,0x08,0x60, value]); break;
		case "fx2autoriffuserphrasesetting6ab": 	message = message.concat([0x60,0x00,0x08,0x61, value]); break;
		case "fx2autoriffuserphrasesetting7ab": 	message = message.concat([0x60,0x00,0x08,0x62, value]); break;
		case "fx2autoriffuserphrasesetting8ab": 	message = message.concat([0x60,0x00,0x08,0x63, value]); break;
		case "fx2autoriffuserphrasesetting9ab": 	message = message.concat([0x60,0x00,0x08,0x64, value]); break;
		case "fx2autoriffuserphrasesetting10ab": 	message = message.concat([0x60,0x00,0x08,0x65, value]); break;
		case "fx2autoriffuserphrasesetting11ab": 	message = message.concat([0x60,0x00,0x08,0x66, value]); break;
		case "fx2autoriffuserphrasesetting12ab": 	message = message.concat([0x60,0x00,0x08,0x67, value]); break;
		case "fx2autoriffuserphrasesetting13ab": 	message = message.concat([0x60,0x00,0x08,0x68, value]); break;
		case "fx2autoriffuserphrasesetting14ab": 	message = message.concat([0x60,0x00,0x08,0x69, value]); break;
		case "fx2autoriffuserphrasesetting15ab": 	message = message.concat([0x60,0x00,0x08,0x6a, value]); break;
		case "fx2autoriffuserphrasesetting16ab": 	message = message.concat([0x60,0x00,0x08,0x6b, value]); break;
		case "fx2autoriffuserphrasesetting1a": 		message = message.concat([0x60,0x00,0x08,0x6c, value]); break;
		case "fx2autoriffuserphrasesetting2a": 		message = message.concat([0x60,0x00,0x08,0x6d, value]); break;
		case "fx2autoriffuserphrasesetting3a": 		message = message.concat([0x60,0x00,0x08,0x6e, value]); break;
		case "fx2autoriffuserphrasesetting4a": 		message = message.concat([0x60,0x00,0x08,0x6f, value]); break;
		case "fx2autoriffuserphrasesetting5a": 		message = message.concat([0x60,0x00,0x08,0x70, value]); break;
		case "fx2autoriffuserphrasesetting6a": 		message = message.concat([0x60,0x00,0x08,0x71, value]); break;
		case "fx2autoriffuserphrasesetting7a": 		message = message.concat([0x60,0x00,0x08,0x72, value]); break;
		case "fx2autoriffuserphrasesetting8a": 		message = message.concat([0x60,0x00,0x08,0x73, value]); break;
		case "fx2autoriffuserphrasesetting9a": 		message = message.concat([0x60,0x00,0x08,0x74, value]); break;
		case "fx2autoriffuserphrasesetting10a": 	message = message.concat([0x60,0x00,0x08,0x75, value]); break;
		case "fx2autoriffuserphrasesetting11a": 	message = message.concat([0x60,0x00,0x08,0x76, value]); break;
		case "fx2autoriffuserphrasesetting12a": 	message = message.concat([0x60,0x00,0x08,0x77, value]); break;
		case "fx2autoriffuserphrasesetting13a": 	message = message.concat([0x60,0x00,0x08,0x78, value]); break;
		case "fx2autoriffuserphrasesetting14a": 	message = message.concat([0x60,0x00,0x08,0x79, value]); break;
		case "fx2autoriffuserphrasesetting15a": 	message = message.concat([0x60,0x00,0x08,0x7a, value]); break;
		case "fx2autoriffuserphrasesetting16a": 	message = message.concat([0x60,0x00,0x08,0x7b, value]); break;
		case "fx2autoriffuserphrasesetting1bb": 	message = message.concat([0x60,0x00,0x08,0x7c, value]); break;
		case "fx2autoriffuserphrasesetting2bb": 	message = message.concat([0x60,0x00,0x08,0x7d, value]); break;
		case "fx2autoriffuserphrasesetting3bb": 	message = message.concat([0x60,0x00,0x08,0x7e, value]); break;
		case "fx2autoriffuserphrasesetting4bb": 	message = message.concat([0x60,0x00,0x08,0x7f, value]); break;
		case "fx2autoriffuserphrasesetting5bb": 	message = message.concat([0x60,0x00,0x09,0x00, value]); break;
		case "fx2autoriffuserphrasesetting6bb": 	message = message.concat([0x60,0x00,0x09,0x01, value]); break;
		case "fx2autoriffuserphrasesetting7bb": 	message = message.concat([0x60,0x00,0x09,0x02, value]); break;
		case "fx2autoriffuserphrasesetting8bb": 	message = message.concat([0x60,0x00,0x09,0x03, value]); break;
		case "fx2autoriffuserphrasesetting9bb": 	message = message.concat([0x60,0x00,0x09,0x04, value]); break;
		case "fx2autoriffuserphrasesetting10bb": 	message = message.concat([0x60,0x00,0x09,0x05, value]); break;
		case "fx2autoriffuserphrasesetting11bb": 	message = message.concat([0x60,0x00,0x09,0x06, value]); break;
		case "fx2autoriffuserphrasesetting12bb": 	message = message.concat([0x60,0x00,0x09,0x07, value]); break;
		case "fx2autoriffuserphrasesetting13bb": 	message = message.concat([0x60,0x00,0x09,0x08, value]); break;
		case "fx2autoriffuserphrasesetting14bb": 	message = message.concat([0x60,0x00,0x09,0x09, value]); break;
		case "fx2autoriffuserphrasesetting15bb": 	message = message.concat([0x60,0x00,0x09,0x0a, value]); break;
		case "fx2autoriffuserphrasesetting16bb": 	message = message.concat([0x60,0x00,0x09,0x0b, value]); break;
		case "fx2autoriffuserphrasesetting1b": 		message = message.concat([0x60,0x00,0x09,0x0c, value]); break;
		case "fx2autoriffuserphrasesetting2b": 		message = message.concat([0x60,0x00,0x09,0x0d, value]); break;
		case "fx2autoriffuserphrasesetting3b": 		message = message.concat([0x60,0x00,0x09,0x0e, value]); break;
		case "fx2autoriffuserphrasesetting4b": 		message = message.concat([0x60,0x00,0x09,0x0f, value]); break;
		case "fx2autoriffuserphrasesetting5b": 		message = message.concat([0x60,0x00,0x09,0x10, value]); break;
		case "fx2autoriffuserphrasesetting6b": 		message = message.concat([0x60,0x00,0x09,0x11, value]); break;
		case "fx2autoriffuserphrasesetting7b": 		message = message.concat([0x60,0x00,0x09,0x12, value]); break;
		case "fx2autoriffuserphrasesetting8b": 		message = message.concat([0x60,0x00,0x09,0x13, value]); break;
		case "fx2autoriffuserphrasesetting9b": 		message = message.concat([0x60,0x00,0x09,0x14, value]); break;
		case "fx2autoriffuserphrasesetting10b": 	message = message.concat([0x60,0x00,0x09,0x15, value]); break;
		case "fx2autoriffuserphrasesetting11b": 	message = message.concat([0x60,0x00,0x09,0x16, value]); break;
		case "fx2autoriffuserphrasesetting12b": 	message = message.concat([0x60,0x00,0x09,0x17, value]); break;
		case "fx2autoriffuserphrasesetting13b": 	message = message.concat([0x60,0x00,0x09,0x18, value]); break;
		case "fx2autoriffuserphrasesetting14b": 	message = message.concat([0x60,0x00,0x09,0x19, value]); break;
		case "fx2autoriffuserphrasesetting15b": 	message = message.concat([0x60,0x00,0x09,0x1a, value]); break;
		case "fx2autoriffuserphrasesetting16b": 	message = message.concat([0x60,0x00,0x09,0x1b, value]); break;
		
		case "fx2soundholdhold": 					message = message.concat([0x60,0x00,0x09,0x1c, value]); break;
		case "fx2soundholdrisetime": 				message = message.concat([0x60,0x00,0x09,0x1d, value]); break;
		case "fx2soundholdeffectlev": 				message = message.concat([0x60,0x00,0x09,0x1e, value]); break;
		
		case "fx2tonemodifytype":		message = message.concat([0x60,0x00,0x09,0x1f, value]); break;
		case "fx2tonemodifyresonance":	message = message.concat([0x60,0x00,0x09,0x20, value]); break;
		case "fx2tonemodifylow":		message = message.concat([0x60,0x00,0x09,0x21, value]); break;
		case "fx2tonemodifyhigh":		message = message.concat([0x60,0x00,0x09,0x22, value]); break;
		case "fx2tonemodifylevel":		message = message.concat([0x60,0x00,0x09,0x23, value]); break;

		case "fx2guitarsimtype": 		message = message.concat([0x60,0x00,0x09,0x24, value]); break;
		case "fx2guitarsimresonance": 	message = message.concat([0x60,0x00,0x09,0x25, value]); break;
		case "fx2guitarsimlow": 		message = message.concat([0x60,0x00,0x09,0x26, value]); break;
		case "fx2guitarsimhigh": 		message = message.concat([0x60,0x00,0x09,0x27, value]); break;
		case "fx2guitarsimlevel": 		message = message.concat([0x60,0x00,0x09,0x28, value]); break;
		
		case "fx2acprocessortype":		message = message.concat([0x60,0x00,0x09,0x29, value]); break;
		case "fx2acprocessorbass":		message = message.concat([0x60,0x00,0x09,0x2a, value]); break;
		case "fx2acprocessormiddle":	message = message.concat([0x60,0x00,0x09,0x2b, value]); break;
		case "fx2acprocessormiddlef":	message = message.concat([0x60,0x00,0x09,0x2c, value]); break;
		case "fx2acprocessortreble":	message = message.concat([0x60,0x00,0x09,0x2d, value]); break;
		case "fx2acprocessorpresence":	message = message.concat([0x60,0x00,0x09,0x2e, value]); break;
		case "fx2acprocessorlevel":		message = message.concat([0x60,0x00,0x09,0x2f, value]); break;
		
		case "fx2subwahtype": 			message = message.concat([0x60,0x00,0x09,0x30, value]); break;
		case "fx2subwahpos": 			message = message.concat([0x60,0x00,0x09,0x31, value]); break;
		case "fx2subwahmin": 			message = message.concat([0x60,0x00,0x09,0x32, value]); break;
		case "fx2subwahmax": 			message = message.concat([0x60,0x00,0x09,0x33, value]); break;
		case "fx2subwaheffectlev": 		message = message.concat([0x60,0x00,0x09,0x34, value]); break;
		case "fx2subwahdirectlev": 		message = message.concat([0x60,0x00,0x09,0x35, value]); break;

		case "fx2graphiceqlevel":		message = message.concat([0x60,0x00,0x09,0x36, value]); break;
		case "fx2graphiceq31":			message = message.concat([0x60,0x00,0x09,0x37, value]); break;
		case "fx2graphiceq62":			message = message.concat([0x60,0x00,0x09,0x38, value]); break;
		case "fx2graphiceq125":			message = message.concat([0x60,0x00,0x09,0x39, value]); break;
		case "fx2graphiceq250":			message = message.concat([0x60,0x00,0x09,0x3a, value]); break;
		case "fx2graphiceq500":			message = message.concat([0x60,0x00,0x09,0x3b, value]); break;
		case "fx2graphiceq1k":			message = message.concat([0x60,0x00,0x09,0x3c, value]); break;
		case "fx2graphiceq2k":			message = message.concat([0x60,0x00,0x09,0x3d, value]); break;
		case "fx2graphiceq4k":			message = message.concat([0x60,0x00,0x09,0x3e, value]); break;
		case "fx2graphiceq8k":			message = message.concat([0x60,0x00,0x09,0x3f, value]); break;
		case "fx2graphiceq16k":			message = message.concat([0x60,0x00,0x09,0x40, value]); break;
		
		
		//
		// Delay
		//
		case "delaysw":			message = message.concat([0x60,0x00,0x0a,0x00, value]); 		break;
		case "delaytype":		message = message.concat([0x60,0x00,0x0a,0x01, value]); 		break;
		case "delaydlytime":
			value2 	= value >> 7; 
			value  	= value & 0x7f;
								message = message.concat([0x60,0x00,0x0a,0x02, value2,value]);	break;
		case "delaytaptime":	message = message.concat([0x60,0x00,0x0a,0x04, value]); 		break;
		case "delayfeedback":	message = message.concat([0x60,0x00,0x0a,0x05, value]); 		break;
		case "delayhighcut":	message = message.concat([0x60,0x00,0x0a,0x06, value]); 		break;
		case "delayd1time":
			value2 	= value >> 7;
			value  	= value & 0x7f;
								message = message.concat([0x60,0x00,0x0a,0x07, value2,value]);	break;
		case "delayd1fbk":		message = message.concat([0x60,0x00,0x0a,0x09, value]); 		break;
		case "delayd1hicut":	message = message.concat([0x60,0x00,0x0a,0x0a, value]); 		break;
		case "delayd1level":	message = message.concat([0x60,0x00,0x0a,0x0b, value]); 		break;
		case "delayd2time":
			value2 	= value >> 7;
			value  	= value & 0x7f;
								message = message.concat([0x60,0x00,0x0a,0x0c, value2,value]);	break;
		case "delayd2fbk":		message = message.concat([0x60,0x00,0x0a,0x0e, value]); 		break;
		case "delayd2hicut":	message = message.concat([0x60,0x00,0x0a,0x0f, value]); 		break;
		case "delayd2level":	message = message.concat([0x60,0x00,0x0a,0x10, value]); 		break;
		case "delaywarpsw":		message = message.concat([0x60,0x00,0x0a,0x11, value]); 		break;
		case "delayrisetime":	message = message.concat([0x60,0x00,0x0a,0x12, value]); 		break;
		case "delayfbdepth":	message = message.concat([0x60,0x00,0x0a,0x13, value]); 		break;
		case "delayleveldep":	message = message.concat([0x60,0x00,0x0a,0x14, value]); 		break;
		case "delaymodrate":	message = message.concat([0x60,0x00,0x0a,0x15, value]); 		break;
		case "delaymoddepth":	message = message.concat([0x60,0x00,0x0a,0x16, value]); 		break;
		case "delayeffectlev":	message = message.concat([0x60,0x00,0x0a,0x17, value]); 		break;
		case "delaydirectlev":	message = message.concat([0x60,0x00,0x0a,0x18, value]); 		break;
		
		
		//
		// Chorus
		//
		case "chorussw":				message = message.concat([0x60,0x00,0x0a,0x20, value]); break;
		case "chorusmode":				message = message.concat([0x60,0x00,0x0a,0x21, value]); break;
		case "chorusrate":				message = message.concat([0x60,0x00,0x0a,0x22, value]); break;
		case "chorusdepth":				message = message.concat([0x60,0x00,0x0a,0x23, value]); break;
		case "choruspredelay":			message = message.concat([0x60,0x00,0x0a,0x24, value]); break;
		case "choruslowcut":			message = message.concat([0x60,0x00,0x0a,0x25, value]); break;
		case "chorushighcut":			message = message.concat([0x60,0x00,0x0a,0x26, value]); break;
		case "choruseffectlev":			message = message.concat([0x60,0x00,0x0a,0x27, value]); break;
		
		//
		// Reverb
		//
		case "reverbsw":				message = message.concat([0x60,0x00,0x0a,0x30, value]); 			break;
		case "reverbtype":				message = message.concat([0x60,0x00,0x0a,0x31, value]); 			break;
		case "reverbtime":				message = message.concat([0x60,0x00,0x0a,0x32, value]); 			break;
		case "reverbpredelay":
			value2 	= value >> 7;
			value  	= value & 0x7f;
										message = message.concat([0x60,0x00,0x0a,0x3a, value2,value]); 		break;
		case "reverblowcut":			message = message.concat([0x60,0x00,0x0a,0x34, value]); 			break;
		case "reverbhighcut":			message = message.concat([0x60,0x00,0x0a,0x35, value]); 			break;
		case "reverbdensity":			message = message.concat([0x60,0x00,0x0a,0x36, value]); 			break;
		case "reverbeffectlev":			message = message.concat([0x60,0x00,0x0a,0x37, value]); 			break;
		case "reverbdirectlev":			message = message.concat([0x60,0x00,0x0a,0x38, value]); 			break;
		case "reverbsprgsens":			message = message.concat([0x60,0x00,0x0a,0x39, value]); 			break;
		
		//
		// Pdl
		//
		case "pdlsw":					message = message.concat([0x60,0x00,0x0a,0x40, value]); break;
		
		//
		// Master
		//
		case "masterpatchlevel":		message = message.concat([0x60,0x00,0x0a,0x60, value]); 		break;
		case "masterlow":				message = message.concat([0x60,0x00,0x0a,0x61, value]); 		break;
		case "mastermidg":				message = message.concat([0x60,0x00,0x0a,0x62, value]); 		break;
		case "mastermidq":				message = message.concat([0x60,0x00,0x0a,0x63, value]); 		break;
		case "mastermidf":				message = message.concat([0x60,0x00,0x0a,0x64, value]); 		break;
		case "masterhigh":				message = message.concat([0x60,0x00,0x0a,0x65, value]); 		break;
		case "masterbpm":
			value2 = value >> 7;
			value  = value & 0x7f;
										message = message.concat([0x60,0x00,0x0a,0x66, value2,value]); 	break;
		case "masterkey":				message = message.concat([0x60,0x00,0x0a,0x68, value]); 		break;
		
		//
		// Amp Control
		//
		case "ampcontrol":				message = message.concat([0x60,0x00,0x0a,0x69, value]); 		break;
		
		
		//
		// NS 1 e 2
		//
		case "noisesupressor1sw":			message = message.concat([0x60,0x00,0x0a,0x71, value]); break;
		case "noisesupressor1threshold":	message = message.concat([0x60,0x00,0x0a,0x72, value]); break;
		case "noisesupressor1release":		message = message.concat([0x60,0x00,0x0a,0x73, value]); break;
		case "noisesupressor1detect":		message = message.concat([0x60,0x00,0x0a,0x74, value]); break;
		case "noisesupressor2sw":			message = message.concat([0x60,0x00,0x0a,0x75, value]); break;
		case "noisesupressor2threshold":	message = message.concat([0x60,0x00,0x0a,0x76, value]); break;
		case "noisesupressor2release":		message = message.concat([0x60,0x00,0x0a,0x77, value]); break;
		case "noisesupressor2detect":		message = message.concat([0x60,0x00,0x0a,0x78, value]); break;
		
		//
		// Send/Return
		//
		case "sendreturnsw":			message = message.concat([0x60,0x00,0x0a,0x79, value]); break;
		case "sendreturnmode":			message = message.concat([0x60,0x00,0x0a,0x7a, value]); break;
		case "sendreturnsendlev":		message = message.concat([0x60,0x00,0x0a,0x7b, value]); break;
		case "sendreturnreturnlev":		message = message.concat([0x60,0x00,0x0a,0x7c, value]); break;
		
		//
		// Fx Chain
		//
		// Usar a função SetFxChain ou RandomFxChain
		
		//
		// Assign
		//
		
		//
		// CTRL 1 e 2
		//
		
		//
		// Quick Setting
		//

		default: return;
	}
	
	message.push(CheckSum(message));
	message.push(0xf7);
	
	if (DebugMode) {
		console.log(parameter+"="+value);
		console.log("MIDI:"+message);
	}
	if (MidiOutput)
		MidiOutput.send(message);
}

//** Altera parâmetros com valores aleatórios ns gt10
function RandomParameter(param, level) {
	var value;
	var preamp = 'A';
	
	param = param.toLowerCase();
	
	switch(param){
		case "compressor":
			switch(level) {
				case "All":
					value = rand(0,1);  SetParameter('CompressorType', value);
						if (value == 0) document.getElementById('CompressorTypeCompressor').checked = true;
						else 			document.getElementById('CompressorTypeLimiter').checked = true;
				case "Except Type":
					value = rand(0,100);  SetParameter('CompressorSustain', value);     	document.getElementById('CompressorSustain').value = value;		document.getElementById('compressorSustain').value = value;
					value = rand(0,100);  SetParameter('CompressorAttack', value);     		document.getElementById('CompressorAttack').value = value;		document.getElementById('compressorAttack').value = value;
					value = rand(0,100);  SetParameter('CompressorThreshold', value);   	document.getElementById('CompressorThreshold').value = value;	document.getElementById('compressorThreshold').value = value;
					value = rand(0,100);  SetParameter('CompressorRelease', value);     	document.getElementById('CompressorRelease').value = value;		document.getElementById('compressorRelease').value = value;
					value = rand(0,100);  SetParameter('CompressorTone', value);     		document.getElementById('CompressorTone').value = value-50;		document.getElementById('compressorTone').value = value-50;
			}
			break;
		
		case "odds":
			switch(level) {
				case "All":
					value = rand(0,25);  SetParameter('OddsType', value);     		document.getElementById('OddsType').value = value;
					
				case "Except Type":
					value = rand(0,7);   SetParameter('OddsCustomType', value);     document.getElementById('OddsCustomType').value = value;
					
				case "Eq+Drive":
					value = rand(0,120); SetParameter('OddsDrive', value);     		document.getElementById('OddsDrive').value = value; 			document.getElementById('oddsDrive').value = value;
					
				case "Eq":
					value = rand(0,100); SetParameter('OddsBottom', value);     	document.getElementById('OddsBottom').value = value-50; 		document.getElementById('oddsBottom').value = value-50;
					value = rand(0,100); SetParameter('OddsTone', value);       	document.getElementById('OddsTone').value = value-50; 			document.getElementById('oddsTone').value = value-50;
					//value = rand(0,100); SetParameter('OddsEffectLev', value);  	document.getElementById('OddsEffectLev').value = value; 		document.getElementById('oddsEffectLev').value = value;
					//value = rand(0,100); SetParameter('OddsDirectLev', value);  	document.getElementById('OddsDirectLev').value = value; 		document.getElementById('oddsDirectLev').value = value;
					value = rand(0,1);   SetParameter('OddsSoloSw', value); 		document.getElementById('OddsSoloSw').checked = value;
					value = rand(0,100); SetParameter('OddsSoloLevel', value); 		document.getElementById('OddsSoloLevel').value = value; 		document.getElementById('oddsSoloLevel').value = value;
					value = rand(0,100); SetParameter('OddsCustomBottom', value);   document.getElementById('OddsCustomBottom').value = value-50; 	document.getElementById('oddsCustomBottom').value = value-50;
					value = rand(0,100); SetParameter('OddsCustomTop', value);     	document.getElementById('OddsCustomTop').value = value-50; 		document.getElementById('oddsCustomTop').value = value-50;
					value = rand(0,100); SetParameter('OddsCustomLow', value);     	document.getElementById('OddsCustomLow').value = value-50; 		document.getElementById('oddsCustomLow').value = value-50;
					value = rand(0,100); SetParameter('OddsCustomHigh', value);    	document.getElementById('OddsCustomHigh').value = value-50; 	document.getElementById('oddsCustomHigh').value = value-50;
					break;
			}
			break;
		
		case "preampb":
			preamp = 'B';
		case "preampa":
			switch(level){
				case "All":
					value = rand(0,9);   SetParameter('Speaker'+preamp+'SpType', value); 		document.getElementById('Speaker'+preamp+'SpType').value = value;
					value = rand(0,4);   SetParameter('Speaker'+preamp+'MicType', value); 		document.getElementById('Speaker'+preamp+'MicType').value = value;
					value = rand(0,1);   SetParameter('Speaker'+preamp+'MicDis', value); 		
										 if (value == 0) document.getElementById('Speaker'+preamp+'MicDisOff').checked = true;
										 else 			 document.getElementById('Speaker'+preamp+'MicDisOn').checked  = true;
					value = rand(0,10);  SetParameter('Speaker'+preamp+'MicPos', value); 		document.getElementById('Speaker'+preamp+'MicPos').value = value;		document.getElementById('speaker'+preamp+'MicPos').value = value;
					value = rand(0,100); SetParameter('Speaker'+preamp+'MicLevel', value); 		document.getElementById('Speaker'+preamp+'MicLevel').value = value;     document.getElementById('speaker'+preamp+'MicLevel').value = value;
					value = rand(0,100); SetParameter('Speaker'+preamp+'DirectLevel', value); 	document.getElementById('Speaker'+preamp+'DirectLevel').value = value;  document.getElementById('speaker'+preamp+'DirectLevel').value = value;

				case "Except Mic":
					value = rand(0x00,0x28); SetParameter('Preamp'+preamp+'Type', value); 		document.getElementById('Preamp'+preamp+'Type').value = value;
					value = rand(0,1);		 SetParameter('Preamp'+preamp+'Bright', value); 	document.getElementById('Preamp'+preamp+'Bright').checked = value;
					value = rand(0,2);		 SetParameter('Preamp'+preamp+'GainSW', value); 	
											switch (value) {
												case 0: document.getElementById('Preamp'+preamp+'GainSWLow').checked = true; 	break;
												case 1: document.getElementById('Preamp'+preamp+'GainSWMiddle').checked = true; break;
												case 2: document.getElementById('Preamp'+preamp+'GainSWHigh').checked = true; 	break;
											}
					
					value = rand(0,1);		 SetParameter('Preamp'+preamp+'SoloSW', value); 	document.getElementById('Preamp'+preamp+'SoloSW').checked = value;
					value = rand(0,100);	 SetParameter('Preamp'+preamp+'SoloLevel', value); 	document.getElementById('Preamp'+preamp+'SoloLevel').value = value;	document.getElementById('preamp'+preamp+'SoloLevel').value = value;

				case "Eq+Gain":
					value = rand(0,120); 	SetParameter('Preamp'+preamp+'Gain', value); 	 	document.getElementById('Preamp'+preamp+'Gain').value = value;		document.getElementById('preamp'+preamp+'Gain').value = value;

				case "Eq":
					value = rand(0,100); 	SetParameter('Preamp'+preamp+'Bass', value); 	 	document.getElementById('Preamp'+preamp+'Bass').value = value;		document.getElementById('preamp'+preamp+'Bass').value = value;
					value = rand(0,100); 	SetParameter('Preamp'+preamp+'Middle', value); 	 	document.getElementById('Preamp'+preamp+'Middle').value = value;    document.getElementById('preamp'+preamp+'Middle').value = value;
					value = rand(0,100); 	SetParameter('Preamp'+preamp+'Treble', value); 	 	document.getElementById('Preamp'+preamp+'Treble').value = value;    document.getElementById('preamp'+preamp+'Treble').value = value;
					value = rand(0,100); 	SetParameter('Preamp'+preamp+'Presence', value); 	document.getElementById('Preamp'+preamp+'Presence').value = value;  document.getElementById('preamp'+preamp+'Presence').value = value;
					break;
			}
			break;
			
		case "preampcustomb":
			preamp = 'B';
		case "preampcustoma":
			switch(level) {
				case "Cust. All":
					value = rand(0,6); 		SetParameter('PreampCustom'+preamp+'Type', value); 		document.getElementById('PreampCustom'+preamp+'Type').value = value;
				case "Cust. Eq":
					value = rand(0,10); 	SetParameter('PreampCustom'+preamp+'Bottom', value); 		document.getElementById('PreampCustom'+preamp+'Bottom').value = 10*(5-value);  	document.getElementById('preampCustom'+preamp+'Bottom').value = 10*(5-value);
					value = rand(0,10); 	SetParameter('PreampCustom'+preamp+'Edge', value); 			document.getElementById('PreampCustom'+preamp+'Edge').value = 10*(5-value);  		document.getElementById('preampCustom'+preamp+'Edge').value = 10*(5-value);
					value = rand(0,10); 	SetParameter('PreampCustom'+preamp+'BassFreq', value); 		document.getElementById('PreampCustom'+preamp+'BassFreq').value = 10*(5-value);  	document.getElementById('preampCustom'+preamp+'BassFreq').value = 10*(5-value);
					value = rand(0,10); 	SetParameter('PreampCustom'+preamp+'TreFreq', value); 		document.getElementById('PreampCustom'+preamp+'TreFreq').value = 10*(5-value);  	document.getElementById('preampCustom'+preamp+'TreFreq').value = 10*(5-value);
					value = rand(0,10); 	SetParameter('PreampCustom'+preamp+'PreampLow', value); 	document.getElementById('PreampCustom'+preamp+'PreampLow').value = 10*(5-value);  	document.getElementById('preampCustom'+preamp+'PreampLow').value = 10*(5-value);
					value = rand(0,10); 	SetParameter('PreampCustom'+preamp+'PreampHi', value); 		document.getElementById('PreampCustom'+preamp+'PreampHi').value = 10*(5-value);  	document.getElementById('preampCustom'+preamp+'PreampHi').value = 10*(5-value);
					break;
				case "Cust. Spk":
					break;
			}
			break;
			
		case "speakercustomb":
			preamp = 'B';
		case "speakercustoma":
			value = rand(0,10); 	SetParameter('SpeakerCustom'+preamp+'SpSize', value); 		document.getElementById('SpeakerCustom'+preamp+'SpSize').value = value+5;  	document.getElementById('speakerCustom'+preamp+'SpSize').value = value+5;
			value = rand(0,20); 	SetParameter('SpeakerCustom'+preamp+'ColorLow', value); 	document.getElementById('SpeakerCustom'+preamp+'ColorLow').value = value-10;  	document.getElementById('speakerCustom'+preamp+'ColorLow').value = value-10;
			value = rand(0,20); 	SetParameter('SpeakerCustom'+preamp+'ColorHigh', value); 	document.getElementById('SpeakerCustom'+preamp+'ColorHigh').value = value-10;  document.getElementById('speakerCustom'+preamp+'ColorHigh').value = value-10;
			value = rand(0,3);		SetParameter('SpeakerCustom'+preamp+'SpNumber', value); 	
									switch (value) {
										case 0: document.getElementById('SpeakerCustom'+preamp+'SpNumberX1').checked = true; 	break;
										case 1: document.getElementById('SpeakerCustom'+preamp+'SpNumberX2').checked = true; 	break;
										case 2: document.getElementById('SpeakerCustom'+preamp+'SpNumberX4').checked = true; 	break;
										case 3: document.getElementById('SpeakerCustom'+preamp+'SpNumberX8').checked = true; 	break;
									}
			value = rand(0,1);		SetParameter('SpeakerCustom'+preamp+'Cabinet', value); 
									if (value == 0)		document.getElementById('SpeakerCustom'+preamp+'CabinetOpen').checked = true;
									else				document.getElementById('SpeakerCustom'+preamp+'CabinetClose').checked = true;
			break;
	
		case "equalizer":
			switch(level) {
				case "All":         
					value = rand(0,5); 		SetParameter('EqualizerLoMidQ', value); 	document.getElementById('EqualizerLoMidQ').value = value;		document.getElementById('equalizerLoMidQ').value = value;
					value = rand(0,5); 		SetParameter('EqualizerHiMidQ', value); 	document.getElementById('EqualizerHiMidQ').value = value;		document.getElementById('equalizerHiMidQ').value = value;
					value = rand(-20,20); 	SetParameter('EqualizerLevel', value+20);  	document.getElementById('EqualizerLevel').value = value;		document.getElementById('equalizerLevel').value = value;
				case "Gain+Freq":   
				case "Freq":
					value = rand(0,10); 	SetParameter('EqualizerLowCut', value);  document.getElementById('EqualizerLowCut').value = value;		document.getElementById('equalizerLowCut').value = value;
					value = rand(0,27); 	SetParameter('EqualizerLoMidf', value);  document.getElementById('EqualizerLoMidf').value = value;		document.getElementById('equalizerLoMidf').value = value;
					value = rand(0,27); 	SetParameter('EqualizerHiMidf', value);  document.getElementById('EqualizerHiMidf').value = value;		document.getElementById('equalizerHiMidf').value = value;
					value = rand(0,9); 		SetParameter('EqualizerHighCut', value); document.getElementById('EqualizerHighCut').value = value;		document.getElementById('equalizerHighCut').value = value;
					if (level == "Freq") break;
				case "Gain":
					value = rand(-20,20); 	SetParameter('EqualizerLowGain', value+20);  document.getElementById('EqualizerLowGain').value = value;		document.getElementById('equalizerLowGain').value = value;
					value = rand(-20,20); 	SetParameter('EqualizerLoMidG', value+20); 	 document.getElementById('EqualizerLoMidG').value = value;		document.getElementById('equalizerLoMidG').value = value;
					value = rand(-20,20); 	SetParameter('EqualizerHiMidG', value+20); 	 document.getElementById('EqualizerHiMidG').value = value;		document.getElementById('equalizerHiMidG').value = value;
					value = rand(-20,20); 	SetParameter('EqualizerHighGain', value+20); document.getElementById('EqualizerHighGain').value = value;	document.getElementById('equalizerHighGain').value = value;
					break;
			}
			break;
			
		case "delay":
			switch(level) {
				case "All":
					value = rand(0,11); SetParameter('DelayType', value);   document.getElementById('DelayType').value = value;
				case "Common":
					value = rand(1,3413); SetParameter('DelayDlyTime', value);    document.getElementById('DelayDlyTime').value = value;		document.getElementById('delayDlyTime').value = value;		SetValueRangeNumberSelect(document.getElementById('delayDlyTime'),3400,'bpm');
					value = rand(0,100);  SetParameter('DelayFeedback', value);   document.getElementById('DelayFeedback').value = value;		document.getElementById('delayFeedback').value = value;
					value = rand(0,9);    SetParameter('DelayHighCut', value);    document.getElementById('DelayHighCut').value = value;		document.getElementById('delayHighCut').value = value;
					//value = rand(0,120);  SetParameter('DelayEffectLev', value);  document.getElementById('DelayEffectLev').value = value;		document.getElementById('delayEffectLev').value = value;
					//value = rand(0,100);  SetParameter('DelayDirectLev', value);  document.getElementById('DelayDirectLev').value = value;		document.getElementById('delayDirectLev').value = value;
					if (level != "All") break;
				case "Pan":
					value = rand(0,100);  SetParameter('DelayTapTime', value);    document.getElementById('DelayTapTime').value = value;		document.getElementById('delayTapTime').value = value;
					if (level != "All") break;
				case "Dual":
					value = rand(1,1713); SetParameter('DelayD1Time', value);     document.getElementById('DelayD1Time').value = value;			document.getElementById('delayD1Time').value = value;		SetValueRangeNumberSelect(document.getElementById('delayD1Time'),1700,'bpm');
					value = rand(0,100);  SetParameter('DelayD1Fbk', value);      document.getElementById('DelayD1Fbk').value = value;			document.getElementById('delayD1Fbk').value = value;
					value = rand(0,9);    SetParameter('DelayD1HiCut', value);    document.getElementById('DelayD1HiCut').value = value;		document.getElementById('delayD1HiCut').value = value;
					value = rand(0,120);  SetParameter('DelayD1Level', value);    document.getElementById('DelayD1Level').value = value;		document.getElementById('delayD1Level').value = value;
					value = rand(1,1713); SetParameter('DelayD2Time', value);     document.getElementById('DelayD2Time').value = value;			document.getElementById('delayD2Time').value = value;		SetValueRangeNumberSelect(document.getElementById('delayD2Time'),1700,'bpm');
					value = rand(0,100);  SetParameter('DelayD2Fbk', value);      document.getElementById('DelayD2Fbk').value = value;			document.getElementById('delayD2Fbk').value = value;
					value = rand(0,9);    SetParameter('DelayD2HiCut', value);    document.getElementById('DelayD2HiCut').value = value;		document.getElementById('delayD2HiCut').value = value;
					value = rand(0,120);  SetParameter('DelayD2Level', value);    document.getElementById('DelayD2Level').value = value;		document.getElementById('delayD2Level').value = value;
					if (level != "All") break;
				case "Warp":
					value = rand(0,1);    SetParameter('DelayWarpSw', value);     document.getElementById('DelayWarpSw').checked = (value ==1);
					value = rand(0,100);  SetParameter('DelayRiseTime', value);   document.getElementById('DelayRiseTime').value = value;		document.getElementById('delayRiseTime').value = value;
					value = rand(0,100);  SetParameter('DelayFBDepth', value);    document.getElementById('DelayFBDepth').value = value;		document.getElementById('delayFBDepth').value = value;
					value = rand(0,100);  SetParameter('DelayLevelDep', value);   document.getElementById('DelayLevelDep').value = value;		document.getElementById('delayLevelDep').value = value;
					if (level != "All") break;
				case "Modulate":
					value = rand(0,100);  SetParameter('DelayModRate', value);    document.getElementById('DelayModRate').value = value;		document.getElementById('delayModRate').value = value;
					value = rand(0,100);  SetParameter('DelayModDepth', value);   document.getElementById('DelayModDepth').value = value;		document.getElementById('delayModDepth').value = value;
					break;
			}
			break;
	
		case "chorus":
			switch(level) {
				case "All":
					value = rand(0,2); 	SetParameter('ChorusMode', value); 			document.getElementById('ChorusMode').value = value;
				case "Except Mode":
					value = rand(0,113); 	SetParameter('ChorusRate', value); 		document.getElementById('ChorusRate').value = value;		document.getElementById('chorusRate').value = value;		SetValueRangeNumberSelect(document.getElementById('chorusRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('ChorusDepth', value); 	document.getElementById('ChorusDepth').value = value;		document.getElementById('chorusDepth').value = value;
					value = rand(0,80); 	SetParameter('ChorusPreDelay', value); 	document.getElementById('ChorusPreDelay').value = value/2;	document.getElementById('chorusPreDelay').value = value/2;
					value = rand(0,10); 	SetParameter('ChorusLowCut', value); 	document.getElementById('ChorusLowCut').value = value;		document.getElementById('chorusLowCut').value = value;
					value = rand(0,9); 		SetParameter('ChorusHighCut', value); 	document.getElementById('ChorusHighCut').value = value;		document.getElementById('chorusHighCut').value = value;
					break;
			}
			break;
	
		case "reverb":
			switch(level) {
				case "All":
					value = rand(0,6);		SetParameter('ReverbType', value);		document.getElementById('ReverbType').value = value;
				case "Except Type":
					value = rand(0,99);		SetParameter('ReverbTime', value);		document.getElementById('ReverbTime').value = value/10+0.1;		document.getElementById('reverbTime').value = value/10+0.1;
					value = rand(0,500);	SetParameter('ReverbPreDelay', value);	document.getElementById('ReverbPreDelay').value = value;		document.getElementById('reverbPreDelay').value = value;
					value = rand(0,10);		SetParameter('ReverbLowCut', value);	document.getElementById('ReverbLowCut').value = value;			document.getElementById('reverbLowCut').value = value;
					value = rand(0,9);		SetParameter('ReverbHighCut', value);	document.getElementById('ReverbHighCut').value = value;			document.getElementById('reverbHighCut').value = value;
					value = rand(0,10);		SetParameter('ReverbDensity', value);	document.getElementById('ReverbDensity').value = value;			document.getElementById('reverbDensity').value = value;
					value = rand(0,100);	SetParameter('ReverbSprgSens', value);	document.getElementById('ReverbSprgSens').value = value;		document.getElementById('reverbSprgSens').value = value;
					//value = rand(0,100);	SetParameter('ReverbEffectLev', value);	document.getElementById('ReverbEffectLev').value = value;		document.getElementById('reverbEffectLev').value = value;
					//value = rand(0,100);	SetParameter('ReverbDirectLev', value);	document.getElementById('ReverbDirectLev').value = value;		document.getElementById('reverbDirectLev').value = value;
					break;
			}
			break;
	
		case "master":
			switch(level){
				case "Eq":
					value = rand(-12,12);	SetParameter('MasterLow', value+12);	document.getElementById('MasterLow').value = value;			document.getElementById('masterLow').value = value;
					value = rand(-12,12);	SetParameter('MasterMidG', value+12);	document.getElementById('MasterMidG').value = value;		document.getElementById('masterMidG').value = value;
					value = rand(0,5);		SetParameter('MasterMidQ', value);		document.getElementById('MasterMidQ').value = value;		document.getElementById('masterMidQ').value = value;
					value = rand(0,27);		SetParameter('MasterMidF', value);		document.getElementById('MasterMidF').value = value;		document.getElementById('masterMidF').value = value;
					value = rand(-12,12);	SetParameter('MasterHigh', value-12);	document.getElementById('MasterHigh').value = value;		document.getElementById('masterHigh').value = value;
					break;
			}
			break;
	
		case "fx1advcomp":
			switch(level){
				case "All":
					value = rand(0,7); 		SetParameter('Fx1AdvCompType',value); 		document.getElementById('Fx1AdvCompType').value 	= value;	 document.getElementById('fx1AdvCompType').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1AdvCompSustain',value); 	document.getElementById('Fx1AdvCompSustain').value 	= value;     document.getElementById('fx1AdvCompSustain').value = value;
					value = rand(0,100); 	SetParameter('Fx1AdvCompAttack',value); 	document.getElementById('Fx1AdvCompAttack').value 	= value;     document.getElementById('fx1AdvCompAttack').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1AdvCompTone',value); 		document.getElementById('Fx1AdvCompTone').value 	= value-50;  document.getElementById('fx1AdvCompTone').value 	= value-50;
					//value = rand(0,100); 	SetParameter('Fx1AdvCompLevel',value); 		document.getElementById('Fx1AdvCompLevel').value 	= value;     document.getElementById('fx1AdvCompLevel').value 	= value;
					break;
			}
			break;
			
		case "fx1limiter":
			switch(level){
				case "All":
					value = rand(0,2); 		SetParameter('Fx1LimiterType', value); 			document.getElementById('Fx1LimiterType').value 		= value;	document.getElementById('fx1LimiterType').value 		= value;
					value = rand(0,100); 	SetParameter('Fx1LimiterAttack', value); 		document.getElementById('Fx1LimiterAttack').value 		= value;    document.getElementById('fx1LimiterAttack').value 		= value;
					value = rand(0,100); 	SetParameter('Fx1LimiterThreshold', value); 	document.getElementById('Fx1LimiterThreshold').value 	= value;    document.getElementById('fx1LimiterThreshold').value 	= value;
					value = rand(0,17); 	SetParameter('Fx1LimiterRatio', value); 		document.getElementById('Fx1LimiterRatio').value 		= value;    document.getElementById('fx1LimiterRatio').value 		= value;
					value = rand(0,100); 	SetParameter('Fx1LimiterRelease', value); 		document.getElementById('Fx1LimiterRelease').value 		= value;    document.getElementById('fx1LimiterRelease').value 		= value;
					//value = rand(0,100); 	SetParameter('Fx1LimiterLevel', value); 		document.getElementById('Fx1LimiterLevel').value 		= value;    document.getElementById('fx1LimiterLevel').value 		= value;
					break;
			}
			break;
			
		case "fx1twah":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx1TWahMode', value); 		document.getElementById('Fx1TWahMode').value 		= value;	document.getElementById('fx1TWahMode').value 		= value;
					value = rand(0,1); 		SetParameter('Fx1TWahPolarity', value); 	document.getElementById('Fx1TWahPolarity').value 	= value;    document.getElementById('fx1TWahPolarity').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1TWahSens', value); 		document.getElementById('Fx1TWahSens').value 		= value;    document.getElementById('fx1TWahSens').value 		= value;
					value = rand(0,100); 	SetParameter('Fx1TWahFrequency', value);    document.getElementById('Fx1TWahFrequency').value 	= value;    document.getElementById('fx1TWahFrequency').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1TWahPeak', value); 		document.getElementById('Fx1TWahPeak').value 		= value;    document.getElementById('fx1TWahPeak').value 		= value;
					//value = rand(0,100); 	SetParameter('Fx1TWahDirectLev', value);    document.getElementById('Fx1TWahDirectLev').value 	= value;    document.getElementById('fx1TWahDirectLev').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx1TWahEffectLev', value);    document.getElementById('Fx1TWahEffectLev').value 	= value;    document.getElementById('fx1TWahEffectLev').value 	= value;
					break;
			}
			break;
			
		case "fx1autowah":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx1AutoWahMode', value); 			document.getElementById('Fx1AutoWahMode').value 		= value;	document.getElementById('fx1AutoWahMode').value 		= value;
					value = rand(0,100); 	SetParameter('Fx1AutoWahFrequency', value); 	document.getElementById('Fx1AutoWahFrequency').value 	= value;    document.getElementById('fx1AutoWahFrequency').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1AutoWahPeak', value); 			document.getElementById('Fx1AutoWahPeak').value 		= value;    document.getElementById('fx1AutoWahPeak').value 		= value;
					value = rand(0,113); 	SetParameter('Fx1AutoWahRate', value); 			document.getElementById('Fx1AutoWahRate').value 		= value;    document.getElementById('fx1AutoWahRate').value 		= value;	SetValueRangeNumberSelect(document.getElementById('fx1AutoWahRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx1AutoWahDepth', value); 		document.getElementById('Fx1AutoWahDepth').value 		= value;    document.getElementById('fx1AutoWahDepth').value 		= value;
					//value = rand(0,100); 	SetParameter('Fx1AutoWahDirectLev', value); 	document.getElementById('Fx1AutoWahDirectLev').value 	= value;    document.getElementById('fx1AutoWahDirectLev').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx1AutoWahEffectLev', value); 	document.getElementById('Fx1AutoWahEffectLev').value 	= value;    document.getElementById('fx1AutoWahEffectLev').value 	= value;
					break;
			}
			break;
			
		case "fx1tremolo":
			switch(level) {
				case "All":
					value = rand(0,100); 	SetParameter('Fx1TremoloWaveShape', value); document.getElementById('Fx1TremoloWaveShape').value = value;  	document.getElementById('fx1TremoloWaveShape').value = value; 
					value = rand(0,113); 	SetParameter('Fx1TremoloRate', value); 		document.getElementById('Fx1TremoloRate').value = value;  		document.getElementById('fx1TremoloRate').value = value; 		SetValueRangeNumberSelect(document.getElementById('Fx1TremoloRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx1TremoloDepth', value); 	document.getElementById('Fx1TremoloDepth').value = value;  		document.getElementById('fx1TremoloDepth').value = value; 
					break;
			}
			break;
			
		case "fx1phaser":
			switch(level) {
				case "All":
					value = rand(0,3); 	 SetParameter('Fx1PhaserType', value);      document.getElementById('Fx1PhaserType').value      = value;
					value = rand(0,113); SetParameter('Fx1PhaserRate', value);      document.getElementById('Fx1PhaserRate').value      = value; document.getElementById('fx1PhaserRate').value      = value;	SetValueRangeNumberSelect(document.getElementById('fx1PhaserRate'),100,'bpm2');
					value = rand(0,100); SetParameter('Fx1PhaserDepth', value);     document.getElementById('Fx1PhaserDepth').value     = value; document.getElementById('fx1PhaserDepth').value     = value;
					value = rand(0,100); SetParameter('Fx1PhaserManual', value);    document.getElementById('Fx1PhaserManual').value    = value; document.getElementById('fx1PhaserManual').value    = value;
					value = rand(0,100); SetParameter('Fx1PhaserResonance', value); document.getElementById('Fx1PhaserResonance').value = value; document.getElementById('fx1PhaserResonance').value = value;
					value = rand(0,113); SetParameter('Fx1PhaserStepRate', value);  document.getElementById('Fx1PhaserStepRate').value  = value; document.getElementById('fx1PhaserStepRate').value  = value;	SetValueRangeNumberSelect(document.getElementById('fx1PhaserStepRate'),100,'bpm2');
					break;
			}
			break;
			
		case "fx1flanger":
			switch(level) {
				case "All":
					value = rand(0,113); SetParameter('Fx1FlangerRate', value);      	document.getElementById('Fx1FlangerRate').value      	= value; document.getElementById('fx1FlangerRate').value       = value;		SetValueRangeNumberSelect(document.getElementById('fx1FlangerRate'),100,'bpm2');
					value = rand(0,100); SetParameter('Fx1FlangerDepth', value);     	document.getElementById('Fx1FlangerDepth').value     	= value; document.getElementById('fx1FlangerDepth').value      = value;
					value = rand(0,100); SetParameter('Fx1FlangerManual', value);    	document.getElementById('Fx1FlangerManual').value    	= value; document.getElementById('fx1FlangerManual').value     = value;
					value = rand(0,100); SetParameter('Fx1FlangerResonance', value);    document.getElementById('Fx1FlangerResonance').value    = value; document.getElementById('fx1FlangerResonance').value  = value;
					value = rand(0,100); SetParameter('Fx1FlangerSeparation', value);   document.getElementById('Fx1FlangerSeparation').value   = value; document.getElementById('fx1FlangerSeparation').value = value;
					value = rand(0,10);  SetParameter('Fx1FlangerLowCut', value);     	document.getElementById('Fx1FlangerLowCut').value       = value; document.getElementById('fx1FlangerLowCut').value     = value;
					//value = rand(0,100); SetParameter('Fx1FlangerEffectLev', value);    document.getElementById('Fx1FlangerEffectLev').value   = value; document.getElementById('fx1FlangerEffectLev').value  = value;
					//value = rand(0,100); SetParameter('Fx1FlangerDirectLev', value);    document.getElementById('Fx1FlangerDirectLev').value   = value; document.getElementById('fx1FlangerDirectLev').value  = value;
					break;
			}
			break;
			
		case "fx1pan":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx1PanType', value);
											if (value == 0) 
												document.getElementById('Fx1PanTypeAuto').checked = true;
											else 
												document.getElementById('Fx1PanTypeManual').checked = true;
					value = rand(0,100); 	SetParameter('Fx1PanPosition', value);		document.getElementById('Fx1PanPosition').value 	= value-50;     document.getElementById('fx1PanPosition').value 	= value-50;
					value = rand(0,100); 	SetParameter('Fx1PanWaveShape', value); 	document.getElementById('Fx1PanWaveShape').value 	= value;        document.getElementById('fx1PanWaveShape').value 	= value;
					value = rand(0,113); 	SetParameter('Fx1PanRate', value); 			document.getElementById('Fx1PanRate').value 		= value;		document.getElementById('fx1PanRate').value 		= value;		SetValueRangeNumberSelect(document.getElementById('fx1PanRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx1PanDepth', value); 		document.getElementById('Fx1PanDepth').value 		= value;        document.getElementById('fx1PanDepth').value 		= value;
					break;
			}
			break;
			
		case "fx1vibrato":
			switch(level){
				case "All":
					value = rand(0,113); 	SetParameter('Fx1VibratoRate', value); 		document.getElementById('Fx1VibratoRate').value 		= value;		document.getElementById('fx1VibratoRate').value 	= value;		SetValueRangeNumberSelect(document.getElementById('fx1VibratoRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx1VibratoDepth', value); 	document.getElementById('Fx1VibratoDepth').value 		= value;        document.getElementById('fx1VibratoDepth').value 	= value;
					value = rand(0,1); 		SetParameter('Fx1VibratoTrigger', value); 	document.getElementById('Fx1VibratoTrigger').checked 	= (value == 1);
					value = rand(0,100); 	SetParameter('Fx1VibratoRiseTime', value); 	document.getElementById('Fx1VibratoRiseTime').value 	= value;        document.getElementById('fx1VibratoRiseTime').value = value;
					break;
			}
			break;
			
		case "fx1univ":
			switch(level){
				case "All":
					value = rand(0,113); 	SetParameter('Fx1UniVRate', value); 		document.getElementById('Fx1UniVRate').value 	= value;		document.getElementById('fx1UniVRate').value 	= value;		SetValueRangeNumberSelect(document.getElementById('fx1UniVRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx1UniVDepth', value); 	    document.getElementById('Fx1UniVDepth').value 	= value;        document.getElementById('fx1UniVDepth').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx1UniVLevel', value); 	    document.getElementById('Fx1UniVLevel').value 	= value;        document.getElementById('fx1UniVLevel').value 	= value;
					break;
			}
			break;
			
		case "fx1ringmod":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx1RingModMode', value); 		document.getElementById('Fx1RingModMode').value 		= value;	document.getElementById('fx1RingModMode').value 		= value;
					value = rand(0,100); 	SetParameter('Fx1RingModFrequency', value); 	document.getElementById('Fx1RingModFrequency').value 	= value;    document.getElementById('fx1RingModFrequency').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx1RingModDirectLev', value); 	document.getElementById('Fx1RingModDirectLev').value 	= value;    document.getElementById('fx1RingModDirectLev').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx1RingModEffectLev', value); 	document.getElementById('Fx1RingModEffectLev').value 	= value;    document.getElementById('fx1RingModEffectLev').value 	= value;
					break;
			}
			break;
			
		case "fx1slowgear":
			switch(level){
				case "All":
					value = rand(0,100); 	SetParameter('Fx1SlowGearSens', value); 		document.getElementById('Fx1SlowGearSens').value 		= value;	document.getElementById('fx1SlowGearSens').value 		= value;
					value = rand(0,100); 	SetParameter('Fx1SlowGearRiseTime', value); 	document.getElementById('Fx1SlowGearRiseTime').value 	= value;    document.getElementById('fx1SlowGearRiseTime').value 	= value;
					break;
			}
			break;
			
		case "fx1feedbacker":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx1FeedbackerMode', value); 		document.getElementById('Fx1FeedbackerMode').value 		= value;	document.getElementById('fx1FeedbackerMode').value 		= value;
					value = rand(0,100); 	SetParameter('Fx1FeedbackerRiseTime', value); 	document.getElementById('Fx1FeedbackerRiseTime').value 	= value;    document.getElementById('fx1FeedbackerRiseTime').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1FeedbackerRiseTUp', value); 	document.getElementById('Fx1FeedbackerRiseTUp').value 	= value;    document.getElementById('fx1FeedbackerRiseTUp').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1FeedbackerFBLevel', value); 	document.getElementById('Fx1FeedbackerFBLevel').value 	= value;    document.getElementById('fx1FeedbackerFBLevel').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1FeedbackerFBLvUp', value); 	document.getElementById('Fx1FeedbackerFBLvUp').value 	= value;    document.getElementById('fx1FeedbackerFBLvUp').value 	= value;
					value = rand(0,113); 	SetParameter('Fx1FeedbackerVibRate', value); 	document.getElementById('Fx1FeedbackerVibRate').value 	= value;	document.getElementById('fx1FeedbackerVibRate').value 	= value;	SetValueRangeNumberSelect(document.getElementById('fx1FeedbackerVibRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx1FeedbackerVibDepth', value); 	document.getElementById('Fx1FeedbackerVibDepth').value 	= value;    document.getElementById('fx1FeedbackerVibDepth').value 	= value;
					break;
			}
			break;
			
		case "fx1antifeedback":
			switch(level){
				case "All":
					value = rand(0,100); 	SetParameter('Fx1AntiFeedbackFreq1', value); 	document.getElementById('Fx1AntiFeedbackFreq1').value 	= value;	document.getElementById('fx1AntiFeedbackFreq1').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1AntiFeedbackDepth1', value); 	document.getElementById('Fx1AntiFeedbackDepth1').value 	= value;    document.getElementById('fx1AntiFeedbackDepth1').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1AntiFeedbackFreq2', value); 	document.getElementById('Fx1AntiFeedbackFreq2').value 	= value;    document.getElementById('fx1AntiFeedbackFreq2').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1AntiFeedbackDepth2', value); 	document.getElementById('Fx1AntiFeedbackDepth2').value 	= value;    document.getElementById('fx1AntiFeedbackDepth2').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1AntiFeedbackFreq3', value); 	document.getElementById('Fx1AntiFeedbackFreq3').value 	= value;    document.getElementById('fx1AntiFeedbackFreq3').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1AntiFeedbackDepth3', value); 	document.getElementById('Fx1AntiFeedbackDepth3').value 	= value;    document.getElementById('fx1AntiFeedbackDepth3').value 	= value;
					break;
			}
			break;
			
		case "fx1humanizer":
			switch(level){
				case "All":
					value = rand(0,2); 		SetParameter('Fx1HumanizerMode', value); 	document.getElementById('Fx1HumanizerMode').value 	= value;	document.getElementById('fx1HumanizerMode').value 	= value;
					value = rand(0,4); 		SetParameter('Fx1HumanizerVowel1', value); 	document.getElementById('Fx1HumanizerVowel1').value = value;    document.getElementById('fx1HumanizerVowel1').value = value;
					value = rand(0,4); 		SetParameter('Fx1HumanizerVowel2', value); 	document.getElementById('Fx1HumanizerVowel2').value = value;    document.getElementById('fx1HumanizerVowel2').value = value;
					value = rand(0,100); 	SetParameter('Fx1HumanizerSens', value); 	document.getElementById('Fx1HumanizerSens').value 	= value;    document.getElementById('fx1HumanizerSens').value 	= value;
					value = rand(0,113); 	SetParameter('Fx1HumanizerRate', value); 	document.getElementById('Fx1HumanizerRate').value 	= value;	document.getElementById('fx1HumanizerRate').value 	= value;	SetValueRangeNumberSelect(document.getElementById('fx1HumanizerRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx1HumanizerDepth', value); 	document.getElementById('Fx1HumanizerDepth').value 	= value;    document.getElementById('fx1HumanizerDepth').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1HumanizerManual', value); 	document.getElementById('Fx1HumanizerManual').value = value;    document.getElementById('fx1HumanizerManual').value = value;
					value = rand(0,100); 	SetParameter('Fx1HumanizerLevel', value); 	document.getElementById('Fx1HumanizerLevel').value 	= value;    document.getElementById('fx1HumanizerLevel').value 	= value;
					break;
			}
			break;
			
		case "fx1slicer":
			switch(level){
				case "All":
					value = rand(0,19); 	SetParameter('Fx1SlicerPattern', value); 	document.getElementById('Fx1SlicerPattern').value 	= value;	document.getElementById('fx1SlicerPattern').value 	= value;
					value = rand(0,113); 	SetParameter('Fx1SlicerRate', value); 		document.getElementById('Fx1SlicerRate').value 		= value;	document.getElementById('fx1SlicerRate').value 		= value;	SetValueRangeNumberSelect(document.getElementById('fx1SlicerRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx1SlicerTrigSens', value); 	document.getElementById('Fx1SlicerTrigSens').value 	= value;    document.getElementById('fx1SlicerTrigSens').value 	= value;
					break;
			}
			break;
			
		case "fx1paraeq":
			switch(level){
				case "All":
					value = rand(0,10); 	SetParameter('Fx1ParaEqLowCut', value); 	document.getElementById('Fx1ParaEqLowCut').value = value;  	document.getElementById('fx1ParaEqLowCut').value = value; 
					value = rand(-20,20); 	SetParameter('Fx1ParaEqLowGain',value+20);  document.getElementById('Fx1ParaEqLowGain').value = value;  document.getElementById('fx1ParaEqLowGain').value = value; 
					value = rand(0,27); 	SetParameter('Fx1ParaEqLoMidf', value); 	document.getElementById('Fx1ParaEqLoMidf').value = value;  	document.getElementById('fx1ParaEqLoMidf').value = value;
					value = rand(0,5); 		SetParameter('Fx1ParaEqLoMidQ', value); 	document.getElementById('Fx1ParaEqLoMidQ').value = value;  	document.getElementById('fx1ParaEqLoMidQ').value = value;
					value = rand(-20,20); 	SetParameter('Fx1ParaEqLoMidG', value+20); 	document.getElementById('Fx1ParaEqLoMidG').value = value;  	document.getElementById('fx1ParaEqLoMidG').value = value;
					value = rand(0,27); 	SetParameter('Fx1ParaEqHiMidf', value); 	document.getElementById('Fx1ParaEqHiMidf').value = value;  	document.getElementById('fx1ParaEqHiMidf').value = value; 
					value = rand(0,5); 		SetParameter('Fx1ParaEqHiMidQ', value); 	document.getElementById('Fx1ParaEqHiMidQ').value = value;  	document.getElementById('fx1ParaEqHiMidQ').value = value; 
					value = rand(-20,20); 	SetParameter('Fx1ParaEqHiMidG', value+20); 	document.getElementById('Fx1ParaEqHiMidG').value = value;  	document.getElementById('fx1ParaEqHiMidG').value = value; 
					value = rand(-20,20); 	SetParameter('Fx1ParaEqHiGain', value+20); 	document.getElementById('Fx1ParaEqHiGain').value = value;  	document.getElementById('fx1ParaEqHiGain').value = value; 
					value = rand(0,9); 		SetParameter('Fx1ParaEqHiCut',  value); 	document.getElementById('Fx1ParaEqHiCut').value = value;  	document.getElementById('fx1ParaEqHiCut').value = value;
					break;
			}
			break;

		case "fx1harmonist":
			switch(level){
				case "All":
				case "Except User Scales":
					value = rand(0,2); 		SetParameter('Fx1HarmonistVoice', value); 	 			document.getElementById('Fx1HarmonistVoice').value 	 			= value;		document.getElementById('fx1HarmonistVoice').value 	 			= value;
					value = rand(0,29); 	SetParameter('Fx1HarmonistHr1Harm', value); 	 		document.getElementById('Fx1HarmonistHr1Harm').value 	 		= value;    	document.getElementById('fx1HarmonistHr1Harm').value 	 		= value;
					value = rand(0,313); 	SetParameter('Fx1HarmonistHr1PreDl', value); 	 		document.getElementById('Fx1HarmonistHr1PreDl').value 	 		= value;		document.getElementById('fx1HarmonistHr1PreDl').value 	 		= value;		SetValueRangeNumberSelect(document.getElementById('fx1HarmonistHr1PreDl'),300,'bpm');
					value = rand(0,100); 	SetParameter('Fx1HarmonistHr1Level', value); 	 		document.getElementById('Fx1HarmonistHr1Level').value 	 		= value;    	document.getElementById('fx1HarmonistHr1Level').value 	 		= value;
					value = rand(0,29); 	SetParameter('Fx1HarmonistHr2Harm', value); 	 		document.getElementById('Fx1HarmonistHr2Harm').value 	 		= value;    	document.getElementById('fx1HarmonistHr2Harm').value 	 		= value;
					value = rand(0,313); 	SetParameter('Fx1HarmonistHr2PreDl', value); 	 		document.getElementById('Fx1HarmonistHr2PreDl').value 	 		= value;		document.getElementById('fx1HarmonistHr2PreDl').value 	 		= value;		SetValueRangeNumberSelect(document.getElementById('fx1HarmonistHr2PreDl'),300,'bpm');
					value = rand(0,100); 	SetParameter('Fx1HarmonistHr2Level', value); 	 		document.getElementById('Fx1HarmonistHr2Level').value 	 		= value;    	document.getElementById('fx1HarmonistHr2Level').value 	 		= value;
					value = rand(0,100); 	SetParameter('Fx1HarmonistHr1Fbk', value); 	 			document.getElementById('Fx1HarmonistHr1Fbk').value 	 		= value;    	document.getElementById('fx1HarmonistHr1Fbk').value 	 		= value;
					value = rand(0,100); 	SetParameter('Fx1HarmonistDirectLev', value); 	 		document.getElementById('Fx1HarmonistDirectLev').value 	 		= value;    	document.getElementById('fx1HarmonistDirectLev').value 	 		= value;
					if (level == "Except User Scales") break;
				case "User Scales":
				case "User Scale 1":
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr1UserScaleKeyC', value); 	document.getElementById('Fx1HarmonistHr1UserScaleKeyC').value 	= value-24; 	document.getElementById('fx1HarmonistHr1UserScaleKeyC').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr1UserScaleKeyDb', value); 	document.getElementById('Fx1HarmonistHr1UserScaleKeyDb').value 	= value-24; 	document.getElementById('fx1HarmonistHr1UserScaleKeyDb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr1UserScaleKeyD', value); 	document.getElementById('Fx1HarmonistHr1UserScaleKeyD').value 	= value-24; 	document.getElementById('fx1HarmonistHr1UserScaleKeyD').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr1UserScaleKeyEb', value); 	document.getElementById('Fx1HarmonistHr1UserScaleKeyEb').value 	= value-24; 	document.getElementById('fx1HarmonistHr1UserScaleKeyEb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr1UserScaleKeyE', value); 	document.getElementById('Fx1HarmonistHr1UserScaleKeyE').value 	= value-24; 	document.getElementById('fx1HarmonistHr1UserScaleKeyE').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr1UserScaleKeyF', value); 	document.getElementById('Fx1HarmonistHr1UserScaleKeyF').value 	= value-24; 	document.getElementById('fx1HarmonistHr1UserScaleKeyF').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr1UserScaleKeyFs', value); 	document.getElementById('Fx1HarmonistHr1UserScaleKeyFs').value 	= value-24; 	document.getElementById('fx1HarmonistHr1UserScaleKeyFs').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr1UserScaleKeyG', value); 	document.getElementById('Fx1HarmonistHr1UserScaleKeyG').value 	= value-24; 	document.getElementById('fx1HarmonistHr1UserScaleKeyG').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr1UserScaleKeyAb', value); 	document.getElementById('Fx1HarmonistHr1UserScaleKeyAb').value 	= value-24; 	document.getElementById('fx1HarmonistHr1UserScaleKeyAb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr1UserScaleKeyA', value); 	document.getElementById('Fx1HarmonistHr1UserScaleKeyA').value 	= value-24; 	document.getElementById('fx1HarmonistHr1UserScaleKeyA').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr1UserScaleKeyBb', value); 	document.getElementById('Fx1HarmonistHr1UserScaleKeyBb').value 	= value-24; 	document.getElementById('fx1HarmonistHr1UserScaleKeyBb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr1UserScaleKeyB', value); 	document.getElementById('Fx1HarmonistHr1UserScaleKeyB').value 	= value-24; 	document.getElementById('fx1HarmonistHr1UserScaleKeyB').value 	= value-24;
					if (level == "User Scale 1") break;
				case "User Scale 2":
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr2UserScaleKeyC', value); 	document.getElementById('Fx1HarmonistHr2UserScaleKeyC').value 	= value-24; 	document.getElementById('fx1HarmonistHr2UserScaleKeyC').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr2UserScaleKeyDb', value); 	document.getElementById('Fx1HarmonistHr2UserScaleKeyDb').value 	= value-24; 	document.getElementById('fx1HarmonistHr2UserScaleKeyDb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr2UserScaleKeyD', value); 	document.getElementById('Fx1HarmonistHr2UserScaleKeyD').value 	= value-24; 	document.getElementById('fx1HarmonistHr2UserScaleKeyD').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr2UserScaleKeyEb', value); 	document.getElementById('Fx1HarmonistHr2UserScaleKeyEb').value 	= value-24; 	document.getElementById('fx1HarmonistHr2UserScaleKeyEb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr2UserScaleKeyE', value); 	document.getElementById('Fx1HarmonistHr2UserScaleKeyE').value 	= value-24; 	document.getElementById('fx1HarmonistHr2UserScaleKeyE').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr2UserScaleKeyF', value); 	document.getElementById('Fx1HarmonistHr2UserScaleKeyF').value 	= value-24; 	document.getElementById('fx1HarmonistHr2UserScaleKeyF').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr2UserScaleKeyFs', value); 	document.getElementById('Fx1HarmonistHr2UserScaleKeyFs').value 	= value-24; 	document.getElementById('fx1HarmonistHr2UserScaleKeyFs').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr2UserScaleKeyG', value); 	document.getElementById('Fx1HarmonistHr2UserScaleKeyG').value 	= value-24; 	document.getElementById('fx1HarmonistHr2UserScaleKeyG').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr2UserScaleKeyAb', value); 	document.getElementById('Fx1HarmonistHr2UserScaleKeyAb').value 	= value-24; 	document.getElementById('fx1HarmonistHr2UserScaleKeyAb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr2UserScaleKeyA', value); 	document.getElementById('Fx1HarmonistHr2UserScaleKeyA').value 	= value-24; 	document.getElementById('fx1HarmonistHr2UserScaleKeyA').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr2UserScaleKeyBb', value); 	document.getElementById('Fx1HarmonistHr2UserScaleKeyBb').value 	= value-24; 	document.getElementById('fx1HarmonistHr2UserScaleKeyBb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx1HarmonistHr2UserScaleKeyB', value); 	document.getElementById('Fx1HarmonistHr2UserScaleKeyB').value 	= value-24; 	document.getElementById('fx1HarmonistHr2UserScaleKeyB').value 	= value-24;
					break;
			}
			break;
			
		case "fx1pitchshifter":
			switch(level){
				case "All":
					value = rand(0,2); 		SetParameter('Fx1PitchShifterVoice', value); 		document.getElementById('Fx1PitchShifterVoice').value 	 	= value;		document.getElementById('fx1PitchShifterVoice').value 	 	= value;
					value = rand(0,3); 		SetParameter('Fx1PitchShifterPs1Mode', value); 		document.getElementById('Fx1PitchShifterPs1Mode').value 	= value;    	document.getElementById('fx1PitchShifterPs1Mode').value 	= value;
					value = rand(0,48); 	SetParameter('Fx1PitchShifterPs1Pitch', value); 	document.getElementById('Fx1PitchShifterPs1Pitch').value 	= value-24;    	document.getElementById('fx1PitchShifterPs1Pitch').value 	= value-24;
					value = rand(0,100); 	SetParameter('Fx1PitchShifterPs1Fine', value); 		document.getElementById('Fx1PitchShifterPs1Fine').value 	= value-50;    	document.getElementById('fx1PitchShifterPs1Fine').value 	= value-50;
					value = rand(0,313); 	SetParameter('Fx1PitchShifterPs1PreDly', value); 	document.getElementById('Fx1PitchShifterPs1PreDly').value 	= value;		document.getElementById('fx1PitchShifterPs1PreDly').value 	= value;	SetValueRangeNumberSelect(document.getElementById('fx1PitchShifterPs1PreDly'),300,'bpm');
					value = rand(0,100); 	SetParameter('Fx1PitchShifterPs1Level', value); 	document.getElementById('Fx1PitchShifterPs1Level').value 	= value;    	document.getElementById('fx1PitchShifterPs1Level').value 	= value;
					value = rand(0,3); 		SetParameter('Fx1PitchShifterPs2Mode', value); 		document.getElementById('Fx1PitchShifterPs2Mode').value 	= value;    	document.getElementById('fx1PitchShifterPs2Mode').value 	= value;
					value = rand(0,48); 	SetParameter('Fx1PitchShifterPs2Pitch', value); 	document.getElementById('Fx1PitchShifterPs2Pitch').value 	= value-24;    	document.getElementById('fx1PitchShifterPs2Pitch').value 	= value-24;
					value = rand(0,100); 	SetParameter('Fx1PitchShifterPs2Fine', value); 		document.getElementById('Fx1PitchShifterPs2Fine').value 	= value-50;    	document.getElementById('fx1PitchShifterPs2Fine').value 	= value-50;
					value = rand(0,313); 	SetParameter('Fx1PitchShifterPs2PreDly', value); 	document.getElementById('Fx1PitchShifterPs2PreDly').value 	= value;		document.getElementById('fx1PitchShifterPs2PreDly').value 	= value;	SetValueRangeNumberSelect(document.getElementById('fx1PitchShifterPs2PreDly'),300,'bpm');
					value = rand(0,100); 	SetParameter('Fx1PitchShifterPs2Level', value); 	document.getElementById('Fx1PitchShifterPs2Level').value 	= value;    	document.getElementById('fx1PitchShifterPs2Level').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1PitchShifterPs1Fbk', value); 	 	document.getElementById('Fx1PitchShifterPs1Fbk').value 		= value;    	document.getElementById('fx1PitchShifterPs1Fbk').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx1PitchShifterDirectLev', value); 	document.getElementById('Fx1PitchShifterDirectLev').value 	= value;    	document.getElementById('fx1PitchShifterDirectLev').value 	= value;
					break;
			}
			break;
			
		case "fx1octave":
			switch(level){
				case "All":
					value = rand(0,3); 		SetParameter('Fx1OctaveRange', value); 	 	document.getElementById('Fx1OctaveRange').value 	 	= value;	document.getElementById('fx1OctaveRange').value 	 	= value;
					//value = rand(0,100); 	SetParameter('Fx1OctaveOctLevel', value); 	document.getElementById('Fx1OctaveOctLevel').value 	 	= value;    document.getElementById('fx1OctaveOctLevel').value 	 	= value;
					//value = rand(0,100); 	SetParameter('Fx1OctaveDirectLev', value);	document.getElementById('Fx1OctaveDirectLev').value 	= value;    document.getElementById('fx1OctaveDirectLev').value 	= value;
					break;
			}
			break;
			
		case "fx1rotary":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx1RotarySpeedSel', value); 	document.getElementById('Fx1RotarySpeedSel').value 	= value;	document.getElementById('fx1RotarySpeedSel').value 	= value;
					value = rand(0,113); 	SetParameter('Fx1RotaryRateSlow', value); 	document.getElementById('Fx1RotaryRateSlow').value 	= value;	document.getElementById('fx1RotaryRateSlow').value 	= value;	SetValueRangeNumberSelect(document.getElementById('fx1RotaryRateSlow'),100,'bpm2');
					value = rand(0,113); 	SetParameter('Fx1RotaryRateFast', value); 	document.getElementById('Fx1RotaryRateFast').value 	= value;	document.getElementById('fx1RotaryRateFast').value 	= value;	SetValueRangeNumberSelect(document.getElementById('fx1RotaryRateFast'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx1RotaryRiseTime', value); 	document.getElementById('Fx1RotaryRiseTime').value 	= value;    document.getElementById('fx1RotaryRiseTime').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1RotaryFallTime', value); 	document.getElementById('Fx1RotaryFallTime').value 	= value;    document.getElementById('fx1RotaryFallTime').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1RotaryDepth', value); 	 	document.getElementById('Fx1RotaryDepth').value 	= value;    document.getElementById('fx1RotaryDepth').value 	= value;
					break;
			}
			break;
			
		case "fx12x2chorus":
			switch(level){
				case "All":
					value = rand(0,16); 	SetParameter('Fx12x2ChorusXoverF', value); 	 document.getElementById('Fx12x2ChorusXoverF').value 	 = value;		document.getElementById('fx12x2ChorusXoverF').value 	 = value;
					value = rand(0,113); 	SetParameter('Fx12x2ChorusLoRate', value); 	 document.getElementById('Fx12x2ChorusLoRate').value 	 = value;		document.getElementById('fx12x2ChorusLoRate').value 	 = value;	SetValueRangeNumberSelect(document.getElementById('fx12x2ChorusLoRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx12x2ChorusLoDepth', value);  document.getElementById('Fx12x2ChorusLoDepth').value 	 = value;   	document.getElementById('fx12x2ChorusLoDepth').value 	 = value;
					value = rand(0,80); 	SetParameter('Fx12x2ChorusLoPreDly', value); document.getElementById('Fx12x2ChorusLoPreDly').value 	 = value/2;   	document.getElementById('fx12x2ChorusLoPreDly').value 	 = value/2;
					value = rand(0,100); 	SetParameter('Fx12x2ChorusLoLevel', value);  document.getElementById('Fx12x2ChorusLoLevel').value 	 = value;   	document.getElementById('fx12x2ChorusLoLevel').value 	 = value;
					value = rand(0,113); 	SetParameter('Fx12x2ChorusHiRate', value); 	 document.getElementById('Fx12x2ChorusHiRate').value 	 = value;		document.getElementById('fx12x2ChorusHiRate').value 	 = value;	SetValueRangeNumberSelect(document.getElementById('fx12x2ChorusHiRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx12x2ChorusHiDepth', value);  document.getElementById('Fx12x2ChorusHiDepth').value 	 = value;   	document.getElementById('fx12x2ChorusHiDepth').value 	 = value;
					value = rand(0,80); 	SetParameter('Fx12x2ChorusHiPreDly', value); document.getElementById('Fx12x2ChorusHiPreDly').value 	 = value/2;   	document.getElementById('fx12x2ChorusHiPreDly').value 	 = value/2;
					value = rand(0,100); 	SetParameter('Fx12x2ChorusHiLevel', value);  document.getElementById('Fx12x2ChorusHiLevel').value 	 = value;   	document.getElementById('fx12x2ChorusHiLevel').value 	 = value;
					break;
			}
			break;
			
		case "fx1subdelay":
			switch(level){
				case "All":
					value = rand(0,3413); 	SetParameter('Fx1SubDelayDlyTime', value); 		document.getElementById('Fx1SubDelayDlyTime').value 	= value;	document.getElementById('fx1SubDelayDlyTime').value 	= value;	SetValueRangeNumberSelect(document.getElementById('fx1SubDelayDlyTime'),3400,'bpm');
					value = rand(0,100); 	SetParameter('Fx1SubDelayFeedback', value); 	document.getElementById('Fx1SubDelayFeedback').value 	= value;    document.getElementById('fx1SubDelayFeedback').value 	= value;
					value = rand(0,9); 		SetParameter('Fx1SubDelayHiCut', value); 	 	document.getElementById('Fx1SubDelayHiCut').value 	 	= value;    document.getElementById('fx1SubDelayHiCut').value 	 	= value;
					//value = rand(0,120); 	SetParameter('Fx1SubDelayEffectLev', value); 	document.getElementById('Fx1SubDelayEffectLev').value 	= value;    document.getElementById('fx1SubDelayEffectLev').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx1SubDelayDirectLev', value); 	document.getElementById('Fx1SubDelayDirectLev').value 	= value;    document.getElementById('fx1SubDelayDirectLev').value 	= value;
					break;
			}
			break;
			
		case "fx1defretter":
			switch(level){
				case "All":
					value = rand(0,100); 	SetParameter('Fx1DefretterTone', value); 	 	document.getElementById('Fx1DefretterTone').value 	 	= value-50;		document.getElementById('fx1DefretterTone').value 	 	= value-50;
					value = rand(0,100); 	SetParameter('Fx1DefretterSens', value); 	 	document.getElementById('Fx1DefretterSens').value 	 	= value;        document.getElementById('fx1DefretterSens').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx1DefretterAttack', value);  	document.getElementById('Fx1DefretterAttack').value 	= value;        document.getElementById('fx1DefretterAttack').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1DefretterDepth', value); 	 	document.getElementById('Fx1DefretterDepth').value 	 	= value;        document.getElementById('fx1DefretterDepth').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx1DefretterResonance', value); 	document.getElementById('Fx1DefretterResonance').value 	= value;        document.getElementById('fx1DefretterResonance').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx1DefretterEffectLev', value); 	document.getElementById('Fx1DefretterEffectLev').value 	= value;        document.getElementById('fx1DefretterEffectLev').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx1DefretterDirectLev', value); 	document.getElementById('Fx1DefretterDirectLev').value 	= value;        document.getElementById('fx1DefretterDirectLev').value 	= value;
					break;
			}
			break;
		
		case "fx1sitarsim":
			switch(level){
				case "All":
					value = rand(0,100); 	SetParameter('Fx1SitarSimTone', value); 	 	document.getElementById('Fx1SitarSimTone').value 	 	= value-50;		document.getElementById('fx1SitarSimTone').value 	 	= value-50;
					value = rand(0,100); 	SetParameter('Fx1SitarSimSens', value); 	 	document.getElementById('Fx1SitarSimSens').value 	 	= value;        document.getElementById('fx1SitarSimSens').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx1SitarSimDepth', value); 	 	document.getElementById('Fx1SitarSimDepth').value 	 	= value;        document.getElementById('fx1SitarSimDepth').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx1SitarSimResonance', value); 	document.getElementById('Fx1SitarSimResonance').value 	= value;        document.getElementById('fx1SitarSimResonance').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1SitarSimBuzz', value); 	 	document.getElementById('Fx1SitarSimBuzz').value 	 	= value;        document.getElementById('fx1SitarSimBuzz').value 	 	= value;
					//value = rand(0,100); 	SetParameter('Fx1SitarSimEffectLev', value); 	document.getElementById('Fx1SitarSimEffectLev').value 	= value;        document.getElementById('fx1SitarSimEffectLev').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx1SitarSimDirectLev', value); 	document.getElementById('Fx1SitarSimDirectLev').value 	= value;        document.getElementById('fx1SitarSimDirectLev').value 	= value;
					break;
			}
			break;
		
		case "fx1wavesynth":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx1WaveSynthWave', value); 	 	document.getElementById('fx1WaveSynthWaveSaw').checked 	= value == 0;   document.getElementById('fx1WaveSynthWaveSquare').checked 	= value == 1;
					value = rand(0,100); 	SetParameter('Fx1WaveSynthCutoff', value); 		document.getElementById('Fx1WaveSynthCutoff').value 	= value;        document.getElementById('fx1WaveSynthCutoff').value 		= value;
					value = rand(0,100); 	SetParameter('Fx1WaveSynthResonance', value); 	document.getElementById('Fx1WaveSynthResonance').value 	= value;        document.getElementById('fx1WaveSynthResonance').value 		= value;
					value = rand(0,100); 	SetParameter('Fx1WaveSynthFltSens', value); 	document.getElementById('Fx1WaveSynthFltSens').value 	= value;        document.getElementById('fx1WaveSynthFltSens').value 		= value;
					value = rand(0,100); 	SetParameter('Fx1WaveSynthFltDecay', value); 	document.getElementById('Fx1WaveSynthFltDecay').value 	= value;        document.getElementById('fx1WaveSynthFltDecay').value 		= value;
					value = rand(0,100); 	SetParameter('Fx1WaveSynthFltDepth', value); 	document.getElementById('Fx1WaveSynthFltDepth').value 	= value;        document.getElementById('fx1WaveSynthFltDepth').value 		= value;
					//value = rand(0,100); 	SetParameter('Fx1WaveSynthSynthLev', value); 	document.getElementById('Fx1WaveSynthSynthLev').value 	= value;        document.getElementById('fx1WaveSynthSynthLev').value 		= value;
					//value = rand(0,100); 	SetParameter('Fx1WaveSynthDirectLev', value); 	document.getElementById('Fx1WaveSynthDirectLev').value 	= value;        document.getElementById('fx1WaveSynthDirectLev').value 		= value;
					break;
			}
			break;
		
		case "fx1guitarsynth":
			switch(level){
				case "All":
					value = rand(0,3); 		SetParameter('Fx1GuitarSynthWave', value); 	 		document.getElementById('fx1GuitarSynthWaveSquare').checked	= value == 0;
																								document.getElementById('fx1GuitarSynthWaveSaw').checked 	= value == 1;
																								document.getElementById('fx1GuitarSynthWaveBrass').checked 	= value == 2;
																								document.getElementById('fx1GuitarSynthWaveBow').checked 	= value == 3;
					value = rand(0,100);	SetParameter('Fx1GuitarSynthSens', value); 	 		document.getElementById('Fx1GuitarSynthSens').value 	 	= value;    	document.getElementById('fx1GuitarSynthSens').value 	 	= value;
					value = rand(0,2); 		SetParameter('Fx1GuitarSynthChromatic', value); 	document.getElementById('Fx1GuitarSynthChromatic').checked 	= value == 1;
					value = rand(-2,0); 	SetParameter('Fx1GuitarSynthOctShift', value); 		document.getElementById('Fx1GuitarSynthOctShift').value 	= value;    	document.getElementById('fx1GuitarSynthOctShift').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1GuitarSynthPwmRate', value); 		document.getElementById('Fx1GuitarSynthPwmRate').value 	 	= value;    	document.getElementById('fx1GuitarSynthPwmRate').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx1GuitarSynthPwmDepth', value); 		document.getElementById('Fx1GuitarSynthPwmDepth').value 	= value;    	document.getElementById('fx1GuitarSynthPwmDepth').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1GuitarSynthCutoff', value); 		document.getElementById('Fx1GuitarSynthCutoff').value 	 	= value;    	document.getElementById('fx1GuitarSynthCutoff').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx1GuitarSynthResonance', value); 	document.getElementById('Fx1GuitarSynthResonance').value 	= value;    	document.getElementById('fx1GuitarSynthResonance').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1GuitarSynthFltSens', value); 		document.getElementById('Fx1GuitarSynthFltSens').value 	 	= value;    	document.getElementById('fx1GuitarSynthFltSens').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx1GuitarSynthFltDecay', value); 		document.getElementById('Fx1GuitarSynthFltDecay').value 	= value;    	document.getElementById('fx1GuitarSynthFltDecay').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1GuitarSynthFltDepth', value); 		document.getElementById('Fx1GuitarSynthFltDepth').value 	= 2*value-50;   document.getElementById('fx1GuitarSynthFltDepth').value 	= 2*value-50;
					value = rand(0,101); 	SetParameter('Fx1GuitarSynthAttack', value); 		document.getElementById('Fx1GuitarSynthAttack').value 	 	= value;    	document.getElementById('fx1GuitarSynthAttack').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx1GuitarSynthRelease', value); 		document.getElementById('Fx1GuitarSynthRelease').value 	 	= value;    	document.getElementById('fx1GuitarSynthRelease').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx1GuitarSynthVelocity', value); 		document.getElementById('Fx1GuitarSynthVelocity').value 	= value;    	document.getElementById('fx1GuitarSynthVelocity').value 	= value;
					value = rand(0,1); 		SetParameter('Fx1GuitarSynthHold', value); 	 		document.getElementById('Fx1GuitarSynthHold').checked 	 	= value == 1;
					//value = rand(0,100); 	SetParameter('Fx1GuitarSynthSynthLev', value); 		document.getElementById('Fx1GuitarSynthSynthLev').value 	= value;    	document.getElementById('fx1GuitarSynthSynthLev').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx1GuitarSynthDirectLev', value); 	document.getElementById('Fx1GuitarSynthDirectLev').value 	= value;    document.getElementById('fx1GuitarSynthDirectLev').value 	= value;
					break;
			}
			break;
		
		case "fx1autoriff":
			switch(level){
				case "All":
					value = rand(0,30); 	SetParameter('Fx1AutoRiffPhrase', value); 	 				document.getElementById('Fx1AutoRiffPhrase').value 	 				= value;		document.getElementById('fx1AutoRiffPhrase').value 	 				= value;
				case "Except Phrase":
					value = rand(0,1); 		SetParameter('Fx1AutoRiffLoop', value); 	 				document.getElementById('Fx1AutoRiffLoop').checked 	 				= value==1;
					value = rand(0,113); 	SetParameter('Fx1AutoRiffTempo', value); 	 				document.getElementById('Fx1AutoRiffTempo').value 	 				= value;		document.getElementById('fx1AutoRiffTempo').value 	 				= value;		SetValueRangeNumberSelect(document.getElementById('Fx1AutoRiffTempo'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx1AutoRiffSens', value); 	 				document.getElementById('Fx1AutoRiffSens').value 	 				= value;        document.getElementById('fx1AutoRiffSens').value 	 				= value;
					value = rand(0,100); 	SetParameter('Fx1AutoRiffMasterKey', value); 	 			document.getElementById('Fx1AutoRiffMasterKey').value 	 			= value;        document.getElementById('fx1AutoRiffMasterKey').value 				= value;
					value = rand(0,100); 	SetParameter('Fx1AutoRiffAttack', value); 	 				document.getElementById('Fx1AutoRiffAttack').value 	 				= value;        document.getElementById('fx1AutoRiffAttack').value 	 				= value;
					value = rand(0,1); 		SetParameter('Fx1AutoRiffHold', value); 	 				document.getElementById('Fx1AutoRiffHold').checked 	 				= value==1;
					value = rand(0,1); 		SetParameter('Fx1AutoRiffNoteDetect', value); 	 			document.getElementById('Fx1AutoRiffNoteDetect').checked 	 			= value==1;
					//value = rand(0,100); 	SetParameter('Fx1AutoRiffEffectLev', value); 	 			document.getElementById('Fx1AutoRiffEffectLev').value 	 			= value;        document.getElementById('fx1AutoRiffEffectLev').value 	 			= value;
					//value = rand(0,100); 	SetParameter('Fx1AutoRiffDirectLev', value); 	 			document.getElementById('Fx1AutoRiffDirectLev').value 	 			= value;        document.getElementById('fx1AutoRiffDirectLev').value 	 			= value;
					break;
				case "User Preset":
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting1C', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting1C').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting2C', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting2C').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting3C', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting3C').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting4C', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting4C').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting5C', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting5C').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting6C', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting6C').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting7C', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting7C').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting8C', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting8C').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting9C', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting9C').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting10C', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting10C').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting11C', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting11C').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting12C', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting12C').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting13C', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting13C').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting14C', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting14C').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting15C', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting15C').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting16C', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting16C').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting1Db', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting1Db').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting2Db', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting2Db').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting3Db', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting3Db').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting4Db', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting4Db').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting5Db', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting5Db').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting6Db', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting6Db').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting7Db', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting7Db').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting8Db', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting8Db').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting9Db', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting9Db').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting10Db', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting10Db').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting11Db', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting11Db').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting12Db', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting12Db').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting13Db', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting13Db').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting14Db', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting14Db').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting15Db', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting15Db').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting16Db', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting16Db').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting1D', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting1D').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting2D', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting2D').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting3D', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting3D').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting4D', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting4D').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting5D', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting5D').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting6D', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting6D').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting7D', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting7D').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting8D', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting8D').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting9D', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting9D').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting10D', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting10D').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting11D', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting11D').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting12D', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting12D').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting13D', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting13D').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting14D', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting14D').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting15D', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting15D').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting16D', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting16D').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting1Eb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting1Eb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting2Eb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting2Eb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting3Eb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting3Eb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting4Eb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting4Eb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting5Eb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting5Eb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting6Eb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting6Eb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting7Eb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting7Eb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting8Eb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting8Eb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting9Eb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting9Eb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting10Eb', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting10Eb').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting11Eb', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting11Eb').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting12Eb', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting12Eb').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting13Eb', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting13Eb').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting14Eb', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting14Eb').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting15Eb', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting15Eb').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting16Eb', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting16Eb').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting1E', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting1E').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting2E', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting2E').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting3E', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting3E').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting4E', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting4E').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting5E', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting5E').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting6E', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting6E').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting7E', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting7E').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting8E', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting8E').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting9E', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting9E').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting10E', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting10E').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting11E', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting11E').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting12E', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting12E').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting13E', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting13E').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting14E', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting14E').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting15E', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting15E').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting16E', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting16E').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting1F', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting1F').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting2F', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting2F').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting3F', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting3F').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting4F', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting4F').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting5F', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting5F').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting6F', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting6F').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting7F', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting7F').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting8F', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting8F').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting9F', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting9F').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting10F', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting10F').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting11F', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting11F').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting12F', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting12F').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting13F', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting13F').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting14F', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting14F').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting15F', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting15F').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting16F', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting16F').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting1Fs', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting1Fs').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting2Fs', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting2Fs').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting3Fs', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting3Fs').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting4Fs', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting4Fs').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting5Fs', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting5Fs').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting6Fs', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting6Fs').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting7Fs', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting7Fs').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting8Fs', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting8Fs').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting9Fs', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting9Fs').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting10Fs', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting10Fs').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting11Fs', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting11Fs').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting12Fs', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting12Fs').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting13Fs', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting13Fs').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting14Fs', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting14Fs').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting15Fs', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting15Fs').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting16Fs', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting16Fs').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting1G', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting1G').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting2G', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting2G').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting3G', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting3G').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting4G', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting4G').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting5G', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting5G').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting6G', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting6G').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting7G', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting7G').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting8G', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting8G').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting9G', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting9G').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting10G', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting10G').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting11G', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting11G').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting12G', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting12G').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting13G', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting13G').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting14G', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting14G').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting15G', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting15G').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting16G', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting16G').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting1Ab', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting1Ab').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting2Ab', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting2Ab').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting3Ab', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting3Ab').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting4Ab', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting4Ab').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting5Ab', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting5Ab').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting6Ab', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting6Ab').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting7Ab', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting7Ab').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting8Ab', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting8Ab').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting9Ab', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting9Ab').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting10Ab', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting10Ab').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting11Ab', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting11Ab').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting12Ab', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting12Ab').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting13Ab', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting13Ab').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting14Ab', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting14Ab').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting15Ab', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting15Ab').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting16Ab', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting16Ab').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting1A', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting1A').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting2A', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting2A').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting3A', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting3A').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting4A', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting4A').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting5A', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting5A').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting6A', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting6A').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting7A', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting7A').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting8A', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting8A').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting9A', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting9A').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting10A', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting10A').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting11A', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting11A').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting12A', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting12A').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting13A', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting13A').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting14A', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting14A').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting15A', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting15A').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting16A', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting16A').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting1Bb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting1Bb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting2Bb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting2Bb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting3Bb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting3Bb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting4Bb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting4Bb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting5Bb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting5Bb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting6Bb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting6Bb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting7Bb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting7Bb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting8Bb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting8Bb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting9Bb', value); 	document.getElementById('Fx1AutoRiffUserPhraseSetting9Bb').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting10Bb', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting10Bb').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting11Bb', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting11Bb').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting12Bb', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting12Bb').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting13Bb', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting13Bb').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting14Bb', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting14Bb').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting15Bb', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting15Bb').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting16Bb', value);	document.getElementById('Fx1AutoRiffUserPhraseSetting16Bb').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting1B', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting1B').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting2B', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting2B').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting3B', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting3B').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting4B', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting4B').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting5B', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting5B').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting6B', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting6B').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting7B', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting7B').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting8B', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting8B').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting9B', value); 		document.getElementById('Fx1AutoRiffUserPhraseSetting9B').value 	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting10B', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting10B').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting11B', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting11B').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting12B', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting12B').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting13B', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting13B').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting14B', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting14B').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting15B', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting15B').value	= value;
					value = rand(0,50); 	SetParameter('Fx1AutoRiffUserPhraseSetting16B', value);		document.getElementById('Fx1AutoRiffUserPhraseSetting16B').value	= value;
					break;
			}
			break;
			
		case "fx1soundhold":
			switch(level){
				case "All":
					//value = rand(0,1); 		SetParameter('Fx1SoundHoldHold', value); 	 		document.getElementById('Fx1SoundHoldHold').checked 		= value == 1;
					value = rand(0,100); 	SetParameter('Fx1SoundHoldRiseTime', value); 	 	document.getElementById('Fx1SoundHoldRiseTime').value 	 	= value;    document.getElementById('fx1SoundHoldRiseTime').value 	 	= value;
					value = rand(0,120); 	SetParameter('Fx1SoundHoldEffectLev', value); 	 	document.getElementById('Fx1SoundHoldEffectLev').value 	 	= value;    document.getElementById('fx1SoundHoldEffectLev').value 	 	= value;
					break;
			}
			break;
		
		case "fx1tonemodify":
			switch(level) {
				case "All":
					value = rand(0,7); 		SetParameter('Fx1ToneModifyType', value); 		document.getElementById('Fx1ToneModifyType').value 		= value;
					value = rand(0,100); 	SetParameter('Fx1ToneModifyResonance', value); 	document.getElementById('Fx1ToneModifyResonance').value = value;  	document.getElementById('fx1ToneModifyResonance').value = value; 
					value = rand(-50,50); 	SetParameter('Fx1ToneModifyLow', value+50); 	document.getElementById('Fx1ToneModifyLow').value 		= value;  	document.getElementById('fx1ToneModifyLow').value 		= value; 
					value = rand(-50,50); 	SetParameter('Fx1ToneModifyHigh', value+50); 	document.getElementById('Fx1ToneModifyHigh').value 		= value;  	document.getElementById('fx1ToneModifyHigh').value 		= value; 
					//value = rand(0,100); 	SetParameter('Fx1ToneModifyLevel', value); 		document.getElementById('Fx1ToneModifyLevel').value 	= value;  	document.getElementById('fx1ToneModifyLevel').value 	= value; 
					break;
			}
			break;
		
		case "fx1guitarsim":
			switch(level){
				case "All":
					value = rand(0,7); 		SetParameter('Fx1GuitarSimType', value);      		document.getElementById('Fx1GuitarSimType').value      	= value;		document.getElementById('fx1GuitarSimType').value      	= value;	
					value = rand(0,100); 	SetParameter('Fx1GuitarSimLow', value);      		document.getElementById('Fx1GuitarSimLow').value      	= value-50;     document.getElementById('fx1GuitarSimLow').value      	= value-50;
					value = rand(0,100); 	SetParameter('Fx1GuitarSimHigh', value);      		document.getElementById('Fx1GuitarSimHigh').value      	= value-50;     document.getElementById('fx1GuitarSimHigh').value      	= value-50;
					//value = rand(0,100); 	SetParameter('Fx1GuitarSimLevel', value);      		document.getElementById('Fx1GuitarSimLevel').value      = value;        document.getElementById('fx1GuitarSimLevel').value      = value;
					value = rand(0,100); 	SetParameter('Fx1GuitarSimBody', value);  			document.getElementById('Fx1GuitarSimBody').value  		= value;    	document.getElementById('fx1GuitarSimBody').value  		= value;
					break;
			}
			break;
			
		case "fx1acprocessor":
			switch(level) {
				case "All":
					value = rand(0,3); 		SetParameter('Fx1AcProcessorType', value); 		document.getElementById('Fx1AcProcessorType').value 	= value;
					value = rand(0,100); 	SetParameter('Fx1AcProcessorBass', value); 		document.getElementById('Fx1AcProcessorBass').value 	= value-50;  	document.getElementById('fx1AcProcessorBass').value 	= value-50; 
					value = rand(0,100); 	SetParameter('Fx1AcProcessorMiddle', value); 	document.getElementById('Fx1AcProcessorMiddle').value 	= value-50;  	document.getElementById('fx1AcProcessorMiddle').value 	= value-50; 
					value = rand(0,27); 	SetParameter('Fx1AcProcessorMiddleF', value); 	document.getElementById('Fx1AcProcessorMiddleF').value 	= value;  		document.getElementById('fx1AcProcessorMiddleF').value 	= value; 
					value = rand(0,100); 	SetParameter('Fx1AcProcessorTreble', value); 	document.getElementById('Fx1AcProcessorTreble').value 	= value-50;  	document.getElementById('fx1AcProcessorTreble').value 	= value-50; 
					value = rand(0,100); 	SetParameter('Fx1AcProcessorPresence', value); 	document.getElementById('Fx1AcProcessorPresence').value = value-50;  	document.getElementById('fx1AcProcessorPresence').value = value-50; 
					break;
			}
			break;
		
		case "fx1subwah":
			switch(level){
				case "All":
					value = rand(0,5); 		SetParameter('Fx1SubWahType', value);   			document.getElementById('Fx1SubWahType').value   	= value;            document.getElementById('fx1SubWahType').value   	= value;
					value = rand(0,100); 	SetParameter('Fx1SubWahPedalPos', value);   		document.getElementById('Fx1SubWahPedalPos').value  = value;            document.getElementById('fx1SubWahPedalPos').value  = value;
					value = rand(0,100); 	SetParameter('Fx1SubWahPedalMin', value);   		document.getElementById('Fx1SubWahPedalMin').value  = value;            document.getElementById('fx1SubWahPedalMin').value  = value;
					value = rand(0,100); 	SetParameter('Fx1SubWahPedalMax', value);   		document.getElementById('Fx1SubWahPedalMax').value  = value;            document.getElementById('fx1SubWahPedalMax').value  = value;
					//value = rand(0,100); 	SetParameter('Fx1SubWahEffectLev', value);			document.getElementById('Fx1SubWahEffectLev').value	= value;            document.getElementById('fx1SubWahEffectLev').value	= value;
					//value = rand(0,100); 	SetParameter('Fx1SubWahDirectLev', value);			document.getElementById('Fx1SubWahDirectLev').value	= value;            document.getElementById('fx1SubWahDirectLev').value	= value;
					break;
			}
			break;
		
		case "fx1graphiceq":
			switch(level){
				case "All":
					value = rand(-12,12); 	SetParameter('Fx1GraphicEq31', value+12); 	document.getElementById('Fx1GraphicEq31').value = value;  	document.getElementById('fx1GraphicEq31').value = value; 
					value = rand(-12,12); 	SetParameter('Fx1GraphicEq62', value+12); 	document.getElementById('Fx1GraphicEq62').value = value;  	document.getElementById('fx1GraphicEq62').value = value; 
					value = rand(-12,12); 	SetParameter('Fx1GraphicEq125', value+12); 	document.getElementById('Fx1GraphicEq125').value = value;  	document.getElementById('fx1GraphicEq125').value = value;
					value = rand(-12,12); 	SetParameter('Fx1GraphicEq250', value+12); 	document.getElementById('Fx1GraphicEq250').value = value;  	document.getElementById('fx1GraphicEq250').value = value;
					value = rand(-12,12); 	SetParameter('Fx1GraphicEq500', value+12); 	document.getElementById('Fx1GraphicEq500').value = value;  	document.getElementById('fx1GraphicEq500').value = value;
					value = rand(-12,12); 	SetParameter('Fx1GraphicEq1k', value+12); 	document.getElementById('Fx1GraphicEq1k').value = value;  	document.getElementById('fx1GraphicEq1k').value = value; 
					value = rand(-12,12); 	SetParameter('Fx1GraphicEq2k', value+12); 	document.getElementById('Fx1GraphicEq2k').value = value;  	document.getElementById('fx1GraphicEq2k').value = value; 
					value = rand(-12,12); 	SetParameter('Fx1GraphicEq4k', value+12); 	document.getElementById('Fx1GraphicEq4k').value = value;  	document.getElementById('fx1GraphicEq4k').value = value; 
					value = rand(-12,12); 	SetParameter('Fx1GraphicEq8k', value+12); 	document.getElementById('Fx1GraphicEq8k').value = value;  	document.getElementById('fx1GraphicEq8k').value = value; 
					value = rand(-12,12); 	SetParameter('Fx1GraphicEq16k', value+12); 	document.getElementById('Fx1GraphicEq16k').value = value;  	document.getElementById('fx1GraphicEq16k').value = value;
					break;
			}
			break;
		
		
		case "fx2advcomp":
			switch(level){
				case "All":
					value = rand(0,7); 		SetParameter('Fx2AdvCompType',value); 		document.getElementById('Fx2AdvCompType').value 	= value;	 document.getElementById('fx2AdvCompType').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2AdvCompSustain',value); 	document.getElementById('Fx2AdvCompSustain').value 	= value;     document.getElementById('fx2AdvCompSustain').value = value;
					value = rand(0,100); 	SetParameter('Fx2AdvCompAttack',value); 	document.getElementById('Fx2AdvCompAttack').value 	= value;     document.getElementById('fx2AdvCompAttack').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2AdvCompTone',value); 		document.getElementById('Fx2AdvCompTone').value 	= value-50;  document.getElementById('fx2AdvCompTone').value 	= value-50;
					//value = rand(0,100); 	SetParameter('Fx2AdvCompLevel',value); 		document.getElementById('Fx2AdvCompLevel').value 	= value;     document.getElementById('fx2AdvCompLevel').value 	= value;
					break;
			}
			break;
			
		case "fx2limiter":
			switch(level){
				case "All":
					value = rand(0,2); 		SetParameter('Fx2LimiterType', value); 			document.getElementById('Fx2LimiterType').value 		= value;	document.getElementById('fx2LimiterType').value 		= value;
					value = rand(0,100); 	SetParameter('Fx2LimiterAttack', value); 		document.getElementById('Fx2LimiterAttack').value 		= value;    document.getElementById('fx2LimiterAttack').value 		= value;
					value = rand(0,100); 	SetParameter('Fx2LimiterThreshold', value); 	document.getElementById('Fx2LimiterThreshold').value 	= value;    document.getElementById('fx2LimiterThreshold').value 	= value;
					value = rand(0,17); 	SetParameter('Fx2LimiterRatio', value); 		document.getElementById('Fx2LimiterRatio').value 		= value;    document.getElementById('fx2LimiterRatio').value 		= value;
					value = rand(0,100); 	SetParameter('Fx2LimiterRelease', value); 		document.getElementById('Fx2LimiterRelease').value 		= value;    document.getElementById('fx2LimiterRelease').value 		= value;
					//value = rand(0,100); 	SetParameter('Fx2LimiterLevel', value); 		document.getElementById('Fx2LimiterLevel').value 		= value;    document.getElementById('fx2LimiterLevel').value 		= value;
					break;
			}
			break;
			
		case "fx2twah":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx2TWahMode', value); 		document.getElementById('Fx2TWahMode').value 		= value;	document.getElementById('fx2TWahMode').value 		= value;
					value = rand(0,1); 		SetParameter('Fx2TWahPolarity', value); 	document.getElementById('Fx2TWahPolarity').value 	= value;    document.getElementById('fx2TWahPolarity').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2TWahSens', value); 		document.getElementById('Fx2TWahSens').value 		= value;    document.getElementById('fx2TWahSens').value 		= value;
					value = rand(0,100); 	SetParameter('Fx2TWahFrequency', value);    document.getElementById('Fx2TWahFrequency').value 	= value;    document.getElementById('fx2TWahFrequency').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2TWahPeak', value); 		document.getElementById('Fx2TWahPeak').value 		= value;    document.getElementById('fx2TWahPeak').value 		= value;
					//value = rand(0,100); 	SetParameter('Fx2TWahDirectLev', value);    document.getElementById('Fx2TWahDirectLev').value 	= value;    document.getElementById('fx2TWahDirectLev').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx2TWahEffectLev', value);    document.getElementById('Fx2TWahEffectLev').value 	= value;    document.getElementById('fx2TWahEffectLev').value 	= value;
					break;
			}
			break;
			
		case "fx2autowah":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx2AutoWahMode', value); 			document.getElementById('Fx2AutoWahMode').value 		= value;	document.getElementById('fx2AutoWahMode').value 		= value;
					value = rand(0,100); 	SetParameter('Fx2AutoWahFrequency', value); 	document.getElementById('Fx2AutoWahFrequency').value 	= value;    document.getElementById('fx2AutoWahFrequency').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2AutoWahPeak', value); 			document.getElementById('Fx2AutoWahPeak').value 		= value;    document.getElementById('fx2AutoWahPeak').value 		= value;
					value = rand(0,113); 	SetParameter('Fx2AutoWahRate', value); 			document.getElementById('Fx2AutoWahRate').value 		= value;    document.getElementById('fx2AutoWahRate').value 		= value;	SetValueRangeNumberSelect(document.getElementById('fx2AutoWahRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx2AutoWahDepth', value); 		document.getElementById('Fx2AutoWahDepth').value 		= value;    document.getElementById('fx2AutoWahDepth').value 		= value;
					//value = rand(0,100); 	SetParameter('Fx2AutoWahDirectLev', value); 	document.getElementById('Fx2AutoWahDirectLev').value 	= value;    document.getElementById('fx2AutoWahDirectLev').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx2AutoWahEffectLev', value); 	document.getElementById('Fx2AutoWahEffectLev').value 	= value;    document.getElementById('fx2AutoWahEffectLev').value 	= value;
					break;
			}
			break;
			
		case "fx2tremolo":
			switch(level) {
				case "All":
					value = rand(0,100); 	SetParameter('Fx2TremoloWaveShape', value); document.getElementById('Fx2TremoloWaveShape').value = value;  	document.getElementById('fx2TremoloWaveShape').value = value; 
					value = rand(0,113); 	SetParameter('Fx2TremoloRate', value); 		document.getElementById('Fx2TremoloRate').value = value;  		document.getElementById('fx2TremoloRate').value = value; 		SetValueRangeNumberSelect(document.getElementById('Fx2TremoloRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx2TremoloDepth', value); 	document.getElementById('Fx2TremoloDepth').value = value;  		document.getElementById('fx2TremoloDepth').value = value; 
					break;
			}
			break;
			
		case "fx2phaser":
			switch(level) {
				case "All":
					value = rand(0,3); 	 SetParameter('Fx2PhaserType', value);      document.getElementById('Fx2PhaserType').value      = value;
					value = rand(0,113); SetParameter('Fx2PhaserRate', value);      document.getElementById('Fx2PhaserRate').value      = value; document.getElementById('fx2PhaserRate').value      = value;	SetValueRangeNumberSelect(document.getElementById('fx2PhaserRate'),100,'bpm2');
					value = rand(0,100); SetParameter('Fx2PhaserDepth', value);     document.getElementById('Fx2PhaserDepth').value     = value; document.getElementById('fx2PhaserDepth').value     = value;
					value = rand(0,100); SetParameter('Fx2PhaserManual', value);    document.getElementById('Fx2PhaserManual').value    = value; document.getElementById('fx2PhaserManual').value    = value;
					value = rand(0,100); SetParameter('Fx2PhaserResonance', value); document.getElementById('Fx2PhaserResonance').value = value; document.getElementById('fx2PhaserResonance').value = value;
					value = rand(0,113); SetParameter('Fx2PhaserStepRate', value);  document.getElementById('Fx2PhaserStepRate').value  = value; document.getElementById('fx2PhaserStepRate').value  = value;	SetValueRangeNumberSelect(document.getElementById('fx2PhaserStepRate'),100,'bpm2');
					break;
			}
			break;
			
		case "fx2flanger":
			switch(level) {
				case "All":
					value = rand(0,113); SetParameter('Fx2FlangerRate', value);      	document.getElementById('Fx2FlangerRate').value      	= value; document.getElementById('fx2FlangerRate').value       = value;		SetValueRangeNumberSelect(document.getElementById('fx2FlangerRate'),100,'bpm2');
					value = rand(0,100); SetParameter('Fx2FlangerDepth', value);     	document.getElementById('Fx2FlangerDepth').value     	= value; document.getElementById('fx2FlangerDepth').value      = value;
					value = rand(0,100); SetParameter('Fx2FlangerManual', value);    	document.getElementById('Fx2FlangerManual').value    	= value; document.getElementById('fx2FlangerManual').value     = value;
					value = rand(0,100); SetParameter('Fx2FlangerResonance', value);    document.getElementById('Fx2FlangerResonance').value    = value; document.getElementById('fx2FlangerResonance').value  = value;
					value = rand(0,100); SetParameter('Fx2FlangerSeparation', value);   document.getElementById('Fx2FlangerSeparation').value   = value; document.getElementById('fx2FlangerSeparation').value = value;
					value = rand(0,10);  SetParameter('Fx2FlangerLowCut', value);     	document.getElementById('Fx2FlangerLowCut').value       = value; document.getElementById('fx2FlangerLowCut').value     = value;
					//value = rand(0,100); SetParameter('Fx2FlangerEffectLev', value);    document.getElementById('Fx2FlangerEffectLev').value   = value; document.getElementById('fx2FlangerEffectLev').value  = value;
					//value = rand(0,100); SetParameter('Fx2FlangerDirectLev', value);    document.getElementById('Fx2FlangerDirectLev').value   = value; document.getElementById('fx2FlangerDirectLev').value  = value;
					break;
			}
			break;
			
		case "fx2pan":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx2PanType', value); 			document.getElementById('Fx2PanType').value 		= value;		document.getElementById('fx2PanType').value 		= value;
					value = rand(0,100); 	SetParameter('Fx2PanPosition', value);		document.getElementById('Fx2PanPosition').value 	= value-32;     document.getElementById('fx2PanPosition').value 	= value-32;
					value = rand(0,100); 	SetParameter('Fx2PanWaveShape', value); 	document.getElementById('Fx2PanWaveShape').value 	= value;        document.getElementById('fx2PanWaveShape').value 	= value;
					value = rand(0,113); 	SetParameter('Fx2PanRate', value); 			document.getElementById('Fx2PanRate').value 		= value;		document.getElementById('fx2PanRate').value 		= value;		SetValueRangeNumberSelect(document.getElementById('fx2PanRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx2PanDepth', value); 		document.getElementById('Fx2PanDepth').value 		= value;        document.getElementById('fx2PanDepth').value 		= value;
					break;
			}
			break;
			
		case "fx2vibrato":
			switch(level){
				case "All":
					value = rand(0,113); 	SetParameter('Fx2VibratoRate', value); 		document.getElementById('Fx2VibratoRate').value 	= value;		document.getElementById('fx2VibratoRate').value 	= value;		SetValueRangeNumberSelect(document.getElementById('fx2VibratoRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx2VibratoDepth', value); 	document.getElementById('Fx2VibratoDepth').value 	= value;        document.getElementById('fx2VibratoDepth').value 	= value;
					value = rand(0,1); 		SetParameter('Fx2VibratoTrigger', value); 	document.getElementById('Fx2VibratoTrigger').value 	= value;        document.getElementById('fx2VibratoTrigger').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2VibratoRiseTime', value); 	document.getElementById('Fx2VibratoRiseTime').value = value;        document.getElementById('fx2VibratoRiseTime').value = value;
					break;
			}
			break;
			
		case "fx2univ":
			switch(level){
				case "All":
					value = rand(0,113); 	SetParameter('Fx2UniVRate', value); 		document.getElementById('Fx2UniVRate').value 	= value;		document.getElementById('fx2UniVRate').value 	= value;		SetValueRangeNumberSelect(document.getElementById('fx2UniVRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx2UniVDepth', value); 	    document.getElementById('Fx2UniVDepth').value 	= value;        document.getElementById('fx2UniVDepth').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx2UniVLevel', value); 	    document.getElementById('Fx2UniVLevel').value 	= value;        document.getElementById('fx2UniVLevel').value 	= value;
					break;
			}
			break;
			
		case "fx2ringmod":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx2RingModMode', value); 		document.getElementById('Fx2RingModMode').value 		= value;	document.getElementById('fx2RingModMode').value 		= value;
					value = rand(0,100); 	SetParameter('Fx2RingModFrequency', value); 	document.getElementById('Fx2RingModFrequency').value 	= value;    document.getElementById('fx2RingModFrequency').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx2RingModDirectLev', value); 	document.getElementById('Fx2RingModDirectLev').value 	= value;    document.getElementById('fx2RingModDirectLev').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx2RingModEffectLev', value); 	document.getElementById('Fx2RingModEffectLev').value 	= value;    document.getElementById('fx2RingModEffectLev').value 	= value;
					break;
			}
			break;
			
		case "fx2slowgear":
			switch(level){
				case "All":
					value = rand(0,100); 	SetParameter('Fx2SlowGearSens', value); 		document.getElementById('Fx2SlowGearSens').value 		= value;	document.getElementById('fx2SlowGearSens').value 		= value;
					value = rand(0,100); 	SetParameter('Fx2SlowGearRiseTime', value); 	document.getElementById('Fx2SlowGearRiseTime').value 	= value;    document.getElementById('fx2SlowGearRiseTime').value 	= value;
					break;
			}
			break;
			
		case "fx2feedbacker":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx2FeedbackerMode', value); 		document.getElementById('Fx2FeedbackerMode').value 		= value;	document.getElementById('fx2FeedbackerMode').value 		= value;
					value = rand(0,100); 	SetParameter('Fx2FeedbackerRiseTime', value); 	document.getElementById('Fx2FeedbackerRiseTime').value 	= value;    document.getElementById('fx2FeedbackerRiseTime').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2FeedbackerRiseTUp', value); 	document.getElementById('Fx2FeedbackerRiseTUp').value 	= value;    document.getElementById('fx2FeedbackerRiseTUp').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2FeedbackerFBLevel', value); 	document.getElementById('Fx2FeedbackerFBLevel').value 	= value;    document.getElementById('fx2FeedbackerFBLevel').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2FeedbackerFBLvUp', value); 	document.getElementById('Fx2FeedbackerFBLvUp').value 	= value;    document.getElementById('fx2FeedbackerFBLvUp').value 	= value;
					value = rand(0,113); 	SetParameter('Fx2FeedbackerVibRate', value); 	document.getElementById('Fx2FeedbackerVibRate').value 	= value;	document.getElementById('fx2FeedbackerVibRate').value 	= value;	SetValueRangeNumberSelect(document.getElementById('fx2FeedbackerVibRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx2FeedbackerDepth', value); 		document.getElementById('Fx2FeedbackerDepth').value 	= value;    document.getElementById('fx2FeedbackerDepth').value 	= value;
					break;
			}
			break;
			
		case "fx2antifeedback":
			switch(level){
				case "All":
					value = rand(0,100); 	SetParameter('Fx2AntiFeedbackFreq1', value); 	document.getElementById('Fx2AntiFeedbackFreq1').value 	= value;	document.getElementById('fx2AntiFeedbackFreq1').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2AntiFeedbackDepth1', value); 	document.getElementById('Fx2AntiFeedbackDepth1').value 	= value;    document.getElementById('fx2AntiFeedbackDepth1').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2AntiFeedbackFreq2', value); 	document.getElementById('Fx2AntiFeedbackFreq2').value 	= value;    document.getElementById('fx2AntiFeedbackFreq2').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2AntiFeedbackDepth2', value); 	document.getElementById('Fx2AntiFeedbackDepth2').value 	= value;    document.getElementById('fx2AntiFeedbackDepth2').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2AntiFeedbackFreq3', value); 	document.getElementById('Fx2AntiFeedbackFreq3').value 	= value;    document.getElementById('fx2AntiFeedbackFreq3').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2AntiFeedbackDepth3', value); 	document.getElementById('Fx2AntiFeedbackDepth3').value 	= value;    document.getElementById('fx2AntiFeedbackDepth3').value 	= value;
					break;
			}
			break;
			
		case "fx2humanizer":
			switch(level){
				case "All":
					value = rand(0,2); 		SetParameter('Fx2HumanizerMode', value); 	document.getElementById('Fx2HumanizerMode').value 	= value;	document.getElementById('fx2HumanizerMode').value 	= value;
					value = rand(0,4); 		SetParameter('Fx2HumanizerVowel1', value); 	document.getElementById('Fx2HumanizerVowel1').value = value;    document.getElementById('fx2HumanizerVowel1').value = value;
					value = rand(0,4); 		SetParameter('Fx2HumanizerVowel2', value); 	document.getElementById('Fx2HumanizerVowel2').value = value;    document.getElementById('fx2HumanizerVowel2').value = value;
					value = rand(0,100); 	SetParameter('Fx2HumanizerSens', value); 	document.getElementById('Fx2HumanizerSens').value 	= value;    document.getElementById('fx2HumanizerSens').value 	= value;
					value = rand(0,113); 	SetParameter('Fx2HumanizerRate', value); 	document.getElementById('Fx2HumanizerRate').value 	= value;	document.getElementById('fx2HumanizerRate').value 	= value;	SetValueRangeNumberSelect(document.getElementById('fx2HumanizerRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx2HumanizerDepth', value); 	document.getElementById('Fx2HumanizerDepth').value 	= value;    document.getElementById('fx2HumanizerDepth').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2HumanizerManual', value); 	document.getElementById('Fx2HumanizerManual').value = value;    document.getElementById('fx2HumanizerManual').value = value;
					value = rand(0,100); 	SetParameter('Fx2HumanizerLevel', value); 	document.getElementById('Fx2HumanizerLevel').value 	= value;    document.getElementById('fx2HumanizerLevel').value 	= value;
					break;
			}
			break;
			
		case "fx2slicer":
			switch(level){
				case "All":
					value = rand(0,19); 	SetParameter('Fx2SlicerPattern', value); 	document.getElementById('Fx2SlicerPattern').value 	= value;	document.getElementById('fx2SlicerPattern').value 	= value;
					value = rand(0,113); 	SetParameter('Fx2SlicerRate', value); 		document.getElementById('Fx2SlicerRate').value 		= value;	document.getElementById('fx2SlicerRate').value 		= value;	SetValueRangeNumberSelect(document.getElementById('fx2SlicerRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx2SlicerTrigSens', value); 	document.getElementById('Fx2SlicerTrigSens').value 	= value;    document.getElementById('fx2SlicerTrigSens').value 	= value;
					break;
			}
			break;
			
		case "fx2paraeq":
			switch(level){
				case "All":
					value = rand(0,10); 	SetParameter('Fx2ParaEqLowCut', value); 	document.getElementById('Fx2ParaEqLowCut').value = value;  	document.getElementById('fx2ParaEqLowCut').value = value; 
					value = rand(-20,20); 	SetParameter('Fx2ParaEqLowGain',value+20);  document.getElementById('Fx2ParaEqLowGain').value = value;  document.getElementById('fx2ParaEqLowGain').value = value; 
					value = rand(0,27); 	SetParameter('Fx2ParaEqLoMidf', value); 	document.getElementById('Fx2ParaEqLoMidf').value = value;  	document.getElementById('fx2ParaEqLoMidf').value = value;
					value = rand(0,5); 		SetParameter('Fx2ParaEqLoMidQ', value); 	document.getElementById('Fx2ParaEqLoMidQ').value = value;  	document.getElementById('fx2ParaEqLoMidQ').value = value;
					value = rand(-20,20); 	SetParameter('Fx2ParaEqLoMidG', value+20); 	document.getElementById('Fx2ParaEqLoMidG').value = value;  	document.getElementById('fx2ParaEqLoMidG').value = value;
					value = rand(0,27); 	SetParameter('Fx2ParaEqHiMidf', value); 	document.getElementById('Fx2ParaEqHiMidf').value = value;  	document.getElementById('fx2ParaEqHiMidf').value = value; 
					value = rand(0,5); 		SetParameter('Fx2ParaEqHiMidQ', value); 	document.getElementById('Fx2ParaEqHiMidQ').value = value;  	document.getElementById('fx2ParaEqHiMidQ').value = value; 
					value = rand(-20,20); 	SetParameter('Fx2ParaEqHiMidG', value+20); 	document.getElementById('Fx2ParaEqHiMidG').value = value;  	document.getElementById('fx2ParaEqHiMidG').value = value; 
					value = rand(-20,20); 	SetParameter('Fx2ParaEqHiGain', value+20); 	document.getElementById('Fx2ParaEqHiGain').value = value;  	document.getElementById('fx2ParaEqHiGain').value = value; 
					value = rand(0,9); 		SetParameter('Fx2ParaEqHiCut',  value); 	document.getElementById('Fx2ParaEqHiCut').value = value;  	document.getElementById('fx2ParaEqHiCut').value = value;
					break;
			}
			break;

		case "fx2harmonist":
			switch(level){
				case "All":
					value = rand(0,2); 		SetParameter('Fx2HarmonistVoice', value); 	 			document.getElementById('Fx2HarmonistVoice').value 	 			= value;		document.getElementById('fx2HarmonistVoice').value 	 			= value;
					value = rand(0,29); 	SetParameter('Fx2HarmonistHr1Harm', value); 	 		document.getElementById('Fx2HarmonistHr1Harm').value 	 		= value;    	document.getElementById('fx2HarmonistHr1Harm').value 	 		= value;
					value = rand(0,313); 	SetParameter('Fx2HarmonistHr1PreDl', value); 	 		document.getElementById('Fx2HarmonistHr1PreDl').value 	 		= value;		document.getElementById('fx2HarmonistHr1PreDl').value 	 		= value;		SetValueRangeNumberSelect(document.getElementById('fx2HarmonistHr1PreDl'),300,'bpm');
					value = rand(0,100); 	SetParameter('Fx2HarmonistHr1Level', value); 	 		document.getElementById('Fx2HarmonistHr1Level').value 	 		= value;    	document.getElementById('fx2HarmonistHr1Level').value 	 		= value;
					value = rand(0,29); 	SetParameter('Fx2HarmonistHr2Harm', value); 	 		document.getElementById('Fx2HarmonistHr2Harm').value 	 		= value;    	document.getElementById('fx2HarmonistHr2Harm').value 	 		= value;
					value = rand(0,313); 	SetParameter('Fx2HarmonistHr2PreDl', value); 	 		document.getElementById('Fx2HarmonistHr2PreDl').value 	 		= value;		document.getElementById('fx2HarmonistHr2PreDl').value 	 		= value;		SetValueRangeNumberSelect(document.getElementById('fx2HarmonistHr2PreDl'),300,'bpm');
					value = rand(0,100); 	SetParameter('Fx2HarmonistHr2Level', value); 	 		document.getElementById('Fx2HarmonistHr2Level').value 	 		= value;    	document.getElementById('fx2HarmonistHr2Level').value 	 		= value;
					value = rand(0,100); 	SetParameter('Fx2HarmonistHr1Fbk', value); 	 			document.getElementById('Fx2HarmonistHr1Fbk').value 	 		= value;    	document.getElementById('fx2HarmonistHr1Fbk').value 	 		= value;
					value = rand(0,100); 	SetParameter('Fx2HarmonistDirectLev', value); 	 		document.getElementById('Fx2HarmonistDirectLev').value 	 		= value;    	document.getElementById('fx2HarmonistDirectLev').value 	 		= value;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr1UserScaleKeyC', value); 	document.getElementById('Fx2HarmonistHr1UserScaleKeyC').value 	= value-24; 	document.getElementById('fx2HarmonistHr1UserScaleKeyC').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr1UserScaleKeyDb', value); 	document.getElementById('Fx2HarmonistHr1UserScaleKeyDb').value 	= value-24; 	document.getElementById('fx2HarmonistHr1UserScaleKeyDb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr1UserScaleKeyD', value); 	document.getElementById('Fx2HarmonistHr1UserScaleKeyD').value 	= value-24; 	document.getElementById('fx2HarmonistHr1UserScaleKeyD').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr1UserScaleKeyEb', value); 	document.getElementById('Fx2HarmonistHr1UserScaleKeyEb').value 	= value-24; 	document.getElementById('fx2HarmonistHr1UserScaleKeyEb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr1UserScaleKeyE', value); 	document.getElementById('Fx2HarmonistHr1UserScaleKeyE').value 	= value-24; 	document.getElementById('fx2HarmonistHr1UserScaleKeyE').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr1UserScaleKeyF', value); 	document.getElementById('Fx2HarmonistHr1UserScaleKeyF').value 	= value-24; 	document.getElementById('fx2HarmonistHr1UserScaleKeyF').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr1UserScaleKeyFs', value); 	document.getElementById('Fx2HarmonistHr1UserScaleKeyFs').value 	= value-24; 	document.getElementById('fx2HarmonistHr1UserScaleKeyFs').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr1UserScaleKeyG', value); 	document.getElementById('Fx2HarmonistHr1UserScaleKeyG').value 	= value-24; 	document.getElementById('fx2HarmonistHr1UserScaleKeyG').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr1UserScaleKeyAb', value); 	document.getElementById('Fx2HarmonistHr1UserScaleKeyAb').value 	= value-24; 	document.getElementById('fx2HarmonistHr1UserScaleKeyAb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr1UserScaleKeyA', value); 	document.getElementById('Fx2HarmonistHr1UserScaleKeyA').value 	= value-24; 	document.getElementById('fx2HarmonistHr1UserScaleKeyA').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr1UserScaleKeyBb', value); 	document.getElementById('Fx2HarmonistHr1UserScaleKeyBb').value 	= value-24; 	document.getElementById('fx2HarmonistHr1UserScaleKeyBb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr1UserScaleKeyB', value); 	document.getElementById('Fx2HarmonistHr1UserScaleKeyB').value 	= value-24; 	document.getElementById('fx2HarmonistHr1UserScaleKeyB').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr2UserScaleKeyC', value); 	document.getElementById('Fx2HarmonistHr2UserScaleKeyC').value 	= value-24; 	document.getElementById('fx2HarmonistHr2UserScaleKeyC').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr2UserScaleKeyDb', value); 	document.getElementById('Fx2HarmonistHr2UserScaleKeyDb').value 	= value-24; 	document.getElementById('fx2HarmonistHr2UserScaleKeyDb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr2UserScaleKeyD', value); 	document.getElementById('Fx2HarmonistHr2UserScaleKeyD').value 	= value-24; 	document.getElementById('fx2HarmonistHr2UserScaleKeyD').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr2UserScaleKeyEb', value); 	document.getElementById('Fx2HarmonistHr2UserScaleKeyEb').value 	= value-24; 	document.getElementById('fx2HarmonistHr2UserScaleKeyEb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr2UserScaleKeyE', value); 	document.getElementById('Fx2HarmonistHr2UserScaleKeyE').value 	= value-24; 	document.getElementById('fx2HarmonistHr2UserScaleKeyE').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr2UserScaleKeyF', value); 	document.getElementById('Fx2HarmonistHr2UserScaleKeyF').value 	= value-24; 	document.getElementById('fx2HarmonistHr2UserScaleKeyF').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr2UserScaleKeyFs', value); 	document.getElementById('Fx2HarmonistHr2UserScaleKeyFs').value 	= value-24; 	document.getElementById('fx2HarmonistHr2UserScaleKeyFs').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr2UserScaleKeyG', value); 	document.getElementById('Fx2HarmonistHr2UserScaleKeyG').value 	= value-24; 	document.getElementById('fx2HarmonistHr2UserScaleKeyG').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr2UserScaleKeyAb', value); 	document.getElementById('Fx2HarmonistHr2UserScaleKeyAb').value 	= value-24; 	document.getElementById('fx2HarmonistHr2UserScaleKeyAb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr2UserScaleKeyA', value); 	document.getElementById('Fx2HarmonistHr2UserScaleKeyA').value 	= value-24; 	document.getElementById('fx2HarmonistHr2UserScaleKeyA').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr2UserScaleKeyBb', value); 	document.getElementById('Fx2HarmonistHr2UserScaleKeyBb').value 	= value-24; 	document.getElementById('fx2HarmonistHr2UserScaleKeyBb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2HarmonistHr2UserScaleKeyB', value); 	document.getElementById('Fx2HarmonistHr2UserScaleKeyB').value 	= value-24; 	document.getElementById('fx2HarmonistHr2UserScaleKeyB').value 	= value-24;
					break;
			}
			break;
			
		case "fx2pitchshifter":
			switch(level){
				case "All":
					value = rand(0,2); 		SetParameter('Fx2PitchShifterVoice', value); 		document.getElementById('Fx2PitchShifterVoice').value 	 	= value;		document.getElementById('fx2PitchShifterVoice').value 	 	= value;
					value = rand(0,3); 		SetParameter('Fx2PitchShifterPs1Mode', value); 		document.getElementById('Fx2PitchShifterPs1Mode').value 	= value;    	document.getElementById('fx2PitchShifterPs1Mode').value 	= value;
					value = rand(0,48); 	SetParameter('Fx2PitchShifterPs1Pitch', value); 	document.getElementById('Fx2PitchShifterPs1Pitch').value 	= value-24;    	document.getElementById('fx2PitchShifterPs1Pitch').value 	= value-24;
					value = rand(0,100); 	SetParameter('Fx2PitchShifterPs1Fine', value); 		document.getElementById('Fx2PitchShifterPs1Fine').value 	= value-50;    	document.getElementById('fx2PitchShifterPs1Fine').value 	= value-50;
					value = rand(0,313); 	SetParameter('Fx2PitchShifterPs1PreDly', value); 	document.getElementById('Fx2PitchShifterPs1PreDly').value 	= value;		document.getElementById('fx2PitchShifterPs1PreDly').value 	= value;	SetValueRangeNumberSelect(document.getElementById('fx2PitchShifterPs1PreDly'),300,'bpm');
					value = rand(0,100); 	SetParameter('Fx2PitchShifterPs1Level', value); 	document.getElementById('Fx2PitchShifterPs1Level').value 	= value;    	document.getElementById('fx2PitchShifterPs1Level').value 	= value;
					value = rand(0,3); 		SetParameter('Fx2PitchShifterPs2Mode', value); 		document.getElementById('Fx2PitchShifterPs2Mode').value 	= value;    	document.getElementById('fx2PitchShifterPs2Mode').value 	= value;
					value = rand(0,48); 	SetParameter('Fx2PitchShifterPs2Pitch', value); 	document.getElementById('Fx2PitchShifterPs2Pitch').value 	= value-24;    	document.getElementById('fx2PitchShifterPs2Pitch').value 	= value-24;
					value = rand(0,100); 	SetParameter('Fx2PitchShifterPs2Fine', value); 		document.getElementById('Fx2PitchShifterPs2Fine').value 	= value-50;    	document.getElementById('fx2PitchShifterPs2Fine').value 	= value-50;
					value = rand(0,313); 	SetParameter('Fx2PitchShifterPs2PreDly', value); 	document.getElementById('Fx2PitchShifterPs2PreDly').value 	= value;		document.getElementById('fx2PitchShifterPs2PreDly').value 	= value;	SetValueRangeNumberSelect(document.getElementById('fx2PitchShifterPs2PreDly'),300,'bpm');
					value = rand(0,100); 	SetParameter('Fx2PitchShifterPs2Level', value); 	document.getElementById('Fx2PitchShifterPs2Level').value 	= value;    	document.getElementById('fx2PitchShifterPs2Level').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2PitchShifterPs1Fbk', value); 	 	document.getElementById('Fx2PitchShifterPs1Fbk').value 		= value;    	document.getElementById('fx2PitchShifterPs1Fbk').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx2PitchShifterDirectLev', value); 	document.getElementById('Fx2PitchShifterDirectLev').value 	= value;    	document.getElementById('fx2PitchShifterDirectLev').value 	= value;
					break;
			}
			break;
			
		case "fx2octave":
			switch(level){
				case "All":
					value = rand(0,3); 		SetParameter('Fx2OctaveRange', value); 	 	document.getElementById('Fx2OctaveRange').value 	 	= value;	document.getElementById('fx2OctaveRange').value 	 	= value;
					//value = rand(0,100); 	SetParameter('Fx2OctaveOctLevel', value); 	document.getElementById('Fx2OctaveOctLevel').value 	 	= value;    document.getElementById('fx2OctaveOctLevel').value 	 	= value;
					//value = rand(0,100); 	SetParameter('Fx2OctaveDirectLev', value);	document.getElementById('Fx2OctaveDirectLev').value 	= value;    document.getElementById('fx2OctaveDirectLev').value 	= value;
					break;
			}
			break;
			
		case "fx2rotary":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx2RotarySpeedSel', value); 	document.getElementById('Fx2RotarySpeedSel').value 	= value;	document.getElementById('fx2RotarySpeedSel').value 	= value;
					value = rand(0,113); 	SetParameter('Fx2RotaryRateSlow', value); 	document.getElementById('Fx2RotaryRateSlow').value 	= value;	document.getElementById('fx2RotaryRateSlow').value 	= value;	SetValueRangeNumberSelect(document.getElementById('fx2RotaryRateSlow'),100,'bpm2');
					value = rand(0,113); 	SetParameter('Fx2RotaryRateFast', value); 	document.getElementById('Fx2RotaryRateFast').value 	= value;	document.getElementById('fx2RotaryRateFast').value 	= value;	SetValueRangeNumberSelect(document.getElementById('fx2RotaryRateFast'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx2RotaryRiseTime', value); 	document.getElementById('Fx2RotaryRiseTime').value 	= value;    document.getElementById('fx2RotaryRiseTime').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2RotaryFallTime', value); 	document.getElementById('Fx2RotaryFallTime').value 	= value;    document.getElementById('fx2RotaryFallTime').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2RotaryDepth', value); 	 	document.getElementById('Fx2RotaryDepth').value 	= value;    document.getElementById('fx2RotaryDepth').value 	= value;
					break;
			}
			break;
			
		case "fx22x2chorus":
			switch(level){
				case "All":
					value = rand(0,16); 	SetParameter('Fx22x2ChorusXoverF', value); 	 document.getElementById('fx22x2ChorusXoverF').value 	 = value;		document.getElementById('fx22x2ChorusXoverF').value 	 = value;
					value = rand(0,113); 	SetParameter('Fx22x2ChorusLoRate', value); 	 document.getElementById('fx22x2ChorusLoRate').value 	 = value;		document.getElementById('fx22x2ChorusLoRate').value 	 = value;	SetValueRangeNumberSelect(document.getElementById('fx22x2ChorusLoRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx22x2ChorusLoDepth', value);  document.getElementById('fx22x2ChorusLoDepth').value 	 = value;   	document.getElementById('fx22x2ChorusLoDepth').value 	 = value;
					value = rand(0,80); 	SetParameter('Fx22x2ChorusLoPreDly', value); document.getElementById('fx22x2ChorusLoPreDly').value 	 = value/2;   	document.getElementById('fx22x2ChorusLoPreDly').value 	 = value/2;
					value = rand(0,100); 	SetParameter('Fx22x2ChorusLoLevel', value);  document.getElementById('fx22x2ChorusLoLevel').value 	 = value;   	document.getElementById('fx22x2ChorusLoLevel').value 	 = value;
					value = rand(0,113); 	SetParameter('Fx22x2ChorusHiRate', value); 	 document.getElementById('fx22x2ChorusHiRate').value 	 = value;		document.getElementById('fx22x2ChorusHiRate').value 	 = value;	SetValueRangeNumberSelect(document.getElementById('fx22x2ChorusHiRate'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx22x2ChorusHiDepth', value);  document.getElementById('fx22x2ChorusHiDepth').value 	 = value;   	document.getElementById('fx22x2ChorusHiDepth').value 	 = value;
					value = rand(0,80); 	SetParameter('Fx22x2ChorusHiPreDly', value); document.getElementById('fx22x2ChorusHiPreDly').value 	 = value/2;   	document.getElementById('fx22x2ChorusHiPreDly').value 	 = value/2;
					value = rand(0,100); 	SetParameter('Fx22x2ChorusHiLevel', value);  document.getElementById('fx22x2ChorusHiLevel').value 	 = value;   	document.getElementById('fx22x2ChorusHiLevel').value 	 = value;
					break;
			}
			break;
			
		case "fx2subdelay":
			switch(level){
				case "All":
					value = rand(0,1013); 	SetParameter('Fx2SubDelayDlyTime', value); 		document.getElementById('Fx2SubDelayDlyTime').value 	= value;	document.getElementById('fx2SubDelayDlyTime').value 	= value;	SetValueRangeNumberSelect(document.getElementById('fx2SubDelayDlyTime'),1000,'bpm');
					value = rand(0,100); 	SetParameter('Fx2SubDelayFeedback', value); 	document.getElementById('Fx2SubDelayFeedback').value 	= value;    document.getElementById('fx2SubDelayFeedback').value 	= value;
					value = rand(0,9); 		SetParameter('Fx2SubDelayHiCut', value); 	 	document.getElementById('Fx2SubDelayHiCut').value 	 	= value;    document.getElementById('fx2SubDelayHiCut').value 	 	= value;
					//value = rand(0,120); 	SetParameter('Fx2SubDelayEffectLev', value); 	document.getElementById('Fx2SubDelayEffectLev').value 	= value;    document.getElementById('fx2SubDelayEffectLev').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx2SubDelayDirectLev', value); 	document.getElementById('Fx2SubDelayDirectLev').value 	= value;    document.getElementById('fx2SubDelayDirectLev').value 	= value;
					break;
			}
			break;
			
		case "fx2defretter":
			switch(level){
				case "All":
					value = rand(); 	SetParameter('Fx2DefretterTone', value); 	 	document.getElementById('Fx2DefretterTone').value 	 	= value-50;		document.getElementById('fx2DefretterTone').value 	 	= value-50;
					value = rand(); 	SetParameter('Fx2DefretterSens', value); 	 	document.getElementById('Fx2DefretterSens').value 	 	= value;        document.getElementById('fx2DefretterSens').value 	 	= value;
					value = rand(); 	SetParameter('Fx2DefretterAttack', value);  		document.getElementById('Fx2DefretterAttack').value 	= value;        document.getElementById('fx2DefretterAttack').value 	= value;
					value = rand(); 	SetParameter('Fx2DefretterDepth', value); 	 	document.getElementById('Fx2DefretterDepth').value 	 	= value;        document.getElementById('fx2DefretterDepth').value 	 	= value;
					value = rand(); 	SetParameter('Fx2DefretterResonance', value); 	document.getElementById('Fx2DefretterResonance').value 	= value;        document.getElementById('fx2DefretterResonance').value 	= value;
					//value = rand(); 	SetParameter('Fx2DefretterEffectLev', value); 	document.getElementById('Fx2DefretterEffectLev').value 	= value;        document.getElementById('fx2DefretterEffectLev').value 	= value;
					//value = rand(); 	SetParameter('Fx2DefretterDirectLev', value); 	document.getElementById('Fx2DefretterDirectLev').value 	= value;        document.getElementById('fx2DefretterDirectLev').value 	= value;
					break;
			}
			break;
		
		case "fx2sitarsim":
			switch(level){
				case "All":
					value = rand(0,100); 	SetParameter('Fx2SitarSimTone', value); 	 	document.getElementById('Fx2SitarSimTone').value 	 	= value-50;		document.getElementById('fx2SitarSimTone').value 	 	= value-50;
					value = rand(0,100); 	SetParameter('Fx2SitarSimSens', value); 	 	document.getElementById('Fx2SitarSimSens').value 	 	= value;        document.getElementById('fx2SitarSimSens').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx2SitarSimDepth', value); 	 	document.getElementById('Fx2SitarSimDepth').value 	 	= value;        document.getElementById('fx2SitarSimDepth').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx2SitarSimResonance', value); 	document.getElementById('Fx2SitarSimResonance').value 	= value;        document.getElementById('fx2SitarSimResonance').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2SitarSimBuzz', value); 	 	document.getElementById('Fx2SitarSimBuzz').value 	 	= value;        document.getElementById('fx2SitarSimBuzz').value 	 	= value;
					//value = rand(0,100); 	SetParameter('Fx2SitarSimEffectLev', value); 	document.getElementById('Fx2SitarSimEffectLev').value 	= value;        document.getElementById('fx2SitarSimEffectLev').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx2SitarSimDirectLev', value); 	document.getElementById('Fx2SitarSimDirectLev').value 	= value;        document.getElementById('fx2SitarSimDirectLev').value 	= value;
					break;
			}
			break;
		
		case "fx2wavesynth":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx2WaveSynthWave', value); 	 	document.getElementById('Fx2WaveSynthWave').value 	 	= value;        document.getElementById('fx2WaveSynthWave').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx2WaveSynthCutoff', value); 		document.getElementById('Fx2WaveSynthCutoff').value 	= value;        document.getElementById('fx2WaveSynthCutoff').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2WaveSynthResonance', value); 	document.getElementById('Fx2WaveSynthResonance').value 	= value;        document.getElementById('fx2WaveSynthResonance').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2WaveSynthFltSens', value); 		document.getElementById('Fx2WaveSynthFltSens').value 	= value;        document.getElementById('fx2WaveSynthFltSens').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2WaveSynthFltDecay', value); 	document.getElementById('Fx2WaveSynthFltDecay').value 	= value;        document.getElementById('fx2WaveSynthFltDecay').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2WaveSynthFltDepth', value); 	document.getElementById('Fx2WaveSynthFltDepth').value 	= value;        document.getElementById('fx2WaveSynthFltDepth').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx2WaveSynthSynthLev', value); 	document.getElementById('Fx2WaveSynthSynthLev').value 	= value;        document.getElementById('fx2WaveSynthSynthLev').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx2WaveSynthDirectLev', value); 	document.getElementById('Fx2WaveSynthDirectLev').value 	= value;        document.getElementById('fx2WaveSynthDirectLev').value 	= value;
					break;
			}
			break;
		
		case "fx2guitarsynth":
			switch(level){
				case "All":
					value = rand(0,3); 		SetParameter('Fx2GuitarSynthWave', value); 	 		document.getElementById('Fx2GuitarSynthWave').value 	 	= value;    	document.getElementById('fx2GuitarSynthWave').value 	 	= value;
					value = rand(0,1); 		SetParameter('Fx2GuitarSynthSens', value); 	 		document.getElementById('Fx2GuitarSynthSens').value 	 	= value;    	document.getElementById('fx2GuitarSynthSens').value 	 	= value;
					value = rand(0,2); 		SetParameter('Fx2GuitarSynthChromatic', value); 	document.getElementById('Fx2GuitarSynthChromatic').value 	= -value;   	document.getElementById('fx2GuitarSynthChromatic').value 	= -value;
					value = rand(0,100); 	SetParameter('Fx2GuitarSynthOctShift', value); 		document.getElementById('Fx2GuitarSynthOctShift').value 	= value;    	document.getElementById('fx2GuitarSynthOctShift').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2GuitarSynthPwmRate', value); 		document.getElementById('Fx2GuitarSynthPwmRate').value 	 	= value;    	document.getElementById('fx2GuitarSynthPwmRate').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx2GuitarSynthPwmDepth', value); 		document.getElementById('Fx2GuitarSynthPwmDepth').value 	= value;    	document.getElementById('fx2GuitarSynthPwmDepth').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2GuitarSynthCutoff', value); 		document.getElementById('Fx2GuitarSynthCutoff').value 	 	= value;    	document.getElementById('fx2GuitarSynthCutoff').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx2GuitarSynthResonance', value); 	document.getElementById('Fx2GuitarSynthResonance').value 	= value;    	document.getElementById('fx2GuitarSynthResonance').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2GuitarSynthFltSens', value); 		document.getElementById('Fx2GuitarSynthFltSens').value 	 	= value;    	document.getElementById('fx2GuitarSynthFltSens').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx2GuitarSynthFltDecay', value); 		document.getElementById('Fx2GuitarSynthFltDecay').value 	= value;    	document.getElementById('fx2GuitarSynthFltDecay').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2GuitarSynthFltDepth', value); 		document.getElementById('Fx2GuitarSynthFltDepth').value 	= 2*value-50;   document.getElementById('fx2GuitarSynthFltDepth').value 	= 2*value-50;
					value = rand(0,101); 	SetParameter('Fx2GuitarSynthAttack', value); 	document.getElementById('Fx2GuitarSynthAttack').value 	 	= value;    	document.getElementById('fx2GuitarSynthAttack').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx2GuitarSynthRelease', value); 	document.getElementById('Fx2GuitarSynthRelease').value 	 	= value;    	document.getElementById('fx2GuitarSynthRelease').value 	 	= value;
					value = rand(0,100); 	SetParameter('Fx2GuitarSynthVelocity', value); 	document.getElementById('Fx2GuitarSynthVelocity').value 	= value;    	document.getElementById('fx2GuitarSynthVelocity').value 	= value;
					value = rand(0,1); 		SetParameter('Fx2GuitarSynthHold', value); 	 	document.getElementById('Fx2GuitarSynthHold').value 	 	= value;    	document.getElementById('fx2GuitarSynthHold').value 	 	= value;
					//value = rand(0,100); 	SetParameter('Fx2GuitarSynthSynthLev', value); 	document.getElementById('Fx2GuitarSynthSynthLev').value 	= value;    	document.getElementById('fx2GuitarSynthSynthLev').value 	= value;
					//value = rand(0,100); 	SetParameter('Fx2GuitarSynthDirectLev', value); 	document.getElementById('Fx2GuitarSynthDirectLev').value 	= value;    document.getElementById('fx2GuitarSynthDirectLev').value 	= value;
					break;
			}
			break;
		
		case "fx2autoriff":
			switch(level){
				case "All":
					value = rand(0,30); 	SetParameter('Fx2AutoRiffPhrase', value); 	 				document.getElementById('Fx2AutoRiffPhrase').value 	 				= value;		document.getElementById('fx2AutoRiffPhrase').value 	 				= value;
					value = rand(0,1); 		SetParameter('Fx2AutoRiffLoop', value); 	 				document.getElementById('Fx2AutoRiffLoop').value 	 				= value;        document.getElementById('fx2AutoRiffLoop').value 	 				= value;
					value = rand(0,113); 	SetParameter('Fx2AutoRiffTempo', value); 	 				document.getElementById('Fx2AutoRiffTempo').value 	 				= value;		document.getElementById('fx2AutoRiffTempo').value 	 				= value;		SetValueRangeNumberSelect(document.getElementById('fx2SubDelayDlyTime'),100,'bpm2');
					value = rand(0,100); 	SetParameter('Fx2AutoRiffSens', value); 	 				document.getElementById('Fx2AutoRiffSens').value 	 				= value;        document.getElementById('fx2AutoRiffSens').value 	 				= value;
					value = rand(0,100); 	SetParameter('Fx2AutoRiffAttack', value); 	 				document.getElementById('Fx2AutoRiffAttack').value 	 				= value;        document.getElementById('fx2AutoRiffAttack').value 	 				= value;
					value = rand(0,1); 		SetParameter('Fx2AutoRiffHold', value); 	 				document.getElementById('Fx2AutoRiffHold').value 	 				= value;        document.getElementById('fx2AutoRiffHold').value 	 				= value;
					//value = rand(0,100); 	SetParameter('Fx2AutoRiffEffectLev', value); 	 			document.getElementById('Fx2AutoRiffEffectLev').value 	 			= value;        document.getElementById('fx2AutoRiffEffectLev').value 	 			= value;
					//value = rand(0,100); 	SetParameter('Fx2AutoRiffDirectLev', value); 	 			document.getElementById('Fx2AutoRiffDirectLev').value 	 			= value;        document.getElementById('fx2AutoRiffDirectLev').value 	 			= value;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting1C', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting1C').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting1C').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting2C', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting2C').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting2C').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting3C', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting3C').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting3C').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting4C', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting4C').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting4C').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting5C', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting5C').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting5C').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting6C', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting6C').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting6C').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting7C', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting7C').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting7C').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting8C', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting8C').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting8C').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting9C', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting9C').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting9C').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting10C', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting10C').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting10C').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting11C', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting11C').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting11C').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting12C', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting12C').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting12C').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting13C', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting13C').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting13C').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting14C', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting14C').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting14C').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting15C', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting15C').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting15C').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting16C', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting16C').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting16C').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting1Db', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting1Db').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting1Db').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting2Db', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting2Db').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting2Db').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting3Db', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting3Db').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting3Db').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting4Db', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting4Db').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting4Db').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting5Db', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting5Db').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting5Db').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting6Db', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting6Db').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting6Db').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting7Db', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting7Db').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting7Db').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting8Db', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting8Db').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting8Db').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting9Db', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting9Db').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting9Db').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting10Db', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting10Db').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting10Db').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting11Db', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting11Db').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting11Db').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting12Db', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting12Db').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting12Db').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting13Db', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting13Db').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting13Db').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting14Db', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting14Db').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting14Db').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting15Db', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting15Db').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting15Db').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting16Db', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting16Db').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting16Db').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting1D', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting1D').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting1D').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting2D', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting2D').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting2D').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting3D', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting3D').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting3D').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting4D', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting4D').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting4D').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting5D', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting5D').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting5D').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting6D', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting6D').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting6D').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting7D', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting7D').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting7D').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting8D', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting8D').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting8D').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting9D', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting9D').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting9D').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting10D', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting10D').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting10D').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting11D', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting11D').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting11D').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting12D', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting12D').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting12D').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting13D', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting13D').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting13D').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting14D', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting14D').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting14D').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting15D', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting15D').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting15D').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting16D', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting16D').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting16D').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting1Eb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting1Eb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting1Eb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting2Eb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting2Eb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting2Eb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting3Eb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting3Eb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting3Eb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting4Eb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting4Eb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting4Eb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting5Eb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting5Eb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting5Eb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting6Eb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting6Eb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting6Eb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting7Eb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting7Eb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting7Eb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting8Eb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting8Eb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting8Eb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting9Eb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting9Eb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting9Eb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting10Eb', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting10Eb').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting10Eb').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting11Eb', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting11Eb').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting11Eb').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting12Eb', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting12Eb').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting12Eb').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting13Eb', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting13Eb').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting13Eb').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting14Eb', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting14Eb').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting14Eb').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting15Eb', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting15Eb').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting15Eb').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting16Eb', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting16Eb').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting16Eb').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting1E', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting1E').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting1E').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting2E', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting2E').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting2E').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting3E', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting3E').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting3E').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting4E', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting4E').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting4E').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting5E', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting5E').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting5E').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting6E', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting6E').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting6E').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting7E', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting7E').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting7E').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting8E', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting8E').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting8E').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting9E', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting9E').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting9E').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting10E', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting10E').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting10E').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting11E', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting11E').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting11E').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting12E', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting12E').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting12E').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting13E', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting13E').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting13E').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting14E', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting14E').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting14E').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting15E', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting15E').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting15E').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting16E', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting16E').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting16E').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting1F', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting1F').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting1F').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting2F', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting2F').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting2F').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting3F', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting3F').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting3F').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting4F', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting4F').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting4F').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting5F', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting5F').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting5F').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting6F', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting6F').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting6F').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting7F', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting7F').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting7F').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting8F', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting8F').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting8F').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting9F', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting9F').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting9F').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting10F', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting10F').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting10F').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting11F', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting11F').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting11F').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting12F', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting12F').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting12F').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting13F', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting13F').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting13F').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting14F', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting14F').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting14F').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting15F', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting15F').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting15F').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting16F', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting16F').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting16F').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting1Fs', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting1Fs').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting1Fs').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting2Fs', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting2Fs').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting2Fs').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting3Fs', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting3Fs').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting3Fs').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting4Fs', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting4Fs').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting4Fs').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting5Fs', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting5Fs').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting5Fs').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting6Fs', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting6Fs').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting6Fs').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting7Fs', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting7Fs').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting7Fs').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting8Fs', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting8Fs').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting8Fs').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting9Fs', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting9Fs').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting9Fs').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting10Fs', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting10Fs').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting10Fs').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting11Fs', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting11Fs').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting11Fs').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting12Fs', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting12Fs').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting12Fs').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting13Fs', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting13Fs').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting13Fs').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting14Fs', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting14Fs').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting14Fs').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting15Fs', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting15Fs').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting15Fs').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting16Fs', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting16Fs').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting16Fs').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting1G', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting1G').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting1G').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting2G', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting2G').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting2G').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting3G', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting3G').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting3G').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting4G', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting4G').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting4G').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting5G', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting5G').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting5G').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting6G', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting6G').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting6G').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting7G', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting7G').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting7G').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting8G', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting8G').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting8G').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting9G', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting9G').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting9G').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting10G', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting10G').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting10G').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting11G', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting11G').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting11G').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting12G', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting12G').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting12G').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting13G', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting13G').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting13G').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting14G', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting14G').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting14G').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting15G', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting15G').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting15G').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting16G', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting16G').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting16G').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting1Ab', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting1Ab').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting1Ab').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting2Ab', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting2Ab').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting2Ab').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting3Ab', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting3Ab').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting3Ab').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting4Ab', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting4Ab').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting4Ab').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting5Ab', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting5Ab').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting5Ab').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting6Ab', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting6Ab').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting6Ab').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting7Ab', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting7Ab').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting7Ab').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting8Ab', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting8Ab').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting8Ab').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting9Ab', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting9Ab').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting9Ab').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting10Ab', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting10Ab').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting10Ab').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting11Ab', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting11Ab').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting11Ab').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting12Ab', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting12Ab').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting12Ab').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting13Ab', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting13Ab').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting13Ab').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting14Ab', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting14Ab').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting14Ab').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting15Ab', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting15Ab').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting15Ab').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting16Ab', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting16Ab').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting16Ab').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting1A', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting1A').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting1A').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting2A', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting2A').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting2A').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting3A', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting3A').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting3A').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting4A', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting4A').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting4A').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting5A', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting5A').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting5A').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting6A', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting6A').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting6A').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting7A', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting7A').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting7A').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting8A', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting8A').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting8A').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting9A', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting9A').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting9A').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting10A', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting10A').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting10A').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting11A', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting11A').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting11A').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting12A', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting12A').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting12A').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting13A', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting13A').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting13A').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting14A', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting14A').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting14A').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting15A', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting15A').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting15A').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting16A', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting16A').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting16A').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting1Bb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting1Bb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting1Bb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting2Bb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting2Bb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting2Bb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting3Bb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting3Bb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting3Bb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting4Bb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting4Bb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting4Bb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting5Bb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting5Bb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting5Bb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting6Bb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting6Bb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting6Bb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting7Bb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting7Bb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting7Bb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting8Bb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting8Bb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting8Bb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting9Bb', value); 	document.getElementById('Fx2AutoRiffUserPhraseSetting9Bb').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting9Bb').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting10Bb', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting10Bb').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting10Bb').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting11Bb', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting11Bb').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting11Bb').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting12Bb', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting12Bb').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting12Bb').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting13Bb', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting13Bb').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting13Bb').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting14Bb', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting14Bb').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting14Bb').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting15Bb', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting15Bb').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting15Bb').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting16Bb', value);	document.getElementById('Fx2AutoRiffUserPhraseSetting16Bb').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting16Bb').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting1B', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting1B').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting1B').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting2B', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting2B').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting2B').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting3B', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting3B').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting3B').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting4B', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting4B').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting4B').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting5B', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting5B').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting5B').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting6B', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting6B').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting6B').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting7B', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting7B').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting7B').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting8B', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting8B').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting8B').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting9B', value); 		document.getElementById('Fx2AutoRiffUserPhraseSetting9B').value 	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting9B').value 	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting10B', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting10B').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting10B').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting11B', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting11B').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting11B').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting12B', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting12B').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting12B').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting13B', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting13B').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting13B').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting14B', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting14B').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting14B').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting15B', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting15B').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting15B').value	= value-24;
					value = rand(0,48); 	SetParameter('Fx2AutoRiffUserPhraseSetting16B', value);		document.getElementById('Fx2AutoRiffUserPhraseSetting16B').value	= value-24;     document.getElementById('fx2AutoRiffUserPhraseSetting16B').value	= value-24;
					break;
			}
			break;
			
		case "fx2soundhold":
			switch(level){
				case "All":
					value = rand(0,1); 		SetParameter('Fx2SoundHoldHold', value); 	 		document.getElementById('Fx2SoundHoldHold').value 	 		= value;	document.getElementById('fx2SoundHoldHold').value 	 		= value;
					value = rand(0,100); 	SetParameter('Fx2SoundHoldRiseTime', value); 	 	document.getElementById('Fx2SoundHoldRiseTime').value 	 	= value;    document.getElementById('fx2SoundHoldRiseTime').value 	 	= value;
					value = rand(0,120); 	SetParameter('Fx2SoundHoldEffectLev', value); 	 	document.getElementById('Fx2SoundHoldEffectLev').value 	 	= value;    document.getElementById('fx2SoundHoldEffectLev').value 	 	= value;
					break;
			}
			break;
		
		case "fx2tonemodify":
			switch(level) {
				case "All":
					value = rand(0,7); 		SetParameter('Fx2ToneModifyType', value); 		document.getElementById('Fx2ToneModifyType').value 		= value;
					value = rand(0,100); 	SetParameter('Fx2ToneModifyResonance', value); 	document.getElementById('Fx2ToneModifyResonance').value = value;  	document.getElementById('fx2ToneModifyResonance').value = value; 
					value = rand(-50,50); 	SetParameter('Fx2ToneModifyLow', value+50); 	document.getElementById('Fx2ToneModifyLow').value 		= value;  	document.getElementById('fx2ToneModifyLow').value 		= value; 
					value = rand(-50,50); 	SetParameter('Fx2ToneModifyHigh', value+50); 	document.getElementById('Fx2ToneModifyHigh').value 		= value;  	document.getElementById('fx2ToneModifyHigh').value 		= value; 
					//value = rand(0,100); 	SetParameter('Fx2ToneModifyLevel', value); 		document.getElementById('Fx2ToneModifyLevel').value 	= value;  	document.getElementById('fx2ToneModifyLevel').value 	= value; 
					break;
			}
			break;
		
		case "fx2guitarsim":
			switch(level){
				case "All":
					value = rand(0,7); 		SetParameter('Fx2GuitarSimType', value);      		document.getElementById('Fx2GuitarSimType').value      	= value;		document.getElementById('fx2GuitarSimType').value      	= value;	
					value = rand(0,100); 	SetParameter('Fx2GuitarSimLow', value);      		document.getElementById('Fx2GuitarSimLow').value      	= value-50;     document.getElementById('fx2GuitarSimLow').value      	= value-50;
					value = rand(0,100); 	SetParameter('Fx2GuitarSimHigh', value);      		document.getElementById('Fx2GuitarSimHigh').value      	= value-50;     document.getElementById('fx2GuitarSimHigh').value      	= value-50;
					//value = rand(0,100); 	SetParameter('Fx2GuitarSimLevel', value);      		document.getElementById('Fx2GuitarSimLevel').value      = value;        document.getElementById('fx2GuitarSimLevel').value      = value;
					value = rand(0,100); 	SetParameter('Fx2GuitarSimBody', value);  			document.getElementById('Fx2GuitarSimBody').value  		= value;    	document.getElementById('fx2GuitarSimBody').value  		= value;
					break;
			}
			break;
			
		case "fx2acprocessor":
			switch(level) {
				case "All":
					value = rand(0,3); 		SetParameter('Fx2AcProcessorType', value); 		document.getElementById('Fx2AcProcessorType').value 	= value;
					value = rand(0,100); 	SetParameter('Fx2AcProcessorBass', value); 		document.getElementById('Fx2AcProcessorBass').value 	= value-50;  	document.getElementById('fx2AcProcessorBass').value 	= value-50; 
					value = rand(0,100); 	SetParameter('Fx2AcProcessorMiddle', value); 	document.getElementById('Fx2AcProcessorMiddle').value 	= value-50;  	document.getElementById('fx2AcProcessorMiddle').value 	= value-50; 
					value = rand(0,27); 	SetParameter('Fx2AcProcessorMiddleF', value); 	document.getElementById('Fx2AcProcessorMiddleF').value 	= value;  		document.getElementById('fx2AcProcessorMiddleF').value 	= value; 
					value = rand(0,100); 	SetParameter('Fx2AcProcessorTreble', value); 	document.getElementById('Fx2AcProcessorTreble').value 	= value-50;  	document.getElementById('fx2AcProcessorTreble').value 	= value-50; 
					value = rand(0,100); 	SetParameter('Fx2AcProcessorPresence', value); 	document.getElementById('Fx2AcProcessorPresence').value = value-50;  	document.getElementById('fx2AcProcessorPresence').value = value-50; 
					break;
			}
			break;
		
		case "fx2subwah":
			switch(level){
				case "All":
					value = rand(0,5); 		SetParameter('Fx2SubWahType', value);   				document.getElementById('Fx2SubWahType').value   	= value;            document.getElementById('fx2SubWahType').value   	= value;
					value = rand(0,100); 	SetParameter('Fx2SubWahPos', value);   				document.getElementById('Fx2SubWahPos').value   	= value;            document.getElementById('fx2SubWahPos').value   	= value;
					value = rand(0,100); 	SetParameter('Fx2SubWahMin', value);   				document.getElementById('Fx2SubWahMin').value   	= value;            document.getElementById('fx2SubWahMin').value   	= value;
					value = rand(0,100); 	SetParameter('Fx2SubWahMax', value);   				document.getElementById('Fx2SubWahMax').value   	= value;            document.getElementById('fx2SubWahMax').value   	= value;
					//value = rand(0,100); 	SetParameter('Fx2SubWahEffectLev', value);			document.getElementById('Fx2SubWahEffectLev').value	= value;            document.getElementById('fx2SubWahEffectLev').value	= value;
					//value = rand(0,100); 	SetParameter('Fx2SubWahDirectLev', value);			document.getElementById('Fx2SubWahDirectLev').value	= value;            document.getElementById('fx2SubWahDirectLev').value	= value;
					break;
			}
			break;
		
		case "fx2graphiceq":
			switch(level){
				case "All":
					value = rand(-12,12); 	SetParameter('Fx2GraphicEq31', value+12); 	document.getElementById('Fx2GraphicEq31').value = value;  	document.getElementById('fx2GraphicEq31').value = value; 
					value = rand(-12,12); 	SetParameter('Fx2GraphicEq62', value+12); 	document.getElementById('Fx2GraphicEq62').value = value;  	document.getElementById('fx2GraphicEq62').value = value; 
					value = rand(-12,12); 	SetParameter('Fx2GraphicEq125', value+12); 	document.getElementById('Fx2GraphicEq125').value = value;  	document.getElementById('fx2GraphicEq125').value = value;
					value = rand(-12,12); 	SetParameter('Fx2GraphicEq250', value+12); 	document.getElementById('Fx2GraphicEq250').value = value;  	document.getElementById('fx2GraphicEq250').value = value;
					value = rand(-12,12); 	SetParameter('Fx2GraphicEq500', value+12); 	document.getElementById('Fx2GraphicEq500').value = value;  	document.getElementById('fx2GraphicEq500').value = value;
					value = rand(-12,12); 	SetParameter('Fx2GraphicEq1k', value+12); 	document.getElementById('Fx2GraphicEq1k').value = value;  	document.getElementById('fx2GraphicEq1k').value = value; 
					value = rand(-12,12); 	SetParameter('Fx2GraphicEq2k', value+12); 	document.getElementById('Fx2GraphicEq2k').value = value;  	document.getElementById('fx2GraphicEq2k').value = value; 
					value = rand(-12,12); 	SetParameter('Fx2GraphicEq4k', value+12); 	document.getElementById('Fx2GraphicEq4k').value = value;  	document.getElementById('fx2GraphicEq4k').value = value; 
					value = rand(-12,12); 	SetParameter('Fx2GraphicEq8k', value+12); 	document.getElementById('Fx2GraphicEq8k').value = value;  	document.getElementById('fx2GraphicEq8k').value = value; 
					value = rand(-12,12); 	SetParameter('Fx2GraphicEq16k', value+12); 	document.getElementById('Fx2GraphicEq16k').value = value;  	document.getElementById('fx2GraphicEq16k').value = value;
					break;
			}
			break;
		
	}
}

//=================================================================================================
// EZ-TONE
//=================================================================================================
// Altera a lista de nomes de efeitos na lista do formulário html (cada categoria de efeitos tem sua própria lista).
function EztGetToneList(basic) {
	var listname;
	
	basic = parseInt(basic);
	
	switch (basic) {
		case 0:  listname = ["Tex.Crunch", "FatLead", "BluesWha", "HardDrive", "ComboClean", "ComboDrive", "CrispClean", "StackCrnch", "TremCrunch", "Dly&Drive"];			break;
		case 1:  listname = ["Cln Rhytm", "PhaseClean", "Funky Wha", "ComboClean", "CrispClean", "CrnchRhytm", "Pedal Wha", "ComboDrive", "Dly&Drive", "CrunchSolo"];		break;
		case 2:  listname = ["Mellow Jzz", "Warm Clean", "Cool Clean", "Mild Drive", "Smooth Cln", "SmoothLead", "Much Revrb", "ComboDrive", "StackCrnch", "Dly&Dryve"];	break;
		case 3:  listname = ["BeatStroke", "ComboClean", "Fuzz Riff", "Mods Drive", "Drivin' Vo", "Trem Clean", "LiteChorus", "StackCrnch", "12-Strings", "Crunch Cho"];	break;
		case 4:  listname = ["WholeStack", "BurninRiff", "Drivin'MS", "Solo Delay", "PhaseRiff", "Rockin' Vo", "Long Delay", "Mid Boost", "StackCrnch", "BackInRiff"];		break;
		case 5:  listname = ["Heavy Riff", "Stack Lead", "Solo Delay", "FlangeRiff", "Cho&Delay", "Cho Drive", "Mid Boost", "LA Lead", "Detune Drv", "Fat Solo"];			break;
		case 6:  listname = ["RiffMaster", "ThickDrive", "HeavyClean", "Heavy Dist", "Solo Delay", "MetalDrive", "Funk Metal", "ThrashRiff", "MetalShred", "Stack Solo"];	break;
		case 7:  listname = ["Rhythm Cln", "Mellow Cln", "CrnchRhytm", "Groove Dly", "ComboDrive", "LiteChorus", "Crunch Cho", "PhaseDrive", "Latin Lead", "Combo Solo"];	break;
		case 8:  listname = ["Fuzz Vibe", "Voodoo Wha", "Foxy Clean", "StackCrnch", "Massive FZ", "CreamyLead", "Fuzz Riff", "OctaveFuzz", "Fuzz Lead", "Fuzz Phase"];		break;
		case 9:  listname = ["ComboDrive", "Cool Clean", "Solo Delay", "PhaseClean", "StackCrnch", "Warm Clean", "CrunchSolo", "Combo Solo", "Detune Drv", "Fat Solo"];		break;
		case 10: listname = ["Pink Echo", "Stack Lead", "ComboDrive", "Cho Drive", "Cho&Delay", "FlangeRiff", "PsycheStep", "Fuzz Face", "Stack Solo", "ComboSolo"];		break;
		case 11: listname = ["Retro Trem", "Clean Rev", "Dly&Reverb", "DeepSpring", "ComboDrive", "ComboClean", "CrunchSolo", "Combo Solo", "TremCrunch", "LiteChorus"];	break;
		case 12: listname = ["ComboClean", "NatrlCrnch", "Mellow Cln", "Rhythm Cln", "Slapback", "DeepSpring", "LiteChorus", "Trem Clean", "CrunchSolo", "Combo Solo"];		break;
		case 13: listname = ["Short Amb", "Bright Cln", "Dly&Chorus", "Deep Revrb", "HiBand Cho", "Mild Aco", "Comp Aco", "Rhythm Aco", "Tight Low", "Mod Delay"];			break;
		case 14: listname = ["Simple Drv", "DS Drive", "HeavyClean", "ScoopDrive", "ThickDrive", "Stack Lead", "Post Punk", "Mods Drive", "MetalDrive", "Fat Solo"];		break;
	}
 	
	var eztList = document.getElementById("eztToneList");
	if (eztList.options.length == 0) {							// cria lista de opções, se não existir			
		var option;

		for (var i=0; i<10; i++) {
			option = document.createElement("option");
			option.innerText  	= listname[i];
			option.value 		= basic + i;
			eztList.options.add(option, i);
		}
	}
	else {														// apenas modifica lista de opções
		for (var i=0; i<10; i++) {
			eztList.options[i].text  = listname[i];
			eztList.options[i].value = basic*10 + i;
		}
	}
	eztList.selectedIndex = -1;									// apaga seleção
}

// Retorna as configurações iniciais do efeito (limpa as configurações de um preset)
function ToneInitialize() {
	if (MidiOutput) {
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x2F,0x12,0x11,0x30,0x00,0x00,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x32,0x32,0x3C,0x28,0x32,0x32,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x08,0x32,0x32,0x32,0x32,0x00,0x00,0x32,0x00,0x05,0x05,0x05,0x05,0x00,0x00,0x7D,0xF7]);
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x2F,0x12,0x11,0x30,0x01,0x00,0x00,0x00,0x00,0x00,0x32,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x32,0x32,0x32,0x32,0x00,0x32,0x00,0x01,0x00,0x32,0x01,0x01,0x01,0x05,0x64,0x00,0x00,0x05,0x05,0x05,0x05,0x05,0x05,0x07,0x0A,0x0A,0x02,0x00,0x00,0x00,0x00,0x00,0x32,0x32,0x32,0x32,0x00,0x32,0x00,0x01,0x00,0x32,0x01,0x01,0x01,0x05,0x64,0x00,0x00,0x05,0x05,0x05,0x05,0x05,0x05,0x07,0x0A,0x0A,0x02,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x14,0x0E,0x01,0x14,0x17,0x01,0x14,0x14,0x09,0x14,0x00,0x00,0x00,0x00,0x50,0xF7]);
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x2F,0x12,0x11,0x30,0x02,0x00,0x00,0x00,0x00,0x32,0x32,0x32,0x32,0x00,0x00,0x3C,0x0B,0x14,0x19,0x01,0x01,0x32,0x1E,0x32,0x00,0x32,0x01,0x1E,0x32,0x32,0x32,0x00,0x32,0x64,0x55,0x32,0x00,0x46,0x32,0x37,0x00,0x00,0x64,0x00,0x19,0x32,0x4B,0x50,0x00,0x00,0x64,0x00,0x00,0x32,0x00,0x28,0x64,0x50,0x2D,0x01,0x50,0x46,0x32,0x64,0x00,0x32,0x64,0x64,0x28,0x32,0x01,0x46,0x55,0x32,0x1E,0x55,0x08,0x03,0x32,0x03,0x32,0x03,0x32,0x01,0x00,0x02,0x32,0x32,0x64,0x32,0x64,0x00,0x32,0x32,0x00,0x14,0x0E,0x01,0x14,0x17,0x01,0x14,0x14,0x09,0x14,0x00,0x0C,0x00,0x00,0x64,0x15,0x00,0x00,0x64,0x00,0x64,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x22,0xF7]);
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x2F,0x12,0x11,0x30,0x03,0x00,0x18,0x18,0x18,0x18,0x18,0x18,0x00,0x01,0x18,0x3C,0x00,0x00,0x64,0x01,0x18,0x28,0x00,0x00,0x64,0x00,0x64,0x00,0x32,0x32,0x01,0x1E,0x55,0x32,0x32,0x32,0x09,0x1E,0x28,0x10,0x32,0x28,0x32,0x08,0x64,0x03,0x10,0x14,0x09,0x32,0x64,0x32,0x32,0x46,0x00,0x32,0x64,0x00,0x32,0x32,0x32,0x20,0x28,0x64,0x00,0x00,0x28,0x1E,0x28,0x32,0x32,0x19,0x00,0x02,0x64,0x00,0x00,0x32,0x32,0x32,0x00,0x28,0x32,0x32,0x01,0x14,0x00,0x00,0x28,0x00,0x00,0x00,0x50,0x64,0x32,0x00,0x64,0x00,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x03,0xF7]);
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x2F,0x12,0x11,0x30,0x04,0x00,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x3B,0xF7]);
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x2F,0x12,0x11,0x30,0x05,0x00,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x00,0x32,0x32,0x00,0x32,0x32,0x32,0x32,0x00,0x32,0x32,0x32,0x32,0x01,0x32,0x32,0x10,0x32,0x32,0x32,0x00,0x64,0x00,0x64,0x64,0x00,0x0C,0x0C,0x0C,0x0C,0x0C,0x0C,0x0C,0x0C,0x0C,0x0C,0x0C,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x6B,0xF7]);
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x2F,0x12,0x11,0x30,0x06,0x00,0x00,0x16,0x00,0x32,0x32,0x32,0x32,0x00,0x00,0x3C,0x0B,0x14,0x19,0x01,0x01,0x32,0x1E,0x32,0x00,0x32,0x01,0x1E,0x32,0x32,0x32,0x00,0x32,0x64,0x55,0x32,0x00,0x46,0x32,0x37,0x00,0x00,0x64,0x00,0x19,0x32,0x4B,0x50,0x00,0x00,0x64,0x00,0x00,0x32,0x00,0x28,0x64,0x50,0x2D,0x01,0x50,0x46,0x32,0x64,0x00,0x32,0x64,0x64,0x28,0x32,0x01,0x46,0x55,0x32,0x1E,0x55,0x08,0x03,0x32,0x03,0x32,0x03,0x32,0x01,0x00,0x02,0x32,0x32,0x64,0x32,0x64,0x00,0x32,0x32,0x00,0x14,0x0E,0x01,0x14,0x17,0x01,0x14,0x14,0x09,0x14,0x00,0x0C,0x00,0x00,0x64,0x15,0x00,0x00,0x64,0x00,0x64,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x08,0xF7]);
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x2F,0x12,0x11,0x30,0x07,0x00,0x18,0x18,0x18,0x18,0x18,0x18,0x00,0x01,0x18,0x3C,0x00,0x00,0x64,0x01,0x18,0x28,0x00,0x00,0x64,0x00,0x64,0x00,0x32,0x32,0x01,0x1E,0x55,0x32,0x32,0x32,0x09,0x1E,0x28,0x10,0x32,0x28,0x32,0x08,0x64,0x03,0x10,0x14,0x09,0x32,0x64,0x32,0x32,0x46,0x00,0x32,0x64,0x00,0x32,0x32,0x32,0x20,0x28,0x64,0x00,0x00,0x28,0x1E,0x28,0x32,0x32,0x19,0x00,0x02,0x64,0x00,0x00,0x32,0x32,0x32,0x00,0x28,0x32,0x32,0x01,0x14,0x00,0x00,0x28,0x00,0x00,0x00,0x50,0x64,0x32,0x00,0x64,0x00,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x7F,0xF7]);
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x2F,0x12,0x11,0x30,0x08,0x00,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x37,0xF7]);
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x2F,0x12,0x11,0x30,0x09,0x00,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x00,0x32,0x32,0x00,0x32,0x32,0x32,0x32,0x00,0x32,0x32,0x32,0x32,0x01,0x32,0x32,0x10,0x32,0x32,0x32,0x00,0x64,0x00,0x64,0x64,0x00,0x0C,0x0C,0x0C,0x0C,0x0C,0x0C,0x0C,0x0C,0x0C,0x0C,0x0C,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x67,0xF7]);
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x2F,0x12,0x11,0x30,0x0A,0x00,0x00,0x00,0x03,0x10,0x32,0x14,0x09,0x00,0x64,0x14,0x09,0x32,0x03,0x10,0x14,0x09,0x32,0x00,0x28,0x64,0x64,0x28,0x32,0x32,0x64,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x28,0x32,0x08,0x00,0x09,0x64,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x04,0x18,0x00,0x03,0x05,0x08,0x23,0x64,0x32,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x05,0x0E,0x01,0x0B,0x00,0x64,0x00,0x64,0x64,0x00,0x00,0x05,0x05,0x05,0x05,0x18,0x24,0x00,0x64,0x00,0x00,0x64,0x00,0x64,0x02,0x00,0x00,0x32,0x0C,0x0C,0x01,0x10,0x0C,0x00,0x78,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x1E,0x1E,0x00,0x01,0x1E,0x1E,0x00,0x00,0x00,0x32,0x32,0x00,0x00,0x00,0x24,0xF7]);
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x2F,0x12,0x11,0x30,0x0B,0x00,0x05,0x00,0x0A,0x0E,0x01,0x10,0x02,0x0C,0x43,0x4D,0x11,0x04,0x0B,0x06,0x07,0x08,0x09,0x0F,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x08,0x00,0x00,0x00,0x01,0x01,0x01,0x00,0x7F,0x04,0x1E,0x00,0x14,0x01,0x00,0x00,0x08,0x00,0x00,0x00,0x01,0x01,0x01,0x00,0x7F,0x04,0x1E,0x00,0x14,0x01,0x00,0x00,0x08,0x00,0x00,0x00,0x01,0x01,0x01,0x00,0x7F,0x04,0x1E,0x00,0x14,0x01,0x00,0x00,0x08,0x00,0x00,0x00,0x01,0x01,0x01,0x00,0x7F,0x04,0x1E,0x00,0x14,0x01,0x00,0x00,0x08,0x00,0x00,0x00,0x01,0x01,0x01,0x00,0x7F,0x04,0x1E,0x00,0x14,0x01,0x00,0x00,0x08,0x00,0x00,0x00,0x01,0x01,0x01,0x00,0x7F,0x04,0x1E,0x00,0x14,0x01,0x15,0xF7]);
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x2F,0x12,0x11,0x30,0x0C,0x00,0x00,0x00,0x08,0x00,0x00,0x00,0x01,0x01,0x01,0x00,0x7F,0x04,0x1E,0x00,0x14,0x01,0x00,0x00,0x08,0x00,0x00,0x00,0x01,0x01,0x01,0x00,0x7F,0x04,0x1E,0x00,0x14,0x01,0x32,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x7F,0xF7]);
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x1B,0x12,0x60,0x00,0x0D,0x00,0x2A,0x2A,0x2A,0x2A,0x2A,0x2A,0x2A,0x2A,0x20,0x50,0x61,0x74,0x63,0x68,0x20,0x64,0x65,0x73,0x63,0x72,0x69,0x70,0x74,0x69,0x6F,0x6E,0x20,0x74,0x65,0x78,0x74,0x20,0x2D,0x20,0x63,0x6C,0x69,0x63,0x6B,0x20,0x68,0x65,0x72,0x65,0x20,0x74,0x6F,0x20,0x65,0x64,0x69,0x74,0x20,0x2A,0x2A,0x2A,0x2A,0x2A,0x2A,0x2A,0x2A,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x3A,0xF7]);
		MidiOutput.send([0xF0,0x41,0x00,0x00,0x00,0x1B,0x12,0x60,0x00,0x0E,0x00,0x70,0x61,0x74,0x63,0x68,0x20,0x63,0x72,0x65,0x61,0x74,0x65,0x64,0x20,0x62,0x79,0x20,0x22,0x59,0x6F,0x75,0x72,0x20,0x4E,0x61,0x6D,0x65,0x22,0x20,0x20,0x20,0x20,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x5B,0xF7]);
	}
}

// FUNÇÃO EZ-TONE
function EztSetTone() {
	var pickup 		= parseInt(document.getElementById('eztPickupList'));
	var output 		= parseInt(document.getElementById('eztOutputList'));
	var basicTone 	= parseInt(document.getElementById('eztBasicToneList'));
	var tone 		= parseInt(document.getElementById('eztToneList'));
	
	if (tone == -1)
		return;
	
	ToneInitialize();
	switch (tone) {
		case 0:
			//SetFxChain();
			//SetParameter();
			break;
	}
}
//=================================================================================================
// PRESETS ARMAZENADOS NA GT-10
//=================================================================================================

// Seleciona aleatoriamente um preset
function RandomPreset(level) {
	level = level.toLowerCase();
	switch(level) {
		case 'user': 	id = 'PresetSelectU'; break;
		case 'preset': 	id = 'PresetSelectP'; break;
		case 'all': 	if (rand(0,1) == 0) id = 'PresetSelectU'; else id = 'PresetSelectP'; break;
	}
	document.getElementById(id).selectedIndex = rand(0,199);
	document.getElementById(id).onchange();
}

// Seleciona um preset
function PresetSelect(patch) {
	var prog 	= parseInt(patch.substr(1,2));
	var subprog = parseInt(patch.substr(4,1));
	var bank;
	var message;
	
	patch = patch.toUpperCase();
	
	if ((patch[0] != 'U' && patch[0] != 'P') || (prog < 1 || prog > 50 || subprog < 1 || subprog > 4)) {
		console.log('Erro: Patch inválido!');
		return;
	}
	
	if (patch[0] == 'U' && prog <= 25)
		bank = 0;
	else if (patch[0] == 'U' && prog > 25)
		bank = 1;
	else if (patch[0] == 'P' && prog <= 25)
		bank = 2;
	else 
		bank = 3;
		
	if (bank == 0 || bank == 2)
		message = [0xB1,0x00,bank, 0xC1,(prog-1)*4+subprog-1];
	else
		message = [0xB1,0x00,bank, 0xC1,(prog-25-1)*4+subprog-1];
	
	if (DebugMode)
		console.log(message);
	
	if (MidiOutput)
		MidiOutput.send(message);
}

// Obtém lista dos nomes dos presets
function GetPresetNames() {
	var message =  [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11,   0x10,0x00,0x00,0x00,   0x00,0x00,0x00,0x10];
	var midi    = [];
	
	// User preset
	message[7] = 0x10;
	for (var i=0; i<=0x7f; i++){
		midi 	= message.slice();
		midi[8] = i;
		midi.push(CheckSum(message));
		midi.push(0xf7);
		
		if (DebugMode) {
			console.log("Preset Name ?");
			console.log("MIDI:"+midi);
		}
		if (MidiOutput) {
			MidiInput.onmidimessage = GetPresetNamesValue;
			MidiOutput.send(midi);
		}
	}
	message[7] = 0x11;
	for (var i=0; i<=0x47; i++){
		midi 	= message.slice();
		midi[8] = i;
		midi.push(CheckSum(message));
		midi.push(0xf7);
		
		if (DebugMode) {
			console.log("Preset Name ?");
			console.log("MIDI:"+midi);
		}
		if (MidiOutput) {
			MidiInput.onmidimessage = GetPresetNamesValue;
			MidiOutput.send(midi);
		}

	}

	// presets de fábrica
	message[7] = 0x20;
	for (var i=0; i<=0x7f; i++){
		midi 	= message.slice();
		midi[8] = i;
		midi.push(CheckSum(message));
		midi.push(0xf7);
		
		if (DebugMode) {
			console.log("Preset Name ?");
			console.log("MIDI:"+midi);
		}
		if (MidiOutput) {
			MidiInput.onmidimessage = GetPresetNamesValue;
			MidiOutput.send(midi);
		}
	}
	message[7] = 0x21;
	for (var i=0; i<=0x47; i++){
		midi 	= message.slice();
		midi[8] = i;
		midi.push(CheckSum(message));
		midi.push(0xf7);
		
		if (DebugMode) {
			console.log("Preset Name ?");
			console.log("MIDI:"+midi);
		}
		if (MidiOutput) {
			MidiInput.onmidimessage = GetPresetNamesValue;
			MidiOutput.send(midi);
		}
	}
}

function GetPresetNamesValue(message) {
	var name 		= [];
	
	var patch = (Math.floor(message.data[8] / 4) + 1);
	switch (message.data[7]) {
		case 0x10:  
			if (patch < 10) patch = 'U0' + patch; else patch = 'U' + patch;
			break;
		case 0x11:  
			patch = 'U' + (patch+32);
			break;
		case 0x20:  
			if (patch < 10) patch = 'P0' + patch; else patch = 'P' + patch;
			break;
		case 0x21:  
			patch = 'P' + (patch+32);
			break;
	}
	patch += '-' + ((message.data[8]%4) + 1);
	
	for (var i=0; i<16; i++)
		name[i] = String.fromCharCode(message.data[i+11]);
	name = patch + " " + name.join("");
	
	document.getElementById(patch).innerText = name;
	
	if (DebugMode)
		console.log(name);
}

// Busca dados de um preset e salva em arquivo no computador
function BackupSaveOne(presetnum) {
	var message;
	
	if (presetnum > 0x7f)
		presetnum = [0x11, presetnum-0x7f];
	else
		presetnum = [0x10, presetnum];
	
	message = [0xf0,0x41,DeviceId,0x00,0x00,0x2f,0x11,  presetnum[0],presetnum[1],0x00,0x00,  0x00,0x00,0x0C,0x23];
	
	message.push(CheckSum(message));
	message.push(0xf7);
	
	if (DebugMode) {
		console.log("Backup Save One, patch="+presetnum);
		console.log("MIDI:"+message);
	}
	
	if (MidiOutput) {
		MidiInput.onmidimessage = GetBackupSaveOne;
		MidiOutput.send(message);
	}
	else
		console.log("No Midi outputs.")
}
function GetBackupSaveOne(message) {
	console.log("Resultados");
	console.log(message.data);
}
function BackupSaveAll() {console.log('Backup Save All');}
function BackupLoadOne() {console.log('Backup Load One');}
function BackupLoadAll() {console.log('Backup Load All');}