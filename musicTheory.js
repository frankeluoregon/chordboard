// Music Theory Module
const MusicTheory = {
    // Chromatic scale
    notes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],

    // Scale formulas (intervals in semitones from root)
    scales: {
        ionian: [0, 2, 4, 5, 7, 9, 11],           // Major scale
        dorian: [0, 2, 3, 5, 7, 9, 10],           // Minor with natural 6th
        phrygian: [0, 1, 3, 5, 7, 8, 10],         // Minor with flat 2nd
        lydian: [0, 2, 4, 6, 7, 9, 11],           // Major with raised 4th
        mixolydian: [0, 2, 4, 5, 7, 9, 10],       // Major with flat 7th
        aeolian: [0, 2, 3, 5, 7, 8, 10],          // Natural minor
        locrian: [0, 1, 3, 5, 6, 8, 10],          // Diminished with flat 2nd and flat 5th
        lydianDominant: [0, 2, 4, 6, 7, 9, 10],   // Mixolydian with raised 4th
        altered: [0, 1, 3, 4, 6, 8, 10],          // Super Locrian
        wholeHalfDiminished: [0, 2, 3, 5, 6, 8, 9, 11], // 8-note symmetrical scale
        wholeTone: [0, 2, 4, 6, 8, 10],           // All whole steps
        lydianAugmented: [0, 2, 4, 6, 8, 9, 11]   // Lydian with raised 5th
    },

    // Mode options for each chord type
    modeOptions: {
        major: [
            { value: 'ionian', label: 'Ionian' },
            { value: 'lydian', label: 'Lydian' },
            { value: 'mixolydian', label: 'Mixolydian' }
        ],
        minor: [
            { value: 'aeolian', label: 'Aeolian' },
            { value: 'dorian', label: 'Dorian' },
            { value: 'phrygian', label: 'Phrygian' }
        ],
        dominant7: [
            { value: 'mixolydian', label: 'Mixolydian' },
            { value: 'lydianDominant', label: 'Lydian Dominant' },
            { value: 'altered', label: 'Altered' }
        ],
        major7: [
            { value: 'ionian', label: 'Ionian' },
            { value: 'lydian', label: 'Lydian' }
        ],
        minor7: [
            { value: 'aeolian', label: 'Aeolian' },
            { value: 'dorian', label: 'Dorian' },
            { value: 'phrygian', label: 'Phrygian' }
        ],
        diminished: [
            { value: 'wholeHalfDiminished', label: 'Whole-Half Diminished' },
            { value: 'locrian', label: 'Locrian' }
        ],
        augmented: [
            { value: 'wholeTone', label: 'Whole Tone' },
            { value: 'lydianAugmented', label: 'Lydian Augmented' }
        ]
    },

    // Chord formulas (intervals in semitones from root)
    chords: {
        major: [0, 4, 7],
        minor: [0, 3, 7],
        dominant7: [0, 4, 7, 10],
        major7: [0, 4, 7, 11],
        minor7: [0, 3, 7, 10],
        diminished: [0, 3, 6],
        augmented: [0, 4, 8]
    },

    /**
     * Convert flat notation to sharp notation
     */
    normalizeNote(note) {
        const flatToSharp = {
            'Db': 'C#',
            'Eb': 'D#',
            'Gb': 'F#',
            'Ab': 'G#',
            'Bb': 'A#'
        };
        return flatToSharp[note] || note;
    },

    /**
     * Get the index of a note in the chromatic scale
     */
    getNoteIndex(note) {
        const normalized = this.normalizeNote(note);
        return this.notes.indexOf(normalized);
    },

    /**
     * Get a note by index (with wrap-around)
     */
    getNoteByIndex(index) {
        return this.notes[((index % 12) + 12) % 12];
    },

    /**
     * Generate all notes in a scale
     */
    getScaleNotes(root, scaleType) {
        const rootIndex = this.getNoteIndex(root);
        const intervals = this.scales[scaleType];

        return intervals.map(interval => {
            return this.getNoteByIndex(rootIndex + interval);
        });
    },

    /**
     * Generate all notes in a chord
     */
    getChordNotes(root, chordType) {
        const rootIndex = this.getNoteIndex(root);
        const intervals = this.chords[chordType];

        return intervals.map(interval => {
            return this.getNoteByIndex(rootIndex + interval);
        });
    },

    /**
     * Check if two notes are enharmonically equivalent
     */
    areNotesEqual(note1, note2) {
        return this.getNoteIndex(note1) === this.getNoteIndex(note2);
    },

    /**
     * Transpose a note by a number of semitones
     */
    transposeNote(note, semitones) {
        const index = this.getNoteIndex(note);
        return this.getNoteByIndex(index + semitones);
    },

    /**
     * Get the interval between two notes (in semitones)
     */
    getInterval(rootNote, targetNote) {
        const rootIndex = this.getNoteIndex(rootNote);
        const targetIndex = this.getNoteIndex(targetNote);
        return ((targetIndex - rootIndex) % 12 + 12) % 12;
    },

    /**
     * Get chord interval label (R, 3, 5, 7, etc.)
     */
    getChordIntervalLabel(rootNote, targetNote, chordType) {
        const interval = this.getInterval(rootNote, targetNote);
        const chordIntervals = this.chords[chordType];
        const position = chordIntervals.indexOf(interval);

        if (position === -1) return null;

        // Map position to interval name
        const intervalNames = {
            0: 'R',   // Root
            1: interval === 3 ? 'b3' : '3',  // Minor or Major third
            2: interval === 6 ? 'b5' : (interval === 8 ? '#5' : '5'),  // Diminished, Perfect, or Augmented fifth
            3: interval === 10 ? 'b7' : '7'   // Minor or Major seventh
        };

        return intervalNames[position] || interval.toString();
    },

    /**
     * Get scale degree label (1-7)
     */
    getScaleDegreeLabel(rootNote, targetNote, scaleType) {
        const interval = this.getInterval(rootNote, targetNote);
        const scaleIntervals = this.scales[scaleType];
        const position = scaleIntervals.indexOf(interval);

        if (position === -1) return null;

        return (position + 1).toString(); // Scale degrees are 1-indexed
    }
};
