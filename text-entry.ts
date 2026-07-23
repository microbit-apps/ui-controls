/**
 * These members extend the `_loc` namespace declared in ui-core and are
 * assigned by the consuming app's generated localization file, the same way
 * `_loc.table` and `_loc.defaultFont` are. They describe the on-screen keyboard,
 * a ui-controls concept, so they are declared here rather than in ui-core.
 */
namespace _loc {
    /**
     * On-screen keyboard letter set and its case-parallel. String order defines
     * the keyboard key order. `alphabetLower` and `alphabetUpper` must have
     * equal length, with the character at each index the lower and upper form of
     * the same letter; a caseless script assigns them identically (or leaves
     * `alphabetUpper` empty). `undefined` means the module default alphabet.
     */
    export let alphabetLower: string = undefined
    export let alphabetUpper: string = undefined

    /**
     * Additional accented letter pairs accepted as text-entry input. Same
     * pairing contract as `alphabet*`: equal length, positionally paired
     * lower/upper forms. Accepted by the input filter and mapped by case
     * normalization. `undefined` means no accented input beyond the base
     * alphabet.
     */
    export let accentsLower: string = undefined
    export let accentsUpper: string = undefined

    /**
     * On-screen keyboard symbol-page characters. String order defines the symbol
     * key order. `undefined` means the module default symbols.
     */
    export let symbols: string = undefined
}

namespace ui {
    const TEXT_ENTRY_LOWERCASE = "abcdefghijklmnopqrstuvwxyz"
    const TEXT_ENTRY_UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const TEXT_ENTRY_SYMBOLS = "-_.,!?@#"
    const UI_TEXT_ENTRY_MODAL_DISPLAY_HEIGHT = 18
    const UI_TEXT_ENTRY_MODAL_TITLE_HEIGHT = 10
    const UI_TEXT_ENTRY_MODAL_DISPLAY_GAP = 3
    const UI_TEXT_ENTRY_MODAL_TITLE_GAP = 1
    const UI_TEXT_ENTRY_MODAL_KEY_WIDTH = 10
    const UI_TEXT_ENTRY_MODAL_ACTION_KEY_WIDTH = 18
    const UI_TEXT_ENTRY_MODAL_SPACE_KEY_WIDTH = 36
    const UI_TEXT_ENTRY_MODAL_KEY_HEIGHT = 12
    const UI_TEXT_ENTRY_MODAL_KEY_GAP = 1
    const UI_TEXT_ENTRY_KEY_SHIFT = "\u0001"
    const UI_TEXT_ENTRY_KEY_BACKSPACE = "\u0002"
    const UI_TEXT_ENTRY_KEY_ENTER = "\u0003"
    const UI_TEXT_ENTRY_KEY_PAGE_LETTERS = "\u0004"
    const UI_TEXT_ENTRY_KEY_PAGE_DIGITS = "\u0005"
    const UI_TEXT_ENTRY_KEY_PAGE_SYMBOLS = "\u0006"
    const UI_TEXT_ENTRY_KEY_SPACE = "\u0007"
    const UI_TEXT_ENTRY_KEY_CUSTOM = "\u0008"
    const UI_TEXT_ENTRY_KEY_SPACER = "\u0009"
    // Vertical tab, chosen to stay clear of any newline handling.
    const UI_TEXT_ENTRY_KEY_PAGE_ACCENTS = "\u000B"
    const UI_TEXT_ENTRY_DIGIT_KEYS = "1234567890"
    // Keyboard grid geometry limits. A row shows at most 13 keys and the letter
    // pages use at most 3 letter rows plus one action row. Alphabet characters
    // beyond `UI_TEXT_ENTRY_MAX_LETTER_ROWS * UI_TEXT_ENTRY_MAX_ROW_KEYS` are
    // still accepted by the input filter but are not rendered as keys.
    const UI_TEXT_ENTRY_MAX_ROW_KEYS = 13
    const UI_TEXT_ENTRY_MAX_LETTER_ROWS = 3
    // Slots reserved in the trailing action row: shift/page-left, page-toggle,
    // space, custom, backspace, enter.
    const UI_TEXT_ENTRY_ACTION_ROW_SLOTS = 6
    const UI_TEXT_ENTRY_ACTION_SHIFT = 0
    const UI_TEXT_ENTRY_ACTION_PAGE = 1
    const UI_TEXT_ENTRY_ACTION_SPACE = 2
    const UI_TEXT_ENTRY_ACTION_CUSTOM = 3
    const UI_TEXT_ENTRY_ACTION_BACKSPACE = 4
    const UI_TEXT_ENTRY_ACTION_ENTER = 5
    const UI_TEXT_ENTRY_FLAG_ALLOW_EMPTY = 1
    const UI_TEXT_ENTRY_FLAG_ALLOW_WHITESPACE = 2
    const UI_TEXT_ENTRY_FLAG_ALLOW_DIGITS = 4
    const UI_TEXT_ENTRY_FLAG_ALLOW_SYMBOLS = 8
    const UI_TEXT_ENTRY_FLAG_UPPERCASE_ONLY = 16
    const UI_TEXT_ENTRY_FLAG_CANCEL_ENABLED = 32
    const UI_TEXT_ENTRY_FLAG_UPPERCASE = 64
    const UI_TEXT_ENTRY_PAGE_LETTERS = 0
    const UI_TEXT_ENTRY_PAGE_DIGITS = 1
    const UI_TEXT_ENTRY_PAGE_SYMBOLS = 2
    const UI_TEXT_ENTRY_PAGE_ACCENTS = 3
    // These key styles intentionally omit `font`: the render path resolves the
    // default font at use time via `ui.locFont()`. Setting it here would capture
    // `bitmaps.font8` at module-init time, before the app assigns a per-language
    // font, and would never pick up a localized default.
    const UI_TEXT_ENTRY_MODAL_ENTER_STYLE: UiButtonStyle = {
        backgroundColor: 1,
        borderColor: 7,
        frame: "roundedRect",
        textPlacement: "content",
    }
    const UI_TEXT_ENTRY_MODAL_CUSTOM_STYLE: UiButtonStyle = {
        backgroundColor: 1,
        borderColor: 10,
        frame: "roundedRect",
        textPlacement: "content",
    }

    /**
     * Per-field keyboard character-set override for text entry. Each present
     * field replaces the corresponding `_loc` charset field (or the module
     * default) for this entry only. `lower`/`upper` and
     * `accentsLower`/`accentsUpper` are case-parallel: equal length, with the
     * character at each index the lower and upper form of the same letter. The
     * string order defines keyboard key order. An empty or absent `upper` marks
     * a caseless keyboard.
     */
    export interface UiTextEntryCharset {
        lower?: string
        upper?: string
        accentsLower?: string
        accentsUpper?: string
        symbols?: string
    }

    /**
     * Resolved keyboard character set. Every field is a concrete string. An
     * empty `upper` (or `upper` equal to `lower`) marks a caseless keyboard;
     * empty `accents*` or `symbols` mark none.
     */
    class ResolvedTextEntryCharset {
        public lower: string
        public upper: string
        public accentsLower: string
        public accentsUpper: string
        public symbols: string
    }

    function pickCharsetField(
        override: string,
        locValue: string,
        fallback: string,
    ): string {
        if (override !== undefined) return override
        if (locValue !== undefined) return locValue
        return fallback
    }

    /**
     * Resolves the effective keyboard charset. Each field independently prefers
     * the per-modal option override, then the matching `_loc` charset field,
     * then the module ASCII default. `_loc` is read here at construction time,
     * never at module init, so an app that assigns its generated charset before
     * a keyboard is constructed is honored.
     */
    function resolveTextEntryCharset(
        override: UiTextEntryCharset,
    ): ResolvedTextEntryCharset {
        const result = new ResolvedTextEntryCharset()
        const o = override || {}
        result.lower = pickCharsetField(
            o.lower,
            _loc.alphabetLower,
            TEXT_ENTRY_LOWERCASE,
        )
        result.upper = pickCharsetField(
            o.upper,
            _loc.alphabetUpper,
            TEXT_ENTRY_UPPERCASE,
        )
        result.accentsLower = pickCharsetField(
            o.accentsLower,
            _loc.accentsLower,
            "",
        )
        result.accentsUpper = pickCharsetField(
            o.accentsUpper,
            _loc.accentsUpper,
            "",
        )
        result.symbols = pickCharsetField(o.symbols, _loc.symbols, TEXT_ENTRY_SYMBOLS)
        // Defensive normalization: per-modal overrides and `_loc` assignments
        // are not build-validated, so guard the pairing contract here. An empty
        // alphabet falls back to the default; a case pair whose halves differ in
        // length is treated as caseless rather than casing only some letters.
        if (result.lower.length == 0) {
            result.lower = TEXT_ENTRY_LOWERCASE
            result.upper = TEXT_ENTRY_UPPERCASE
        }
        if (result.upper.length != result.lower.length)
            result.upper = result.lower
        if (result.accentsUpper.length != result.accentsLower.length)
            result.accentsUpper = result.accentsLower
        return result
    }

    /**
     * Distributes `count` items across exactly `rows` rows as evenly as
     * possible. When the count does not divide evenly, the longer rows are the
     * last ones (10 across 3 rows is 3, 3, 4), which reads better than a heavy
     * top row. distributeEvenly(26, 2) yields the two full rows of 13 used by
     * the ASCII default.
     */
    function distributeEvenly(count: number, rows: number): number[] {
        const base = Math.idiv(count, rows)
        const remainder = count - base * rows
        const lengths: number[] = []
        for (let i = 0; i < rows; i++)
            lengths.push(base + (i >= rows - remainder ? 1 : 0))
        return lengths
    }

    /**
     * Splits `count` letters across keyboard rows. Rows hold at most
     * `UI_TEXT_ENTRY_MAX_ROW_KEYS` keys and there are at most
     * `UI_TEXT_ENTRY_MAX_LETTER_ROWS` letter rows, so at most 39 letters render;
     * any beyond that are filter-accepted but not shown. Letters fill in string
     * order and are distributed as evenly as possible, the last rows taking any
     * remainder. A 26-letter alphabet yields the two full rows of 13 used by the
     * ASCII default.
     */
    function splitLetterRows(count: number): number[] {
        const maxShown = UI_TEXT_ENTRY_MAX_LETTER_ROWS * UI_TEXT_ENTRY_MAX_ROW_KEYS
        let shown = count
        if (shown > maxShown) shown = maxShown
        if (shown < 1) shown = 1
        let rows = Math.idiv(
            shown + UI_TEXT_ENTRY_MAX_ROW_KEYS - 1,
            UI_TEXT_ENTRY_MAX_ROW_KEYS,
        )
        if (rows < 1) rows = 1
        return distributeEvenly(shown, rows)
    }

    /**
     * Validation result for entry edits.
     */
    export type UiEntryValidationResult = "accepted" | "rejected" | "completed"

    /**
     * Edit action offered to a text entry validator.
     */
    export type UiTextEntryEditAction =
        | "character"
        | "backspace"
        | "custom"
        | "enter"
        | "back"

    /**
     * Optional validator for text entry.
     */
    export type UiTextEntryValidator = (
        candidateText: string,
        action: UiTextEntryEditAction,
    ) => UiEntryValidationResult

    /**
     * Handles a text entry custom action.
     */
    export type UiTextEntryCustomActionHandler = (text: string) => string

    /**
     * Result emitted by text entry.
     */
    export type UiTextEntryResult =
        | { kind: "completed"; text: string }
        | { kind: "cancelled"; text: string }
        | { kind: "custom"; text: string }

    /**
     * Options for a modal text keyboard backed by `UiTextEntry`.
     */
    export interface UiTextEntryModalOptions extends UiModalStyle {
        /**
         * Modal focus scope owned while the keyboard is open.
         */
        modalScopeId: UiFocusScopeId

        /**
         * Initial editable text. Defaults to the empty string.
         */
        initialText?: string

        /**
         * Maximum editable text length. Defaults to `16`.
         */
        maxLength?: number

        /**
         * Minimum completed text length after trimming. Defaults to `0`.
         */
        minLength?: number

        /**
         * Whether completion accepts empty trimmed text.
         */
        allowEmpty?: boolean

        /**
         * Whether space characters are accepted.
         */
        allowWhitespace?: boolean

        /**
         * Whether digit characters are accepted. Defaults to `true`.
         */
        allowDigits?: boolean

        /**
         * Whether built-in symbol characters are accepted.
         */
        allowSymbols?: boolean

        /**
         * Whether letters are normalized to uppercase.
         */
        uppercaseOnly?: boolean

        /**
         * Optional edit validator.
         */
        validate?: UiTextEntryValidator

        /**
         * Optional per-field keyboard charset override. Unset fields fall back
         * to the matching `_loc` charset field, then the module default.
         */
        charset?: UiTextEntryCharset

        /**
         * Optional title content.
         */
        title?: UiControlContentOptions | string

        /**
         * Style applied to keyboard buttons.
         */
        keyStyle?: UiButtonStyle

        /**
         * Optional custom action key content.
         */
        customAction?: UiControlContentOptions | string

        /**
         * Optional in-modal custom action handler.
         */
        onCustomAction?: UiTextEntryCustomActionHandler

        /**
         * Receives text entry modal results.
         */
        onResult?: (result: UiTextEntryResult) => void
    }

    /**
     * Short text entry state with typed completion results.
     */
    export class UiTextEntry {
        private text_: string
        private maxLength_: number
        private minLength_: number
        private flags_: number
        private validate_: UiTextEntryValidator
        private charset_: ResolvedTextEntryCharset

        constructor(
            initialText?: string,
            maxLength?: number,
            minLength?: number,
            allowEmpty?: boolean,
            allowWhitespace?: boolean,
            allowDigits?: boolean,
            allowSymbols?: boolean,
            uppercaseOnly?: boolean,
            cancelEnabled?: boolean,
            validate?: UiTextEntryValidator,
            charset?: UiTextEntryCharset,
        ) {
            this.charset_ = resolveTextEntryCharset(charset)
            this.flags_ = 0
            if (allowEmpty) this.flags_ |= UI_TEXT_ENTRY_FLAG_ALLOW_EMPTY
            if (allowWhitespace)
                this.flags_ |= UI_TEXT_ENTRY_FLAG_ALLOW_WHITESPACE
            if (allowDigits !== false)
                this.flags_ |= UI_TEXT_ENTRY_FLAG_ALLOW_DIGITS
            if (allowSymbols) this.flags_ |= UI_TEXT_ENTRY_FLAG_ALLOW_SYMBOLS
            if (uppercaseOnly) this.flags_ |= UI_TEXT_ENTRY_FLAG_UPPERCASE_ONLY
            if (cancelEnabled) this.flags_ |= UI_TEXT_ENTRY_FLAG_CANCEL_ENABLED
            this.maxLength_ = _uiControls.sanitizeDimension(maxLength, 16)
            if (this.maxLength_ == 0) this.maxLength_ = 16
            this.minLength_ = _uiControls.sanitizeDimension(minLength, 0)
            this.validate_ = validate
            this.text_ = this.normalizedEditableText(initialText || "")
        }

        /**
         * Current editable text.
         */
        public get text(): string {
            return this.text_
        }

        /**
         * Maximum editable text length.
         */
        public get maxLength(): number {
            return this.maxLength_
        }

        /**
         * Minimum completed text length after trimming.
         */
        public get minLength(): number {
            return this.minLength_
        }

        /**
         * Attempts to append one character.
         */
        public inputCharacter(ch: string): UiTextEntryResult {
            if (!ch || ch.length == 0) return undefined
            return this.applyText(this.text_ + ch.charAt(0), "character")
        }

        /**
         * Attempts to replace the editable text.
         */
        public replaceText(text: string): UiTextEntryResult {
            return this.applyText(text || "", "custom")
        }

        /**
         * Removes the last character when one exists.
         */
        public backspace(): UiTextEntryResult {
            if (this.text_.length == 0) return undefined
            return this.applyText(
                this.text_.substr(0, this.text_.length - 1),
                "backspace",
            )
        }

        /**
         * Completes the current text.
         */
        public enter(): UiTextEntryResult {
            return this.complete("enter")
        }

        /**
         * Completes the current text using the default back behavior.
         */
        public back(): UiTextEntryResult {
            return this.complete("back")
        }

        /**
         * Emits a custom result after validation.
         */
        public custom(): UiTextEntryResult {
            const text = this.trimmedText(this.text_)
            const validation = this.validate_
                ? this.validate_(text, "custom")
                : "accepted"
            if (validation == "rejected") return undefined
            if (validation == "completed") return this.complete("custom")
            return { kind: "custom", text }
        }

        /**
         * Emits a non-committing cancellation when enabled.
         */
        public cancel(): UiTextEntryResult {
            if (!(this.flags_ & UI_TEXT_ENTRY_FLAG_CANCEL_ENABLED))
                return undefined
            return { kind: "cancelled", text: this.trimmedText(this.text_) }
        }

        /**
         * Renders the current entry text.
         */
        public render(surface: DrawSurface, rect: Rect): void {
            _uiEntryModal.renderEntryText(
                surface,
                rect,
                this.text_,
                locFont(),
            )
        }

        private applyText(
            candidate: string,
            action: UiTextEntryEditAction,
        ): UiTextEntryResult {
            candidate = this.normalizedEditableText(candidate)
            const validation = this.validate_
                ? this.validate_(candidate, action)
                : "accepted"
            if (validation == "rejected") return undefined
            this.text_ = candidate
            if (validation == "completed") return this.complete(action)
            return undefined
        }

        private complete(action: UiTextEntryEditAction): UiTextEntryResult {
            const text = this.trimmedText(this.text_)
            if (!this.canComplete(text)) return undefined
            const validation = this.validate_
                ? this.validate_(text, action)
                : "accepted"
            if (validation == "rejected") return undefined
            this.text_ = text
            return { kind: "completed", text }
        }

        private normalizedEditableText(text: string): string {
            let result = ""
            for (let i = 0; i < text.length; i++) {
                const ch = this.normalizedCharacter(text.charAt(i))
                if (ch.length == 0) continue
                if (result.length >= this.maxLength_) break
                result += ch
            }
            return result
        }

        private normalizedCharacter(ch: string): string {
            const cs = this.charset_
            const lowerIndex = cs.lower.indexOf(ch)
            if (lowerIndex >= 0) {
                if (
                    this.flags_ & UI_TEXT_ENTRY_FLAG_UPPERCASE_ONLY &&
                    cs.upper.length > lowerIndex
                )
                    return cs.upper.charAt(lowerIndex)
                return ch
            }
            if (cs.upper.indexOf(ch) >= 0) return ch
            const accentIndex = cs.accentsLower.indexOf(ch)
            if (accentIndex >= 0) {
                if (
                    this.flags_ & UI_TEXT_ENTRY_FLAG_UPPERCASE_ONLY &&
                    cs.accentsUpper.length > accentIndex
                )
                    return cs.accentsUpper.charAt(accentIndex)
                return ch
            }
            if (cs.accentsUpper.indexOf(ch) >= 0) return ch
            if (ch >= "0" && ch <= "9")
                return this.flags_ & UI_TEXT_ENTRY_FLAG_ALLOW_DIGITS ? ch : ""
            if (ch == " ")
                return this.flags_ & UI_TEXT_ENTRY_FLAG_ALLOW_WHITESPACE
                    ? ch
                    : ""
            if (
                this.flags_ & UI_TEXT_ENTRY_FLAG_ALLOW_SYMBOLS &&
                this.isSymbol(ch)
            )
                return ch
            return ""
        }

        private isSymbol(ch: string): boolean {
            return this.charset_.symbols.indexOf(ch) >= 0
        }

        private canComplete(text: string): boolean {
            if (
                !(this.flags_ & UI_TEXT_ENTRY_FLAG_ALLOW_EMPTY) &&
                text.length == 0
            )
                return false
            return text.length >= this.minLength_
        }

        private trimmedText(text: string): string {
            let start = 0
            let end = text.length
            while (start < end && text.charAt(start) == " ") start++
            while (end > start && text.charAt(end - 1) == " ") end--
            return text.substr(start, end - start)
        }
    }

    /**
     * Modal text keyboard for short text entry.
     */
    export class UiTextEntryModal
        implements UiModal<UiTextEntryResult>, UiFocusNavigationProvider
    {
        public readonly layoutSpec: UiLayoutSpec
        public readonly finalRect: Rect
        public layoutDirty: boolean
        private modalScopeId_: UiFocusScopeId
        private entry_: UiTextEntry
        private title_: UiControlContentOptions | string
        private customAction_: UiControlContentOptions | string
        private onCustomAction_: UiTextEntryCustomActionHandler
        private keyStyle_: UiButtonStyle
        private titleStyle_: UiButtonStyle
        private keyView_: UiButtonView
        private keyContent_: UiControlContent
        private keyValues_: string[]
        private keyXs_: number[]
        private keyRect_: Rect
        private displayRect_: Rect
        private titleRect_: Rect
        private gridRect_: Rect
        private backgroundColor_: number
        private contentMargin_: number
        private titleGap_: number
        private page_: number
        private flags_: number
        private charset_: ResolvedTextEntryCharset
        private hasCase_: boolean
        private rowLengths_: number[]
        private rowStarts_: number[]
        private numRows_: number
        private slotCount_: number
        private shownLetters_: number
        private onResult_: (result: UiTextEntryResult) => void

        constructor(options: UiTextEntryModalOptions) {
            this.modalScopeId_ = options.modalScopeId
            this.charset_ = resolveTextEntryCharset(options.charset)
            this.hasCase_ =
                this.charset_.upper.length > 0 &&
                this.charset_.upper != this.charset_.lower
            this.buildRowStructure()
            this.entry_ = this.createEntry(options)
            this.title_ = options.title
            this.customAction_ = options.customAction
            this.onCustomAction_ = options.onCustomAction
            this.flags_ = 0
            if (options.allowDigits !== false)
                this.flags_ |= UI_TEXT_ENTRY_FLAG_ALLOW_DIGITS
            if (options.allowSymbols)
                this.flags_ |= UI_TEXT_ENTRY_FLAG_ALLOW_SYMBOLS
            if (options.allowWhitespace)
                this.flags_ |= UI_TEXT_ENTRY_FLAG_ALLOW_WHITESPACE
            if (options.uppercaseOnly)
                this.flags_ |= UI_TEXT_ENTRY_FLAG_UPPERCASE_ONLY
            this.backgroundColor_ =
                options.backgroundColor === undefined
                    ? 12
                    : options.backgroundColor
            this.contentMargin_ = _uiEntryModal.contentMargin(
                options.contentMargin,
            )
            this.titleGap_ = this.titleGap(options.titleGap)
            this.keyStyle_ =
                options.keyStyle ||
                buttonStyle(UiButtonStyles.LightShadowedWhite, {
                    textPlacement: "content",
                })
            if (this.title_ !== undefined)
                this.titleStyle_ = {
                    color: options.color === undefined ? 1 : options.color,
                    textPlacement: "content",
                }
            this.keyView_ = new UiButtonView(this.keyStyle_)
            this.keyContent_ = {}
            this.keyValues_ = []
            this.keyXs_ = []
            for (let i = 0; i < this.slotCount_; i++) {
                this.keyValues_.push(UI_TEXT_ENTRY_KEY_SPACER)
                this.keyXs_.push(0)
            }
            this.keyRect_ = new Rect()
            this.displayRect_ = new Rect()
            this.titleRect_ = new Rect()
            this.gridRect_ = new Rect()
            this.page_ = UI_TEXT_ENTRY_PAGE_LETTERS
            this.onResult_ = options.onResult
            this.layoutSpec = {
                width: { mode: "content" },
                height: { mode: "content" },
            }
            this.finalRect = new Rect()
            this.layoutDirty = true
            this.rebuildKeys()
        }

        /**
         * Modal focus scope id used by this keyboard.
         */
        public get modalScopeId(): UiFocusScopeId {
            return this.modalScopeId_
        }

        /**
         * Measures the display and keyboard under parent constraints.
         */
        public measure(
            constraints: UiLayoutConstraints,
            output: UiMeasuredSize,
        ): void {
            const width = Math.min(constraints.maxWidth || 160, 160)
            let height =
                this.contentMargin_ * 2 +
                UI_TEXT_ENTRY_MODAL_DISPLAY_HEIGHT +
                UI_TEXT_ENTRY_MODAL_DISPLAY_GAP +
                this.gridHeight()
            if (this.hasTitle())
                height += UI_TEXT_ENTRY_MODAL_TITLE_HEIGHT + this.titleGap_
            output.set(width, height, width, height)
            this.clearLayoutInvalidation()
        }

        /**
         * Arranges the modal panel, title, display, and keyboard grid.
         */
        public arrange(rect: Rect): void {
            this.finalRect.copyFrom(rect)
            let y = rect.y + this.contentMargin_
            const contentWidth = Math.max(
                0,
                rect.width - this.contentMargin_ * 2,
            )
            if (this.hasTitle()) {
                this.titleRect_.set(
                    rect.x + this.contentMargin_,
                    y,
                    contentWidth,
                    UI_TEXT_ENTRY_MODAL_TITLE_HEIGHT,
                )
                y += UI_TEXT_ENTRY_MODAL_TITLE_HEIGHT + this.titleGap_
            } else {
                this.titleRect_.set(0, 0, 0, 0)
            }
            this.displayRect_.set(
                rect.x + this.contentMargin_,
                y,
                contentWidth,
                UI_TEXT_ENTRY_MODAL_DISPLAY_HEIGHT,
            )
            y +=
                UI_TEXT_ENTRY_MODAL_DISPLAY_HEIGHT +
                UI_TEXT_ENTRY_MODAL_DISPLAY_GAP
            this.gridRect_.set(
                rect.x + this.contentMargin_,
                y,
                contentWidth,
                this.gridHeight(),
            )
            this.arrangeKeys()
            this.clearLayoutInvalidation()
        }

        /**
         * Marks the modal as needing layout.
         */
        public invalidateLayout(): void {
            this.layoutDirty = true
        }

        /**
         * Clears pending layout invalidation.
         */
        public clearLayoutInvalidation(): void {
            this.layoutDirty = false
        }

        /**
         * Resolves resolver-backed content ids for title and custom action content.
         */
        public _resolveContentAssets(assets: UiAssetResolver): void {
            if (this.title_ !== undefined && typeof this.title_ != "string")
                _uiControls.resolveContentOptions(this.title_, assets)
            if (
                this.customAction_ !== undefined &&
                typeof this.customAction_ != "string"
            )
                _uiControls.resolveContentOptions(this.customAction_, assets)
        }

        /**
         * Registers modal focus targets and activates the modal scope.
         */
        public open(
            focus: UiFocusState,
            controller?: UiFocusInputController,
        ): UiFocusSetResult {
            focus.setScope({
                id: this.modalScopeId_,
                parentScopeId: focus.getActiveScopeId(),
                preferredTargetId: _uiEntryModal.targetIdForIndex(
                    this.modalScopeId_,
                    this.firstVisibleKeyIndex(),
                ),
                handlesCancel: true,
                modal: true,
            })
            this.registerTargets(focus)
            if (controller) controller.setNavigation(this.modalScopeId_, this)
            return focus.setActiveScope(this.modalScopeId_)
        }

        /**
         * Restores focus to the parent modal scope.
         */
        public close(focus: UiFocusState): UiFocusSetResult {
            return focus.closeModalScope(this.modalScopeId_)
        }

        /**
         * Converts focus input into a text entry result.
         */
        public handleFocusInput(result: UiFocusInputResult): UiTextEntryResult {
            let entryResult: UiTextEntryResult = undefined
            if (result.kind == "activated") {
                const key = this.keyValueForTargetId(result.targetId)
                if (key.length && result.scopeId == this.modalScopeId_)
                    entryResult = this.applyKey(key)
            } else if (result.kind == "cancelled") {
                entryResult = this.entry_.cancel()
            }

            if (entryResult && this.onResult_) this.onResult_(entryResult)
            return entryResult
        }

        public move(request: UiFocusNavigationRequest): UiFocusMoveResult {
            const currentIndex = this.keyIndexForTargetId(
                request.currentTargetId,
            )
            if (currentIndex < 0)
                return {
                    kind: "stayed",
                    scopeId: this.modalScopeId_,
                    targetId: request.currentTargetId,
                    reason: "missingActive",
                }

            let destinationIndex = -1
            if (request.direction == "left" || request.direction == "right") {
                destinationIndex = this.horizontalDestinationIndex(
                    currentIndex,
                    request.direction,
                )
            } else {
                destinationIndex = this.verticalDestinationIndex(
                    currentIndex,
                    request.direction,
                )
            }

            if (destinationIndex >= 0)
                return {
                    kind: "moved",
                    fromScopeId: this.modalScopeId_,
                    fromTargetId: request.currentTargetId,
                    toScopeId: this.modalScopeId_,
                    toTargetId: _uiEntryModal.targetIdForIndex(
                        this.modalScopeId_,
                        destinationIndex,
                    ),
                }

            return {
                kind: "stayed",
                scopeId: this.modalScopeId_,
                targetId: request.currentTargetId,
                reason: "boundary",
            }
        }

        /**
         * Renders the modal panel, title, display, and keyboard.
         */
        public render(
            surface: DrawSurface,
            assets: UiAssetResolver,
            focus?: UiFocusState,
        ): void {
            surface.drawRoundedRect(this.finalRect, 15, this.backgroundColor_)
            this.renderTitle(surface)
            this.entry_.render(surface, this.displayRect_)
            this.renderKeys(surface)
            this.renderFocus(surface, focus)
        }

        private createEntry(options: UiTextEntryModalOptions): UiTextEntry {
            return new UiTextEntry(
                options.initialText,
                options.maxLength,
                options.minLength,
                options.allowEmpty,
                options.allowWhitespace,
                options.allowDigits,
                options.allowSymbols,
                options.uppercaseOnly,
                true,
                options.validate,
                this.charset_,
            )
        }

        private buildRowStructure(): void {
            const letterRows = splitLetterRows(this.charset_.lower.length)
            this.rowLengths_ = []
            this.shownLetters_ = 0
            for (let i = 0; i < letterRows.length; i++) {
                this.rowLengths_.push(letterRows[i])
                this.shownLetters_ += letterRows[i]
            }
            this.rowLengths_.push(UI_TEXT_ENTRY_ACTION_ROW_SLOTS)
            this.numRows_ = this.rowLengths_.length
            this.rowStarts_ = []
            let start = 0
            for (let i = 0; i < this.numRows_; i++) {
                this.rowStarts_.push(start)
                start += this.rowLengths_[i]
            }
            this.slotCount_ = start
        }

        private actionBase(): number {
            return this.rowStarts_[this.numRows_ - 1]
        }

        private rebuildKeys(): void {
            for (let i = 0; i < this.keyValues_.length; i++)
                this.keyValues_[i] = UI_TEXT_ENTRY_KEY_SPACER
            if (this.page_ == UI_TEXT_ENTRY_PAGE_LETTERS) this.addLetterKeys()
            else if (this.page_ == UI_TEXT_ENTRY_PAGE_ACCENTS)
                this.addAccentKeys()
            else if (this.page_ == UI_TEXT_ENTRY_PAGE_DIGITS)
                this.addDigitKeys()
            else this.addSymbolKeys()
        }

        // Ordered list of non-letter pages available for the current flags and
        // charset: accents (only when the resolved charset carries an accent
        // set), then digits, then symbols. Drives both the letters-page page key
        // and the cycle between extra pages.
        private extraPages(): number[] {
            const pages: number[] = []
            if (this.charset_.accentsLower.length > 0)
                pages.push(UI_TEXT_ENTRY_PAGE_ACCENTS)
            if (this.flags_ & UI_TEXT_ENTRY_FLAG_ALLOW_DIGITS)
                pages.push(UI_TEXT_ENTRY_PAGE_DIGITS)
            if (this.flags_ & UI_TEXT_ENTRY_FLAG_ALLOW_SYMBOLS)
                pages.push(UI_TEXT_ENTRY_PAGE_SYMBOLS)
            return pages
        }

        private pageKeyFor(page: number): string {
            if (page == UI_TEXT_ENTRY_PAGE_ACCENTS)
                return UI_TEXT_ENTRY_KEY_PAGE_ACCENTS
            if (page == UI_TEXT_ENTRY_PAGE_DIGITS)
                return UI_TEXT_ENTRY_KEY_PAGE_DIGITS
            if (page == UI_TEXT_ENTRY_PAGE_SYMBOLS)
                return UI_TEXT_ENTRY_KEY_PAGE_SYMBOLS
            return UI_TEXT_ENTRY_KEY_PAGE_LETTERS
        }

        private addLetterKeys(): void {
            for (let i = 0; i < this.shownLetters_; i++)
                this.keyValues_[i] = this.charset_.lower.charAt(i)
            const base = this.actionBase()
            if (
                !(this.flags_ & UI_TEXT_ENTRY_FLAG_UPPERCASE_ONLY) &&
                this.hasCase_
            )
                this.keyValues_[base + UI_TEXT_ENTRY_ACTION_SHIFT] =
                    UI_TEXT_ENTRY_KEY_SHIFT
            const extras = this.extraPages()
            if (extras.length > 0)
                this.keyValues_[base + UI_TEXT_ENTRY_ACTION_PAGE] =
                    this.pageKeyFor(extras[0])
            this.addActionKeys()
        }

        // Places a page's characters across the content rows (every row but the
        // trailing action row), distributed as evenly as possible and left in
        // string order. Unlike the letter pages, digit and symbol pages hold
        // fewer keys than the grid has content slots, so spreading them keeps
        // each row balanced rather than packing the first rows full. Remaining
        // slots stay spacers, which the row layout centers around.
        private placeContentKeys(source: string): void {
            const contentRows = this.numRows_ - 1
            let shown = source.length
            if (shown > this.actionBase()) shown = this.actionBase()
            const shares = distributeEvenly(shown, contentRows)
            let srcIndex = 0
            for (let row = 0; row < contentRows; row++) {
                let share = shares[row]
                if (share > this.rowLengths_[row]) share = this.rowLengths_[row]
                const start = this.rowStarts_[row]
                for (let i = 0; i < share; i++) {
                    this.keyValues_[start + i] = source.charAt(srcIndex)
                    srcIndex++
                }
            }
        }

        private addAccentKeys(): void {
            this.placeContentKeys(this.charset_.accentsLower)
            this.setupExtraPageActionRow(UI_TEXT_ENTRY_PAGE_ACCENTS)
        }

        private addDigitKeys(): void {
            this.placeContentKeys(UI_TEXT_ENTRY_DIGIT_KEYS)
            this.setupExtraPageActionRow(UI_TEXT_ENTRY_PAGE_DIGITS)
        }

        private addSymbolKeys(): void {
            this.placeContentKeys(this.charset_.symbols)
            this.setupExtraPageActionRow(UI_TEXT_ENTRY_PAGE_SYMBOLS)
        }

        // Action row shared by every non-letter page. The shift slot always
        // returns to the letter page; the page slot advances to the next extra
        // page, cycling among the present extras and collapsing to the letter
        // page when only one extra exists.
        private setupExtraPageActionRow(page: number): void {
            const base = this.actionBase()
            this.keyValues_[base + UI_TEXT_ENTRY_ACTION_SHIFT] =
                UI_TEXT_ENTRY_KEY_PAGE_LETTERS
            const extras = this.extraPages()
            let target = UI_TEXT_ENTRY_PAGE_LETTERS
            if (extras.length > 1) {
                const i = extras.indexOf(page)
                target = extras[(i + 1) % extras.length]
            }
            this.keyValues_[base + UI_TEXT_ENTRY_ACTION_PAGE] =
                this.pageKeyFor(target)
            this.addActionKeys()
        }

        private addActionKeys(): void {
            const base = this.actionBase()
            if (this.flags_ & UI_TEXT_ENTRY_FLAG_ALLOW_WHITESPACE)
                this.keyValues_[base + UI_TEXT_ENTRY_ACTION_SPACE] =
                    UI_TEXT_ENTRY_KEY_SPACE
            if (this.customAction_)
                this.keyValues_[base + UI_TEXT_ENTRY_ACTION_CUSTOM] =
                    UI_TEXT_ENTRY_KEY_CUSTOM
            this.keyValues_[base + UI_TEXT_ENTRY_ACTION_BACKSPACE] =
                UI_TEXT_ENTRY_KEY_BACKSPACE
            this.keyValues_[base + UI_TEXT_ENTRY_ACTION_ENTER] =
                UI_TEXT_ENTRY_KEY_ENTER
        }

        private arrangeKeys(): void {
            for (let row = 0; row < this.numRows_; row++) {
                const start = this.rowStart(row)
                const length = this.rowLength(row)
                let x = this.rowX(row)
                let visibleCount = 0
                for (let i = 0; i < length; i++) {
                    const index = start + i
                    const key = this.keyValues_[index]
                    const width = this.keyWidth(key)
                    if (key != UI_TEXT_ENTRY_KEY_SPACER) {
                        if (visibleCount > 0) x += UI_TEXT_ENTRY_MODAL_KEY_GAP
                        this.keyXs_[index] = x
                        x += width
                        visibleCount++
                    } else {
                        this.keyXs_[index] = x
                    }
                }
            }
        }

        private registerTargets(focus: UiFocusState): void {
            for (let i = 0; i < this.keyValues_.length; i++) {
                this.setKeyRect(i)
                focus.setTarget({
                    id: _uiEntryModal.targetIdForIndex(this.modalScopeId_, i),
                    scopeId: this.modalScopeId_,
                    rect: this.keyRect_,
                    hidden: this.keyValues_[i] == UI_TEXT_ENTRY_KEY_SPACER,
                    activatable: true,
                })
            }
        }

        private renderTitle(surface: DrawSurface): void {
            if (!this.hasTitle()) return
            this.prepareContent(this.title_)
            this.keyView_.render(
                surface,
                this.titleRect_,
                this.keyContent_,
                this.titleStyle_,
            )
        }

        private renderKeys(surface: DrawSurface): void {
            for (let i = 0; i < this.keyValues_.length; i++) {
                const key = this.keyValues_[i]
                if (key == UI_TEXT_ENTRY_KEY_SPACER) continue
                this.setKeyRect(i)
                this.prepareKeyContent(key)
                this.keyView_.render(
                    surface,
                    this.keyRect_,
                    this.keyContent_,
                    this.keyStyleForKey(key),
                )
            }
        }

        private renderFocus(surface: DrawSurface, focus: UiFocusState): void {
            const index = _uiEntryModal.activeIndex(
                focus,
                this.modalScopeId_,
                this.keyValues_.length,
            )
            if (index < 0) return
            const key = this.keyValues_[index]
            if (key == UI_TEXT_ENTRY_KEY_SPACER) return
            this.setKeyRect(index)
            this.prepareKeyContent(key)
            this.keyView_.renderFocus(
                surface,
                this.keyRect_,
                this.keyContent_,
                this.keyStyleForKey(key),
                undefined,
            )
        }

        private applyKey(key: string): UiTextEntryResult {
            if (this.isCharacterKey(key))
                return this.entry_.inputCharacter(this.keyTextForKey(key))
            switch (key) {
                case UI_TEXT_ENTRY_KEY_SHIFT:
                    this.flags_ ^= UI_TEXT_ENTRY_FLAG_UPPERCASE
                    this.rebuildKeys()
                    this.arrangeKeys()
                    return undefined
                case UI_TEXT_ENTRY_KEY_BACKSPACE:
                    return this.entry_.backspace()
                case UI_TEXT_ENTRY_KEY_ENTER:
                    return this.entry_.enter()
                case UI_TEXT_ENTRY_KEY_PAGE_LETTERS:
                    this.setPage(UI_TEXT_ENTRY_PAGE_LETTERS)
                    return undefined
                case UI_TEXT_ENTRY_KEY_PAGE_DIGITS:
                    this.setPage(UI_TEXT_ENTRY_PAGE_DIGITS)
                    return undefined
                case UI_TEXT_ENTRY_KEY_PAGE_SYMBOLS:
                    this.setPage(UI_TEXT_ENTRY_PAGE_SYMBOLS)
                    return undefined
                case UI_TEXT_ENTRY_KEY_PAGE_ACCENTS:
                    this.setPage(UI_TEXT_ENTRY_PAGE_ACCENTS)
                    return undefined
                case UI_TEXT_ENTRY_KEY_SPACE:
                    return this.entry_.inputCharacter(" ")
                case UI_TEXT_ENTRY_KEY_CUSTOM:
                    return this.applyCustomAction()
            }
            return undefined
        }

        private applyCustomAction(): UiTextEntryResult {
            if (this.onCustomAction_) {
                return this.entry_.replaceText(
                    this.onCustomAction_(this.trimmedEntryText()),
                )
            }
            return this.entry_.custom()
        }

        private setPage(page: number): void {
            this.page_ = page
            this.rebuildKeys()
            this.arrangeKeys()
        }

        private prepareKeyContent(key: string): void {
            if (key == UI_TEXT_ENTRY_KEY_CUSTOM) {
                this.prepareContent(this.customAction_)
            } else {
                this.keyContent_.bitmap = undefined
                this.keyContent_.text = this.keyTextForKey(key)
            }
        }

        private prepareContent(source: UiControlContentOptions | string): void {
            _uiControls.resolveContent(source, undefined, this.keyContent_)
        }

        private keyTextForKey(key: string): string {
            if (key == UI_TEXT_ENTRY_KEY_SHIFT)
                return this.flags_ & UI_TEXT_ENTRY_FLAG_UPPERCASE
                    ? loc("abc")
                    : loc("ABC")
            if (key == UI_TEXT_ENTRY_KEY_BACKSPACE) return "<-"
            if (key == UI_TEXT_ENTRY_KEY_ENTER) return loc("OK")
            if (key == UI_TEXT_ENTRY_KEY_PAGE_LETTERS) return loc("ABC")
            if (key == UI_TEXT_ENTRY_KEY_PAGE_DIGITS) return loc("123")
            if (key == UI_TEXT_ENTRY_KEY_PAGE_SYMBOLS) return loc("#+=")
            if (key == UI_TEXT_ENTRY_KEY_PAGE_ACCENTS)
                return this.accentsLabel()
            if (key == UI_TEXT_ENTRY_KEY_SPACE) return loc("space")
            if (
                this.flags_ &
                (UI_TEXT_ENTRY_FLAG_UPPERCASE |
                    UI_TEXT_ENTRY_FLAG_UPPERCASE_ONLY)
            ) {
                const index = this.charset_.lower.indexOf(key)
                if (index >= 0 && this.charset_.upper.length > index)
                    return this.charset_.upper.charAt(index)
                const accentIndex = this.charset_.accentsLower.indexOf(key)
                if (
                    accentIndex >= 0 &&
                    this.charset_.accentsUpper.length > accentIndex
                )
                    return this.charset_.accentsUpper.charAt(accentIndex)
            }
            return key
        }

        // Illustrative caption for the accents page key: the leading one or two
        // accented letters of the resolved set. Not localized -- these are the
        // charset's own glyphs, not a translatable word.
        private accentsLabel(): string {
            const accents = this.charset_.accentsLower
            return accents.length > 2 ? accents.substr(0, 2) : accents
        }

        private keyStyleForKey(key: string): UiButtonStyle {
            if (key == UI_TEXT_ENTRY_KEY_ENTER)
                return UI_TEXT_ENTRY_MODAL_ENTER_STYLE
            if (key == UI_TEXT_ENTRY_KEY_CUSTOM)
                return UI_TEXT_ENTRY_MODAL_CUSTOM_STYLE
            return this.keyStyle_
        }

        private rowForIndex(index: number): number {
            for (let row = this.numRows_ - 1; row >= 0; row--)
                if (index >= this.rowStarts_[row]) return row
            return 0
        }

        private rowStart(row: number): number {
            return this.rowStarts_[row]
        }

        private rowLength(row: number): number {
            return this.rowLengths_[row]
        }

        private keyIndexForTargetId(targetId: UiFocusId): number {
            return _uiEntryModal.indexForTargetId(
                this.modalScopeId_,
                targetId,
                this.keyValues_.length,
            )
        }

        private keyValueForTargetId(targetId: UiFocusId): string {
            const index = this.keyIndexForTargetId(targetId)
            return index < 0 ? "" : this.keyValues_[index]
        }

        private setKeyRect(index: number): void {
            const row = this.rowForIndex(index)
            this.keyRect_.set(
                this.keyXs_[index],
                this.gridRect_.y +
                    row *
                        (UI_TEXT_ENTRY_MODAL_KEY_HEIGHT +
                            UI_TEXT_ENTRY_MODAL_KEY_GAP),
                this.keyWidth(this.keyValues_[index]),
                UI_TEXT_ENTRY_MODAL_KEY_HEIGHT,
            )
        }

        private firstVisibleKeyIndex(): number {
            for (let i = 0; i < this.keyValues_.length; i++) {
                if (this.keyValues_[i] != UI_TEXT_ENTRY_KEY_SPACER) return i
            }
            return 0
        }

        private horizontalDestinationIndex(
            currentIndex: number,
            direction: UiFocusDirection,
        ): number {
            const row = this.rowForIndex(currentIndex)
            const start = this.rowStart(row)
            const length = this.rowLength(row)
            const step = direction == "left" ? -1 : 1
            let column = currentIndex - start + step
            if (column < 0) column = length - 1
            else if (column >= length) column = 0
            while (column != currentIndex - start) {
                const index = start + column
                if (this.keyValues_[index] != UI_TEXT_ENTRY_KEY_SPACER)
                    return index
                column += step
                if (column < 0) column = length - 1
                else if (column >= length) column = 0
            }
            return -1
        }

        private verticalDestinationIndex(
            currentIndex: number,
            direction: UiFocusDirection,
        ): number {
            const currentRow = this.rowForIndex(currentIndex)
            const currentX =
                this.keyXs_[currentIndex] +
                Math.idiv(this.keyWidth(this.keyValues_[currentIndex]), 2)
            const step = direction == "up" ? -1 : 1
            let row = currentRow + step
            while (row >= 0 && row < this.numRows_) {
                const start = this.rowStart(row)
                const length = this.rowLength(row)
                let bestIndex = -1
                let bestDistance = 0
                for (let i = 0; i < length; i++) {
                    const index = start + i
                    if (this.keyValues_[index] == UI_TEXT_ENTRY_KEY_SPACER)
                        continue
                    const distance = Math.abs(
                        this.keyXs_[index] +
                            Math.idiv(
                                this.keyWidth(this.keyValues_[index]),
                                2,
                            ) -
                            currentX,
                    )
                    if (bestIndex < 0 || distance < bestDistance) {
                        bestIndex = index
                        bestDistance = distance
                    }
                }
                if (bestIndex >= 0) return bestIndex
                row += step
            }
            return -1
        }

        private rowX(row: number): number {
            return (
                this.gridRect_.x +
                Math.max(
                    0,
                    Math.idiv(this.gridRect_.width - this.rowWidth(row), 2),
                )
            )
        }

        private rowWidth(row: number): number {
            const start = this.rowStart(row)
            const length = this.rowLength(row)
            let width = 0
            let visibleCount = 0
            for (let i = 0; i < length; i++) {
                const key = this.keyValues_[start + i]
                if (key == UI_TEXT_ENTRY_KEY_SPACER) continue
                width += this.keyWidth(key)
                visibleCount++
            }
            if (visibleCount > 1)
                width += UI_TEXT_ENTRY_MODAL_KEY_GAP * (visibleCount - 1)
            return width
        }

        private isCharacterKey(key: string): boolean {
            return key >= " "
        }

        private keyWidth(key: string): number {
            if (key == UI_TEXT_ENTRY_KEY_SPACE)
                return UI_TEXT_ENTRY_MODAL_SPACE_KEY_WIDTH
            if (key >= " ") return UI_TEXT_ENTRY_MODAL_KEY_WIDTH
            return UI_TEXT_ENTRY_MODAL_ACTION_KEY_WIDTH
        }

        private gridHeight(): number {
            return (
                UI_TEXT_ENTRY_MODAL_KEY_HEIGHT * this.numRows_ +
                UI_TEXT_ENTRY_MODAL_KEY_GAP * (this.numRows_ - 1)
            )
        }

        private hasTitle(): boolean {
            return this.title_ !== undefined
        }

        private trimmedEntryText(): string {
            let text = this.entry_.text
            let start = 0
            let end = text.length
            while (start < end && text.charAt(start) == " ") start++
            while (end > start && text.charAt(end - 1) == " ") end--
            return text.substr(start, end - start)
        }

        private titleGap(value: number): number {
            if (value !== undefined) return Math.max(0, value)
            return UI_TEXT_ENTRY_MODAL_TITLE_GAP
        }
    }
}
