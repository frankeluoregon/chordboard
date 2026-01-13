// Main Application
const App = {
    // Default settings
    currentMode: 'fretboard', // 'fretboard' or 'progression'
    currentInstrument: 'guitar',
    numChords: 4,
    chords: [],
    pdfOrientation: 'landscape', // 'portrait' or 'landscape'

    // Progression mode settings
    progressionKey: 'C',
    progressionQuality: 'major',
    showLeadingNotes: true,
    showScaleNotes: true,

    /**
     * Initialize the application
     */
    init() {
        // Initialize chord progression with defaults
        this.initializeChords();

        // Show guitar tuning selector by default (since guitar is the default instrument)
        document.getElementById('guitar-tuning-group').style.display = 'flex';

        // Set up event listeners
        this.setupEventListeners();

        // Set initial padding based on menu bar height
        this.updatePadding();

        // Setup responsive fret limiting
        this.setupResponsiveFrets();

        // Update padding on window resize
        window.addEventListener('resize', () => this.updatePadding());

        // Render the initial mode
        this.renderFretboards();
    },

    /**
     * Setup responsive fret limiting based on viewport
     */
    setupResponsiveFrets() {
        const handleViewportChange = () => {
            // Only apply on smaller screens (mobile/tablet)
            if (window.innerWidth <= 768) {
                const isPortrait = window.innerHeight > window.innerWidth;
                const numFretsSelect = document.getElementById('num-frets');

                if (isPortrait) {
                    // Portrait: limit to 5 frets
                    Fretboard.numFrets = 5;
                    if (numFretsSelect) numFretsSelect.value = '5';
                } else {
                    // Landscape: allow up to 12 frets, default to 12
                    Fretboard.numFrets = 12;
                    if (numFretsSelect) numFretsSelect.value = '12';
                }

                // Re-render if already initialized
                if (this.chords && this.chords.length > 0) {
                    if (this.currentMode === 'fretboard') {
                        this.renderFretboards();
                    } else {
                        this.renderProgressionDisplay();
                    }
                }
            }
        };

        // Initial setup with slight delay to ensure DOM is ready
        setTimeout(() => handleViewportChange(), 100);

        // Listen for orientation and resize changes
        window.addEventListener('orientationchange', handleViewportChange);
        window.addEventListener('resize', handleViewportChange);
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

            // Show/hide guitar tuning selector
            const guitarTuningGroup = document.getElementById('guitar-tuning-group');
            if (this.currentInstrument === 'guitar') {
                guitarTuningGroup.style.display = 'flex';
            } else {
                guitarTuningGroup.style.display = 'none';
            }

            if (this.currentMode === 'fretboard') {
                this.renderFretboards();
            } else {
                this.renderProgressionDisplay();
            }
        });

        // Guitar tuning selector
        const guitarTuningSelect = document.getElementById('guitar-tuning');
        guitarTuningSelect.addEventListener('change', (e) => {
            Fretboard.setGuitarTuning(e.target.value);
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

        // Fret count selector
        document.getElementById('num-frets').addEventListener('change', (e) => {
            Fretboard.numFrets = parseInt(e.target.value);
            if (this.currentMode === 'fretboard') {
                this.renderFretboards();
            } else {
                this.renderProgressionDisplay();
            }
        });

        // PDF orientation selector - now triggers export on change
        document.getElementById('pdf-orientation').addEventListener('change', (e) => {
            this.pdfOrientation = e.target.value;
            // Auto-export when orientation is selected
            this.exportToPDF();
            // Hide the orientation dropdown after export
            document.getElementById('pdf-orientation-group').style.display = 'none';
        });

        // Zoom slider
        const zoomSlider = document.getElementById('zoom-slider');
        const zoomValue = document.getElementById('zoom-value');
        zoomSlider.addEventListener('input', (e) => {
            const zoom = e.target.value;
            zoomValue.textContent = `${zoom}%`;

            // Apply zoom to both fretboard and progression containers
            const fretboardContainer = document.getElementById('fretboard-container');
            const progressionDisplay = document.getElementById('progression-display');

            fretboardContainer.style.transform = `scale(${zoom / 100})`;
            fretboardContainer.style.transformOrigin = 'top center';

            progressionDisplay.style.transform = `scale(${zoom / 100})`;
            progressionDisplay.style.transformOrigin = 'top center';
        });

        // Chord select mode scale notes toggle
        document.getElementById('chord-select-show-scale').addEventListener('change', (e) => {
            this.showScaleNotes = e.target.checked;
            if (this.currentMode === 'fretboard') {
                this.renderFretboards();
            }
        });

        // Progression mode controls - split key selector
        document.getElementById('progression-key-letter').addEventListener('change', (e) => {
            const accidental = document.getElementById('progression-key-accidental').value;
            this.progressionKey = e.target.value + accidental;
        });

        document.getElementById('progression-key-accidental').addEventListener('change', (e) => {
            const letter = document.getElementById('progression-key-letter').value;
            this.progressionKey = letter + e.target.value;
        });

        document.getElementById('progression-quality').addEventListener('change', (e) => {
            this.progressionQuality = e.target.value;
        });

        // Progression toggle for leading notes
        document.getElementById('show-leading-notes').addEventListener('change', (e) => {
            this.showLeadingNotes = e.target.checked;
            if (this.currentMode === 'progression') {
                this.renderProgressionDisplay();
            }
        });

        // Progression selector dropdown
        const progressionSelect = document.getElementById('progression-select');
        progressionSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const progression = selectedOption.value;

            if (!progression) return; // Skip if "Select a progression..." is chosen

            const quality = selectedOption.dataset.quality;
            const use7ths = selectedOption.dataset.use7ths === 'true';

            // Update the quality selector to match the progression
            if (quality) {
                document.getElementById('progression-quality').value = quality;
                this.progressionQuality = quality;
            }

            this.loadProgression(progression, use7ths);
        });

        // Progression playback controls in toolbar
        const playProgressionBtn = document.getElementById('play-progression-btn');
        const progressionFlyout = document.getElementById('progression-playback-flyout');

        playProgressionBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = progressionFlyout.style.display === 'block';
            // Close all flyouts
            document.querySelectorAll('.playback-flyout').forEach(f => f.style.display = 'none');
            // Toggle this flyout
            progressionFlyout.style.display = isVisible ? 'none' : 'block';
        });

        // Mode button handlers for progression playback
        progressionFlyout.querySelectorAll('.playback-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playbackMode = btn.dataset.mode;
                this.playProgression(playbackMode);
                progressionFlyout.style.display = 'none';
            });
        });

        // Stop button handler
        document.getElementById('progression-stop-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            MIDIPlayer.stopAll();
            progressionFlyout.style.display = 'none';
        });

        // Export to PDF button - now shows orientation selector
        document.getElementById('export-pdf-btn').addEventListener('click', () => {
            const orientationGroup = document.getElementById('pdf-orientation-group');
            // Toggle orientation dropdown visibility
            if (orientationGroup.style.display === 'none') {
                orientationGroup.style.display = 'flex';
                // Focus on the select to make it easier to choose
                document.getElementById('pdf-orientation').focus();
            } else {
                orientationGroup.style.display = 'none';
            }
        });

        // Close flyouts when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.playback-container')) {
                document.querySelectorAll('.playback-flyout').forEach(f => f.style.display = 'none');
            }
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

        // Show/hide controls based on mode
        const isProgressionMode = mode === 'progression';
        document.getElementById('num-chords-group').style.display = mode === 'fretboard' ? 'flex' : 'none';
        document.getElementById('progression-key-group').style.display = isProgressionMode ? 'flex' : 'none';
        document.getElementById('progression-quality-group').style.display = isProgressionMode ? 'flex' : 'none';
        document.getElementById('show-leading-notes-group').style.display = isProgressionMode ? 'flex' : 'none';
        document.getElementById('progression-select-group').style.display = isProgressionMode ? 'flex' : 'none';

        // Load first progression when entering progression mode
        if (isProgressionMode) {
            const progressionSelect = document.getElementById('progression-select');
            const hasProgression = this.chords.length > 0 && this.chords[0].progressionName;

            // Only auto-load if no progression is currently loaded
            if (!hasProgression && progressionSelect.options.length > 1) {
                // Select the first real progression (index 1, skipping "Select a progression...")
                progressionSelect.selectedIndex = 1;
                const firstOption = progressionSelect.options[1];
                const progression = firstOption.value;
                const quality = firstOption.dataset.quality;
                const use7ths = firstOption.dataset.use7ths === 'true';

                // Update quality selector
                if (quality) {
                    document.getElementById('progression-quality').value = quality;
                    this.progressionQuality = quality;
                }

                this.loadProgression(progression, use7ths);
            } else if (hasProgression) {
                // If a progression is already loaded, just render it
                this.renderProgressionDisplay();
            }
        } else {
            this.renderFretboards();
        }

        // Update padding after controls visibility changes (affects menu height)
        setTimeout(() => this.updatePadding(), 0);
    },

    /**
     * Update padding based on menu bar height
     */
    updatePadding() {
        const topBar = document.querySelector('.top-bar');
        if (!topBar) return;

        // Get the actual height of the top bar
        const topBarHeight = topBar.offsetHeight;
        const paddingValue = topBarHeight + 20;

        // Set CSS variable for padding
        document.documentElement.style.setProperty('--topbar-offset', `${paddingValue}px`);
    },

    /**
     * Load a progression
     */
    loadProgression(progressionString, use7ths = false) {
        const chords = Progressions.parseProgression(progressionString, this.progressionKey, this.progressionQuality, use7ths);
        // Mark each chord with the progression name so we know a progression was loaded
        chords.forEach(chord => chord.progressionName = progressionString);
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

        // Check if we have a valid progression loaded (not just default chords)
        const hasProgression = this.chords.length > 0 && this.chords[0].progressionName;

        if (!hasProgression) {
            // Show placeholder with empty fretboard background
            const placeholder = document.createElement('div');
            placeholder.className = 'progression-placeholder';
            placeholder.innerHTML = `
                <div class="placeholder-fretboard"></div>
                <div class="placeholder-content">
                    <div class="placeholder-arrow">↑</div>
                    <h2>Select a Chord Progression</h2>
                    <p>Choose a progression from the dropdown above</p>
                </div>
            `;
            container.appendChild(placeholder);
            return;
        }

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
                    nextChordRoot,
                    this.showLeadingNotes,  // Use toggle value
                    this.showScaleNotes     // Use toggle value
                );

                // Add playback controls overlay AFTER fretboard is rendered
                const fretboardContainer = document.getElementById(`prog-fretboard-${i}`);
                if (fretboardContainer) {
                    const playbackContainer = this.createPlaybackControls(i, 'prog');
                    fretboardContainer.appendChild(playbackContainer);
                }
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

        // Playback controls will be added after fretboard is rendered
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

        // Chord number label (for desktop)
        const label = document.createElement('div');
        label.className = 'chord-label';
        label.textContent = `Chord ${index + 1}`;
        controls.appendChild(label);

        // Root note letter selector
        const currentRoot = this.chords[index].root;
        const rootLetter = currentRoot.replace('#', '');
        const rootAccidental = currentRoot.includes('#') ? '#' : '';

        const rootLetterGroup = this.createSelect(
            `root-letter-${index}`,
            'Root:',
            [
                { value: 'C', label: 'C' },
                { value: 'D', label: 'D' },
                { value: 'E', label: 'E' },
                { value: 'F', label: 'F' },
                { value: 'G', label: 'G' },
                { value: 'A', label: 'A' },
                { value: 'B', label: 'B' }
            ],
            rootLetter,
            (e) => {
                const accidental = document.getElementById(`root-accidental-${index}`).value;
                this.chords[index].root = e.target.value + accidental;
                this.updateFretboard(index);
            }
        );
        controls.appendChild(rootLetterGroup);

        // Root accidental selector
        const rootAccidentalGroup = this.createSelect(
            `root-accidental-${index}`,
            '',
            [
                { value: '', label: '♮' },
                { value: '#', label: '♯' },
                { value: 'b', label: '♭' }
            ],
            rootAccidental,
            (e) => {
                const letter = document.getElementById(`root-letter-${index}`).value;
                this.chords[index].root = letter + e.target.value;
                this.updateFretboard(index);
            }
        );
        rootAccidentalGroup.classList.add('compact-group');
        controls.appendChild(rootAccidentalGroup);

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

        // Populate mode options and render, then add playback controls
        setTimeout(() => {
            this.updateModeOptions(index);
            this.updateFretboard(index);

            // Add playback controls overlay AFTER fretboard is rendered
            const playbackContainer = this.createPlaybackControls(index, 'fretboard');
            fretboardContainer.appendChild(playbackContainer);
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
            optElement.textContent = option.label;

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
     * Create playback controls (button + flyout)
     */
    createPlaybackControls(index, mode) {
        const container = document.createElement('div');
        container.className = 'playback-container';
        container.style.position = 'relative';

        // Create playback button
        const playButton = document.createElement('button');
        playButton.className = 'playback-button';
        playButton.innerHTML = '▶ Play';
        playButton.dataset.index = index;
        playButton.dataset.mode = mode;

        // Create flyout
        const flyout = document.createElement('div');
        flyout.className = 'playback-flyout';
        flyout.dataset.index = index;

        // Create mode buttons
        const harmonyBtn = document.createElement('button');
        harmonyBtn.className = 'playback-mode-btn';
        harmonyBtn.textContent = '🎵 Harmony';
        harmonyBtn.dataset.playbackMode = 'harmony';

        const strumBtn = document.createElement('button');
        strumBtn.className = 'playback-mode-btn';
        strumBtn.textContent = '🎸 Strum';
        strumBtn.dataset.playbackMode = 'strum';

        const arpeggioBtn = document.createElement('button');
        arpeggioBtn.className = 'playback-mode-btn';
        arpeggioBtn.textContent = '🎼 Arpeggio';
        arpeggioBtn.dataset.playbackMode = 'arpeggio';

        const stopBtn = document.createElement('button');
        stopBtn.className = 'stop-button';
        stopBtn.textContent = '⏹ Stop';

        flyout.appendChild(harmonyBtn);
        flyout.appendChild(strumBtn);
        flyout.appendChild(arpeggioBtn);
        flyout.appendChild(stopBtn);

        container.appendChild(playButton);
        container.appendChild(flyout);

        // Event listeners
        playButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = flyout.style.display === 'block';
            // Close all other flyouts
            document.querySelectorAll('.playback-flyout').forEach(f => f.style.display = 'none');
            // Toggle this flyout
            flyout.style.display = isVisible ? 'none' : 'block';
        });

        // Mode button handlers
        [harmonyBtn, strumBtn, arpeggioBtn].forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playbackMode = btn.dataset.playbackMode;
                const chord = this.chords[index];
                this.playChord(chord, playbackMode);
                flyout.style.display = 'none';
            });
        });

        // Stop button handler
        stopBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            MIDIPlayer.stopAll();
            flyout.style.display = 'none';
        });

        return container;
    },

    /**
     * Play a chord using MIDI
     */
    async playChord(chord, playbackMode) {
        console.log('App.playChord called with:', chord, playbackMode);
        const instrument = this.currentInstrument;
        console.log('Current instrument:', instrument);

        try {
            if (playbackMode === 'harmony') {
                await MIDIPlayer.playChordHarmony(chord, instrument);
            } else if (playbackMode === 'strum') {
                await MIDIPlayer.playChordStrum(chord, instrument);
            } else if (playbackMode === 'arpeggio') {
                await MIDIPlayer.playChordArpeggio(chord, instrument);
            }
        } catch (error) {
            console.error('Error in playChord:', error);
        }
    },

    /**
     * Play entire progression
     */
    async playProgression(playbackMode) {
        console.log('App.playProgression called with:', playbackMode);
        const instrument = this.currentInstrument;
        console.log('Current instrument:', instrument, 'Chords:', this.chords);

        try {
            await MIDIPlayer.playProgression(this.chords, instrument, playbackMode, 2.0);
        } catch (error) {
            console.error('Error in playProgression:', error);
        }
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
            chord.mode,
            null,  // nextChordRoot (not used in chord select)
            false, // showLeadingNotes (not used in chord select)
            this.showScaleNotes  // Use toggle value
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
    drawFretboardOnCanvas(canvas, chord, chordLabel, nextChordRoot, maxFrets) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw label (indented)
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';  // Reset text alignment to left
        ctx.textBaseline = 'top';  // Reset baseline
        ctx.fillText(chordLabel, 50, 30);  // Moved up 10px (from 40 to 30)

        const fretboardTop = 80;  // Spacing maintained for breathing room
        const fretboardHeight = height - 160;  // Leave more room for fret numbers (60px instead of 40px)
        const fretboardWidth = width - 100;
        const numStrings = Fretboard.tuning.length;
        const numFrets = maxFrets;  // Use the passed-in max frets
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
                        fillColor = '#000000';  // Black for root
                        strokeColor = '#FFFFFF';  // White outline
                        textColor = '#FFFFFF';  // White text
                        lineWidth = 3;
                        shape = 'square';
                    } else if (isLeadingNote) {
                        // All leading notes use triangle
                        fillColor = '#999999';  // Medium gray
                        strokeColor = '#999999';
                        textColor = '#000000';  // Black text
                        lineWidth = 0;
                        shape = 'triangle';
                    } else if (isChordTone) {
                        fillColor = '#CCCCCC';  // Light gray for chord tones
                        strokeColor = '#CCCCCC';
                        textColor = '#000000';  // Black text
                        lineWidth = 2;
                        shape = 'square';
                    } else {
                        fillColor = '#FFFFFF';  // White for scale notes
                        strokeColor = '#000000';  // Black outline
                        textColor = '#000000';  // Black text
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
                    } else if (isLeadingNote) {
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
        const orientation = this.pdfOrientation === 'landscape' ? 'l' : 'p';
        const pdf = new jsPDF(orientation, 'mm', 'a4');

        if (this.chords.length === 0) {
            alert('No fretboards to export');
            return;
        }

        // Determine max frets based on orientation and current fret count
        // Portrait: max 12 frets, Landscape: max 20 frets (but respect user's selection if lower)
        const maxFretsForOrientation = this.pdfOrientation === 'landscape' ? 20 : 12;
        const maxFrets = Math.min(Fretboard.numFrets, maxFretsForOrientation);

        // Create a hidden canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 450;  // Increased from 400 to give room for fret numbers

        let yPosition = 20;
        const pageHeight = this.pdfOrientation === 'landscape' ? 210 : 297;
        const sectionHeight = 70;

        for (let i = 0; i < this.chords.length; i++) {
            const chord = this.chords[i];
            // Only pass nextChordRoot in progression mode (to show leading notes)
            const nextChordRoot = this.currentMode === 'progression' && i < this.chords.length - 1
                ? this.chords[i + 1].root
                : null;

            // Create chord label
            const chordLabel = this.currentMode === 'progression' && chord.numeral
                ? `${chord.numeral} - ${chord.root} ${this.getChordTypeName(chord.type)} (${this.getModeName(chord.mode)})`
                : `Chord ${i + 1} - ${chord.root} ${this.getChordTypeName(chord.type)} (${this.getModeName(chord.mode)})`;

            // Calculate image dimensions
            const imgWidth = 170;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Check if we need a new page BEFORE drawing
            if (i > 0 && yPosition + imgHeight > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
            }

            // Draw fretboard on canvas
            this.drawFretboardOnCanvas(canvas, chord, chordLabel, nextChordRoot, maxFrets);

            // Add canvas to PDF
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
        }

        // Generate filename
        let filename;
        if (this.currentMode === 'fretboard') {
            // Chord Select mode: use chord abbreviations (e.g., "C-Am-F-G.pdf")
            const chordAbbrs = this.chords.map(chord => {
                const root = chord.root.replace('#', 's'); // Replace # with s for filenames
                const type = this.getChordTypeAbbr(chord.type);
                return root + type;
            });
            filename = chordAbbrs.join('-') + '.pdf';
        } else {
            // Progression mode: use key and progression pattern (e.g., "C-major-I-V-vi-IV.pdf")
            const key = this.progressionKey.replace('#', 's');
            const quality = this.progressionQuality;
            const numerals = this.chords.map(c => c.numeral).join('-');
            filename = `${key}-${quality}-${numerals}.pdf`;
        }

        pdf.save(filename);
    },

    /**
     * Get chord type abbreviation for filename
     */
    getChordTypeAbbr(type) {
        const abbrs = {
            major: '',
            minor: 'm',
            dominant7: '7',
            major7: 'maj7',
            minor7: 'm7',
            diminished: 'dim',
            augmented: 'aug'
        };
        return abbrs[type] || '';
    }
};

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
