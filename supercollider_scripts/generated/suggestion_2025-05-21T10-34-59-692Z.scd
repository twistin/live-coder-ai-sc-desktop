(
{
	var noise, filterFreq, env, sig;

	// Ruido blanco como fuente
	noise = WhiteNoise.ar(0.2);

	// LFO para variar la frecuencia de corte del filtro
	filterFreq = LFNoise1.kr(0.5).range(200, 3000);

	// Envolvente ADSR suave para el filtro
	env = EnvGen.kr(Env.adsr(0.1, 0.2, 0.5, 3), doneAction: 2);

	// Filtro pasa bajas
	sig = LPF.ar(noise, filterFreq) * env;

	// Reverb sutil y paneo aleatorio
	sig = FreeVerb.ar(sig, mix: 0.1, room: 0.7);
	sig = Pan2.ar(sig, LFNoise1.kr(0.1).range(-1, 1));

	Out.ar(0, sig * 0.1);
}.play;
)