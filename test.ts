namespace ui.controls.test {
    class RuntimeSmokeDisplayAdapter implements UiDisplayAdapter {
        private inner_: DisplayShieldFrameAdapter
        private onCommit_: () => void

        constructor(onCommit: () => void) {
            this.inner_ = new DisplayShieldFrameAdapter()
            this.onCommit_ = onCommit
        }

        public get surface(): DrawSurface {
            return this.inner_.surface
        }

        public commit(): Bitmap {
            this.onCommit_()
            return this.inner_.commit()
        }
    }

    function assertLayoutRect(
        rect: Rect,
        x: number,
        y: number,
        width: number,
        height: number,
        name: string,
    ): void {
        control.assert(rect.x == x, name + " x")
        control.assert(rect.y == y, name + " y")
        control.assert(rect.width == width, name + " width")
        control.assert(rect.height == height, name + " height")
    }

    class ControlSmokeSurface implements DrawSurface {
        public log: string

        constructor() {
            this.log = ""
        }

        public clear(color: number): void {
            this.log += "clear:" + color + ";"
        }

        public fillRect(rect: Rect, color: number): void {
            this.log += "fill:" + color + ";"
        }

        public drawRect(rect: Rect, color: number): void {
            this.log += "rect:" + color + ";"
        }

        public drawRoundedRect(
            rect: Rect,
            color?: number,
            fillColor?: number,
        ): void {
            this.log +=
                "rounded:" +
                (color === undefined ? "" : color) +
                ":" +
                (fillColor === undefined ? "" : fillColor) +
                ";"
        }

        public drawLine(
            x0: number,
            y0: number,
            x1: number,
            y1: number,
            color: number,
        ): void {
            this.log += "line:" + color + ";"
        }

        public drawCircle(
            cx: number,
            cy: number,
            radius: number,
            color: number,
        ): void {
            this.log += "circle:" + color + ";"
        }

        public fillCircle(
            cx: number,
            cy: number,
            radius: number,
            color: number,
        ): void {
            this.log += "fcircle:" + color + ";"
        }

        public drawBitmap(
            bitmap: Bitmap,
            x: number,
            y: number,
            options?: DrawBitmapOptions,
        ): void {
            this.log += "bitmap:" + bitmap.width + "x" + bitmap.height + ";"
        }

        public drawText(
            text: string,
            x: number,
            y: number,
            options?: DrawTextOptions,
        ): void {
            this.log += "text:" + text + ";"
            if (options && options.color !== undefined)
                this.log += "textColor:" + options.color + ";"
        }

        public measureText(text: string, font?: TextFont): Size {
            return new Size(text.length * 5, 8)
        }
    }

    class ControlSmokeAssets implements UiAssetResolver {
        public fallbackBitmap: Bitmap
        public knownBitmap: Bitmap

        constructor() {
            this.fallbackBitmap = bmp`1`
            this.knownBitmap = bmp`2 2`
        }

        public getBitmap(
            id: string | number,
            nullIfMissing?: boolean,
        ): Bitmap | undefined {
            if (id == "known") return this.knownBitmap
            if (nullIfMissing) return undefined
            return this.fallbackBitmap
        }

        public getText(id: string): string {
            if (id == "knownText") return "resolved"
            return ""
        }
    }

    class ControlSmokeScreen extends UiScreen {
        private inputHandler_: (event: UiInputEvent) => boolean | undefined

        constructor(
            runtime: UiRuntime,
            handler: (event: UiInputEvent) => boolean | undefined,
        ) {
            super(runtime)
            this.inputHandler_ = handler
        }

        public handleInput(event: UiInputEvent): boolean | undefined {
            return this.inputHandler_(event)
        }
    }

    class ControlSmokeRoot implements UiFocusableView<{ kind: "activated" }> {
        public readonly layoutSpec: UiLayoutSpec
        public readonly finalRect: Rect
        public layoutDirty: boolean
        private scopeId_: UiFocusScopeId
        private width_: number
        private height_: number
        private gap_: number
        private selectedIndex_: number
        private rects_: Rect[]
        private onActivate_: (value: string) => void

        constructor(
            scopeId: UiFocusScopeId,
            width: number,
            height: number,
            gap: number,
            selectedIndex: number,
            onActivate?: (value: string) => void,
        ) {
            this.scopeId_ = scopeId
            this.width_ = width
            this.height_ = height
            this.gap_ = gap
            this.selectedIndex_ = selectedIndex
            this.onActivate_ = onActivate
            this.layoutSpec = {
                width: { mode: "content" },
                height: { mode: "content" },
            }
            this.finalRect = new Rect()
            this.layoutDirty = true
            this.rects_ = [new Rect(), new Rect()]
        }

        public measure(
            constraints: UiLayoutConstraints,
            output: UiMeasuredSize,
        ): void {
            const width = this.width_ * 2 + this.gap_
            output.set(width, this.height_, width, this.height_)
            this.clearLayoutInvalidation()
        }

        public arrange(rect: Rect): void {
            this.finalRect.copyFrom(rect)
            this.rects_[0].set(rect.x, rect.y, this.width_, this.height_)
            this.rects_[1].set(
                rect.x + this.width_ + this.gap_,
                rect.y,
                this.width_,
                this.height_,
            )
            this.clearLayoutInvalidation()
        }

        public invalidateLayout(): void {
            this.layoutDirty = true
        }

        public clearLayoutInvalidation(): void {
            this.layoutDirty = false
        }

        public getControlRect(controlId: string, output: Rect): boolean {
            const index = controlId == "a" ? 0 : controlId == "b" ? 1 : -1
            if (index < 0) return false
            output.copyFrom(this.rects_[index])
            return true
        }

        public registerFocusTargets(focus: UiFocusState): void {
            focus.setScope({
                id: this.scopeId_,
                preferredTargetId: this.scopeId_ + "/" + this.controlId(1),
            })
            for (let i = 0; i < 2; i++)
                focus.setTarget({
                    id: this.scopeId_ + "/" + this.controlId(i),
                    scopeId: this.scopeId_,
                    rect: this.rects_[i],
                    activatable: true,
                })
        }

        public registerNavigation(controller: UiFocusInputController): void {
            controller.setNavigation(this.scopeId_, {
                kind: "row",
                targets: [
                    {
                        id: this.scopeId_ + "/a",
                        rect: this.rects_[0],
                    },
                    {
                        id: this.scopeId_ + "/b",
                        rect: this.rects_[1],
                    },
                ],
            })
        }

        public focusDefault(focus: UiFocusState): UiFocusSetResult {
            return focus.setActiveTarget(
                this.scopeId_,
                this.scopeId_ + "/" + this.controlId(this.selectedIndex_),
            )
        }

        public handleFocusInput(result: UiFocusInputResult): {
            kind: "activated"
        } {
            if (result.kind != "activated" || result.scopeId != this.scopeId_)
                return undefined
            if (this.onActivate_) this.onActivate_(this.value(result.targetId))
            return { kind: "activated" }
        }

        public render(
            surface: DrawSurface,
            assets: UiAssetResolver,
            focus?: UiFocusState,
        ): void {
            surface.fillRect(this.finalRect, 1)
        }

        private controlId(index: number): string {
            return index == 0 ? "a" : "b"
        }

        private value(targetId: UiFocusId): string {
            return targetId == this.scopeId_ + "/a" ? "A" : "B"
        }
    }

    class ControlSmokeModal implements UiModal<{
        kind: "cancelled"
        modalScopeId: UiFocusScopeId
    }> {
        public readonly layoutSpec: UiLayoutSpec
        public readonly finalRect: Rect
        public layoutDirty: boolean
        private modalScopeId_: UiFocusScopeId
        private onCancel_: () => void

        constructor(modalScopeId: UiFocusScopeId, onCancel?: () => void) {
            this.modalScopeId_ = modalScopeId
            this.onCancel_ = onCancel
            this.layoutSpec = {
                width: { mode: "content" },
                height: { mode: "content" },
            }
            this.finalRect = new Rect()
            this.layoutDirty = true
        }

        public get modalScopeId(): UiFocusScopeId {
            return this.modalScopeId_
        }

        public measure(
            constraints: UiLayoutConstraints,
            output: UiMeasuredSize,
        ): void {
            output.set(32, 40, 32, 40)
            this.clearLayoutInvalidation()
        }

        public arrange(rect: Rect): void {
            this.finalRect.copyFrom(rect)
            this.clearLayoutInvalidation()
        }

        public invalidateLayout(): void {
            this.layoutDirty = true
        }

        public clearLayoutInvalidation(): void {
            this.layoutDirty = false
        }

        public open(
            focus: UiFocusState,
            controller?: UiFocusInputController,
        ): UiFocusSetResult {
            focus.setScope({
                id: this.modalScopeId_,
                parentScopeId: focus.getActiveScopeId(),
                handlesCancel: true,
                modal: true,
            })
            return focus.setActiveScope(this.modalScopeId_)
        }

        public close(focus: UiFocusState): UiFocusSetResult {
            return focus.closeModalScope(this.modalScopeId_)
        }

        public handleFocusInput(result: UiFocusInputResult): {
            kind: "cancelled"
            modalScopeId: UiFocusScopeId
        } {
            if (result.kind != "cancelled") return undefined
            if (this.onCancel_) this.onCancel_()
            return { kind: "cancelled", modalScopeId: this.modalScopeId_ }
        }

        public render(
            surface: DrawSurface,
            assets: UiAssetResolver,
            focus?: UiFocusState,
        ): void {
            surface.fillRect(this.finalRect, 1)
        }
    }

    type ControlSmokeActionModalResult =
        | { kind: "completed"; modalScopeId: UiFocusScopeId }
        | { kind: "custom"; modalScopeId: UiFocusScopeId }
        | { kind: "keepOpen"; modalScopeId: UiFocusScopeId }

    class ControlSmokeActionModal implements UiModal<ControlSmokeActionModalResult> {
        public readonly layoutSpec: UiLayoutSpec
        public readonly finalRect: Rect
        public layoutDirty: boolean
        private modalScopeId_: UiFocusScopeId
        private resultKind_: string
        private targetRect_: Rect

        constructor(modalScopeId: UiFocusScopeId, resultKind: string) {
            this.modalScopeId_ = modalScopeId
            this.resultKind_ = resultKind
            this.layoutSpec = {
                width: { mode: "content" },
                height: { mode: "content" },
            }
            this.finalRect = new Rect()
            this.layoutDirty = true
            this.targetRect_ = new Rect()
        }

        public get modalScopeId(): UiFocusScopeId {
            return this.modalScopeId_
        }

        public measure(
            constraints: UiLayoutConstraints,
            output: UiMeasuredSize,
        ): void {
            output.set(24, 24, 24, 24)
            this.clearLayoutInvalidation()
        }

        public arrange(rect: Rect): void {
            this.finalRect.copyFrom(rect)
            this.targetRect_.copyFrom(rect)
            this.clearLayoutInvalidation()
        }

        public invalidateLayout(): void {
            this.layoutDirty = true
        }

        public clearLayoutInvalidation(): void {
            this.layoutDirty = false
        }

        public open(
            focus: UiFocusState,
            controller?: UiFocusInputController,
        ): UiFocusSetResult {
            const targetId = this.targetId()
            focus.setScope({
                id: this.modalScopeId_,
                parentScopeId: focus.getActiveScopeId(),
                preferredTargetId: targetId,
                handlesCancel: true,
                modal: true,
            })
            focus.setTarget({
                id: targetId,
                scopeId: this.modalScopeId_,
                rect: this.targetRect_,
                activatable: true,
            })
            return focus.setActiveScope(this.modalScopeId_)
        }

        public close(focus: UiFocusState): UiFocusSetResult {
            return focus.closeModalScope(this.modalScopeId_)
        }

        public handleFocusInput(
            result: UiFocusInputResult,
        ): ControlSmokeActionModalResult {
            if (
                result.kind != "activated" ||
                result.scopeId != this.modalScopeId_
            )
                return undefined
            return <ControlSmokeActionModalResult>{
                kind: this.resultKind_,
                modalScopeId: this.modalScopeId_,
            }
        }

        public render(
            surface: DrawSurface,
            assets: UiAssetResolver,
            focus?: UiFocusState,
        ): void {
            surface.fillRect(this.finalRect, 1)
        }

        private targetId(): UiFocusId {
            return this.modalScopeId_ + "/ok"
        }
    }

    /**
     * Smoke harness for reusable control visuals.
     */
    export function runControlButtonSmokeTest(): void {
        const surface = new ControlSmokeSurface()
        const buttonView = new UiButtonView(UiButtonStyles.LightShadowedWhite)
        const rect = new Rect(10, 20, 18, 18)
        const bitmap = bmp`
      2 2
      2 2
    `

        buttonView.render(surface, rect, { bitmap })
        buttonView.renderFocus(surface, rect, { bitmap })

        control.assert(surface.log.indexOf("fill:1;") >= 0, "control fill")
        control.assert(surface.log.indexOf("line:11;") >= 0, "control shadow")
        control.assert(
            surface.log.indexOf("bitmap:2x2;") >= 0,
            "control bitmap",
        )
        control.assert(surface.log.indexOf("line:9;") >= 0, "control focus")

        const focusLabelStyle = buttonStyle(
            UiButtonStyles.Transparent,
            UiButtonStyles.FocusLabel,
            {
                focusLabelGap: 2,
            },
        )
        control.assert(
            UiButtonStyles.GreenBorderedWhite.borderColor == 7,
            "control green border style",
        )
        surface.log = ""
        buttonView.render(
            surface,
            rect,
            { bitmap, text: "go" },
            focusLabelStyle,
        )
        surface.log = ""
        _uiControls.renderControl(
            surface,
            {
                id: "control",
                value: "control",
                bitmap,
            },
            rect,
            buttonView,
            UiButtonStyles.LightShadowedWhite,
        )
        control.assert(
            surface.log.indexOf("fill:7;") < 0,
            "control render does not fill green",
        )
        control.assert(
            surface.log.indexOf("text:go;") < 0,
            "control focus label hidden",
        )
        const assets = new ControlSmokeAssets()
        const dynamicControl: UiControl<string> = {
            id: "dynamic",
            value: "dynamic",
            bitmapId: "known",
        }
        surface.log = ""
        _uiControls.renderControl(
            surface,
            dynamicControl,
            rect,
            buttonView,
            UiButtonStyles.Transparent,
            undefined,
            undefined,
            assets,
        )
        control.assert(
            surface.log.indexOf(
                "bitmap:" +
                    assets.knownBitmap.width +
                    "x" +
                    assets.knownBitmap.height +
                    ";",
            ) >= 0,
            "dynamic control resolves initial bitmap id",
        )
        control.assert(
            dynamicControl.bitmap === undefined &&
                dynamicControl.bitmapId == "known",
            "render control leaves bitmap id mutable",
        )
        dynamicControl.bitmapId = "missing"
        surface.log = ""
        _uiControls.renderControl(
            surface,
            dynamicControl,
            rect,
            buttonView,
            UiButtonStyles.Transparent,
            undefined,
            undefined,
            assets,
        )
        control.assert(
            surface.log.indexOf(
                "bitmap:" +
                    assets.fallbackBitmap.width +
                    "x" +
                    assets.fallbackBitmap.height +
                    ";",
            ) >= 0,
            "dynamic control resolves changed bitmap id",
        )
        surface.log = ""
        buttonView.render(
            surface,
            rect,
            { bitmap, text: "go" },
            focusLabelStyle,
        )
        buttonView.renderFocus(
            surface,
            rect,
            { bitmap, text: "go" },
            focusLabelStyle,
            new Rect(0, 0, 40, 40),
        )
        control.assert(
            surface.log.indexOf("fill:15;") >= 0,
            "control focus label fill",
        )
        control.assert(
            surface.log.indexOf("text:go;") >= 0,
            "control focus label text",
        )
        control.assert(
            _uiControls.focusedControlOverlayIndex(
                "missing-active",
                [
                    {
                        id: "control",
                        value: "control",
                    },
                ],
                undefined,
            ) == -1,
            "control focus overlay accepts missing target",
        )

        let activated = ""
        const single = new UiButton("start", "Start", () => {
            activated = "called"
        })
        const measured = new UiMeasuredSize()
        single.measure({ maxWidth: 160, maxHeight: 120 }, measured)
        control.assert(
            measured.preferredWidth == 46,
            "single button measured width",
        )
        control.assert(
            measured.preferredHeight == 20,
            "single button measured height",
        )
        single.arrange(new Rect(4, 5, 46, 20))
        const focus = new UiFocusState()
        const controller = new UiFocusInputController(focus)
        single.registerFocusTargets(focus)
        single.registerNavigation(controller)
        single.focusDefault(focus)
        control.assert(
            focus.getActiveTargetId("start") == "start/start",
            "single button focused target",
        )
        surface.log = ""
        single.render(surface, new ControlSmokeAssets(), focus)
        control.assert(
            surface.log.indexOf("text:Start;") >= 0,
            "single button text render",
        )
        control.assert(
            surface.log.indexOf("line:9;") >= 0,
            "single button focus render",
        )
        const resolvedLabel = label({
            textId: "knownText",
            bitmapId: "known",
            color: 7,
            size: { width: 40, height: 8 },
        })
        resolvedLabel._resolveContentAssets(new ControlSmokeAssets())
        resolvedLabel.arrange(new Rect(0, 0, 40, 8))
        surface.log = ""
        resolvedLabel.measure({ maxWidth: 160, maxHeight: 120 }, measured)
        resolvedLabel.render(surface)
        control.assert(
            surface.log.indexOf("bitmap:2x1;") >= 0,
            "label bitmap id render",
        )
        control.assert(
            surface.log.indexOf("text:resolved;") >= 0,
            "label text id render",
        )
        control.assert(
            surface.log.indexOf("textColor:7;") >= 0,
            "label text color",
        )
        const singleActivate = single.handleFocusInput(
            controller.handleInput({ action: "activate" }),
        )
        control.assert(
            singleActivate.kind == "activated" &&
                singleActivate.value == "start",
            "single button activation result",
        )
        control.assert(activated == "called", "single button callback")
        const singleExit = single.handleFocusInput(
            controller.handleInput({ action: "right" }),
        )
        control.assert(
            singleExit.kind == "exited" && singleExit.direction == "right",
            "single button exit result",
        )
        const sized = new UiButton({
            id: "fixed",
            text: "Fixed",
            size: { width: 60, height: 22 },
        })
        sized.measure({ maxWidth: 160, maxHeight: 120 }, measured)
        control.assert(measured.preferredWidth == 60, "sized button width")
        control.assert(measured.preferredHeight == 22, "sized button height")
    }

    /**
     * Smoke harness for modal picker layout, focus, and typed results.
     */
    export function runPickerSmokeTest(): void {
        let activated = ""
        let cancelled = ""
        const picker = new UiPicker<string>({
            modalScopeId: "confirm",
            title: { text: "Save changes?", bitmapId: "known" },
            controls: [
                { id: "cancel", value: "cancel", text: "Cancel" },
                { id: "ok", value: "ok", text: "OK" },
            ],
            defaultControlId: "ok",
            columnCount: 2,
            controlSize: { width: 44, height: 18 },
            columnGap: 4,
            controlStyle: UiButtonStyles.LightShadowedWhite,
            onActivate: value => {
                activated = value
            },
            onCancel: scopeId => {
                cancelled = scopeId
            },
        })
        picker._resolveContentAssets(new ControlSmokeAssets())

        const measured = new UiMeasuredSize()
        picker.measure({ maxWidth: 160, maxHeight: 120 }, measured)
        control.assert(
            measured.preferredWidth >=
                "Save changes?".length * bitmaps.font8.charWidth + 8,
            "picker title width included",
        )

        picker.arrange(new Rect(0, 0, measured.preferredWidth, 56))
        const focus = new UiFocusState()
        const controller = new UiFocusInputController(focus)
        focus.setScope({ id: "parent" })
        focus.setActiveScope("parent")
        picker.open(focus, controller)
        control.assert(
            focus.getActiveTargetId("confirm") == "confirm/ok",
            "picker preferred target",
        )

        const surface = new ControlSmokeSurface()
        picker.render(surface, new ControlSmokeAssets(), focus)
        control.assert(
            surface.log.indexOf("rounded:15:12;") >= 0,
            "picker rounded panel",
        )
        control.assert(
            surface.log.indexOf("text:Save changes?;") >= 0,
            "picker title render",
        )
        control.assert(
            surface.log.indexOf("bitmap:2x1;") >= 0,
            "picker title bitmap render",
        )
        control.assert(
            surface.log.indexOf("textColor:1;") >= 0,
            "picker title color",
        )
        const customPanelSurface = new ControlSmokeSurface()
        drawModalPanel(customPanelSurface, new Rect(0, 0, 10, 10), {
            backgroundColor: 5,
        })
        control.assert(
            customPanelSurface.log.indexOf("rounded:15:5;") >= 0,
            "picker panel background override",
        )

        const activateResult = picker.handleFocusInput(
            controller.handleInput({ action: "activate" }),
        )
        control.assert(
            activateResult.kind == "activated" &&
                activateResult.value == "ok" &&
                activateResult.close,
            "picker activation result",
        )
        control.assert(activated == "ok", "picker activation callback")

        const cancelResult = picker.handleFocusInput(
            controller.handleInput({ action: "cancel" }),
        )
        control.assert(cancelResult.kind == "cancelled", "picker cancel result")
        control.assert(cancelled == "confirm", "picker cancel callback")

        let simpleActivated = ""
        let simpleCancelled = ""
        const simplePicker = new UiPicker(
            "simple-confirm",
            "Continue?",
            ["No", "Yes"],
            value => {
                simpleActivated = value
            },
            scopeId => {
                simpleCancelled = scopeId
            },
        )
        const simpleMeasured = new UiMeasuredSize()
        simplePicker.measure({ maxWidth: 160, maxHeight: 120 }, simpleMeasured)
        simplePicker.arrange(new Rect(0, 0, simpleMeasured.preferredWidth, 56))
        const simpleFocus = new UiFocusState()
        const simpleController = new UiFocusInputController(simpleFocus)
        simpleFocus.setScope({ id: "simple-parent" })
        simpleFocus.setActiveScope("simple-parent")
        simplePicker.open(simpleFocus, simpleController)
        control.assert(
            simpleFocus.getActiveTargetId("simple-confirm") ==
                "simple-confirm/choice-1",
            "simple picker preferred target",
        )
        const simpleActivateResult = simplePicker.handleFocusInput(
            simpleController.handleInput({ action: "activate" }),
        )
        control.assert(
            simpleActivateResult.kind == "activated" &&
                simpleActivateResult.value == "Yes",
            "simple picker activation result",
        )
        control.assert(
            simpleActivated == "Yes",
            "simple picker activation callback",
        )
        const simpleCancelResult = simplePicker.handleFocusInput(
            simpleController.handleInput({ action: "cancel" }),
        )
        control.assert(
            simpleCancelResult.kind == "cancelled",
            "simple picker cancel result",
        )
        control.assert(
            simpleCancelled == "simple-confirm",
            "simple picker cancel callback",
        )
    }

    /**
     * Smoke harness for screen-owned view focus and input plumbing.
     */
    export function runScreenControllerSmokeTest(): void {
        let screenLog = ""
        const screenRuntime = new UiRuntime(
            new RuntimeSmokeDisplayAdapter(() => {}),
            new ControlSmokeAssets(),
        )
        const screen = new ControlSmokeScreen(screenRuntime, event => {
            if (event.action == "cancel" && event.phase != "released") {
                screenLog += "root-cancel;"
                return true
            }
            return undefined
        })
        screen.add(new UiLabel("Screen", 1), { x: 2, y: 3 })
        const screenRow = new ControlSmokeRoot(
            "screen-row",
            24,
            20,
            0,
            1,
            value => {
                screenLog += value + ";"
            },
        )
        screen.addCentered(screenRow, 15, 100, 20)
        const autoRow = new ControlSmokeRoot("screen-auto-row", 10, 6, 3, 0)
        screen.add(autoRow, {
            x: 7,
            y: 32,
        })
        screen._enter()
        control.assert(
            screen.focus.getActiveTargetId("screen-row") == "screen-row/b",
            "screen controller root focus",
        )
        const screenControlRect = new Rect()
        control.assert(
            screenRow.getControlRect("b", screenControlRect),
            "screen controller placed control exists",
        )
        assertLayoutRect(
            screenControlRect,
            50,
            5,
            24,
            20,
            "screen controller placed control rect",
        )
        const autoControlRect = new Rect()
        control.assert(
            autoRow.getControlRect("b", autoControlRect),
            "screen auto placed control exists",
        )
        assertLayoutRect(
            autoControlRect,
            20,
            32,
            10,
            6,
            "screen auto placed control rect",
        )
        control.assert(
            screen.routeInput({ action: "activate" }),
            "screen controller activation handled",
        )
        control.assert(screenLog == "B;", "screen controller root callback")
        control.assert(
            screen.routeInput({ action: "left" }),
            "screen controller row navigation handled",
        )
        control.assert(
            screen.focus.getActiveTargetId("screen-row") == "screen-row/a",
            "screen controller row navigation focus",
        )
        control.assert(
            screen.routeInput({ action: "activate" }),
            "screen controller second activation handled",
        )
        control.assert(
            screenLog == "B;A;",
            "screen controller row navigation callback",
        )
        control.assert(
            screen.routeInput({ action: "cancel" }),
            "screen controller root cancel handled",
        )
        control.assert(
            !screen.routeInput({ action: "cancel", phase: "released" }),
            "screen controller cancel release unhandled",
        )
        control.assert(
            !screen.routeInput({ action: "menu" }),
            "screen controller leaves menu unregistered",
        )

        const screenSurface = new ControlSmokeSurface()
        screen.render(screenSurface)
        control.assert(
            screenSurface.log.indexOf("text:Screen;") >= 0,
            "screen controller renders passive label",
        )
        control.assert(
            screenSurface.log.indexOf("fill:1;") >= 0,
            "screen controller renders roots",
        )

        const screenModal = new ControlSmokeModal("screen-modal", () => {
            screenLog += "modal-cancel;"
        })
        screen.openModal(screenModal)
        assertLayoutRect(
            screenModal.finalRect,
            64,
            40,
            32,
            40,
            "screen controller default modal layout",
        )
        control.assert(screen.hasModal, "screen controller has modal")
        control.assert(
            screen.routeInput({ action: "cancel" }),
            "screen controller modal input handled",
        )
        control.assert(
            screenLog == "B;A;root-cancel;modal-cancel;",
            "screen controller modal-first input",
        )
        control.assert(
            !screen.hasModal,
            "screen controller modal cancel closes",
        )

        const completedModal = new ControlSmokeActionModal(
            "screen-completed-modal",
            "completed",
        )
        screen.openModal(completedModal)
        control.assert(screen.hasModal, "screen controller has completed modal")
        control.assert(
            screen.routeInput({ action: "activate" }),
            "screen controller completed modal input handled",
        )
        control.assert(
            !screen.hasModal,
            "screen controller completed modal closes",
        )

        const keepOpenModal = new ControlSmokeActionModal(
            "screen-keep-open-modal",
            "keepOpen",
        )
        screen.openModal(keepOpenModal)
        control.assert(screen.hasModal, "screen controller has keep-open modal")
        control.assert(
            screen.routeInput({ action: "activate" }),
            "screen controller keep-open modal input handled",
        )
        control.assert(
            screen.hasModal,
            "screen controller keep-open modal stays open",
        )
        screen.closeModal(keepOpenModal)

        const customModal = new ControlSmokeActionModal(
            "screen-custom-modal",
            "custom",
        )
        screen.openModal(customModal)
        control.assert(screen.hasModal, "screen controller has custom modal")
        control.assert(
            screen.routeInput({ action: "activate" }),
            "screen controller custom modal input handled",
        )
        control.assert(
            !screen.hasModal,
            "screen controller custom modal closes",
        )

        screen._exit()
    }

    /**
     * Smoke harness for numeric entry edit rules and typed results.
     */
    export function runNumericEntrySmokeTest(): void {
        const decimal = new UiNumericEntry("decimal", "1", undefined, true)
        control.assert(decimal.maxLength == 8, "decimal max length default")
        decimal.toggleSign()
        control.assert(decimal.text == "-1", "decimal sign toggle")
        decimal.inputDecimalPoint()
        decimal.inputDecimalPoint()
        control.assert(decimal.text == "-1.", "decimal one point")
        decimal.inputDigit(5)
        control.assert(decimal.text == "-1.5", "decimal digit")
        control.assert(
            decimal.createDeleteResult().kind == "deleted",
            "decimal delete result",
        )
        const backResult = decimal.back()
        control.assert(backResult.kind == "completed", "decimal back completes")
        control.assert((<any>backResult).text == "-1.5", "decimal back text")
        control.assert((<any>backResult).value == -1.5, "decimal back value")

        const zero = new UiNumericEntry("decimal", "-0")
        const zeroResult = zero.enter()
        control.assert(
            (<any>zeroResult).text == "0",
            "decimal minus zero normalized",
        )
        control.assert((<any>zeroResult).value == 0, "decimal minus zero value")

        const trailingPoint = new UiNumericEntry("decimal", "1")
        trailingPoint.inputDecimalPoint()
        const trailingPointResult = trailingPoint.enter()
        control.assert(
            (<any>trailingPointResult).text == "1",
            "decimal trailing point normalized",
        )

        const decimalPointFirst = new UiNumericEntry("decimal")
        decimalPointFirst.inputDecimalPoint()
        control.assert(
            decimalPointFirst.text == "",
            "decimal rejects leading point",
        )
        decimalPointFirst.toggleSign()
        decimalPointFirst.inputDecimalPoint()
        control.assert(
            decimalPointFirst.text == "-",
            "decimal rejects point after sign",
        )

        const decimalLeadingZero = new UiNumericEntry("decimal", "0")
        decimalLeadingZero.inputDigit(5)
        control.assert(
            decimalLeadingZero.text == "5",
            "decimal replaces zero with digit",
        )
        const decimalZeroFraction = new UiNumericEntry("decimal", "0")
        decimalZeroFraction.inputDecimalPoint()
        decimalZeroFraction.inputDigit(5)
        control.assert(
            decimalZeroFraction.text == "0.5",
            "decimal accepts digit after zero point",
        )

        const decimalNegativeLeadingZero = new UiNumericEntry("decimal", "-0")
        decimalNegativeLeadingZero.inputDigit(5)
        control.assert(
            decimalNegativeLeadingZero.text == "-5",
            "decimal replaces minus zero with digit",
        )
        const decimalNegativeZeroFraction = new UiNumericEntry("decimal", "-0")
        decimalNegativeZeroFraction.inputDecimalPoint()
        decimalNegativeZeroFraction.inputDigit(5)
        control.assert(
            decimalNegativeZeroFraction.text == "-0.5",
            "decimal accepts digit after minus zero point",
        )

        const positive = new UiNumericEntry("positiveInteger", "0", 3)
        positive.toggleSign()
        positive.inputDecimalPoint()
        control.assert(
            positive.text == "0",
            "positive rejects sign and decimal",
        )
        positive.inputDigit(7)
        positive.inputDigit(8)
        positive.inputDigit(9)
        positive.inputDigit(6)
        control.assert(
            positive.text == "789",
            "positive leading zero replacement",
        )
        const positiveResult = positive.enter()
        control.assert(
            positiveResult.kind == "completed",
            "positive enter completes",
        )
        control.assert(
            (<any>positiveResult).value == 789,
            "positive integer value",
        )

        const positiveZero = new UiNumericEntry("positiveInteger", "0")
        const positiveZeroResult = positiveZero.enter()
        control.assert(
            (<any>positiveZeroResult).text == "1",
            "positive zero fixup",
        )
        control.assert(
            (<any>positiveZeroResult).value == 1,
            "positive zero value",
        )

        const noCancel = new UiNumericEntry("decimal")
        control.assert(
            noCancel.cancel() === undefined,
            "cancel absent by default",
        )
        control.assert(
            noCancel.createDeleteResult() === undefined,
            "delete absent by default",
        )
        const cancel = new UiNumericEntry(
            "decimal",
            "3",
            undefined,
            undefined,
            true,
        )
        control.assert(cancel.cancel().kind == "cancelled", "cancel enabled")

        let validateLog = ""
        let completedValidatorCalls = 0
        const validated = new UiNumericEntry(
            "decimal",
            undefined,
            undefined,
            undefined,
            undefined,
            (
                mode: UiNumericEntryMode,
                candidate: string,
                action: UiNumericEntryEditAction,
            ) => {
                validateLog += action + ":" + candidate + ";"
                if (mode == "decimal" && candidate == "9" && action == "digit")
                    completedValidatorCalls++
                return candidate == "9" ? "completed" : "accepted"
            },
        )
        const completed = validated.inputDigit(9)
        control.assert(completed.kind == "completed", "validator completed")
        control.assert(
            completedValidatorCalls >= 1,
            "validator receives typed action",
        )
        control.assert(
            validateLog.indexOf("digit:9;") >= 0,
            "validator receives candidate",
        )

        const displaySurface = new ControlSmokeSurface()
        const displayEntry = new UiNumericEntry("decimal", "42")
        displayEntry.render(displaySurface, new Rect(0, 0, 24, 12))
        control.assert(
            displaySurface.log.indexOf("rounded:15:1;") >= 0,
            "numeric display rounded border",
        )

        let simpleModalValue = 0
        const simpleModal = new UiNumericEntryModal(
            "numeric-simple",
            5,
            value => {
                simpleModalValue = value
            },
        )
        const simpleFocus = new UiFocusState()
        const simpleController = new UiFocusInputController(simpleFocus)
        simpleFocus.setScope({ id: "parent-simple" })
        simpleFocus.setActiveScope("parent-simple")
        simpleModal.open(simpleFocus, simpleController)
        simpleFocus.setActiveTarget("numeric-simple", "numeric-simple/15")
        const simpleResult = simpleModal.handleFocusInput(
            simpleController.handleInput({ action: "activate" }),
        )
        control.assert(
            simpleResult.kind == "completed",
            "numeric simple modal completed",
        )
        control.assert(
            simpleModalValue == 5,
            "numeric simple modal callback value",
        )

        let modalResult: UiNumericEntryResult = undefined
        const modal = new UiNumericEntryModal({
            modalScopeId: "numeric-modal",
            mode: "positiveInteger",
            initialText: "0",
            contentMargin: 5,
            onResult: result => {
                modalResult = result
            },
        })
        const modalMeasured = new UiMeasuredSize()
        modal.measure({ maxWidth: 160, maxHeight: 120 }, modalMeasured)
        control.assert(
            modalMeasured.preferredWidth == 88,
            "numeric modal measured width",
        )
        control.assert(
            modalMeasured.preferredHeight == 111,
            "numeric modal measured height",
        )
        modal.arrange(new Rect(0, 0, 88, 111))

        const modalFocus = new UiFocusState()
        const modalController = new UiFocusInputController(modalFocus)
        modalFocus.setScope({ id: "parent" })
        modalFocus.setActiveScope("parent")
        modal.open(modalFocus, modalController)
        control.assert(
            modalFocus.getActiveScopeId() == "numeric-modal",
            "numeric modal active scope",
        )
        modalController.handleInput({ action: "up" })
        control.assert(
            modalFocus.getActiveTargetId("numeric-modal") == "numeric-modal/4",
            "numeric modal one row above one",
        )
        modalController.handleInput({ action: "up" })
        control.assert(
            modalFocus.getActiveTargetId("numeric-modal") == "numeric-modal/0",
            "numeric modal top row starts with seven",
        )
        modalFocus.setActiveTarget("numeric-modal", "numeric-modal/8")
        modalController.handleInput({ action: "down" })
        control.assert(
            modalFocus.getActiveTargetId("numeric-modal") == "numeric-modal/13",
            "numeric modal down skips left spacer",
        )
        modalFocus.setActiveTarget("numeric-modal", "numeric-modal/10")
        modalController.handleInput({ action: "down" })
        control.assert(
            modalFocus.getActiveTargetId("numeric-modal") == "numeric-modal/15",
            "numeric modal down skips right spacer",
        )
        const modalCancel = modal.handleFocusInput(
            modalController.handleInput({ action: "cancel" }),
        )
        control.assert(
            modalCancel.kind == "cancelled",
            "numeric modal cancel result",
        )
        control.assert(
            modalResult && modalResult.kind == "cancelled",
            "numeric modal cancel callback",
        )

        const modalSurface = new ControlSmokeSurface()
        modal.render(modalSurface, new ControlSmokeAssets(), modalFocus)
        control.assert(
            modalSurface.log.indexOf("rounded:15:12;") >= 0,
            "numeric modal rounded panel",
        )
        control.assert(
            modalSurface.log.indexOf("rounded:7:1;") >= 0,
            "numeric modal enter green outline",
        )

        let deleteModalResult: UiNumericEntryResult = undefined
        const deleteModal = new UiNumericEntryModal({
            modalScopeId: "numeric-delete",
            mode: "decimal",
            initialText: "7",
            deleteEnabled: true,
            deleteContent: { bitmapId: "known" },
            onResult: result => {
                deleteModalResult = result
            },
        })
        deleteModal._resolveContentAssets(new ControlSmokeAssets())
        const deleteModalMeasured = new UiMeasuredSize()
        deleteModal.measure(
            { maxWidth: 160, maxHeight: 120 },
            deleteModalMeasured,
        )
        control.assert(
            deleteModalMeasured.preferredWidth == 86,
            "numeric delete modal measured width",
        )
        control.assert(
            deleteModalMeasured.preferredHeight == 109,
            "numeric delete modal measured height",
        )
        deleteModal.arrange(new Rect(0, 0, 86, 109))
        const deleteFocus = new UiFocusState()
        const deleteController = new UiFocusInputController(deleteFocus)
        deleteFocus.setScope({ id: "parent-delete" })
        deleteFocus.setActiveScope("parent-delete")
        deleteModal.open(deleteFocus, deleteController)
        const deleteModalSurface = new ControlSmokeSurface()
        deleteModal.render(
            deleteModalSurface,
            new ControlSmokeAssets(),
            deleteFocus,
        )
        control.assert(
            deleteModalSurface.log.indexOf("bitmap:2x1;") >= 0,
            "numeric modal delete icon",
        )
        deleteFocus.setActiveTarget("numeric-delete", "numeric-delete/8")
        deleteController.handleInput({ action: "down" })
        control.assert(
            deleteFocus.getActiveTargetId("numeric-delete") ==
                "numeric-delete/12",
            "numeric modal decimal sign key below one",
        )
        deleteFocus.setActiveTarget("numeric-delete", "numeric-delete/10")
        deleteController.handleInput({ action: "down" })
        control.assert(
            deleteFocus.getActiveTargetId("numeric-delete") ==
                "numeric-delete/14",
            "numeric modal decimal point key below three",
        )
        deleteFocus.setActiveTarget("numeric-delete", "numeric-delete/11")
        const deleteResult = deleteModal.handleFocusInput(
            deleteController.handleInput({ action: "activate" }),
        )
        control.assert(
            deleteResult.kind == "deleted",
            "numeric modal delete result",
        )
        control.assert(
            deleteModalResult && deleteModalResult.kind == "deleted",
            "numeric modal delete callback",
        )
    }

    /**
     * Smoke harness for text entry edit rules and typed results.
     */
    export function runTextEntrySmokeTest(): void {
        const filtered = new UiTextEntry(" Ab 12 !# ", 6)
        control.assert(filtered.text == "Ab12", "text filters initial default")
        control.assert(filtered.maxLength == 6, "text max length option")
        control.assert(filtered.minLength == 0, "text min length default")

        const whitespace = new UiTextEntry(
            " Ada ",
            undefined,
            undefined,
            undefined,
            true,
        )
        const whitespaceResult = whitespace.enter()
        control.assert(
            whitespaceResult.kind == "completed",
            "text whitespace completes",
        )
        control.assert(
            (<any>whitespaceResult).text == "Ada",
            "text completion trims",
        )

        const emptyRejected = new UiTextEntry(
            "   ",
            undefined,
            undefined,
            undefined,
            true,
        )
        control.assert(
            emptyRejected.enter() === undefined,
            "text rejects empty default",
        )
        const emptyAccepted = new UiTextEntry(
            "   ",
            undefined,
            undefined,
            true,
            true,
        )
        control.assert(
            (<any>emptyAccepted.enter()).text == "",
            "text allow empty",
        )

        const minLength = new UiTextEntry("ab", undefined, 3)
        control.assert(
            minLength.enter() === undefined,
            "text rejects short completion",
        )
        minLength.inputCharacter("c")
        control.assert(
            (<any>minLength.enter()).text == "abc",
            "text accepts min length",
        )

        const capability = new UiTextEntry(
            "a1- b?",
            undefined,
            undefined,
            undefined,
            true,
            false,
            true,
            true,
        )
        control.assert(
            capability.text == "A- B?",
            "text capability normalization",
        )
        capability.inputCharacter("z")
        capability.inputCharacter("7")
        capability.inputCharacter("#")
        control.assert(capability.text == "A- B?Z#", "text capability edits")

        const maxLength = new UiTextEntry(undefined, 3)
        maxLength.inputCharacter("a")
        maxLength.inputCharacter("b")
        maxLength.inputCharacter("c")
        maxLength.inputCharacter("d")
        control.assert(maxLength.text == "abc", "text max length")
        maxLength.backspace()
        control.assert(maxLength.text == "ab", "text backspace")

        const noCancel = new UiTextEntry()
        control.assert(
            noCancel.cancel() === undefined,
            "text cancel absent by default",
        )
        const cancel = new UiTextEntry(
            " Ada ",
            undefined,
            undefined,
            undefined,
            true,
            undefined,
            undefined,
            undefined,
            true,
        )
        const cancelResult = cancel.cancel()
        control.assert(cancelResult.kind == "cancelled", "text cancel enabled")
        control.assert((<any>cancelResult).text == "Ada", "text cancel trims")

        let validateLog = ""
        const rejected = new UiTextEntry(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            (candidate: string, action: UiTextEntryEditAction) => {
                validateLog += action + ":" + candidate + ";"
                return candidate == "x" ? "rejected" : "accepted"
            },
        )
        rejected.inputCharacter("x")
        control.assert(rejected.text == "", "text validator rejects")
        rejected.inputCharacter("y")
        control.assert(rejected.text == "y", "text validator accepts")
        control.assert(
            validateLog.indexOf("character:x;") >= 0,
            "text validator sees character",
        )

        const completed = new UiTextEntry(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            (candidate: string, action: UiTextEntryEditAction) => {
                if (candidate == "ok" && action == "custom") return "completed"
                return "accepted"
            },
        )
        const completedResult = completed.replaceText("ok")
        control.assert(
            completedResult.kind == "completed",
            "text custom validator completes",
        )
        control.assert(
            (<any>completedResult).text == "ok",
            "text custom completed text",
        )

        const custom = new UiTextEntry(
            undefined,
            4,
            undefined,
            undefined,
            undefined,
            undefined,
            true,
            undefined,
            undefined,
            (candidate: string, action: UiTextEntryEditAction) => {
                if (action == "custom" && candidate == "bad") return "rejected"
                return "accepted"
            },
        )
        custom.inputCharacter("a")
        custom.replaceText("bad")
        control.assert(custom.text == "a", "text rejected custom unchanged")
        custom.replaceText("long-name!")
        control.assert(custom.text == "long", "text custom normalization")

        const displaySurface = new ControlSmokeSurface()
        const displayEntry = new UiTextEntry("Name")
        displayEntry.render(displaySurface, new Rect(0, 0, 40, 18))
        control.assert(
            displaySurface.log.indexOf("rounded:15:1;") >= 0,
            "text display rounded border",
        )
        control.assert(
            displaySurface.log.indexOf("text:Name;") >= 0,
            "text display rendered text",
        )

        let modalResult: UiTextEntryResult = undefined
        const modal = new UiTextEntryModal({
            modalScopeId: "text-modal",
            title: { text: "Name", bitmapId: "known" },
            allowDigits: true,
            allowSymbols: true,
            allowWhitespace: true,
            customAction: { textId: "knownText" },
            onResult: result => {
                modalResult = result
            },
        })
        modal._resolveContentAssets(new ControlSmokeAssets())
        const modalMeasured = new UiMeasuredSize()
        modal.measure({ maxWidth: 160, maxHeight: 120 }, modalMeasured)
        control.assert(
            modalMeasured.preferredWidth == 160,
            "text modal measured width",
        )
        control.assert(
            modalMeasured.preferredHeight == 78,
            "text modal measured height",
        )
        modal.arrange(new Rect(0, 0, 160, 78))
        const modalFocus = new UiFocusState()
        const modalController = new UiFocusInputController(modalFocus)
        modalFocus.setScope({ id: "text-parent" })
        modalFocus.setActiveScope("text-parent")
        modal.open(modalFocus, modalController)
        control.assert(
            modalFocus.getActiveTargetId("text-modal") == "text-modal/0",
            "text modal preferred target",
        )
        const modalSurface = new ControlSmokeSurface()
        modal.render(modalSurface, new ControlSmokeAssets(), modalFocus)
        control.assert(
            modalSurface.log.indexOf("text:Name;") >= 0,
            "text modal title text",
        )
        control.assert(
            modalSurface.log.indexOf("bitmap:2x1;") >= 0,
            "text modal title bitmap",
        )
        control.assert(
            modalSurface.log.indexOf("text:resolved;") >= 0,
            "text modal custom text id",
        )
        const verticalMove = modal.move({
            scopeId: "text-modal",
            currentTargetId: "text-modal/17",
            direction: "down",
        })
        control.assert(
            verticalMove.kind == "moved" &&
                verticalMove.toTargetId == "text-modal/28",
            "text modal vertical navigation uses nearest key",
        )

        modal.handleFocusInput(
            modalController.handleInput({ action: "activate" }),
        )
        modalFocus.setActiveTarget("text-modal", "text-modal/26")
        modal.handleFocusInput(
            modalController.handleInput({ action: "activate" }),
        )
        modalFocus.setActiveTarget("text-modal", "text-modal/1")
        modal.handleFocusInput(
            modalController.handleInput({ action: "activate" }),
        )
        modalFocus.setActiveTarget("text-modal", "text-modal/31")
        const modalCompleted = modal.handleFocusInput(
            modalController.handleInput({ action: "activate" }),
        )
        control.assert(
            modalCompleted.kind == "completed",
            "text modal completed result",
        )
        control.assert(
            (<any>modalCompleted).text == "aB",
            "text modal shift toggle result",
        )
        control.assert(
            modalResult && (<any>modalResult).text == "aB",
            "text modal completed callback",
        )

        let pageResult: UiTextEntryResult = undefined
        const pageModal = new UiTextEntryModal({
            modalScopeId: "text-page-modal",
            allowDigits: true,
            allowSymbols: true,
            allowWhitespace: true,
            onResult: result => {
                pageResult = result
            },
        })
        pageModal.measure({ maxWidth: 160, maxHeight: 120 }, modalMeasured)
        control.assert(
            modalMeasured.preferredHeight == 67,
            "text titleless modal measured height",
        )
        pageModal.arrange(new Rect(0, 0, 160, 67))
        const pageFocus = new UiFocusState()
        const pageController = new UiFocusInputController(pageFocus)
        pageFocus.setScope({ id: "text-page-parent" })
        pageFocus.setActiveScope("text-page-parent")
        pageModal.open(pageFocus, pageController)
        pageFocus.setActiveTarget("text-page-modal", "text-page-modal/27")
        pageModal.handleFocusInput(
            pageController.handleInput({ action: "activate" }),
        )
        pageFocus.setActiveTarget("text-page-modal", "text-page-modal/0")
        pageModal.handleFocusInput(
            pageController.handleInput({ action: "activate" }),
        )
        pageFocus.setActiveTarget("text-page-modal", "text-page-modal/27")
        pageModal.handleFocusInput(
            pageController.handleInput({ action: "activate" }),
        )
        pageFocus.setActiveTarget("text-page-modal", "text-page-modal/0")
        pageModal.handleFocusInput(
            pageController.handleInput({ action: "activate" }),
        )
        pageFocus.setActiveTarget("text-page-modal", "text-page-modal/26")
        pageModal.handleFocusInput(
            pageController.handleInput({ action: "activate" }),
        )
        pageFocus.setActiveTarget("text-page-modal", "text-page-modal/0")
        pageModal.handleFocusInput(
            pageController.handleInput({ action: "activate" }),
        )
        pageFocus.setActiveTarget("text-page-modal", "text-page-modal/28")
        pageModal.handleFocusInput(
            pageController.handleInput({ action: "activate" }),
        )
        pageFocus.setActiveTarget("text-page-modal", "text-page-modal/31")
        const pageCompleted = pageModal.handleFocusInput(
            pageController.handleInput({ action: "activate" }),
        )
        control.assert(
            pageCompleted.kind == "completed",
            "text modal page completed result",
        )
        control.assert(
            (<any>pageCompleted).text == "1-a",
            "text modal page switching result",
        )
        control.assert(
            pageResult && (<any>pageResult).text == "1-a",
            "text modal page callback",
        )

        const customModal = new UiTextEntryModal({
            modalScopeId: "text-custom-modal",
            customAction: "Gen",
            onCustomAction: text => {
                return "Ada"
            },
        })
        customModal.arrange(new Rect(0, 0, 160, 67))
        const customFocus = new UiFocusState()
        const customController = new UiFocusInputController(customFocus)
        customFocus.setScope({ id: "text-custom-parent" })
        customFocus.setActiveScope("text-custom-parent")
        customModal.open(customFocus, customController)
        customFocus.setActiveTarget("text-custom-modal", "text-custom-modal/29")
        control.assert(
            customModal.handleFocusInput(
                customController.handleInput({ action: "activate" }),
            ) === undefined,
            "text modal custom handler keeps open",
        )
        customFocus.setActiveTarget("text-custom-modal", "text-custom-modal/31")
        const customCompleted = customModal.handleFocusInput(
            customController.handleInput({ action: "activate" }),
        )
        control.assert(
            (<any>customCompleted).text == "Ada",
            "text modal custom handler replacement",
        )

        let customResult: UiTextEntryResult = undefined
        const customResultModal = new UiTextEntryModal({
            modalScopeId: "text-custom-result",
            initialText: "Skip",
            customAction: "Skip",
            onResult: result => {
                customResult = result
            },
        })
        customResultModal.arrange(new Rect(0, 0, 160, 67))
        const customResultFocus = new UiFocusState()
        const customResultController = new UiFocusInputController(
            customResultFocus,
        )
        customResultFocus.setScope({ id: "text-custom-result-parent" })
        customResultFocus.setActiveScope("text-custom-result-parent")
        customResultModal.open(customResultFocus, customResultController)
        customResultFocus.setActiveTarget(
            "text-custom-result",
            "text-custom-result/29",
        )
        const directCustomResult = customResultModal.handleFocusInput(
            customResultController.handleInput({ action: "activate" }),
        )
        control.assert(
            directCustomResult.kind == "custom",
            "text modal custom direct result",
        )
        control.assert(
            (<any>directCustomResult).text == "Skip",
            "text modal custom direct text",
        )
        control.assert(
            customResult && customResult.kind == "custom",
            "text modal custom callback",
        )
    }

    /**
     * Smoke harness for keyboard charset injection. Verifies that the default
     * charset is unchanged, that an injected `_loc` alphabet renders and accepts
     * a non-ASCII letter with working case toggling, that a per-modal override
     * beats `_loc`, that a caseless charset hides the shift key, and that a
     * symbols override drives the symbol page.
     */
    export function runTextEntryCharsetSmokeTest(): void {
        function resetLoc(): void {
            _loc.table = undefined
            _loc.alphabetLower = undefined
            _loc.alphabetUpper = undefined
            _loc.accentsLower = undefined
            _loc.accentsUpper = undefined
            _loc.symbols = undefined
        }

        const assets = new ControlSmokeAssets()
        // Spanish alphabet: the base 26 letters plus the n-tilde pair after n.
        const esLower = "abcdefghijklmnñopqrstuvwxyz"
        const esUpper = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"

        // Group 1: no _loc charset fields means the ASCII default is untouched.
        resetLoc()
        const defaultModal = new UiTextEntryModal({
            modalScopeId: "charset-default",
            allowDigits: true,
        })
        const defaultMeasured = new UiMeasuredSize()
        defaultModal.measure({ maxWidth: 160, maxHeight: 120 }, defaultMeasured)
        defaultModal.arrange(new Rect(0, 0, 160, defaultMeasured.preferredHeight))
        const defaultFocus = new UiFocusState()
        const defaultController = new UiFocusInputController(defaultFocus)
        defaultFocus.setScope({ id: "charset-default-parent" })
        defaultFocus.setActiveScope("charset-default-parent")
        defaultModal.open(defaultFocus, defaultController)
        const defaultSurface = new ControlSmokeSurface()
        defaultModal.render(defaultSurface, assets, defaultFocus)
        control.assert(
            defaultMeasured.preferredHeight == 67,
            "charset default height unchanged",
        )
        control.assert(
            defaultSurface.log.indexOf("text:a;") >= 0,
            "charset default renders a",
        )
        control.assert(
            defaultSurface.log.indexOf("text:z;") >= 0,
            "charset default renders z",
        )
        control.assert(
            defaultSurface.log.indexOf("text:ABC;") >= 0,
            "charset default shift caption present",
        )

        // Group 2: an injected _loc alphabet renders and accepts its new letter.
        resetLoc()
        _loc.alphabetLower = esLower
        _loc.alphabetUpper = esUpper
        let injectedResult: UiTextEntryResult = undefined
        const injected = new UiTextEntryModal({
            modalScopeId: "charset-es",
            allowDigits: true,
            onResult: result => {
                injectedResult = result
            },
        })
        const injMeasured = new UiMeasuredSize()
        injected.measure({ maxWidth: 160, maxHeight: 120 }, injMeasured)
        injected.arrange(new Rect(0, 0, 160, injMeasured.preferredHeight))
        const injFocus = new UiFocusState()
        const injController = new UiFocusInputController(injFocus)
        injFocus.setScope({ id: "charset-es-parent" })
        injFocus.setActiveScope("charset-es-parent")
        injected.open(injFocus, injController)
        const injLower = new ControlSmokeSurface()
        injected.render(injLower, assets, injFocus)
        control.assert(
            injMeasured.preferredHeight == 80,
            "charset injected height grows for third letter row",
        )
        control.assert(
            injLower.log.indexOf("text:ñ;") >= 0,
            "charset injected renders n-tilde key",
        )
        control.assert(
            injLower.log.indexOf("text:Ñ;") < 0,
            "charset injected lowercase before shift",
        )
        control.assert(
            injLower.log.indexOf("text:ABC;") >= 0,
            "charset injected shift present",
        )

        // Case toggle maps the pair to uppercase and back to lowercase.
        injFocus.setActiveTarget("charset-es", "charset-es/27")
        injected.handleFocusInput(
            injController.handleInput({ action: "activate" }),
        )
        const injUpper = new ControlSmokeSurface()
        injected.render(injUpper, assets, injFocus)
        control.assert(
            injUpper.log.indexOf("text:Ñ;") >= 0,
            "charset injected renders uppercase n-tilde after shift",
        )
        control.assert(
            injUpper.log.indexOf("text:abc;") >= 0,
            "charset injected shift caption toggles",
        )
        injFocus.setActiveTarget("charset-es", "charset-es/27")
        injected.handleFocusInput(
            injController.handleInput({ action: "activate" }),
        )
        const injBack = new ControlSmokeSurface()
        injected.render(injBack, assets, injFocus)
        control.assert(
            injBack.log.indexOf("text:ñ;") >= 0,
            "charset injected maps back to lowercase",
        )
        control.assert(
            injBack.log.indexOf("text:Ñ;") < 0,
            "charset injected uppercase gone after toggle back",
        )

        // Typing and committing the new letter flows through the modal value.
        injFocus.setActiveTarget("charset-es", "charset-es/14")
        injected.handleFocusInput(
            injController.handleInput({ action: "activate" }),
        )
        injFocus.setActiveTarget("charset-es", "charset-es/32")
        const injCompleted = injected.handleFocusInput(
            injController.handleInput({ action: "activate" }),
        )
        control.assert(
            injCompleted.kind == "completed",
            "charset injected commit completes",
        )
        control.assert(
            (<any>injCompleted).text == "ñ",
            "charset injected typed value",
        )
        control.assert(
            injectedResult && (<any>injectedResult).text == "ñ",
            "charset injected result callback",
        )

        // initialText holding the injected letter survives normalization.
        const injInitial = new UiTextEntryModal({
            modalScopeId: "charset-es-initial",
            initialText: "ñ",
        })
        injInitial.arrange(new Rect(0, 0, 160, 80))
        const injInitFocus = new UiFocusState()
        const injInitController = new UiFocusInputController(injInitFocus)
        injInitFocus.setScope({ id: "charset-es-initial-parent" })
        injInitFocus.setActiveScope("charset-es-initial-parent")
        injInitial.open(injInitFocus, injInitController)
        injInitFocus.setActiveTarget(
            "charset-es-initial",
            "charset-es-initial/32",
        )
        const injInitResult = injInitial.handleFocusInput(
            injInitController.handleInput({ action: "activate" }),
        )
        control.assert(
            injInitResult && injInitResult.kind == "completed",
            "charset injected initial text commits",
        )
        control.assert(
            (<any>injInitResult).text == "ñ",
            "charset injected initial text not stripped",
        )

        // Group 3: a per-modal override beats the assigned _loc alphabet.
        resetLoc()
        _loc.alphabetLower = esLower
        _loc.alphabetUpper = esUpper
        const overrideModal = new UiTextEntryModal({
            modalScopeId: "charset-override",
            charset: { lower: "abcde", upper: "ABCDE" },
        })
        const overrideMeasured = new UiMeasuredSize()
        overrideModal.measure({ maxWidth: 160, maxHeight: 120 }, overrideMeasured)
        overrideModal.arrange(
            new Rect(0, 0, 160, overrideMeasured.preferredHeight),
        )
        const overrideFocus = new UiFocusState()
        const overrideController = new UiFocusInputController(overrideFocus)
        overrideFocus.setScope({ id: "charset-override-parent" })
        overrideFocus.setActiveScope("charset-override-parent")
        overrideModal.open(overrideFocus, overrideController)
        const overrideSurface = new ControlSmokeSurface()
        overrideModal.render(overrideSurface, assets, overrideFocus)
        control.assert(
            overrideSurface.log.indexOf("text:a;") >= 0,
            "charset override renders first letter",
        )
        control.assert(
            overrideSurface.log.indexOf("text:e;") >= 0,
            "charset override renders last letter",
        )
        control.assert(
            overrideSurface.log.indexOf("text:ñ;") < 0,
            "charset override beats loc alphabet",
        )

        // Group 4: a caseless charset (upper equals lower) hides the shift key.
        resetLoc()
        _loc.alphabetLower = "abcdefghijklmnopqrstuvwxyz"
        _loc.alphabetUpper = "abcdefghijklmnopqrstuvwxyz"
        const caselessModal = new UiTextEntryModal({
            modalScopeId: "charset-caseless",
            allowDigits: true,
        })
        const caselessMeasured = new UiMeasuredSize()
        caselessModal.measure({ maxWidth: 160, maxHeight: 120 }, caselessMeasured)
        caselessModal.arrange(
            new Rect(0, 0, 160, caselessMeasured.preferredHeight),
        )
        const caselessFocus = new UiFocusState()
        const caselessController = new UiFocusInputController(caselessFocus)
        caselessFocus.setScope({ id: "charset-caseless-parent" })
        caselessFocus.setActiveScope("charset-caseless-parent")
        caselessModal.open(caselessFocus, caselessController)
        const caselessSurface = new ControlSmokeSurface()
        caselessModal.render(caselessSurface, assets, caselessFocus)
        control.assert(
            caselessSurface.log.indexOf("text:a;") >= 0,
            "charset caseless renders letters",
        )
        control.assert(
            caselessSurface.log.indexOf("text:ABC;") < 0,
            "charset caseless has no shift caption",
        )

        // Group 5: a symbols override drives the symbol page.
        resetLoc()
        let symResult: UiTextEntryResult = undefined
        const symbolsModal = new UiTextEntryModal({
            modalScopeId: "charset-symbols",
            allowDigits: true,
            allowSymbols: true,
            charset: { symbols: "~%^" },
            onResult: result => {
                symResult = result
            },
        })
        const symMeasured = new UiMeasuredSize()
        symbolsModal.measure({ maxWidth: 160, maxHeight: 120 }, symMeasured)
        symbolsModal.arrange(new Rect(0, 0, 160, symMeasured.preferredHeight))
        const symFocus = new UiFocusState()
        const symController = new UiFocusInputController(symFocus)
        symFocus.setScope({ id: "charset-symbols-parent" })
        symFocus.setActiveScope("charset-symbols-parent")
        symbolsModal.open(symFocus, symController)
        // Letters page to digits page to symbols page via the page toggles.
        symFocus.setActiveTarget("charset-symbols", "charset-symbols/27")
        symbolsModal.handleFocusInput(
            symController.handleInput({ action: "activate" }),
        )
        symFocus.setActiveTarget("charset-symbols", "charset-symbols/27")
        symbolsModal.handleFocusInput(
            symController.handleInput({ action: "activate" }),
        )
        const symSurface = new ControlSmokeSurface()
        symbolsModal.render(symSurface, assets, symFocus)
        control.assert(
            symSurface.log.indexOf("text:~;") >= 0,
            "charset symbols override renders first symbol",
        )
        control.assert(
            symSurface.log.indexOf("text:%;") >= 0,
            "charset symbols override renders second symbol",
        )
        control.assert(
            symSurface.log.indexOf("text:!;") < 0,
            "charset symbols override replaces default symbols",
        )
        symFocus.setActiveTarget("charset-symbols", "charset-symbols/0")
        symbolsModal.handleFocusInput(
            symController.handleInput({ action: "activate" }),
        )
        symFocus.setActiveTarget("charset-symbols", "charset-symbols/31")
        const symCompleted = symbolsModal.handleFocusInput(
            symController.handleInput({ action: "activate" }),
        )
        control.assert(
            (<any>symCompleted).text == "~",
            "charset symbols override accepts a symbol",
        )
        control.assert(
            symResult && (<any>symResult).text == "~",
            "charset symbols override result callback",
        )

        resetLoc()
    }

    /**
     * Smoke harness for the keyboard accents page. Verifies that with no accent
     * set the letters page still routes to digits and shows no accents caption,
     * that an injected accent set adds a reachable accents page whose keys render
     * and commit, that accent case follows the global uppercase flag, and that
     * the home key returns from an extra page to the letters page.
     */
    export function runTextEntryAccentsSmokeTest(): void {
        function resetLoc(): void {
            _loc.table = undefined
            _loc.alphabetLower = undefined
            _loc.alphabetUpper = undefined
            _loc.accentsLower = undefined
            _loc.accentsUpper = undefined
            _loc.symbols = undefined
        }

        const assets = new ControlSmokeAssets()
        // A 26-letter base alphabet keeps the action row at indices 26..31:
        // shift 26, page 27, space 28, custom 29, backspace 30, enter 31.
        const baseLower = "abcdefghijklmnopqrstuvwxyz"
        const baseUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

        function activateIndex(
            modal: UiTextEntryModal,
            focus: UiFocusState,
            controller: UiFocusInputController,
            scopeId: string,
            index: number,
        ): UiTextEntryResult {
            focus.setActiveTarget(scopeId, scopeId + "/" + index)
            return modal.handleFocusInput(
                controller.handleInput({ action: "activate" }),
            )
        }

        // Group 1: no accent set means the letters page routes to digits and
        // shows no accents caption. Confirms the default keyboard is unchanged.
        resetLoc()
        const noAccents = new UiTextEntryModal({
            modalScopeId: "accents-none",
            allowDigits: true,
        })
        const noAccentsMeasured = new UiMeasuredSize()
        noAccents.measure({ maxWidth: 160, maxHeight: 120 }, noAccentsMeasured)
        noAccents.arrange(
            new Rect(0, 0, 160, noAccentsMeasured.preferredHeight),
        )
        const noAccentsFocus = new UiFocusState()
        const noAccentsController = new UiFocusInputController(noAccentsFocus)
        noAccentsFocus.setScope({ id: "accents-none-parent" })
        noAccentsFocus.setActiveScope("accents-none-parent")
        noAccents.open(noAccentsFocus, noAccentsController)
        const noAccentsLetters = new ControlSmokeSurface()
        noAccents.render(noAccentsLetters, assets, noAccentsFocus)
        control.assert(
            noAccentsLetters.log.indexOf("text:123;") >= 0,
            "accents none letters page routes to digits",
        )
        control.assert(
            noAccentsLetters.log.indexOf("text:áé;") < 0,
            "accents none shows no accents caption",
        )
        activateIndex(
            noAccents,
            noAccentsFocus,
            noAccentsController,
            "accents-none",
            27,
        )
        const noAccentsDigits = new ControlSmokeSurface()
        noAccents.render(noAccentsDigits, assets, noAccentsFocus)
        control.assert(
            noAccentsDigits.log.indexOf("text:1;") >= 0,
            "accents none digits page reachable",
        )

        // Group 2: an injected accent set adds a reachable accents page whose
        // key renders and commits through the modal value and onResult.
        resetLoc()
        _loc.alphabetLower = baseLower
        _loc.alphabetUpper = baseUpper
        _loc.accentsLower = "áé"
        _loc.accentsUpper = "ÁÉ"
        let accentResult: UiTextEntryResult = undefined
        const accents = new UiTextEntryModal({
            modalScopeId: "accents-es",
            allowDigits: true,
            onResult: result => {
                accentResult = result
            },
        })
        const accentsMeasured = new UiMeasuredSize()
        accents.measure({ maxWidth: 160, maxHeight: 120 }, accentsMeasured)
        accents.arrange(new Rect(0, 0, 160, accentsMeasured.preferredHeight))
        const accentsFocus = new UiFocusState()
        const accentsController = new UiFocusInputController(accentsFocus)
        accentsFocus.setScope({ id: "accents-es-parent" })
        accentsFocus.setActiveScope("accents-es-parent")
        accents.open(accentsFocus, accentsController)
        const accentsLetters = new ControlSmokeSurface()
        accents.render(accentsLetters, assets, accentsFocus)
        control.assert(
            accentsLetters.log.indexOf("text:áé;") >= 0,
            "accents present letters page shows accents caption",
        )
        activateIndex(
            accents,
            accentsFocus,
            accentsController,
            "accents-es",
            27,
        )
        const accentsPage = new ControlSmokeSurface()
        accents.render(accentsPage, assets, accentsFocus)
        control.assert(
            accentsPage.log.indexOf("text:á;") >= 0,
            "accents page renders accent key",
        )
        activateIndex(accents, accentsFocus, accentsController, "accents-es", 0)
        const accentCommit = activateIndex(
            accents,
            accentsFocus,
            accentsController,
            "accents-es",
            31,
        )
        control.assert(
            accentCommit.kind == "completed",
            "accents commit completes",
        )
        control.assert(
            (<any>accentCommit).text == "á",
            "accents commit typed value",
        )
        control.assert(
            accentResult && (<any>accentResult).text == "á",
            "accents commit result callback",
        )

        // Group 3: accent case follows the global uppercase flag set on the
        // letters page; the accents page has no case-toggle of its own.
        const accentsCase = new UiTextEntryModal({
            modalScopeId: "accents-upper",
            allowDigits: true,
        })
        const accentsCaseMeasured = new UiMeasuredSize()
        accentsCase.measure(
            { maxWidth: 160, maxHeight: 120 },
            accentsCaseMeasured,
        )
        accentsCase.arrange(
            new Rect(0, 0, 160, accentsCaseMeasured.preferredHeight),
        )
        const accentsCaseFocus = new UiFocusState()
        const accentsCaseController = new UiFocusInputController(
            accentsCaseFocus,
        )
        accentsCaseFocus.setScope({ id: "accents-upper-parent" })
        accentsCaseFocus.setActiveScope("accents-upper-parent")
        accentsCase.open(accentsCaseFocus, accentsCaseController)
        activateIndex(
            accentsCase,
            accentsCaseFocus,
            accentsCaseController,
            "accents-upper",
            26,
        )
        activateIndex(
            accentsCase,
            accentsCaseFocus,
            accentsCaseController,
            "accents-upper",
            27,
        )
        const accentsUpperPage = new ControlSmokeSurface()
        accentsCase.render(accentsUpperPage, assets, accentsCaseFocus)
        control.assert(
            accentsUpperPage.log.indexOf("text:Á;") >= 0,
            "accents page follows uppercase flag",
        )
        activateIndex(
            accentsCase,
            accentsCaseFocus,
            accentsCaseController,
            "accents-upper",
            0,
        )
        const accentUpperCommit = activateIndex(
            accentsCase,
            accentsCaseFocus,
            accentsCaseController,
            "accents-upper",
            31,
        )
        control.assert(
            (<any>accentUpperCommit).text == "Á",
            "accents commit uppercase value",
        )

        // Group 4: the home key returns from an extra page to the letters page.
        const accentsHome = new UiTextEntryModal({
            modalScopeId: "accents-home",
            allowDigits: true,
        })
        const accentsHomeMeasured = new UiMeasuredSize()
        accentsHome.measure(
            { maxWidth: 160, maxHeight: 120 },
            accentsHomeMeasured,
        )
        accentsHome.arrange(
            new Rect(0, 0, 160, accentsHomeMeasured.preferredHeight),
        )
        const accentsHomeFocus = new UiFocusState()
        const accentsHomeController = new UiFocusInputController(
            accentsHomeFocus,
        )
        accentsHomeFocus.setScope({ id: "accents-home-parent" })
        accentsHomeFocus.setActiveScope("accents-home-parent")
        accentsHome.open(accentsHomeFocus, accentsHomeController)
        activateIndex(
            accentsHome,
            accentsHomeFocus,
            accentsHomeController,
            "accents-home",
            27,
        )
        activateIndex(
            accentsHome,
            accentsHomeFocus,
            accentsHomeController,
            "accents-home",
            26,
        )
        const accentsHomeLetters = new ControlSmokeSurface()
        accentsHome.render(accentsHomeLetters, assets, accentsHomeFocus)
        control.assert(
            accentsHomeLetters.log.indexOf("text:a;") >= 0,
            "accents home key returns to letters page",
        )

        resetLoc()
    }

    /**
     * Smoke harness for control-caption localization and the localized default
     * font. Verifies that with no catalog the English source captions render
     * unchanged, that an assigned catalog replaces a rendered caption, and that
     * an assigned default font drives control measurement.
     */
    export function runLocalizationSmokeTest(): void {
        // Baseline: no catalog and no default font means identity behavior.
        _loc.table = undefined
        _loc.defaultFont = undefined
        control.assert(loc("OK") == "OK", "loc caption identity no table")
        control.assert(loc("space") == "space", "loc space identity no table")

        const modal = new UiTextEntryModal({
            modalScopeId: "loc-text-modal",
            allowWhitespace: true,
        })
        modal.measure({ maxWidth: 160, maxHeight: 120 }, new UiMeasuredSize())
        modal.arrange(new Rect(0, 0, 160, 67))
        const modalFocus = new UiFocusState()
        const modalController = new UiFocusInputController(modalFocus)
        modalFocus.setScope({ id: "loc-text-parent" })
        modalFocus.setActiveScope("loc-text-parent")
        modal.open(modalFocus, modalController)

        const srcSurface = new ControlSmokeSurface()
        modal.render(srcSurface, new ControlSmokeAssets(), modalFocus)
        control.assert(
            srcSurface.log.indexOf("text:OK;") >= 0,
            "text modal renders source enter caption",
        )
        control.assert(
            srcSurface.log.indexOf("text:space;") >= 0,
            "text modal renders source space caption",
        )

        // Catalog hit: the same reachable render path picks up the translation.
        _loc.table = {
            OK: "Valider",
            space: "espace",
        }
        const localizedSurface = new ControlSmokeSurface()
        modal.render(localizedSurface, new ControlSmokeAssets(), modalFocus)
        control.assert(loc("OK") == "Valider", "loc caption table hit")
        control.assert(
            localizedSurface.log.indexOf("text:Valider;") >= 0,
            "text modal renders localized enter caption",
        )
        control.assert(
            localizedSurface.log.indexOf("text:espace;") >= 0,
            "text modal renders localized space caption",
        )
        _loc.table = undefined

        // Assigned default font drives control measurement at the use site.
        const wideFont: TextFont = {
            charWidth: 12,
            charHeight: 5,
            data: hex``,
        }
        _loc.defaultFont = wideFont
        const measured = new UiMeasuredSize()
        const localizedLabel = label("AB")
        localizedLabel.measure({ maxWidth: 160, maxHeight: 120 }, measured)
        control.assert(
            measured.preferredWidth == 24,
            "label measure uses localized default font width",
        )
        _loc.defaultFont = undefined
        const defaultMeasured = new UiMeasuredSize()
        const defaultLabel = label("AB")
        defaultLabel.measure({ maxWidth: 160, maxHeight: 120 }, defaultMeasured)
        control.assert(
            defaultMeasured.preferredWidth ==
                "AB".length * bitmaps.font8.charWidth,
            "label measure reverts to font8 when default font unset",
        )
    }

    runControlButtonSmokeTest()
    runPickerSmokeTest()
    runScreenControllerSmokeTest()
    runNumericEntrySmokeTest()
    runTextEntrySmokeTest()
    runTextEntryCharsetSmokeTest()
    runTextEntryAccentsSmokeTest()
    runLocalizationSmokeTest()

    control.__log(1, "All tests passed!")
}
