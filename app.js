// Main Application
const App = {
    // Default settings
    currentMode: 'fretboard', // 'fretboard' or 'progression'
    currentInstrument: 'guitar',
    numChords: 4,
    chords: [],

    // Progression mode settings
    progressionKey: 'C',
    progressionQuality: 'major',

    /**
     * Initialize the application
     */
    init() {
        // Initialize chord progression with defaults
        this.initializeChords();

        // Set up event listeners
        this.setupEventListeners();

        // Render the initial mode
        this.renderFretboards();
    },

    /**
     * Initialize chord objects
     */
    initializeChords() {
        const defaultChords = [
            { root: 'C', type: 'major', mode: 'ionian' },
            { root: 'A', type: 'minor', mode: 'aeolian' },
            { root: 'F', type: 'major', mode: 'ionian' },
            { root: 'G', type: 'major', mode: 'mixolydian' }
        ];

        this.chords = [];
        for (let i = 0; i < this.numChords; i++) {
            if (i < defaultChords.length) {
                this.chords.push({ ...defaultChords[i] });
            } else {
                this.chords.push({ root: 'C', type: 'major', mode: 'ionian' });
            }
        }
    },

    /**
     * Set up event listeners for controls
     */
    setupEventListeners() {
        // Mode toggle
        document.getElementById('fretboard-mode-btn').addEventListener('click', () => {
            this.switchMode('fretboard');
        });

        document.getElementById('progression-mode-btn').addEventListener('click', () => {
            this.switchMode('progression');
        });

        // Global controls
        const instrumentSelect = document.getElementById('instrument');
        const numChordsSelect = document.getElementById('num-chords');

        instrumentSelect.addEventListener('change', (e) => {
            this.currentInstrument = e.target.value;
            Fretboard.setInstrument(this.currentInstrument);
            if (this.currentMode === 'fretboard') {
                this.renderFretboards();
            } else {
                this.renderProgressionDisplay();
            }
        });

        numChordsSelect.addEventListener('change', (e) => {
            this.numChords = parseInt(e.target.value);
            this.initializeChords();
            this.renderFretboards();
        });

        // Progression mode controls
        document.getElementById('progression-key').addEventListener('change', (e) => {
            this.progressionKey = e.target.value;
        });

        document.getElementById('progression-quality').addEventListener('change', (e) => {
            this.progressionQuality = e.target.value;
        });

        // Progression buttons
        document.querySelectorAll('.progression-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const progression = e.target.dataset.progression;
                const quality = e.target.dataset.quality;

                // Update the quality selector to match the progression
                if (quality) {
                    document.getElementById('progression-quality').value = quality;
                    this.progressionQuality = quality;
                }

                this.loadProgression(progression);
            });
        });

        // Export to PDF button
        document.getElementById('export-pdf-btn').addEventListener('click', () => {
            this.exportToPDF();
        });
    },

    /**
     * Switch between modes
     */
    switchMode(mode) {
        this.currentMode = mode;

        // Update button states
        document.getElementById('fretboard-mode-btn').classList.toggle('active', mode === 'fretboard');
        document.getElementById('progression-mode-btn').classList.toggle('active', mode === 'progression');

        // Update page visibility
        document.getElementById('fretboard-page').classList.toggle('active', mode === 'fretboard');
        document.getElementById('progression-page').classList.toggle('active', mode === 'progression');

        // Show/hide controls
        document.getElementById('num-chords-group').style.display = mode === 'fretboard' ? 'flex' : 'none';
    },

    /**
     * Load a progression
     */
    loadProgression(progressionString) {
        const chords = Progressions.parseProgression(progressionString, this.progressionKey, this.progressionQuality);
        this.chords = chords;
        this.numChords = chords.length;
        this.renderProgressionDisplay();
    },

    /**
     * Render progression display
     */
    renderProgressionDisplay() {
        const container = document.getElementById('progression-display');
        container.innerHTML = '';

        for (let i = 0; i < this.numChords; i++) {
            const chordSection = this.createProgressionChordSection(i);
            container.appendChild(chordSection);
        }

        // Render fretboards after DOM is ready
        setTimeout(() => {
            for (let i = 0; i < this.numChords; i++) {
                const chord = this.chords[i];
                const nextChordRoot = i < this.numChords - 1 ? this.chords[i + 1].root : null;
                Fretboard.renderFretboard(
                    `prog-fretboard-${i}`,
                    chord.root,
                    chord.type,
                    chord.mode,
                    nextChordRoot
                );
            }
        }, 10);
    },

    /**
     * Create a chord section for progression mode (no controls)
     */
    createProgressionChordSection(index) {
        const section = document.createElement('div');
        section.className = 'chord-section';

        // Create label showing chord numeral and name
        const label = document.createElement('div');
        label.className = 'chord-label';
        const chord = this.chords[index];
        label.textContent = `${chord.numeral || index + 1} - ${chord.root} ${this.getChordTypeName(chord.type)} (${this.getModeName(chord.mode)})`;
        section.appendChild(label);

        // Create fretboard container
        const fretboardContainer = document.createElement('div');
        fretboardContainer.id = `prog-fretboard-${index}`;
        fretboardContainer.className = 'fretboard-container';
        section.appendChild(fretboardContainer);

        return section;
    },

    /**
     * Render fretboards for fretboard mode
     */
    renderFretboards() {
        const container = document.getElementById('fretboard-container');
        container.innerHTML = '';

        for (let i = 0; i < this.numChords; i++) {
            const chordSection = this.createChordSection(i);
            container.appendChild(chordSection);
        }
    },

    /**
     * Create a chord section with controls
     */
    createChordSection(index) {
        const section = document.createElement('div');
        section.className = 'chord-section';
        section.dataset.index = index;

        // Create controls
        const controls = document.createElement('div');
        controls.className = 'chord-controls';

        // Chord number label
        const label = document.createElement('div');
        label.className = 'chord-label';
        label.textContent = `Chord ${index + 1}`;
        controls.appendChild(label);

        // Root note selector
        const rootGroup = this.createSelect(
            `root-note-${index}`,
            'Root:',
            [
                { value: 'C', label: 'C' }, { value: 'C#', label: 'C#' },
                { value: 'D', label: 'D' }, { value: 'D#', label: 'D#' },
                { value: 'E', label: 'E' }, { value: 'F', label: 'F' },
                { value: 'F#', label: 'F#' }, { value: 'G', label: 'G' },
                { value: 'G#', label: 'G#' }, { value: 'A', label: 'A' },
                { value: 'A#', label: 'A#' }, { value: 'B', label: 'B' }
            ],
            this.chords[index].root,
            (e) => {
                this.chords[index].root = e.target.value;
                this.updateFretboard(index);
            }
        );
        controls.appendChild(rootGroup);

        // Chord type selector
        const chordGroup = this.createSelect(
            `chord-type-${index}`,
            'Type:',
            [
                { value: 'major', label: 'Major' },
                { value: 'minor', label: 'Minor' },
                { value: 'dominant7', label: 'Dom 7' },
                { value: 'major7', label: 'Maj 7' },
                { value: 'minor7', label: 'Min 7' },
                { value: 'diminished', label: 'Dim' },
                { value: 'augmented', label: 'Aug' }
            ],
            this.chords[index].type,
            (e) => {
                this.chords[index].type = e.target.value;
                this.updateModeOptions(index);
                this.updateFretboard(index);
            }
        );
        controls.appendChild(chordGroup);

        // Mode selector
        const modeGroup = document.createElement('div');
        modeGroup.className = 'input-group';
        const modeLabel = document.createElement('label');
        modeLabel.textContent = 'Mode:';
        modeLabel.htmlFor = `mode-type-${index}`;
        const modeSelect = document.createElement('select');
        modeSelect.id = `mode-type-${index}`;
        modeSelect.addEventListener('change', (e) => {
            this.chords[index].mode = e.target.value;
            this.updateFretboard(index);
        });
        modeGroup.appendChild(modeLabel);
        modeGroup.appendChild(modeSelect);
        controls.appendChild(modeGroup);

        section.appendChild(controls);

        // Create fretboard container
        const fretboardContainer = document.createElement('div');
        fretboardContainer.id = `fretboard-${index}`;
        fretboardContainer.className = 'fretboard-container';
        section.appendChild(fretboardContainer);

        // Populate mode options and render
        setTimeout(() => {
            this.updateModeOptions(index);
            this.updateFretboard(index);
        }, 0);

        return section;
    },

    /**
     * Update mode options for a specific chord
     */
    updateModeOptions(chordIndex) {
        const modeSelect = document.getElementById(`mode-type-${chordIndex}`);
        if (!modeSelect) return;

        const chordType = this.chords[chordIndex].type;
        const options = MusicTheory.modeOptions[chordType];

        modeSelect.innerHTML = '';

        options.forEach((option, index) => {
            const optElement = document.createElement('option');
            optElement.value = option.value;
            optElement.textContent = `${option.label} - ${option.description}`;

            if (option.value === this.chords[chordIndex].mode ||
                (index === 0 && !this.chords[chordIndex].mode)) {
                optElement.selected = true;
                if (!this.chords[chordIndex].mode) {
                    this.chords[chordIndex].mode = option.value;
                }
            }

            modeSelect.appendChild(optElement);
        });
    },

    /**
     * Helper to create a select input group
     */
    createSelect(id, labelText, options, selectedValue, onChange) {
        const group = document.createElement('div');
        group.className = 'input-group';

        const label = document.createElement('label');
        label.textContent = labelText;
        label.htmlFor = id;

        const select = document.createElement('select');
        select.id = id;

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === selectedValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        select.addEventListener('change', onChange);

        group.appendChild(label);
        group.appendChild(select);

        return group;
    },

    /**
     * Update a specific fretboard
     */
    updateFretboard(index) {
        const chord = this.chords[index];
        const containerId = `fretboard-${index}`;

        Fretboard.renderFretboard(
            containerId,
            chord.root,
            chord.type,
            chord.mode
        );
    },

    /**
     * Get chord type display name
     */
    getChordTypeName(type) {
        const names = {
            major: 'Major',
            minor: 'Minor',
            dominant7: 'Dom7',
            major7: 'Maj7',
            minor7: 'Min7',
            diminished: 'Dim',
            augmented: 'Aug'
        };
        return names[type] || type;
    },

    /**
     * Get mode display name
     */
    getModeName(mode) {
        const names = {
            ionian: 'Ionian',
            dorian: 'Dorian',
            phrygian: 'Phrygian',
            lydian: 'Lydian',
            mixolydian: 'Mixolydian',
            aeolian: 'Aeolian',
            locrian: 'Locrian',
            lydianDominant: 'Lydian Dominant',
            altered: 'Altered',
            wholeHalfDiminished: 'Whole-Half Dim',
            wholeTone: 'Whole Tone',
            lydianAugmented: 'Lydian Augmented'
        };
        return names[mode] || mode;
    },

    /**
     * Draw a fretboard on canvas for PDF export
     */
    drawFretboardOnCanvas(canvas, chord, chordLabel, nextChordRoot) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw label
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(chordLabel, 20, 40);

        const fretboardTop = 60;
        const fretboardHeight = height - 100;
        const fretboardWidth = width - 100;
        const numStrings = Fretboard.tuning.length;
        const numFrets = 12;
        const stringSpacing = fretboardHeight / (numStrings - 1);
        const fretSpacing = fretboardWidth / numFrets;

        // Draw strings (horizontal lines)
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1;
        for (let i = 0; i < numStrings; i++) {
            const y = fretboardTop + i * stringSpacing;
            ctx.beginPath();
            ctx.moveTo(50, y);
            ctx.lineTo(50 + fretboardWidth, y);
            ctx.stroke();
        }

        // Draw frets (vertical lines)
        ctx.strokeStyle = '#8B7355';
        for (let i = 0; i <= numFrets; i++) {
            const x = 50 + i * fretSpacing;
            ctx.lineWidth = i === 0 ? 6 : 2; // Wider nut
            ctx.beginPath();
            ctx.moveTo(x, fretboardTop);
            ctx.lineTo(x, fretboardTop + fretboardHeight);
            ctx.stroke();
        }

        // Draw fret numbers (lower and 25% larger)
        ctx.fillStyle = '#000000';
        ctx.font = '15px Arial'; // 25% larger than 12px
        ctx.textAlign = 'center';
        for (let i = 1; i <= numFrets; i++) {
            const x = 50 + i * fretSpacing - fretSpacing / 2;
            ctx.fillText(i.toString(), x, fretboardTop + fretboardHeight + 30); // Lower position
        }

        // Get chord and scale notes
        const chordNotes = MusicTheory.getChordNotes(chord.root, chord.type);
        const scaleNotes = MusicTheory.getScaleNotes(chord.root, chord.mode);

        // Draw note markers
        for (let stringIndex = 0; stringIndex < numStrings; stringIndex++) {
            for (let fret = 0; fret <= numFrets; fret++) {
                const note = Fretboard.getNoteAtPosition(stringIndex, fret);
                const isChordTone = chordNotes.some(n => MusicTheory.areNotesEqual(note, n));
                const isScaleNote = scaleNotes.some(n => MusicTheory.areNotesEqual(note, n));
                const isRoot = MusicTheory.areNotesEqual(note, chord.root);
                // Leading note is a half step below the next chord's root
                const leadingNote = nextChordRoot ? MusicTheory.transposeNote(nextChordRoot, -1) : null;
                const isLeadingNote = leadingNote && MusicTheory.areNotesEqual(note, leadingNote);

                if (isChordTone || isScaleNote || isLeadingNote) {
                    const x = 50 + (fret === 0 ? 0 : fret * fretSpacing - fretSpacing / 2);
                    const y = fretboardTop + stringIndex * stringSpacing;
                    const size = 14;

                    // Determine shape and colors
                    let fillColor, strokeColor, lineWidth, shape, textColor;

                    if (isRoot) {
                        fillColor = '#007030';
                        strokeColor = '#FEE11A';
                        textColor = '#FEE11A';
                        lineWidth = 3;
                        shape = 'square';
                    } else if (isLeadingNote && isChordTone) {
                        fillColor = '#FEE11A';
                        strokeColor = '#007030';
                        textColor = '#007030';
                        lineWidth = 2;
                        shape = 'pentagon';
                    } else if (isLeadingNote && !isChordTone) {
                        fillColor = '#7FA925';
                        strokeColor = '#6A8E1F';
                        textColor = '#000000';
                        lineWidth = 2;
                        shape = 'triangle';
                    } else if (isChordTone) {
                        fillColor = '#FEE11A';
                        strokeColor = '#FEE11A';
                        textColor = '#007030';
                        lineWidth = 2;
                        shape = 'square';
                    } else {
                        fillColor = '#FFFFFF';
                        strokeColor = '#000000';
                        textColor = '#000000';
                        lineWidth = 2;
                        shape = 'circle';
                    }

                    ctx.beginPath();

                    // Draw shape
                    if (shape === 'square') {
                        ctx.rect(x - size, y - size, size * 2, size * 2);
                    } else if (shape === 'circle') {
                        ctx.arc(x, y, size, 0, 2 * Math.PI);
                    } else if (shape === 'triangle') {
                        // Right-pointing triangle (shifted right)
                        const shift = size * 0.3;
                        ctx.moveTo(x - size + shift, y - size);
                        ctx.lineTo(x - size + shift, y + size);
                        ctx.lineTo(x + size * 1.2, y);
                        ctx.closePath();
                    } else if (shape === 'pentagon') {
                        // Right-pointing house shape (square with triangular point)
                        const w = size * 1.2;
                        const h = size * 1.4;
                        // Left side rectangle
                        ctx.moveTo(x - w, y - h * 0.4);
                        ctx.lineTo(x - w, y + h * 0.4);
                        ctx.lineTo(x + w * 0.2, y + h * 0.4);
                        // Triangle point
                        ctx.lineTo(x + w * 0.2, y + h * 0.7);
                        ctx.lineTo(x + w, y);
                        ctx.lineTo(x + w * 0.2, y - h * 0.7);
                        ctx.lineTo(x + w * 0.2, y - h * 0.4);
                        ctx.closePath();
                    }

                    ctx.fillStyle = fillColor;
                    ctx.fill();
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = lineWidth;
                    ctx.stroke();

                    // Draw text
                    ctx.fillStyle = textColor;
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    let label;
                    if (isRoot) {
                        label = 'R';
                    } else if (isLeadingNote && isChordTone) {
                        label = MusicTheory.getChordIntervalLabel(chord.root, note, chord.type);
                    } else if (isLeadingNote && !isChordTone) {
                        label = 'L';
                    } else if (isChordTone) {
                        label = MusicTheory.getChordIntervalLabel(chord.root, note, chord.type);
                    } else {
                        label = MusicTheory.getScaleDegreeLabel(chord.root, note, chord.mode);
                    }
                    ctx.fillText(label, x, y);
                }
            }
        }
    },

    /**
     * Export current fretboards to PDF
     */
    async exportToPDF() {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        if (this.chords.length === 0) {
            alert('No fretboards to export');
            return;
        }

        // Create a hidden canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 400;

        let yPosition = 20;
        const pageHeight = 297;
        const sectionHeight = 70;

        for (let i = 0; i < this.chords.length; i++) {
            const chord = this.chords[i];
            const nextChordRoot = i < this.chords.length - 1 ? this.chords[i + 1].root : null;

            // Create chord label
            const chordLabel = this.currentMode === 'progression' && chord.numeral
                ? `${chord.numeral} - ${chord.root} ${this.getChordTypeName(chord.type)} (${this.getModeName(chord.mode)})`
                : `Chord ${i + 1} - ${chord.root} ${this.getChordTypeName(chord.type)} (${this.getModeName(chord.mode)})`;

            // Draw fretboard on canvas
            this.drawFretboardOnCanvas(canvas, chord, chordLabel, nextChordRoot);

            // Check if we need a new page
            if (i > 0 && yPosition + sectionHeight > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
            }

            // Add canvas to PDF
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 170;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
        }

        // Generate filename
        const filename = this.currentMode === 'fretboard'
            ? 'chordboard-fretboards.pdf'
            : 'chordboard-progression.pdf';

        pdf.save(filename);
    }
};

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
