// Fretboard Module
const Fretboard = {
    // Tuning configurations
    tunings: {
        bass4: ['G', 'D', 'A', 'E'],         // 4-string bass
        bass5: ['G', 'D', 'A', 'E', 'B'],    // 5-string bass (high to low)
        guitar: ['E', 'B', 'G', 'D', 'A', 'E']  // 6-string guitar (high to low)
    },
    currentInstrument: 'guitar',
    tuning: ['E', 'B', 'G', 'D', 'A', 'E'],  // Default to guitar
    numFrets: 12,

    /**
     * Set the instrument type
     */
    setInstrument(instrument) {
        this.currentInstrument = instrument;
        this.tuning = this.tunings[instrument];
    },

    /**
     * Get the note at a specific string and fret
     */
    getNoteAtPosition(stringIndex, fret) {
        const openNote = this.tuning[stringIndex];
        return MusicTheory.transposeNote(openNote, fret);
    },

    /**
     * Create the fretboard HTML structure in a specific container
     */
    createFretboard(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        const grid = document.createElement('div');
        grid.className = 'fretboard-grid';

        // Create grid: strings (rows) x frets (columns)
        for (let stringIndex = 0; stringIndex < this.tuning.length; stringIndex++) {
            // String label
            const label = document.createElement('div');
            label.className = 'string-label';
            label.textContent = this.tuning[stringIndex];
            grid.appendChild(label);

            // Frets for this string
            for (let fret = 0; fret <= this.numFrets; fret++) {
                const cell = document.createElement('div');
                cell.className = `fret-cell fret-${fret}`;
                cell.dataset.string = stringIndex;
                cell.dataset.fret = fret;

                // Add fret markers for last string only (bottom)
                if (stringIndex === this.tuning.length - 1 && fret > 0) {
                    const fretNum = document.createElement('div');
                    fretNum.className = 'fret-number';
                    fretNum.textContent = fret;
                    cell.appendChild(fretNum);

                    // Add position marker dots
                    if ([3, 5, 7, 9].includes(fret)) {
                        const inlay = document.createElement('div');
                        inlay.className = 'fret-inlay';
                        cell.appendChild(inlay);
                    }

                    // Double dots for 12th fret
                    if (fret === 12) {
                        const inlay1 = document.createElement('div');
                        inlay1.className = 'fret-inlay';
                        inlay1.style.left = '30%';
                        const inlay2 = document.createElement('div');
                        inlay2.className = 'fret-inlay';
                        inlay2.style.left = '60%';
                        cell.appendChild(inlay1);
                        cell.appendChild(inlay2);
                    }
                }

                grid.appendChild(cell);
            }
        }

        container.appendChild(grid);
    },

    /**
     * Update the fretboard with note markers
     */
    updateFretboard(containerId, rootNote, chordType, scaleType, nextChordRoot = null, showLeadingNotes = false, showScaleNotes = true) {
        const container = document.getElementById(containerId);
        const chordNotes = MusicTheory.getChordNotes(rootNote, chordType);
        const scaleNotes = MusicTheory.getScaleNotes(rootNote, scaleType);

        // Clear all existing markers in this container
        container.querySelectorAll('.fret-marker').forEach(marker => marker.remove());

        // Iterate through all positions
        for (let stringIndex = 0; stringIndex < this.tuning.length; stringIndex++) {
            for (let fret = 0; fret <= this.numFrets; fret++) {
                const note = this.getNoteAtPosition(stringIndex, fret);
                const cell = container.querySelector(
                    `.fret-cell[data-string="${stringIndex}"][data-fret="${fret}"]`
                );

                if (!cell) continue;

                const isChordTone = chordNotes.some(chordNote =>
                    MusicTheory.areNotesEqual(note, chordNote)
                );
                const isScaleNote = scaleNotes.some(scaleNote =>
                    MusicTheory.areNotesEqual(note, scaleNote)
                );
                const isRoot = MusicTheory.areNotesEqual(note, rootNote);
                // Leading note is a half step below the next chord's root (only in progression mode)
                const leadingNote = showLeadingNotes && nextChordRoot ? MusicTheory.transposeNote(nextChordRoot, -1) : null;
                const isLeadingNote = leadingNote && MusicTheory.areNotesEqual(note, leadingNote);

                // Show markers for chord tones, scale notes (if enabled), or leading notes (if enabled)
                const shouldShowScaleNote = showScaleNotes && isScaleNote && !isChordTone;
                if (isChordTone || shouldShowScaleNote || isLeadingNote) {
                    const marker = document.createElement('div');
                    marker.className = 'fret-marker';

                    // Determine what to display
                    if (isRoot) {
                        const noteName = note.replace('#', '<sup>♯</sup>');
                        marker.innerHTML = `${noteName}<sub>R</sub>`;
                    } else if (isLeadingNote) {
                        marker.textContent = 'L';
                    } else if (isChordTone) {
                        const interval = MusicTheory.getChordIntervalLabel(rootNote, note, chordType);
                        const noteName = note.replace('#', '<sup>♯</sup>');
                        marker.innerHTML = `${noteName}<sub>${interval}</sub>`;
                    } else if (isScaleNote) {
                        const degree = MusicTheory.getScaleDegreeLabel(rootNote, note, scaleType);
                        const noteName = note.replace('#', '<sup>♯</sup>');
                        marker.innerHTML = `${noteName}<sub>${degree}</sub>`;
                    }

                    // Apply styling - priority: Root > Leading Note > Chord Tone > Scale Note
                    if (isRoot) {
                        marker.classList.add('root');
                        if (isChordTone) {
                            marker.classList.add('chord-tone');
                        }
                    } else if (isLeadingNote) {
                        // All leading notes use triangle, regardless of whether they're chord tones
                        marker.classList.add('leading-note');
                    } else if (isChordTone) {
                        marker.classList.add('chord-tone');
                    } else if (isScaleNote) {
                        marker.classList.add('scale-note');
                    }

                    cell.appendChild(marker);
                }
            }
        }
    },

    /**
     * Render a complete fretboard (create + update)
     */
    renderFretboard(containerId, rootNote, chordType, scaleType, nextChordRoot = null, showLeadingNotes = false, showScaleNotes = true) {
        this.createFretboard(containerId);
        this.updateFretboard(containerId, rootNote, chordType, scaleType, nextChordRoot, showLeadingNotes, showScaleNotes);
    }
};
