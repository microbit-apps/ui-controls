namespace ui {
    /**
     * Axis along which a stack arranges its children.
     */
    export type UiStackOrientation = "row" | "column"

    /**
     * Distribution of leftover space along a stack's own axis. Applies only when
     * the stack is arranged larger than its content, which needs a parent that
     * assigns a size, such as a placement with `stretch` on that axis.
     */
    export type UiStackJustify = "start" | "center" | "end" | "spaceBetween"

    /**
     * Child view with stack-local placement options.
     */
    export interface UiStackChild {
        /**
         * View arranged and rendered by the stack.
         */
        view: UiView<any>

        /**
         * Cross-axis placement for this child. Omitted values use the stack's
         * alignment.
         */
        alignment?: UiLayoutAlignment

        /**
         * Extra space inserted before this child. Added to the stack gap for
         * non-first children.
         */
        gapBefore?: number

        /**
         * Extra space inserted after this child.
         */
        gapAfter?: number
    }

    /**
     * Options for a stack of views.
     */
    export interface UiStackOptions {
        /**
         * Axis along which children are arranged.
         */
        orientation: UiStackOrientation

        /**
         * Child records in arrangement order.
         */
        children: UiStackChild[]

        /**
         * Space between adjacent children.
         */
        gap?: number

        /**
         * Cross-axis placement of each child. Individual children may override
         * it.
         */
        alignment?: UiLayoutAlignment

        /**
         * Distribution of leftover space along the stack's axis.
         */
        justify?: UiStackJustify

        /**
         * Focus scope owned by this stack. When set, the stack registers its
         * focusable children under this one scope and navigates them together;
         * children keep rendering and arranging themselves. Omit it for a
         * layout-only stack.
         */
        scopeId?: UiFocusScopeId

        /**
         * Whether movement along a row wraps from the last target to the first
         * and back.
         */
        wrap?: boolean

        /**
         * Strategy used when moving between rows of a column stack. Defaults to
         * `"nearest"`, which suits rows of differing widths or alignments.
         */
        verticalStrategy?: UiFocusVerticalStrategy
    }

    /**
     * Arranges and renders child views along one axis.
     *
     * Given a `scopeId`, the stack also owns one focus scope for its children:
     * it registers their targets under that scope and answers directional
     * movement across all of them, so a column of rows navigates as one ragged
     * grid and passive children such as labels are simply skipped.
     */
    export class UiStack
        implements UiComposableFocusView<any>, UiFocusNavigationProvider
    {
        public readonly layoutSpec: UiLayoutSpec
        public readonly finalRect: Rect
        public layoutDirty: boolean
        private orientation_: UiStackOrientation
        private children_: UiStackChild[]
        private gap_: number
        private alignment_: UiLayoutAlignment
        private justify_: UiStackJustify
        private scopeId_: UiFocusScopeId | undefined
        private wrap_: boolean
        private verticalStrategy_: UiFocusVerticalStrategy
        private childRect_: Rect
        private childSize_: UiMeasuredSize
        private childConstraints_: UiLayoutConstraints

        constructor(options: UiStackOptions) {
            this.orientation_ = options.orientation
            this.gap_ = _uiControls.gap(options.gap)
            this.alignment_ = options.alignment || "start"
            this.justify_ = options.justify || "start"
            this.scopeId_ = options.scopeId
            this.wrap_ = !!options.wrap
            this.verticalStrategy_ = options.verticalStrategy || "nearest"
            this.layoutSpec = _uiControls.defaultLayoutSpec()
            this.finalRect = new Rect()
            this.layoutDirty = true
            this.childRect_ = new Rect()
            this.childSize_ = new UiMeasuredSize()
            this.childConstraints_ = { maxWidth: 0, maxHeight: 0 }
            this.children_ = []
            this.setChildren(options.children)
        }

        /**
         * Focus scope owned by this stack, or `undefined` for a layout-only
         * stack.
         */
        public get scopeId(): UiFocusScopeId | undefined {
            return this.scopeId_
        }

        /**
         * Adopts an owner scope and passes it on to the children, so a stack
         * nests inside another stack's scope.
         */
        public setScopeId(scopeId: UiFocusScopeId): void {
            this.scopeId_ = scopeId
            for (let i = 0; i < this.children_.length; i++)
                this.adoptScope(this.children_[i])
        }

        /**
         * Current child records in arrangement order.
         */
        public get children(): UiStackChild[] {
            return this.children_
        }

        /**
         * Replaces the child records and marks layout dirty. Children that can
         * join a focus scope adopt this stack's scope.
         */
        public setChildren(children: UiStackChild[]): void {
            this.children_ = children || []
            for (let i = 0; i < this.children_.length; i++)
                this.adoptScope(this.children_[i])
            this.invalidateLayout()
        }

        /**
         * Measures this stack under parent constraints.
         */
        public measure(
            constraints: UiLayoutConstraints,
            output: UiMeasuredSize,
        ): void {
            const row = this.orientation_ == "row"
            let mainSize = 0
            let crossSize = 0
            for (let i = 0; i < this.children_.length; i++) {
                const child = this.children_[i]
                child.view.measure(constraints, this.childSize_)
                const main = row
                    ? this.childSize_.preferredWidth
                    : this.childSize_.preferredHeight
                const cross = row
                    ? this.childSize_.preferredHeight
                    : this.childSize_.preferredWidth
                mainSize += main + this.gapBefore(i) + this.gapAfter(i)
                if (cross > crossSize) crossSize = cross
            }
            const width = row ? mainSize : crossSize
            const height = row ? crossSize : mainSize
            measureLayoutSpec(
                this.layoutSpec,
                constraints,
                width,
                height,
                width,
                height,
                output,
            )
            this.clearLayoutInvalidation()
        }

        /**
         * Arranges child rectangles within the assigned bounds.
         */
        public arrange(rect: Rect): void {
            copyArrangedLayoutRect(this.finalRect, rect)
            this.childConstraints_.maxWidth = this.finalRect.width
            this.childConstraints_.maxHeight = this.finalRect.height
            const row = this.orientation_ == "row"
            const available = row ? this.finalRect.width : this.finalRect.height
            const content = this.contentMainSize()
            const slack = Math.max(0, available - content)
            let pos = (row ? this.finalRect.x : this.finalRect.y) +
                this.justifyOffset(slack)
            const spacing = this.justifySpacing(slack)
            for (let i = 0; i < this.children_.length; i++) {
                const child = this.children_[i]
                const alignment = child.alignment || this.alignment_
                child.view.measure(this.childConstraints_, this.childSize_)
                const childWidth = this.childSize_.preferredWidth
                const childHeight = this.childSize_.preferredHeight
                pos += this.gapBefore(i) + (i ? spacing : 0)
                if (row) {
                    const h = _uiLayout.alignedSize(
                        this.finalRect.height,
                        childHeight,
                        alignment,
                    )
                    this.childRect_.set(
                        pos,
                        _uiLayout.alignedOffset(
                            this.finalRect.y,
                            this.finalRect.height,
                            h,
                            alignment,
                        ),
                        childWidth,
                        h,
                    )
                    pos += childWidth + this.gapAfter(i)
                } else {
                    const w = _uiLayout.alignedSize(
                        this.finalRect.width,
                        childWidth,
                        alignment,
                    )
                    this.childRect_.set(
                        _uiLayout.alignedOffset(
                            this.finalRect.x,
                            this.finalRect.width,
                            w,
                            alignment,
                        ),
                        pos,
                        w,
                        childHeight,
                    )
                    pos += childHeight + this.gapAfter(i)
                }
                child.view.arrange(this.childRect_)
            }
            this.clearLayoutInvalidation()
        }

        /**
         * Marks the stack as needing layout.
         */
        public invalidateLayout(): void {
            this.layoutDirty = true
        }

        /**
         * Clears this stack's layout invalidation flag.
         */
        public clearLayoutInvalidation(): void {
            this.layoutDirty = false
        }

        /**
         * Registers the scope this stack owns and its children's targets under
         * it. A stack that owns no scope steps aside and lets each child
         * register the scope it came with, so a focusable view placed in a
         * layout-only stack behaves as it would on a screen of its own.
         */
        public registerFocusTargets(
            focus: UiFocusState,
            scopeOptions?: UiFocusScopeOptions,
        ): void {
            if (this.scopeId_ === undefined) {
                for (let i = 0; i < this.children_.length; i++) {
                    const view = <any>this.children_[i].view
                    if (view.registerFocusTargets)
                        view.registerFocusTargets(focus)
                }
                return
            }

            const scope = scopeOptions || {
                id: this.scopeId_,
                preferredTargetId: this.resolvePreferredTargetId(),
            }
            focus.setScope(scope)
            for (let i = 0; i < this.children_.length; i++) {
                const child = this.focusChild(i)
                if (child) child.registerFocusTargets(focus, scope)
            }
        }

        /**
         * Registers this stack as the navigation for the scope it owns, so that
         * movement is answered from current child state on every press. A stack
         * that owns no scope lets each child register its own navigation.
         */
        public registerNavigation(controller: UiFocusInputController): void {
            if (this.scopeId_ === undefined) {
                for (let i = 0; i < this.children_.length; i++) {
                    const view = <any>this.children_[i].view
                    if (view.registerNavigation) view.registerNavigation(controller)
                }
                return
            }

            controller.setNavigation(this.scopeId_, this)
        }

        /**
         * Focuses this stack's retained or preferred target. A stack that owns
         * no scope offers its children in order, so that focus still starts
         * somewhere sensible inside a layout-only stack.
         */
        public focusDefault(focus: UiFocusState): UiFocusSetResult {
            if (this.scopeId_ !== undefined)
                return focus.setActiveScope(this.scopeId_)

            let firstResult: UiFocusSetResult = undefined
            for (let i = 0; i < this.children_.length; i++) {
                const view = <any>this.children_[i].view
                if (!view.focusDefault) continue
                const result = <UiFocusSetResult>view.focusDefault(focus)
                if (result && result.kind == "focused") return result
                if (!firstResult) firstResult = result
            }
            return firstResult || { kind: "rejected", reason: "missingScope" }
        }

        /**
         * Rows of navigation targets across the focusable children. A column
         * stack contributes each child's rows in order; a row stack merges them
         * into one row.
         */
        public navigationRows(): UiFocusNavigationTarget[][] {
            const rows: UiFocusNavigationTarget[][] = []
            for (let i = 0; i < this.children_.length; i++) {
                const child = this.focusChild(i)
                if (!child) continue
                const childRows = child.navigationRows()
                for (let j = 0; j < childRows.length; j++)
                    rows.push(childRows[j])
            }
            if (this.orientation_ != "row") return rows

            const merged: UiFocusNavigationTarget[] = []
            for (let i = 0; i < rows.length; i++)
                for (let j = 0; j < rows[i].length; j++) merged.push(rows[i][j])
            return [merged]
        }

        /**
         * Returns the target this stack focuses by default, which is the first
         * one offered by a focusable child.
         */
        public resolvePreferredTargetId(): UiFocusId | undefined {
            for (let i = 0; i < this.children_.length; i++) {
                const child = this.focusChild(i)
                if (!child) continue
                const targetId = child.resolvePreferredTargetId()
                if (targetId !== undefined) return targetId
            }
            return undefined
        }

        /**
         * Moves focus within the scope this stack owns.
         */
        public move(request: UiFocusNavigationRequest): UiFocusMoveResult {
            if (
                this.scopeId_ === undefined ||
                request.scopeId != this.scopeId_
            )
                return undefined
            const rows = this.navigationRows()
            const result = moveFocusInRaggedGrid({
                scopeId: this.scopeId_,
                currentTargetId: request.currentTargetId,
                direction: request.direction,
                horizontalWrap: this.wrap_,
                verticalStrategy: this.verticalStrategy_,
                rows,
            })
            // Focus was left on a control that has since been hidden, so no
            // movement can start from it. Recover onto the first target.
            if (result.kind == "stayed" && result.reason == "missingActive")
                return this.moveToFirstTarget(rows, request)
            return result
        }

        /**
         * Renders the child views, with every focus treatment drawn after every
         * control.
         */
        public render(
            surface: DrawSurface,
            assets: UiAssetResolver,
            focus?: UiFocusState,
        ): void {
            this.renderControls(surface, assets, focus)
            this.renderFocus(surface, assets, focus)
        }

        /**
         * Renders the child views without their focus treatments. Children that
         * cannot separate the two render whole.
         */
        public renderControls(
            surface: DrawSurface,
            assets: UiAssetResolver,
            focus?: UiFocusState,
        ): void {
            for (let i = 0; i < this.children_.length; i++) {
                const view = <any>this.children_[i].view
                if (view.renderControls) view.renderControls(surface, assets, focus)
                else view.render(surface, assets, focus)
            }
        }

        /**
         * Renders only the children's focus treatments. Drawing these in a pass
         * of their own keeps a focus label, which extends past its control, from
         * being covered by a child rendered after it.
         */
        public renderFocus(
            surface: DrawSurface,
            assets: UiAssetResolver,
            focus?: UiFocusState,
        ): void {
            for (let i = 0; i < this.children_.length; i++) {
                const view = <any>this.children_[i].view
                if (view.renderFocus) view.renderFocus(surface, assets, focus)
            }
        }

        /**
         * Forwards focus input to the children, so controls inside a stack
         * activate as they do when added to a screen directly.
         */
        public handleFocusInput(result: UiFocusInputResult): any {
            for (let i = 0; i < this.children_.length; i++) {
                // Every child is offered the result, not just the ones this
                // stack navigates, so a child holding a scope of its own still
                // activates.
                const childResult =
                    this.children_[i].view.handleFocusInput(result)
                if (childResult) return childResult
            }
            return undefined
        }

        /**
         * Resolves resolver-backed content ids for child views.
         */
        public _resolveContentAssets(assets: UiAssetResolver): void {
            for (let i = 0; i < this.children_.length; i++) {
                const child = <any>this.children_[i].view
                if (child._resolveContentAssets)
                    child._resolveContentAssets(assets)
            }
        }

        private adoptScope(child: UiStackChild): void {
            if (this.scopeId_ === undefined) return
            const focusable = <any>child.view
            if (focusable.setScopeId) focusable.setScopeId(this.scopeId_)
        }

        private focusChild(
            index: number,
        ): UiComposableFocusView<any> | undefined {
            const child = <any>this.children_[index].view
            if (!child.navigationRows || !child.registerFocusTargets)
                return undefined
            return <UiComposableFocusView<any>>child
        }

        private moveToFirstTarget(
            rows: UiFocusNavigationTarget[][],
            request: UiFocusNavigationRequest,
        ): UiFocusMoveResult {
            for (let i = 0; i < rows.length; i++) {
                for (let j = 0; j < rows[i].length; j++) {
                    if (rows[i][j].hidden) continue
                    return {
                        kind: "moved",
                        fromScopeId: this.scopeId_,
                        fromTargetId: request.currentTargetId,
                        toScopeId: this.scopeId_,
                        toTargetId: rows[i][j].id,
                    }
                }
            }
            return {
                kind: "stayed",
                scopeId: this.scopeId_,
                targetId: request.currentTargetId,
                reason: "empty",
            }
        }

        private contentMainSize(): number {
            const row = this.orientation_ == "row"
            let mainSize = 0
            for (let i = 0; i < this.children_.length; i++) {
                this.children_[i].view.measure(
                    this.childConstraints_,
                    this.childSize_,
                )
                mainSize += row
                    ? this.childSize_.preferredWidth
                    : this.childSize_.preferredHeight
                mainSize += this.gapBefore(i) + this.gapAfter(i)
            }
            return mainSize
        }

        private justifyOffset(slack: number): number {
            if (this.justify_ == "center") return slack >> 1
            if (this.justify_ == "end") return slack
            return 0
        }

        private justifySpacing(slack: number): number {
            if (this.justify_ != "spaceBetween") return 0
            if (this.children_.length < 2) return 0
            return Math.idiv(slack, this.children_.length - 1)
        }

        private gapBefore(index: number): number {
            const gap = index ? this.gap_ : 0
            return (
                gap +
                _uiControls.sanitizeDimension(this.children_[index].gapBefore, 0)
            )
        }

        private gapAfter(index: number): number {
            return _uiControls.sanitizeDimension(
                this.children_[index].gapAfter,
                0,
            )
        }
    }
}
