// audio synthesis with audiolet.js
var Synth = new Class({
	Extends: AudioletGroup,
	initialize: function(audiolet, frequency) {
		AudioletGroup.prototype.initialize.apply(this, [audiolet, 0, 1]);
		// Basic wave
		this.sine = new Sine(audiolet, frequency);
		
		// Gain envelope
		this.gain = new Gain(audiolet);
		this.env = new PercussiveEnvelope(audiolet, 1, 0.2, .5,
			function() {
				this.audiolet.scheduler.addRelative(0, this.remove.bind(this));
			}.bind(this)
		);
		this.envMulAdd = new MulAdd(audiolet, 0.3, 0);

		// Main signal path
		this.sine.connect(this.gain);
		this.gain.connect(this.outputs[0]);

		// Envelope
		this.env.connect(this.envMulAdd);
		this.envMulAdd.connect(this.gain, 0, 1);
	}
});

var AudioletAppNote = new Class({
	initialize: function() {
	 this.audiolet = new Audiolet();
	},
	
	play: function(note) {
	  var synth = new Synth(this.audiolet, note.frequency());
	  synth.connect(this.audiolet.output);
	}
});

