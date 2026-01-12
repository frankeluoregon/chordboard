// MIDI Playback Module
const MIDIPlayer = {
    audioContext: null,
    masterGainNode: null,
    activeNotes: new Map(), // Track playing notes for cleanup

    // Instrument voice mappings (General MIDI Program Numbers)
    instruments: {
        guitar: { program: 24, name: 'Acoustic Guitar (nylon)' },
        bass4: { program: 33, name: 'Electric Bass (finger)' },
        bass5: { program: 33, name: 'Electric Bass (finger)' },
        bass6: { program: 33, name: 'Electric Bass (finger)' },
        ukulele: { program: 24, name: 'Acoustic Guitar (nylon)' },
        mandolin: { program: 105, name: 'Banjo' },
        banjo: { program: 105, name: 'Banjo' }
    },

    /**
     * Initialize Web Audio API
     */
    async init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);
            this.masterGainNode.gain.value = 0.3; // Master volume
        }

        // Resume context if suspended (required by some browsers)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
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
     * Play a single note using Web Audio API
     */
    playNote(midiNote, duration = 1.0, startTime = 0, velocity = 0.7) {
        const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
        const now = this.audioContext.currentTime + startTime;

        // Create oscillator with more guitar-like sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Use triangle wave for warmer sound
        oscillator.type = 'triangle';
        oscillator.frequency.value = frequency;

        // ADSR envelope for more natural sound
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.3, now + 0.01); // Attack
        gainNode.gain.linearRampToValueAtTime(velocity * 0.2, now + 0.05); // Decay
        gainNode.gain.setValueAtTime(velocity * 0.2, now + duration - 0.1); // Sustain
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);

        oscillator.start(now);
        oscillator.stop(now + duration);

        // Track active note
        const noteId = `${midiNote}-${now}`;
        this.activeNotes.set(noteId, { oscillator, gainNode });

        // Clean up after note finishes
        oscillator.onended = () => {
            this.activeNotes.delete(noteId);
        };
    },

    /**
     * Play chord as harmony (all notes at once)
     */
    async playChordHarmony(chord, instrument, duration = 2.0) {
        await this.init();

        const notes = this.getChordMidiNotes(chord, instrument);

        // Play all notes simultaneously
        notes.forEach(midiNote => {
            this.playNote(midiNote, duration, 0, 0.6);
        });
    },

    /**
     * Play chord as strum (notes in quick succession)
     */
    async playChordStrum(chord, instrument, duration = 2.0, direction = 'down') {
        await this.init();

        let notes = this.getChordMidiNotes(chord, instrument);

        // Reverse for upstroke
        if (direction === 'up') {
            notes = notes.reverse();
        }

        const strumDelay = 0.08; // 80ms between notes for clearer strum

        notes.forEach((midiNote, index) => {
            const startTime = index * strumDelay;
            this.playNote(midiNote, duration, startTime, 0.7);
        });
    },

    /**
     * Play chord as arpeggio (notes in sequence)
     */
    async playChordArpeggio(chord, instrument, duration = 2.0, pattern = 'ascending') {
        await this.init();

        let notes = this.getChordMidiNotes(chord, instrument);

        // Remove duplicates and sort
        notes = [...new Set(notes)].sort((a, b) => a - b);

        // Apply pattern
        if (pattern === 'descending') {
            notes = notes.reverse();
        } else if (pattern === 'alternating') {
            const ascending = [...notes];
            const descending = [...notes].reverse().slice(1, -1);
            notes = [...ascending, ...descending];
        }

        const noteDelay = duration / notes.length;
        const noteDuration = noteDelay * 1.2; // Slight overlap

        notes.forEach((midiNote, index) => {
            const startTime = index * noteDelay;
            this.playNote(midiNote, noteDuration, startTime, 0.6);
        });
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
        this.activeNotes.forEach(({ oscillator, gainNode }) => {
            try {
                gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(gainNode.gain.value, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
                oscillator.stop(this.audioContext.currentTime + 0.1);
            } catch (e) {
                // Note may have already stopped
            }
        });
        this.activeNotes.clear();
    }
};
