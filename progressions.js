// Progression Module
const Progressions = {
    // Roman numeral to scale degree mapping (using 7th chords)
    romanNumerals: {
        major: {
            'I': { degree: 0, type: 'major7', mode: 'ionian' },
            'ii': { degree: 1, type: 'minor7', mode: 'dorian' },
            'iii': { degree: 2, type: 'minor7', mode: 'phrygian' },
            'IV': { degree: 3, type: 'major7', mode: 'lydian' },
            'V': { degree: 4, type: 'dominant7', mode: 'mixolydian' },
            'vi': { degree: 5, type: 'minor7', mode: 'aeolian' },
            'vii°': { degree: 6, type: 'diminished', mode: 'locrian' }
        },
        minor: {
            'i': { degree: 0, type: 'minor7', mode: 'aeolian' },
            'ii°': { degree: 1, type: 'diminished', mode: 'locrian' },
            'III': { degree: 2, type: 'major7', mode: 'ionian' },
            'iv': { degree: 3, type: 'minor7', mode: 'dorian' },
            'v': { degree: 4, type: 'minor7', mode: 'phrygian' },
            'VI': { degree: 5, type: 'major7', mode: 'lydian' },
            'VII': { degree: 6, type: 'dominant7', mode: 'mixolydian' }
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
    parseProgression(progressionString, key, quality) {
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
                    type: chordInfo.type,
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
            { name: 'I - IV - V', value: 'I-IV-V', description: 'Classic Rock' },
            { name: 'I - V - vi - IV', value: 'I-V-vi-IV', description: 'Pop' },
            { name: 'ii - V - I', value: 'ii-V-I', description: 'Jazz' },
            { name: 'I - vi - ii - V', value: 'I-vi-ii-V', description: '50s Progression' },
            { name: 'i - VI - III - VII', value: 'i-VI-III-VII', description: 'Minor Pop' },
            { name: 'i - iv - v', value: 'i-iv-v', description: 'Minor Blues' },
            { name: 'I - iii - IV - V', value: 'I-iii-IV-V', description: 'Doo-Wop' },
            { name: 'vi - IV - I - V', value: 'vi-IV-I-V', description: 'Sensitive' }
        ];
    }
};
