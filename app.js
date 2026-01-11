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
                Fretboard.renderFretboard(
                    `prog-fretboard-${i}`,
                    chord.root,
                    chord.type,
                    chord.mode
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
    }
};

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
