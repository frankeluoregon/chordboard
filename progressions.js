// Progression Module
const Progressions = {
    // Roman numeral to scale degree mapping (7th chords for jazz, triads for others)
    romanNumerals: {
        major: {
            'I': { degree: 0, type: 'major', mode: 'ionian', seventh: 'major7' },
            'ii': { degree: 1, type: 'minor', mode: 'dorian', seventh: 'minor7' },
            'iii': { degree: 2, type: 'minor', mode: 'phrygian', seventh: 'minor7' },
            'IV': { degree: 3, type: 'major', mode: 'lydian', seventh: 'major7' },
            'V': { degree: 4, type: 'major', mode: 'mixolydian', seventh: 'dominant7' },
            'vi': { degree: 5, type: 'minor', mode: 'aeolian', seventh: 'minor7' },
            'vii°': { degree: 6, type: 'diminished', mode: 'locrian', seventh: 'diminished' }
        },
        minor: {
            'i': { degree: 0, type: 'minor', mode: 'aeolian', seventh: 'minor7' },
            'ii°': { degree: 1, type: 'diminished', mode: 'locrian', seventh: 'diminished' },
            'III': { degree: 2, type: 'major', mode: 'ionian', seventh: 'major7' },
            'iv': { degree: 3, type: 'minor', mode: 'dorian', seventh: 'minor7' },
            'v': { degree: 4, type: 'minor', mode: 'phrygian', seventh: 'minor7' },
            'VI': { degree: 5, type: 'major', mode: 'lydian', seventh: 'major7' },
            'VII': { degree: 6, type: 'major', mode: 'mixolydian', seventh: 'dominant7' }
        }
    },

    // Scale intervals for major and minor
    scaleIntervals: {
        major: [0, 2, 4, 5, 7, 9, 11],
        minor: [0, 2, 3, 5, 7, 8, 10]
    },

    /**
     * Parse a progression string and generate chord objects
     */
    parseProgression(progressionString, key, quality, use7ths = false) {
        const numerals = progressionString.split('-');
        const chords = [];
        const mapping = this.romanNumerals[quality];
        const intervals = this.scaleIntervals[quality];

        numerals.forEach(numeral => {
            const chordInfo = mapping[numeral];
            if (chordInfo) {
                const rootInterval = intervals[chordInfo.degree];
                const rootNote = MusicTheory.transposeNote(key, rootInterval);

                chords.push({
                    numeral: numeral,
                    root: rootNote,
                    type: use7ths ? chordInfo.seventh : chordInfo.type,
                    mode: chordInfo.mode
                });
            }
        });

        return chords;
    },

    /**
     * Get all available progressions
     */
    getProgressions() {
        return [
            { name: 'I - IV - V', value: 'I-IV-V', description: 'Classic Rock', use7ths: false },
            { name: 'I - V - vi - IV', value: 'I-V-vi-IV', description: 'Pop', use7ths: false },
            { name: 'ii - V - I', value: 'ii-V-I', description: 'Jazz', use7ths: true },
            { name: 'I - vi - ii - V', value: 'I-vi-ii-V', description: '50s Progression', use7ths: true },
            { name: 'i - VI - III - VII', value: 'i-VI-III-VII', description: 'Minor Pop', use7ths: false },
            { name: 'i - iv - v', value: 'i-iv-v', description: 'Minor Blues', use7ths: false },
            { name: 'I - iii - IV - V', value: 'I-iii-IV-V', description: 'Doo-Wop', use7ths: false },
            { name: 'vi - IV - I - V', value: 'vi-IV-I-V', description: 'Sensitive', use7ths: false }
        ];
    }
};
