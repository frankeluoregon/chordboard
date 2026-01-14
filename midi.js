// MIDI Playback Module with Tone.js Samplers
const MIDIPlayer = {
    samplers: {},
    activeNotes: new Map(),
    isInitialized: false,
    baseUrl: './samples/', // Use local samples folder

    // Instrument voice mappings for Tone.js
    instruments: {
        guitar: { type: 'guitar-electric', name: 'Electric Guitar' },
        bass4: { type: 'bass-electric', name: 'Electric Bass' },
        bass5: { type: 'bass-electric', name: 'Electric Bass' },
        bass6: { type: 'bass-electric', name: 'Electric Bass' },
        ukulele: { type: 'guitar-nylon', name: 'Nylon Guitar' },
        mandolin: { type: 'guitar-nylon', name: 'Mandolin' },
        banjo: { type: 'guitar-electric', name: 'Banjo' }
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
                'guitar-electric': new Tone.Sampler({
                    urls: {
                        A2: "A2.mp3",
                        A3: "A3.mp3",
                        A4: "A4.mp3",
                        A5: "A5.mp3",
                        C3: "C3.mp3",
                        C4: "C4.mp3",
                        C5: "C5.mp3",
                        C6: "C6.mp3",
                        "C#2": "Cs2.mp3",
                        "D#3": "Ds3.mp3",
                        "D#4": "Ds4.mp3",
                        "D#5": "Ds5.mp3",
                        E2: "E2.mp3",
                        "F#2": "Fs2.mp3",
                        "F#3": "Fs3.mp3",
                        "F#4": "Fs4.mp3",
                        "F#5": "Fs5.mp3"
                    },
                    baseUrl: this.baseUrl + "guitar-electric/",
                    release: 1,
                    onload: () => {
                        console.log('Guitar electric samples loaded');
                    }
                }).toDestination(),

                'guitar-nylon': new Tone.Sampler({
                    urls: {
                        A2: "A2.mp3",
                        A3: "A3.mp3",
                        A4: "A4.mp3",
                        A5: "A5.mp3",
                        "A#5": "As5.mp3",
                        B1: "B1.mp3",
                        B2: "B2.mp3",
                        B3: "B3.mp3",
                        B4: "B4.mp3",
                        "C#3": "Cs3.mp3",
                        "C#4": "Cs4.mp3",
                        "C#5": "Cs5.mp3",
                        D2: "D2.mp3",
                        D3: "D3.mp3",
                        D5: "D5.mp3",
                        "D#4": "Ds4.mp3",
                        E2: "E2.mp3",
                        E3: "E3.mp3",
                        E4: "E4.mp3",
                        E5: "E5.mp3",
                        "F#2": "Fs2.mp3",
                        "F#3": "Fs3.mp3",
                        "F#4": "Fs4.mp3",
                        "F#5": "Fs5.mp3",
                        G3: "G3.mp3",
                        G5: "G5.mp3",
                        "G#2": "Gs2.mp3",
                        "G#4": "Gs4.mp3",
                        "G#5": "Gs5.mp3"
                    },
                    baseUrl: this.baseUrl + "guitar-nylon/",
                    release: 1,
                    onload: () => {
                        console.log('Guitar nylon samples loaded');
                    }
                }).toDestination(),

                'bass-electric': new Tone.Sampler({
                    urls: {
                        // Use electric guitar samples pitched down by mapping to lower octaves
                        A2: "A2.mp3",
                        A3: "A3.mp3",
                        A4: "A4.mp3",
                        C3: "C3.mp3",
                        C4: "C4.mp3",
                        C5: "C5.mp3",
                        "C#2": "Cs2.mp3",
                        "D#3": "Ds3.mp3",
                        "D#4": "Ds4.mp3",
                        E2: "E2.mp3",
                        "F#2": "Fs2.mp3",
                        "F#3": "Fs3.mp3",
                        "F#4": "Fs4.mp3"
                    },
                    baseUrl: this.baseUrl + "guitar-electric/",
                    release: 1.5, // Longer release for bass character
                    onload: () => {
                        console.log('Bass electric samples loaded (using pitched electric guitar)');
                    }
                }).toDestination()
            };

            // Set volumes
            this.samplers['guitar-electric'].volume.value = -8;
            this.samplers['guitar-nylon'].volume.value = -8;
            this.samplers['bass-electric'].volume.value = -6; // Louder for pitched-down samples

            this.isInitialized = true;
            console.log('All samplers initialized');

            // Wait for all samplers to load their samples
            const loadPromises = Object.values(this.samplers).map(sampler => {
                return new Promise((resolve) => {
                    // Check if already loaded
                    if (sampler.loaded) {
                        console.log('Sampler already loaded');
                        resolve();
                        return;
                    }

                    // Wait for load event
                    const checkLoaded = setInterval(() => {
                        if (sampler.loaded) {
                            console.log('Sampler loaded');
                            clearInterval(checkLoaded);
                            resolve();
                        }
                    }, 100);

                    // Timeout after 10 seconds
                    setTimeout(() => {
                        clearInterval(checkLoaded);
                        console.error('Sampler load timeout. Will use fallback synth.');
                        reject(new Error('Sampler load timeout'));
                    }, 10000);
                });
            });

            await Promise.all(loadPromises);
            console.log('All samples loaded and ready');
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
            'guitar-electric': new Tone.PolySynth(Tone.Synth, {
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
        this.samplers['guitar-electric'].volume.value = -8;
        this.samplers['guitar-nylon'].volume.value = -8;
        this.samplers['bass-electric'].volume.value = -6;
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
     * Play a single note
     */
    async playSingleNote(toneNote, instrument, duration = 0.8) {
        try {
            await this.init();
            const sampler = this.getSampler(instrument);
            if (!sampler) {
                console.error('No sampler available for', instrument);
                return;
            }
            // Play note
            sampler.triggerAttackRelease(toneNote, duration);
            console.log(`Triggered note: ${toneNote}`);
        } catch (error) {
            console.error('Error playing single note:', error);
        }
    },

    /**
     * Get MIDI note number for a specific fretboard position
     */
    getMidiNoteAtPosition(stringIndex, fret, instrument) {
        // Use Fretboard.tuning if instruments match to support alternate tunings
        const tuning = (instrument === Fretboard.currentInstrument) ? Fretboard.tuning : (Fretboard.tunings[instrument] || Fretboard.tuning);
        const baseOctaves = this.getBaseOctaves(instrument);

        if (stringIndex >= tuning.length) {
            console.error(`String index ${stringIndex} is out of bounds for instrument ${instrument}`);
            return null;
        }

        const openNoteName = tuning[stringIndex];
        const baseOctave = baseOctaves[stringIndex];
        const openMidi = this.noteToMidi(openNoteName + baseOctave);
        return openMidi + fret;
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
        // Use Fretboard.tuning if instruments match to support alternate tunings
        const tuning = (instrument === Fretboard.currentInstrument) ? Fretboard.tuning : (Fretboard.tunings[instrument] || Fretboard.tuning);

        // Get base octaves for each string based on instrument
        const baseOctaves = this.getBaseOctaves(instrument);

        // If filter is active (visiblePositions exists), play only selected notes
        if (chord.visiblePositions) {
            if (chord.visiblePositions.size === 0) {
                console.warn('Filter active but no notes selected - playing silence');
                return [];
            }

            chord.visiblePositions.forEach(pos => {
                const parts = pos.split('-');
                const stringIndex = parseInt(parts[0]);
                const fret = parseInt(parts[1]);
                
                // Ensure string exists on current instrument
                if (stringIndex < tuning.length) {
                    // Calculate note locally to avoid dependency on Fretboard UI state
                    const openNoteName = tuning[stringIndex];
                    const baseOctave = baseOctaves[stringIndex];
                    const openMidi = this.noteToMidi(openNoteName + baseOctave);
                    const midiNote = openMidi + fret;
                    notes.push(midiNote);
                }
            });
            return notes;
        }

        // Play simple one-octave voicing for unfiltered chords
        const intervals = MusicTheory.chords[chord.type];
        if (!intervals) return [];

        // Find the lowest playable MIDI note on the instrument
        let minMidi = 127;
        tuning.forEach((note, index) => {
            const octave = baseOctaves[index];
            const midi = this.noteToMidi(note + octave);
            if (midi < minMidi) minMidi = midi;
        });

        // Find the lowest Root note >= minMidi
        // Target the 2nd octave range (start of 2nd octave relative to instrument low note)
        let targetMinMidi = minMidi + 12;

        // For bass, override to ensure consistent low register (E1+) across 4/5/6 strings
        if (instrument.startsWith('bass')) {
            targetMinMidi = 28; // E1
        }

        // Find the lowest Root note >= targetMinMidi
        let rootMidi = -1;
        for (let oct = 0; oct <= 8; oct++) {
            const testMidi = this.noteToMidi(chord.root + oct);
            if (testMidi >= targetMinMidi) {
                rootMidi = testMidi;
                break;
            }
        }
        
        if (rootMidi === -1) rootMidi = this.noteToMidi(chord.root + 4);

        // Generate chord notes
        intervals.forEach(interval => {
            notes.push(rootMidi + interval);
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
            bass6: [3, 2, 2, 1, 1, 0],   // C3, G2, D2, A1, E1, B0
            ukulele: [4, 4, 4, 4],       // A4, E4, C4, G4 (High G)
            mandolin: [5, 5, 4, 4, 4, 4, 3, 3], // E5, E5, A4, A4, D4, D4, G3, G3
            banjo: [4, 3, 3, 3, 4]       // D4, B3, G3, D3, G4 (High G 5th string)
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

            if (instrument === 'mandolin') {
                const courseDelay = 0.01; // Very tight delay for mandolin courses
                midiNotes.forEach((midiNote, index) => {
                    const toneNote = this.midiToToneNote(midiNote);
                    const startTime = index * strumDelay;
                    
                    // First string of course
                    sampler.triggerAttackRelease(toneNote, duration, '+' + startTime);
                    // Second string of course
                    sampler.triggerAttackRelease(toneNote, duration, '+' + (startTime + courseDelay));
                });
            } else {
                midiNotes.forEach((midiNote, index) => {
                    const toneNote = this.midiToToneNote(midiNote);
                    const startTime = '+' + (index * strumDelay);
                    sampler.triggerAttackRelease(toneNote, duration, startTime);
                });
            }
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

            const noteDelay = duration / 4;
            const noteDuration = noteDelay;

            if (instrument === 'mandolin') {
                const courseDelay = 0.01; // Very tight delay for mandolin courses
                midiNotes.forEach((midiNote, index) => {
                    const toneNote = this.midiToToneNote(midiNote);
                    const startTime = index * noteDelay;
                    
                    // First string of course
                    sampler.triggerAttackRelease(toneNote, noteDuration, '+' + startTime);
                    // Second string of course
                    sampler.triggerAttackRelease(toneNote, noteDuration, '+' + (startTime + courseDelay));
                });
            } else {
                midiNotes.forEach((midiNote, index) => {
                    const toneNote = this.midiToToneNote(midiNote);
                    const startTime = '+' + (index * noteDelay);
                    sampler.triggerAttackRelease(toneNote, noteDuration, startTime);
                });
            }
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
                    this.playChordArpeggio(chord, instrument, chordDuration);
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
