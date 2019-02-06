var freqByteData = 0;
var analyzer = null;
var input = null;
var audioContext = null;

var c = document.getElementById('soundCanvas');
var ctx = c.getContext('2d');

var errorDiv = document.getElementById('error');

var showError = function() {
	c.style.display = 'none';
	errorDiv.style.display = 'block';
};

var errorCallback = function(e) {
	console.log('Could not get user media!', e);
	showError();
};

var successCallback = function(stream) {
	audioContext = new AudioContext;
	input = audioContext.createMediaStreamSource(stream);

	analyzer = audioContext.createAnalyser();
	//analyzer.smoothingTimeConstant = 0.75;

	input.connect(analyzer);

	freqByteData = new Uint8Array(analyzer.frequencyBinCount);

	analyze();
};

var analyze = function() {
	analyzer.getByteFrequencyData(freqByteData);

	ctx.clearRect(0, 0, c.width, c.height);
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, c.width, c.height);

	var scaleX = (c.width/1024) * 1.4;
	var scaleY = (c.height/512);
	var yOffset = 25;

	for(var i=0; i<freqByteData.length; i++) {
		var xPos = Math.ceil(i * scaleX);

		// draw top half
		ctx.fillStyle = hsv2rgb(256 - freqByteData[i], 1, 1);
		ctx.fillRect(
			xPos, (256 + yOffset) * scaleY,
			Math.ceil(scaleX), -freqByteData[i] * scaleY
		);

		// draw gray bottom half
		ctx.fillStyle = '#444444';
		ctx.fillRect(
			xPos, (256 + yOffset) * scaleY,
			Math.ceil(scaleX), freqByteData[i] * scaleY / 2
		);
	}

	setTimeout(analyze, 10);
}

if (navigator.mediaDevices) {
	navigator.mediaDevices.enumerateDevices().then(function (sources) {
		var audioSources = sources.filter(function (source) {
			console.log('source: ' + source.kind);
			return source.kind === 'audioinput';
		});
		console.log('audio input sources', audioSources);

		var constraints = {
			audio: {
				optional: [{sourceId: audioSources[0]}]
			}
		};

		navigator.mediaDevices.getUserMedia(constraints)
			.then(successCallback)
			.catch(errorCallback);
	});
} else {
	showError();
}

var hsv2rgb = function(h, s, v) {
	var rgb, i, data = [];
	if (s === 0) {
		rgb = [v,v,v];
	} else {
		h = h / 60;
		i = Math.floor(h);
		data = [v*(1-s), v*(1-s*(h-i)), v*(1-s*(1-(h-i)))];
		switch(i) {
			case 0:
				rgb = [v, data[2], data[0]];
				break;
			case 1:
				rgb = [data[1], v, data[0]];
				break;
			case 2:
				rgb = [data[0], v, data[2]];
				break;
			case 3:
				rgb = [data[0], data[1], v];
				break;
			case 4:
				rgb = [data[2], data[0], v];
				break;
			default:
				rgb = [v, data[0], data[1]];
				break;
		}
	}
	return '#' + rgb.map(function(x){
		return ('0' + Math.round(x*255).toString(16)).slice(-2);
	}).join('');
};

var resizeCanvas = function() {
	var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0],
		x = w.innerWidth || e.clientWidth || g.clientWidth,
		y = w.innerHeight|| e.clientHeight|| g.clientHeight;

	c.style.width = x + 'px';
	c.style.height = y + 'px';

	c.style.marginLeft = -x * 0.5 + 'px';
	c.style.marginTop = -y * 0.5 + 'px';

	ctx.canvas.width  = x;
	ctx.canvas.height = y;
}

window.addEventListener('resize', function(event){
	resizeCanvas();
});

resizeCanvas();
