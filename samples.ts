//-------------------------------------------------
// README samples
//-------------------------------------------------
namespace ui.controls.samples {
    const STACK_SETUP_SCOPE = "stack-setup"
    const MIXER_SCOPE = "mixer"

    class SettingsScreen extends ui.UiScreen {
        private speed: number
        private speedLabel: ui.UiLabel

        constructor(runtime: ui.UiRuntime) {
            super(runtime)
            this.speed = 5
            this.backgroundColor = 8
            this.add(new ui.UiLabel("Speed", 1), { x: 8, y: 8 })
            this.speedLabel = new ui.UiLabel("" + this.speed, 7)
            this.add(this.speedLabel, { x: 8, y: 24 })
            this.add(new ui.UiLabel("Press A to Edit", 1), {
                centerX: 80,
                y: 108,
            })
        }

        public handleInput(event: ui.UiInputEvent): boolean | undefined {
            if (event.action == "activate" && event.phase != "released") {
                this.openSpeedEditor()
                return true
            }

            return undefined
        }

        private openSpeedEditor(): void {
            this.openModal(
                new ui.UiNumericEntryModal(
                    "speed-editor",
                    this.speed,
                    value => {
                        this.speed = value
                        this.speedLabel.setText("" + value)
                    },
                ),
            )
        }
    }

    class NameEntryScreen extends ui.UiScreen {
        private name: string
        private nameLabel: ui.UiLabel

        constructor(runtime: ui.UiRuntime) {
            super(runtime)
            this.name = ""
            this.backgroundColor = 8
            this.add(new ui.UiLabel("Player", 1), { x: 8, y: 8 })
            this.nameLabel = new ui.UiLabel("No name", 7)
            this.add(this.nameLabel, { x: 8, y: 24 })
            this.add(new ui.UiLabel("Press A to enter", 1), {
                centerX: 80,
                y: 108,
            })
        }

        public handleInput(event: ui.UiInputEvent): boolean | undefined {
            if (event.action == "activate" && event.phase != "released") {
                this.openNameEditor()
                return true
            }

            return undefined
        }

        private openNameEditor(): void {
            this.openModal(
                new ui.UiTextEntryModal({
                    modalScopeId: "name-editor",
                    title: loc("Enter your name:"),
                    initialText: this.name,
                    allowWhitespace: true,
                    allowSymbols: true,
                    maxLength: 16,
                    onResult: result => {
                        if (result.kind == "completed") {
                            this.name = result.text
                            this.nameLabel.setText(
                                this.name.length ? this.name : "No name",
                            )
                        }
                    },
                }),
            )
        }
    }

    class DataGraphScreen extends ui.UiScreen {
        private values: number[]
        private tick: number
        private graphRect: ui.Rect
        private valueLabel: ui.UiLabel
        private toggleButton: ui.UiButton
        private running: boolean

        constructor(runtime: ui.UiRuntime) {
            super(runtime)
            this.backgroundColor = 0
            this.tick = 0
            this.running = true
            this.graphRect = new ui.Rect(8, 22, 144, 70)
            this.add(new ui.UiLabel("Signal", 1), { x: 8, y: 6 })
            this.toggleButton = new ui.UiButton("toggle", "Stop", () => {
                this.running = !this.running
                this.toggleButton.setText(this.running ? "Stop" : "Start")
            })
            this.values = [
                24, 28, 35, 40, 46, 52, 58, 63, 68, 72, 70, 66, 60, 54, 48, 42,
                36, 31, 27, 25,
            ]
            this.valueLabel = new ui.UiLabel(
                "" + this.values[this.values.length - 1],
                7,
            )
            this.add(this.valueLabel, { x: 128, y: 6 })
            this.add(this.toggleButton, { centerX: 80, centerY: 107 })
        }

        public update(): void {
            if (!this.running) return

            this.tick += 1
            if (this.tick % 6 != 0) return

            const phase = Math.idiv(this.tick, 6) % 20
            const wave = phase < 10 ? phase : 20 - phase
            this.values.removeAt(0)
            this.values.push(25 + wave * 6)
            this.valueLabel.setText("" + this.values[this.values.length - 1])
        }

        public render(surface: ui.DrawSurface): void {
            surface.drawRect(this.graphRect, 1)
            surface.drawLine(
                this.graphRect.x + 1,
                this.graphRect.y + Math.idiv(this.graphRect.height, 2),
                this.graphRect.x + this.graphRect.width - 2,
                this.graphRect.y + Math.idiv(this.graphRect.height, 2),
                13,
            )

            let previousX = 0
            let previousY = 0
            for (let i = 0; i < this.values.length; i++) {
                const x =
                    this.graphRect.x +
                    2 +
                    Math.idiv(
                        i * (this.graphRect.width - 4),
                        this.values.length - 1,
                    )
                const y =
                    this.graphRect.y +
                    this.graphRect.height -
                    3 -
                    Math.idiv(this.values[i] * (this.graphRect.height - 6), 100)

                if (i > 0) surface.drawLine(previousX, previousY, x, y, 7)
                previousX = x
                previousY = y
            }

            super.render(surface)
        }
    }

    // A column stack that owns one focus scope. Rows of different widths each
    // center on their own, labels sit between them, and up and down move from
    // row to row without any navigation code in the screen.
    class StackSetupScreen extends ui.UiScreen {
        private status: ui.UiLabel

        constructor(runtime: ui.UiRuntime) {
            super(runtime)
            this.backgroundColor = 6
            this.status = new ui.UiLabel("Choose a size", 15)

            const stack = new ui.UiStack({
                orientation: "column",
                // One scope for every row in the stack. The stack registers the
                // rows under it and answers directional movement itself, which
                // is what makes up and down cross from one row to the next.
                scopeId: STACK_SETUP_SCOPE,
                // Cross-axis placement of each child. Rows of two, three, and
                // one control all end up on the same center line. A single
                // child can override it with `alignment` on its record.
                alignment: "center",
                wrap: true,
                gap: 0,
                children: [
                    // Every child is a record: the view plus whatever spacing
                    // and alignment belong to it rather than to the stack.
                    // Passive views such as labels contribute no focus targets
                    // and are skipped by movement.
                    { view: this.status },
                    { view: new ui.UiLabel("Size", 15), gapBefore: 4 },
                    { view: this.createRow("size", ["S", "M", "L"], 34), gapBefore: 3 },
                    { view: new ui.UiLabel("Speed", 15), gapBefore: 4 },
                    { view: this.createRow("speed", ["Slow", "Fast"], 40), gapBefore: 3 },
                    // For a child pinned to the far edge instead, give the stack
                    // `justify: "spaceBetween"` and a placement that stretches it
                    // along its axis.
                    { view: this.createRow("done", ["Done"], 44), gapBefore: 10 },
                ],
            })

            this.add(stack, {
                x: 0,
                y: 4,
                width: ui.STANDARD_DISPLAY_WIDTH,
                horizontalAlignment: "center",
            })
        }

        // Rows built for a stack need no scope of their own. The stack assigns
        // its scope to each of them, so all the controls navigate as a single
        // ragged grid.
        private createRow(
            id: string,
            texts: string[],
            controlWidth: number,
        ): ui.UiRow<string> {
            const controls: ui.UiControl<string>[] = []
            for (let i = 0; i < texts.length; i++) {
                const text = texts[i]
                controls.push(
                    ui.button<string>(id + "-" + i, text, () =>
                        this.status.setText(text + " selected"),
                    ),
                )
            }

            return new ui.UiRow<string>({
                controls,
                controlSize: { width: controlWidth, height: 20 },
                controlStyle: ui.UiButtonStyles.LightShadowedWhite,
                gap: 4,
            })
        }
    }

    // The same stack put to work differently: stretched to the display so that
    // `justify` spreads the children instead of hand-written gaps, one child
    // aligned against the edge rather than centered, and a grid, a plain button
    // and a row all sharing the stack's scope. The transport strip is a nested
    // row stack, which merges its children into a single navigation row.
    class MixerScreen extends ui.UiScreen {
        private status: ui.UiLabel

        constructor(runtime: ui.UiRuntime) {
            super(runtime)
            this.backgroundColor = 12
            this.status = new ui.UiLabel("Mixer", 1)

            // A grid contributes one navigation row per grid row, so the pads
            // navigate internally exactly as they would on their own.
            const pads = new ui.UiGrid<string>({
                controls: [
                    this.pad("1"),
                    this.pad("2"),
                    this.pad("3"),
                    this.pad("4"),
                    this.pad("5"),
                    this.pad("6"),
                ],
                columnCount: 3,
                controlSize: { width: 34, height: 20 },
                controlStyle: ui.UiButtonStyles.LightShadowedWhite,
                rowGap: 4,
                columnGap: 4,
            })

            // A nested stack takes the scope of the stack that holds it, and
            // passes it on to its own children. Being a row stack, it reports
            // one merged navigation row, so the button and the pair of volume
            // controls read as a single strip.
            const transport = new ui.UiStack({
                orientation: "row",
                alignment: "center",
                gap: 4,
                children: [
                    {
                        view: new ui.UiButton<string>({
                            id: "play",
                            text: "Play",
                            size: { width: 40, height: 20 },
                            onActivate: () => this.status.setText("Playing"),
                        }),
                    },
                    {
                        view: new ui.UiRow<string>({
                            controls: [
                                // The type argument keeps the control's value
                                // type as `string`. Without it the id is
                                // inferred as its own literal type, which will
                                // not fit a row of `UiControl<string>`.
                                ui.button<string>("volume-down", "-", () =>
                                    this.status.setText("Quieter"),
                                ),
                                ui.button<string>("volume-up", "+", () =>
                                    this.status.setText("Louder"),
                                ),
                            ],
                            controlSize: { width: 24, height: 20 },
                            controlStyle: ui.UiButtonStyles.LightShadowedWhite,
                            gap: 4,
                        }),
                    },
                ],
            })

            const stack = new ui.UiStack({
                orientation: "column",
                scopeId: MIXER_SCOPE,
                alignment: "center",
                // Spreads the leftover space between the children, which needs a
                // placement that stretches the stack along its axis. The pads
                // end up centered and the transport strip pinned to the bottom
                // without a single hand-tuned gap.
                justify: "spaceBetween",
                wrap: true,
                children: [
                    // Overrides the stack's centering for this child only.
                    { view: this.status, alignment: "start" },
                    { view: pads },
                    { view: transport },
                ],
            })

            this.add(stack, {
                x: 0,
                y: 4,
                width: ui.STANDARD_DISPLAY_WIDTH,
                height: ui.STANDARD_DISPLAY_HEIGHT - 8,
                horizontalAlignment: "stretch",
                verticalAlignment: "stretch",
            })
        }

        private pad(name: string): ui.UiControl<string> {
            return ui.button<string>("pad-" + name, name, () =>
                this.status.setText("Pad " + name),
            )
        }
    }

    // Selects a locale by assigning the localization seams directly. A
    // consuming app normally assigns these from its generated per-language
    // file; any code that runs before the UI is constructed can do the same,
    // which is how a sample or test drives a locale.
    function applySpanishLocale(): void {
        _loc.table = {
            "space": "espacio",
            "DEL": "SUP",
            "Enter your name:": "Escribe tu nombre:",
        }
        _loc.alphabetLower = "abcdefghijklmnñopqrstuvwxyz"
        _loc.alphabetUpper = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"
        _loc.accentsLower = "áéíóúü"
        _loc.accentsUpper = "ÁÉÍÓÚÜ"
        _loc.symbols = "-_.,!?@#¡¿"
    }

    // French keeps the default alphabet and symbols and adds an accent set,
    // so it exercises the accents keyboard page.
    function applyFrenchLocale(): void {
        _loc.table = {
            "space": "espace",
            "DEL": "SUP",
            "Enter your name:": "Entre ton nom :",
        }
        _loc.accentsLower = "àâäçéèêëîïôöùûüÿœ"
        _loc.accentsUpper = "ÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸŒ"
    }

    //applySpanishLocale()
    applyFrenchLocale()
    const runtime = new ui.UiRuntime(new ui.DisplayShieldFrameAdapter())
    //runtime.push(new SettingsScreen(runtime))
    //runtime.push(new NameEntryScreen(runtime))
    //runtime.push(new DataGraphScreen(runtime))
    //runtime.push(new StackSetupScreen(runtime))
    runtime.push(new MixerScreen(runtime))
    runtime.start()
}
