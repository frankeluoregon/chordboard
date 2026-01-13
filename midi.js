// MIDI Playback Module with Tone.js Samplers
const MIDIPlayer = {
    samplers: {},
    activeNotes: new Map(),
    isInitialized: false,
    baseUrl: './samples/', // Use local samples folder

    // Instrument voice mappings for Tone.js
    instruments: {
        guitar: { type: 'guitar-acoustic', name: 'Acoustic Guitar' },
        bass4: { type: 'bass-electric', name: 'Electric Bass' },
        bass5: { type: 'bass-electric', name: 'Electric Bass' },
        bass6: { type: 'bass-electric', name: 'Electric Bass' },
        ukulele: { type: 'guitar-nylon', name: 'Nylon Guitar' },
        mandolin: { type: 'guitar-nylon', name: 'Mandolin' },
        banjo: { type: 'guitar-acoustic', name: 'Banjo' }
    },

    /**
     * Initialize Tone.js and create samplers with real instrument samples
     */
    async init() {
        if (this.isInitialized) return;

        try {
            // Start Tone.js audio context (requires user gesture)
            await Tone.start();
            console.log('Tone.js started, AudioContext state:', Tone.context.state);
        } catch (error) {
            console.error('Failed to start Tone.js:', error);
            throw error;
        }

        // Create samplers for different instrument types with sampled notes
        // Note: We'll use a reduced set of samples for faster loading
        try {
            this.samplers = {
                'guitar-acoustic': new Tone.Sampler({
                    urls: {
                        A2: "A2.mp3",
                        A3: "A3.mp3",
                        A4: "A4.mp3",
                        C3: "C3.mp3",
                        C4: "C4.mp3",
                        C5: "C5.mp3",
                        "D#3": "Ds3.mp3",
                        "D#4": "Ds4.mp3",
                        "F#2": "Fs2.mp3",
                        "F#3": "Fs3.mp3",
                        "F#4": "Fs4.mp3"
                    },
                    baseUrl: this.baseUrl + "guitar-acoustic/",
                    release: 1,
                    onload: () => {
                        console.log('Guitar acoustic samples loaded');
                    }
                }).toDestination(),

                'guitar-nylon': new Tone.Sampler({
                    urls: {
                        A2: "A2.mp3",
                        A3: "A3.mp3",
                        A4: "A4.mp3",
                        C3: "C3.mp3",
                        C4: "C4.mp3",
                        C5: "C5.mp3",
                        "D#3": "Ds3.mp3",
                        "D#4": "Ds4.mp3",
                        "F#2": "Fs2.mp3",
                        "F#3": "Fs3.mp3",
                        "F#4": "Fs4.mp3"
                    },
                    baseUrl: this.baseUrl + "guitar-nylon/",
                    release: 1,
                    onload: () => {
                        console.log('Guitar nylon samples loaded');
                    }
                }).toDestination(),

                'bass-electric': new Tone.Sampler({
                    urls: {
                        A1: "A1.mp3",
                        A2: "A2.mp3",
                        C1: "C1.mp3",
                        C2: "C2.mp3",
                        "D#1": "Ds1.mp3",
                        "D#2": "Ds2.mp3",
                        "F#1": "Fs1.mp3",
                        "F#2": "Fs2.mp3"
                    },
                    baseUrl: this.baseUrl + "bass-electric/",
                    release: 1,
                    onload: () => {
                        console.log('Bass electric samples loaded');
                    }
                }).toDestination()
            };

            // Set volumes
            this.samplers['guitar-acoustic'].volume.value = -8;
            this.samplers['guitar-nylon'].volume.value = -8;
            this.samplers['bass-electric'].volume.value = -10;

            this.isInitialized = true;
            console.log('All samplers initialized');
        } catch (error) {
            console.error('Error initializing samplers:', error);
            // Fallback to simple synthesis if samplers fail to load
            this.initFallbackSynth();
        }
    },

    /**
     * Fallback to simple synthesis if samples fail to load
     */
    initFallbackSynth() {
        console.log('Using fallback synthesis');
        this.samplers = {
            'guitar-acoustic': new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "fatsawtooth" },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.4 }
            }).toDestination(),
            'guitar-nylon': new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "fatsawtooth" },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.4 }
            }).toDestination(),
            'bass-electric': new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "fatsawtooth" },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 1.4 }
            }).toDestination()
        };
        this.samplers['guitar-acoustic'].volume.value = -8;
        this.samplers['guitar-nylon'].volume.value = -8;
        this.samplers['bass-electric'].volume.value = -10;
        this.isInitialized = true;
    },

    /**
     * Get sampler for instrument
     */
    getSampler(instrument) {
        const instrumentConfig = this.instruments[instrument] || this.instruments.guitar;
        console.log(`Getting sampler for ${instrument} -> ${instrumentConfig.type}`);
        const sampler = this.samplers[instrumentConfig.type];
        if (!sampler) {
            console.error(`No sampler found for type: ${instrumentConfig.type}`);
        }
        return sampler;
    },

    /**
     * Convert note name to MIDI note number
     */
    noteToMidi(noteName) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        };

        // Extract note and octave (default to octave 4 if not specified)
        const match = noteName.match(/^([A-G][#b]?)(\d?)$/);
        if (!match) return 60; // Default to middle C

        const note = match[1];
        const octave = match[2] ? parseInt(match[2]) : 4;

        return (octave + 1) * 12 + noteMap[note];
    },

    /**
     * Convert MIDI note number to Tone.js note name
     */
    midiToToneNote(midiNote) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNote / 12) - 1;
        const noteIndex = midiNote % 12;
        return noteNames[noteIndex] + octave;
    },

    /**
     * Get MIDI note numbers for a chord based on tuning and positions
     */
    getChordMidiNotes(chord, instrument) {
        const notes = [];
        const tuning = Fretboard.tunings[instrument] || Fretboard.tuning;

        // Get base octaves for each string based on instrument
        const baseOctaves = this.getBaseOctaves(instrument);

        // Get chord notes from MusicTheory
        const chordNotes = MusicTheory.getChordNotes(chord.root, chord.type);

        // For each string, find the first occurrence of a chord tone
        tuning.forEach((openNote, stringIndex) => {
            const baseOctave = baseOctaves[stringIndex];

            // Check frets 0-12 for chord tones
            for (let fret = 0; fret <= 12; fret++) {
                const note = Fretboard.getNoteAtPosition(stringIndex, fret);
                const isChordTone = chordNotes.some(chordNote =>
                    MusicTheory.areNotesEqual(note, chordNote)
                );

                if (isChordTone) {
                    // Calculate octave based on fret position
                    const octave = baseOctave + Math.floor(fret / 12);
                    const midiNote = this.noteToMidi(note.replace('#', '#') + octave);
                    notes.push(midiNote);
                    break; // Move to next string
                }
            }
        });

        return notes;
    },

    /**
     * Get base octave for each string based on instrument
     */
    getBaseOctaves(instrument) {
        const octaveMap = {
            guitar: [4, 3, 3, 3, 2, 2], // E4, B3, G3, D3, A2, E2
            bass4: [2, 2, 1, 1],         // G2, D2, A1, E1
            bass5: [2, 2, 1, 1, 0],      // G2, D2, A1, E1, B0
            bass6: [2, 2, 2, 1, 1, 0],   // C2, G2, D2, A1, E1, B0
            ukulele: [4, 4, 4, 3],       // A4, E4, C4, G3 (reentrant)
            mandolin: [4, 4, 3, 3, 3, 3, 2, 2], // E4, E4, A3, A3, D3, D3, G2, G2
            banjo: [4, 3, 3, 2, 2]       // D4, B3, G3, D2, G2
        };

        return octaveMap[instrument] || octaveMap.guitar;
    },

    /**
     * Play chord as harmony (all notes at once)
     */
    async playChordHarmony(chord, instrument, duration = 2.0) {
        try {
            await this.init();
            console.log('Playing harmony for:', chord, 'on', instrument);

            const midiNotes = this.getChordMidiNotes(chord, instrument);
            console.log('MIDI notes:', midiNotes);

            const toneNotes = midiNotes.map(midi => this.midiToToneNote(midi));
            console.log('Tone notes:', toneNotes);

            const sampler = this.getSampler(instrument);

            if (!sampler) {
                console.error('No sampler available for', instrument);
                return;
            }

            // Play chord
            sampler.triggerAttackRelease(toneNotes, duration);
            console.log('Triggered notes');
        } catch (error) {
            console.error('Error playing harmony:', error);
        }
    },

    /**
     * Play chord as strum (notes in quick succession)
     */
    async playChordStrum(chord, instrument, duration = 2.0, direction = 'down') {
        try {
            await this.init();
            console.log('Playing strum for:', chord, 'on', instrument);

            let midiNotes = this.getChordMidiNotes(chord, instrument);

            // Reverse for upstroke
            if (direction === 'up') {
                midiNotes = midiNotes.reverse();
            }

            const sampler = this.getSampler(instrument);
            if (!sampler) {
                console.error('No sampler available for', instrument);
                return;
            }

            const strumDelay = 0.05; // 50ms between notes

            midiNotes.forEach((midiNote, index) => {
                const toneNote = this.midiToToneNote(midiNote);
                const startTime = '+' + (index * strumDelay);
                sampler.triggerAttackRelease(toneNote, duration, startTime);
            });
            console.log('Triggered strum');
        } catch (error) {
            console.error('Error playing strum:', error);
        }
    },

    /**
     * Play chord as arpeggio (notes in sequence)
     */
    async playChordArpeggio(chord, instrument, duration = 2.0, pattern = 'ascending') {
        try {
            await this.init();
            console.log('Playing arpeggio for:', chord, 'on', instrument);

            let midiNotes = this.getChordMidiNotes(chord, instrument);

            // Remove duplicates and sort
            midiNotes = [...new Set(midiNotes)].sort((a, b) => a - b);

            // Apply pattern
            if (pattern === 'descending') {
                midiNotes = midiNotes.reverse();
            } else if (pattern === 'alternating') {
                const ascending = [...midiNotes];
                const descending = [...midiNotes].reverse().slice(1, -1);
                midiNotes = [...ascending, ...descending];
            }

            const sampler = this.getSampler(instrument);
            if (!sampler) {
                console.error('No sampler available for', instrument);
                return;
            }

            const noteDelay = duration / midiNotes.length;
            const noteDuration = noteDelay * 1.2; // Slight overlap

            midiNotes.forEach((midiNote, index) => {
                const toneNote = this.midiToToneNote(midiNote);
                const startTime = '+' + (index * noteDelay);
                sampler.triggerAttackRelease(toneNote, noteDuration, startTime);
            });
            console.log('Triggered arpeggio');
        } catch (error) {
            console.error('Error playing arpeggio:', error);
        }
    },

    /**
     * Play entire progression
     */
    async playProgression(chords, instrument, playbackMode = 'harmony', chordDuration = 2.0) {
        await this.init();

        for (let i = 0; i < chords.length; i++) {
            const chord = chords[i];
            const delay = i * chordDuration;

            setTimeout(() => {
                if (playbackMode === 'harmony') {
                    this.playChordHarmony(chord, instrument, chordDuration * 0.9);
                } else if (playbackMode === 'strum') {
                    this.playChordStrum(chord, instrument, chordDuration * 0.9);
                } else if (playbackMode === 'arpeggio') {
                    this.playChordArpeggio(chord, instrument, chordDuration * 2.7);
                }
            }, delay * 1000);
        }
    },

    /**
     * Stop all currently playing notes
     */
    stopAll() {
        if (!this.isInitialized) return;

        // Release all samplers
        Object.values(this.samplers).forEach(sampler => {
            sampler.releaseAll();
        });

        this.activeNotes.clear();
    }
};
