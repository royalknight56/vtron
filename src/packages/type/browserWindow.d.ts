declare interface BrowserWindowConstructorOptions {
    /**
     * Window's width in pixels. Default is `800`.
     */
    width?: number;
    /**
     * Window's height in pixels. Default is `600`.
     */
    height?: number;
    /**
     * (**required** if y is used) Window's left offset from screen. Default is to
     * center the window.
     */
    x?: number;
    /**
     * (**required** if x is used) Window's top offset from screen. Default is to
     * center the window.
     */
    y?: number;
    /**
     * The `width` and `height` would be used as web page's size, which means the
     * actual window's size will include window frame's size and be slightly larger.
     * Default is `false`.
     */
    useContentSize?: boolean;
    /**
     * Show window in the center of the screen. Default is `false`.
     */
    center?: boolean;
    /**
     * Window's minimum width. Default is `0`.
     */
    minWidth?: number;
    /**
     * Window's minimum height. Default is `0`.
     */
    minHeight?: number;
    /**
     * Window's maximum width. Default is no limit.
     */
    maxWidth?: number;
    /**
     * Window's maximum height. Default is no limit.
     */
    maxHeight?: number;
    /**
     * Whether window is resizable. Default is `true`.
     */
    resizable?: boolean;
    /**
     * Whether window is movable. This is not implemented on Linux. Default is `true`.
     *
     * @platform darwin,win32
     */
    movable?: boolean;
    /**
     * Whether window is minimizable. This is not implemented on Linux. Default is
     * `true`.
     *
     * @platform darwin,win32
     */
    minimizable?: boolean;
    /**
     * Whether window is maximizable. This is not implemented on Linux. Default is
     * `true`.
     *
     * @platform darwin,win32
     */
    maximizable?: boolean;
    /**
     * Whether window is closable. This is not implemented on Linux. Default is `true`.
     *
     * @platform darwin,win32
     */
    closable?: boolean;
    /**
     * Whether the window can be focused. Default is `true`. On Windows setting
     * `focusable: false` also implies setting `skipTaskbar: true`. On Linux setting
     * `focusable: false` makes the window stop interacting with wm, so the window will
     * always stay on top in all workspaces.
     */
    focusable?: boolean;
    /**
     * Whether the window should always stay on top of other windows. Default is
     * `false`.
     */
    alwaysOnTop?: boolean;
    /**
     * Whether the window should show in fullscreen. When explicitly set to `false` the
     * fullscreen button will be hidden or disabled on macOS. Default is `false`.
     */
    fullscreen?: boolean;
    /**
     * Whether the window can be put into fullscreen mode. On macOS, also whether the
     * maximize/zoom button should toggle full screen mode or maximize window. Default
     * is `true`.
     */
    fullscreenable?: boolean;
    /**
     * Use pre-Lion fullscreen on macOS. Default is `false`.
     *
     * @platform darwin
     */
    simpleFullscreen?: boolean;
    /**
     * Whether to show the window in taskbar. Default is `false`.
     *
     * @platform darwin,win32
     */
    skipTaskbar?: boolean;
    /**
     * Whether window should be hidden when the user toggles into mission control.
     *
     * @platform darwin
     */
    hiddenInMissionControl?: boolean;
    /**
     * Whether the window is in kiosk mode. Default is `false`.
     */
    kiosk?: boolean;
    /**
     * Default window title. Default is `"Electron"`. If the HTML tag `<title>` is
     * defined in the HTML file loaded by `loadURL()`, this property will be ignored.
     */
    title?: string;
    /**
     * The window icon. On Windows it is recommended to use `ICO` icons to get best
     * visual effects, you can also leave it undefined so the executable's icon will be
     * used.
     */
    icon?: (NativeImage) | (string);
    /**
     * Whether window should be shown when created. Default is `true`.
     */
    show?: boolean;
    /**
     * Whether the renderer should be active when `show` is `false` and it has just
     * been created.  In order for `document.visibilityState` to work correctly on
     * first load with `show: false` you should set this to `false`.  Setting this to
     * `false` will cause the `ready-to-show` event to not fire.  Default is `true`.
     */
    paintWhenInitiallyHidden?: boolean;
    /**
     * Specify `false` to create a frameless window. Default is `true`.
     */
    frame?: boolean;
    /**
     * Specify parent window. Default is `null`.
     */
    parent?: BrowserWindow;
    /**
     * Whether this is a modal window. This only works when the window is a child
     * window. Default is `false`.
     */
    modal?: boolean;
    /**
     * Whether clicking an inactive window will also click through to the web contents.
     * Default is `false` on macOS. This option is not configurable on other platforms.
     *
     * @platform darwin
     */
    acceptFirstMouse?: boolean;
    /**
     * Whether to hide cursor when typing. Default is `false`.
     */
    disableAutoHideCursor?: boolean;
    /**
     * Auto hide the menu bar unless the `Alt` key is pressed. Default is `false`.
     */
    autoHideMenuBar?: boolean;
    /**
     * Enable the window to be resized larger than screen. Only relevant for macOS, as
     * other OSes allow larger-than-screen windows by default. Default is `false`.
     *
     * @platform darwin
     */
    enableLargerThanScreen?: boolean;
    /**
     * The window's background color in Hex, RGB, RGBA, HSL, HSLA or named CSS color
     * format. Alpha in #AARRGGBB format is supported if `transparent` is set to
     * `true`. Default is `#FFF` (white). See win.setBackgroundColor for more
     * information.
     */
    backgroundColor?: string;
    /**
     * Whether window should have a shadow. Default is `true`.
     */
    hasShadow?: boolean;
    /**
     * Set the initial opacity of the window, between 0.0 (fully transparent) and 1.0
     * (fully opaque). This is only implemented on Windows and macOS.
     *
     * @platform darwin,win32
     */
    opacity?: number;
    /**
     * Forces using dark theme for the window, only works on some GTK+3 desktop
     * environments. Default is `false`.
     */
    darkTheme?: boolean;
    /**
     * Makes the window transparent. Default is `false`. On Windows, does not work
     * unless the window is frameless.
     */
    transparent?: boolean;
    /**
     * The type of window, default is normal window. See more about this below.
     */
    type?: string;
    /**
     * Specify how the material appearance should reflect window activity state on
     * macOS. Must be used with the `vibrancy` property. Possible values are:
     *
     * @platform darwin
     */
    visualEffectState?: ('followWindow' | 'active' | 'inactive');
    /**
     * The style of window title bar. Default is `default`. Possible values are:
     *
     * @platform darwin,win32
     */
    titleBarStyle?: ('default' | 'hidden' | 'hiddenInset' | 'customButtonsOnHover');
    /**
     * Set a custom position for the traffic light buttons in frameless windows.
     *
     * @platform darwin
     */
    trafficLightPosition?: Point;
    /**
     * Whether frameless window should have rounded corners on macOS. Default is
     * `true`. Setting this property to `false` will prevent the window from being
     * fullscreenable.
     *
     * @platform darwin
     */
    roundedCorners?: boolean;
    /**
     * Shows the title in the title bar in full screen mode on macOS for `hiddenInset`
     * titleBarStyle. Default is `false`.
     *
     * @deprecated
     * @platform darwin
     */
    fullscreenWindowTitle?: boolean;
    /**
     * Use `WS_THICKFRAME` style for frameless windows on Windows, which adds standard
     * window frame. Setting it to `false` will remove window shadow and window
     * animations. Default is `true`.
     */
    thickFrame?: boolean;
    /**
     * Add a type of vibrancy effect to the window, only on macOS. Can be
     * `appearance-based`, `light`, `dark`, `titlebar`, `selection`, `menu`, `popover`,
     * `sidebar`, `medium-light`, `ultra-dark`, `header`, `sheet`, `window`, `hud`,
     * `fullscreen-ui`, `tooltip`, `content`, `under-window`, or `under-page`. Please
     * note that `appearance-based`, `light`, `dark`, `medium-light`, and `ultra-dark`
     * are deprecated and have been removed in macOS Catalina (10.15).
     *
     * @platform darwin
     */
    vibrancy?: ('appearance-based' | 'light' | 'dark' | 'titlebar' | 'selection' | 'menu' | 'popover' | 'sidebar' | 'medium-light' | 'ultra-dark' | 'header' | 'sheet' | 'window' | 'hud' | 'fullscreen-ui' | 'tooltip' | 'content' | 'under-window' | 'under-page');
    /**
     * Controls the behavior on macOS when option-clicking the green stoplight button
     * on the toolbar or by clicking the Window > Zoom menu item. If `true`, the window
     * will grow to the preferred width of the web page when zoomed, `false` will cause
     * it to zoom to the width of the screen. This will also affect the behavior when
     * calling `maximize()` directly. Default is `false`.
     *
     * @platform darwin
     */
    zoomToPageWidth?: boolean;
    /**
     * Tab group name, allows opening the window as a native tab on macOS 10.12+.
     * Windows with the same tabbing identifier will be grouped together. This also
     * adds a native new tab button to your window's tab bar and allows your `app` and
     * window to receive the `new-window-for-tab` event.
     *
     * @platform darwin
     */
    tabbingIdentifier?: string;
    /**
     * Settings of web page's features.
     */
    webPreferences?: WebPreferences;
    /**
     *  When using a frameless window in conjunction with
     * `win.setWindowButtonVisibility(true)` on macOS or using a `titleBarStyle` so
     * that the standard window controls ("traffic lights" on macOS) are visible, this
     * property enables the Window Controls Overlay JavaScript APIs and CSS Environment
     * Variables. Specifying `true` will result in an overlay with default system
     * colors. Default is `false`.
     */
    titleBarOverlay?: (TitleBarOverlay) | (boolean);
  }

declare interface BrowserWindowModel{
    /**
     * BrowserWindow
     */
    constructor(options?: BrowserWindowConstructorOptions);
    /**
     * The window that owns the given `browserView`. If the given view is not attached
     * to any window, returns `null`.
     */
    static fromBrowserView(browserView: BrowserView): (BrowserWindow) | (null);
    /**
     * The window with the given `id`.
     */
    static fromId(id: number): (BrowserWindow) | (null);
    /**
     * The window that owns the given `webContents` or `null` if the contents are not
     * owned by a window.
     */
    static fromWebContents(webContents: WebContents): (BrowserWindow) | (null);
    /**
     * An array of all opened browser windows.
     */
    static getAllWindows(): BrowserWindow[];
    /**
     * The window that is focused in this application, otherwise returns `null`.
     */
    static getFocusedWindow(): (BrowserWindow) | (null);
    /**
     * Replacement API for setBrowserView supporting work with multi browser views.
     *
     * @experimental
     */
    addBrowserView(browserView: BrowserView): void;
    /**
     * Adds a window as a tab on this window, after the tab for the window instance.
     *
     * @platform darwin
     */
    addTabbedWindow(browserWindow: BrowserWindow): void;
    /**
     * Removes focus from the window.
     */
    blur(): void;
    blurWebView(): void;
    /**
     * Resolves with a NativeImage
     *
     * Captures a snapshot of the page within `rect`. Omitting `rect` will capture the
     * whole visible page. If the page is not visible, `rect` may be empty. The page is
     * considered visible when its browser window is hidden and the capturer count is
     * non-zero. If you would like the page to stay hidden, you should ensure that
     * `stayHidden` is set to true.
     */
    capturePage(rect?: Rectangle, opts?: Opts): Promise<Electron.NativeImage>;
    /**
     * Moves window to the center of the screen.
     */
    center(): void;
    /**
     * Try to close the window. This has the same effect as a user manually clicking
     * the close button of the window. The web page may cancel the close though. See
     * the close event.
     */
    close(): void;
    /**
     * Closes the currently open Quick Look panel.
     *
     * @platform darwin
     */
    closeFilePreview(): void;
    /**
     * Force closing the window, the `unload` and `beforeunload` event won't be emitted
     * for the web page, and `close` event will also not be emitted for this window,
     * but it guarantees the `closed` event will be emitted.
     */
    destroy(): void;
    /**
     * Starts or stops flashing the window to attract user's attention.
     */
    flashFrame(flag: boolean): void;
    /**
     * Focuses on the window.
     */
    focus(): void;
    focusOnWebView(): void;
    /**
     * Gets the background color of the window in Hex (`#RRGGBB`) format.
     *
     * See Setting `backgroundColor`.
     *
     * **Note:** The alpha value is _not_ returned alongside the red, green, and blue
     * values.
     */
    getBackgroundColor(): string;
    /**
     * The `bounds` of the window as `Object`.
     */
    getBounds(): Rectangle;
    /**
     * The `BrowserView` attached to `win`. Returns `null` if one is not attached.
     * Throws an error if multiple `BrowserView`s are attached.
     *
     * @experimental
     */
    getBrowserView(): (BrowserView) | (null);
    /**
     * an array of all BrowserViews that have been attached with `addBrowserView` or
     * `setBrowserView`.
     *
     * **Note:** The BrowserView API is currently experimental and may change or be
     * removed in future Electron releases.
     *
     * @experimental
     */
    getBrowserViews(): BrowserView[];
    /**
     * All child windows.
     */
    getChildWindows(): BrowserWindow[];
    /**
     * The `bounds` of the window's client area as `Object`.
     */
    getContentBounds(): Rectangle;
    /**
     * Contains the window's client area's width and height.
     */
    getContentSize(): number[];
    /**
     * Contains the window's maximum width and height.
     */
    getMaximumSize(): number[];
    /**
     * Window id in the format of DesktopCapturerSource's id. For example
     * "window:1324:0".
     *
     * More precisely the format is `window:id:other_id` where `id` is `HWND` on
     * Windows, `CGWindowID` (`uint64_t`) on macOS and `Window` (`unsigned long`) on
     * Linux. `other_id` is used to identify web contents (tabs) so within the same top
     * level window.
     */
    getMediaSourceId(): string;
    /**
     * Contains the window's minimum width and height.
     */
    getMinimumSize(): number[];
    /**
     * The platform-specific handle of the window.
     *
     * The native type of the handle is `HWND` on Windows, `NSView*` on macOS, and
     * `Window` (`unsigned long`) on Linux.
     */
    getNativeWindowHandle(): Buffer;
    /**
     * Contains the window bounds of the normal state
     *
     * **Note:** whatever the current state of the window : maximized, minimized or in
     * fullscreen, this function always returns the position and size of the window in
     * normal state. In normal state, getBounds and getNormalBounds returns the same
     * `Rectangle`.
     */
    getNormalBounds(): Rectangle;
    /**
     * between 0.0 (fully transparent) and 1.0 (fully opaque). On Linux, always returns
     * 1.
     */
    getOpacity(): number;
    /**
     * The parent window or `null` if there is no parent.
     */
    getParentWindow(): (BrowserWindow) | (null);
    /**
     * Contains the window's current position.
     */
    getPosition(): number[];
    /**
     * The pathname of the file the window represents.
     *
     * @platform darwin
     */
    getRepresentedFilename(): string;
    /**
     * Contains the window's width and height.
     */
    getSize(): number[];
    /**
     * The title of the native window.
     *
     * **Note:** The title of the web page can be different from the title of the
     * native window.
     */
    getTitle(): string;
    /**
     * The custom position for the traffic light buttons in frameless window.
     *
     * @platform darwin
     */
    getTrafficLightPosition(): Point;
    /**
     * Whether the window has a shadow.
     */
    hasShadow(): boolean;
    /**
     * Hides the window.
     */
    hide(): void;
    /**
     * Hooks a windows message. The `callback` is called when the message is received
     * in the WndProc.
     *
     * @platform win32
     */
    hookWindowMessage(message: number, callback: (wParam: any, lParam: any) => void): void;
    /**
     * Whether the window is always on top of other windows.
     */
    isAlwaysOnTop(): boolean;
    /**
     * Whether the window can be manually closed by user.
     *
     * On Linux always returns `true`.
     *
     * @platform darwin,win32
     */
    isClosable(): boolean;
    /**
     * Whether the window is destroyed.
     */
    isDestroyed(): boolean;
    /**
     * Whether the window's document has been edited.
     *
     * @platform darwin
     */
    isDocumentEdited(): boolean;
    /**
     * whether the window is enabled.
     */
    isEnabled(): boolean;
    /**
     * Returns whether the window can be focused.
     *
     * @platform darwin,win32
     */
    isFocusable(): void;
    /**
     * Whether the window is focused.
     */
    isFocused(): boolean;
    /**
     * Whether the window is in fullscreen mode.
     */
    isFullScreen(): boolean;
    /**
     * Whether the maximize/zoom window button toggles fullscreen mode or maximizes the
     * window.
     */
    isFullScreenable(): boolean;
    /**
     * Whether the window will be hidden when the user toggles into mission control.
     *
     * @platform darwin
     */
    isHiddenInMissionControl(): boolean;
    /**
     * Whether the window is in kiosk mode.
     */
    isKiosk(): boolean;
    /**
     * Whether the window can be manually maximized by user.
     *
     * On Linux always returns `true`.
     *
     * @platform darwin,win32
     */
    isMaximizable(): boolean;
    /**
     * Whether the window is maximized.
     */
    isMaximized(): boolean;
    /**
     * Whether menu bar automatically hides itself.
     *
     * @platform win32,linux
     */
    isMenuBarAutoHide(): boolean;
    /**
     * Whether the menu bar is visible.
     *
     * @platform win32,linux
     */
    isMenuBarVisible(): boolean;
    /**
     * Whether the window can be manually minimized by the user.
     *
     * On Linux always returns `true`.
     *
     * @platform darwin,win32
     */
    isMinimizable(): boolean;
    /**
     * Whether the window is minimized.
     */
    isMinimized(): boolean;
    /**
     * Whether current window is a modal window.
     */
    isModal(): boolean;
    /**
     * Whether the window can be moved by user.
     *
     * On Linux always returns `true`.
     *
     * @platform darwin,win32
     */
    isMovable(): boolean;
    /**
     * Whether the window is in normal state (not maximized, not minimized, not in
     * fullscreen mode).
     */
    isNormal(): boolean;
    /**
     * Whether the window can be manually resized by the user.
     */
    isResizable(): boolean;
    /**
     * Whether the window is in simple (pre-Lion) fullscreen mode.
     *
     * @platform darwin
     */
    isSimpleFullScreen(): boolean;
    /**
     * Whether the window is in Windows 10 tablet mode.
     *
     * Since Windows 10 users can use their PC as tablet, under this mode apps can
     * choose to optimize their UI for tablets, such as enlarging the titlebar and
     * hiding titlebar buttons.
     *
     * This API returns whether the window is in tablet mode, and the `resize` event
     * can be be used to listen to changes to tablet mode.
     *
     * @platform win32
     */
    isTabletMode(): boolean;
    /**
     * Whether the window is visible to the user.
     */
    isVisible(): boolean;
    /**
     * Whether the window is visible on all workspaces.
     *
     * **Note:** This API always returns false on Windows.
     *
     * @platform darwin,linux
     */
    isVisibleOnAllWorkspaces(): boolean;
    /**
     * `true` or `false` depending on whether the message is hooked.
     *
     * @platform win32
     */
    isWindowMessageHooked(message: number): boolean;
    /**
     * the promise will resolve when the page has finished loading (see
     * `did-finish-load`), and rejects if the page fails to load (see `did-fail-load`).
     *
     * Same as `webContents.loadFile`, `filePath` should be a path to an HTML file
     * relative to the root of your application.  See the `webContents` docs for more
     * information.
     */
    loadFile(filePath: string, options?: LoadFileOptions): Promise<void>;
    /**
     * the promise will resolve when the page has finished loading (see
     * `did-finish-load`), and rejects if the page fails to load (see `did-fail-load`).
     *
     * Same as `webContents.loadURL(url[, options])`.
     *
     * The `url` can be a remote address (e.g. `http://`) or a path to a local HTML
     * file using the `file://` protocol.
     *
     * To ensure that file URLs are properly formatted, it is recommended to use Node's
     * `url.format` method:
     *
     * You can load a URL using a `POST` request with URL-encoded data by doing the
     * following:
     */
    loadURL(url: string, options?: LoadURLOptions): Promise<void>;
    /**
     * Maximizes the window. This will also show (but not focus) the window if it isn't
     * being displayed already.
     */
    maximize(): void;
    /**
     * Merges all windows into one window with multiple tabs when native tabs are
     * enabled and there is more than one open window.
     *
     * @platform darwin
     */
    mergeAllWindows(): void;
    /**
     * Minimizes the window. On some platforms the minimized window will be shown in
     * the Dock.
     */
    minimize(): void;
    /**
     * Moves window above the source window in the sense of z-order. If the
     * `mediaSourceId` is not of type window or if the window does not exist then this
     * method throws an error.
     */
    moveAbove(mediaSourceId: string): void;
    /**
     * Moves the current tab into a new window if native tabs are enabled and there is
     * more than one tab in the current window.
     *
     * @platform darwin
     */
    moveTabToNewWindow(): void;
    /**
     * Moves window to top(z-order) regardless of focus
     */
    moveTop(): void;
    /**
     * Uses Quick Look to preview a file at a given path.
     *
     * @platform darwin
     */
    previewFile(path: string, displayName?: string): void;
    /**
     * Same as `webContents.reload`.
     */
    reload(): void;
    removeBrowserView(browserView: BrowserView): void;
    /**
     * Remove the window's menu bar.
     *
     * @platform linux,win32
     */
    removeMenu(): void;
    /**
     * Restores the window from minimized state to its previous state.
     */
    restore(): void;
    /**
     * Selects the next tab when native tabs are enabled and there are other tabs in
     * the window.
     *
     * @platform darwin
     */
    selectNextTab(): void;
    /**
     * Selects the previous tab when native tabs are enabled and there are other tabs
     * in the window.
     *
     * @platform darwin
     */
    selectPreviousTab(): void;
    /**
     * Sets whether the window should show always on top of other windows. After
     * setting this, the window is still a normal window, not a toolbox window which
     * can not be focused on.
     */
    setAlwaysOnTop(flag: boolean, level?: 'normal' | 'floating' | 'torn-off-menu' | 'modal-panel' | 'main-menu' | 'status' | 'pop-up-menu' | 'screen-saver', relativeLevel?: number): void;
    /**
     * Sets the properties for the window's taskbar button.
     *
     * **Note:** `relaunchCommand` and `relaunchDisplayName` must always be set
     * together. If one of those properties is not set, then neither will be used.
     *
     * @platform win32
     */
    setAppDetails(options: AppDetailsOptions): void;
    /**
     * This will make a window maintain an aspect ratio. The extra size allows a
     * developer to have space, specified in pixels, not included within the aspect
     * ratio calculations. This API already takes into account the difference between a
     * window's size and its content size.
     *
     * Consider a normal window with an HD video player and associated controls.
     * Perhaps there are 15 pixels of controls on the left edge, 25 pixels of controls
     * on the right edge and 50 pixels of controls below the player. In order to
     * maintain a 16:9 aspect ratio (standard aspect ratio for HD @1920x1080) within
     * the player itself we would call this function with arguments of 16/9 and {
     * width: 40, height: 50 }. The second argument doesn't care where the extra width
     * and height are within the content view--only that they exist. Sum any extra
     * width and height areas you have within the overall content view.
     *
     * The aspect ratio is not respected when window is resized programmatically with
     * APIs like `win.setSize`.
     *
     * To reset an aspect ratio, pass 0 as the `aspectRatio` value:
     * `win.setAspectRatio(0)`.
     */
    setAspectRatio(aspectRatio: number, extraSize?: Size): void;
    /**
     * Controls whether to hide cursor when typing.
     *
     * @platform darwin
     */
    setAutoHideCursor(autoHide: boolean): void;
    /**
     * Sets whether the window menu bar should hide itself automatically. Once set the
     * menu bar will only show when users press the single `Alt` key.
     *
     * If the menu bar is already visible, calling `setAutoHideMenuBar(true)` won't
     * hide it immediately.
     *
     * @platform win32,linux
     */
    setAutoHideMenuBar(hide: boolean): void;
    /**
     * Examples of valid `backgroundColor` values:
     *
     * * Hex
     *   * #fff (shorthand RGB)
     *   * #ffff (shorthand ARGB)
     *   * #ffffff (RGB)
     *   * #ffffffff (ARGB)
     * * RGB
     *   * rgb(([\d]+),\s*([\d]+),\s*([\d]+))
     *     * e.g. rgb(255, 255, 255)
     * * RGBA
     *   * rgba(([\d]+),\s*([\d]+),\s*([\d]+),\s*([\d.]+))
     *     * e.g. rgba(255, 255, 255, 1.0)
     * * HSL
     *   * hsl((-?[\d.]+),\s*([\d.]+)%,\s*([\d.]+)%)
     *     * e.g. hsl(200, 20%, 50%)
     * * HSLA
     *   * hsla((-?[\d.]+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+))
     *     * e.g. hsla(200, 20%, 50%, 0.5)
     * * Color name
     *   * Options are listed in SkParseColor.cpp
     *   * Similar to CSS Color Module Level 3 keywords, but case-sensitive.
     *     * e.g. `blueviolet` or `red`
     *
     * Sets the background color of the window. See Setting `backgroundColor`.
     */
    setBackgroundColor(backgroundColor: string): void;
    /**
     * Resizes and moves the window to the supplied bounds. Any properties that are not
     * supplied will default to their current values.
     */
    setBounds(bounds: Partial<Rectangle>, animate?: boolean): void;
    setBrowserView(browserView: (BrowserView) | (null)): void;
    /**
     * Sets whether the window can be manually closed by user. On Linux does nothing.
     *
     * @platform darwin,win32
     */
    setClosable(closable: boolean): void;
    /**
     * Resizes and moves the window's client area (e.g. the web page) to the supplied
     * bounds.
     */
    setContentBounds(bounds: Rectangle, animate?: boolean): void;
    /**
     * Prevents the window contents from being captured by other apps.
     *
     * On macOS it sets the NSWindow's sharingType to NSWindowSharingNone. On Windows
     * it calls SetWindowDisplayAffinity with `WDA_EXCLUDEFROMCAPTURE`. For Windows 10
     * version 2004 and up the window will be removed from capture entirely, older
     * Windows versions behave as if `WDA_MONITOR` is applied capturing a black window.
     *
     * @platform darwin,win32
     */
    setContentProtection(enable: boolean): void;
    /**
     * Resizes the window's client area (e.g. the web page) to `width` and `height`.
     */
    setContentSize(width: number, height: number, animate?: boolean): void;
    /**
     * Specifies whether the window’s document has been edited, and the icon in title
     * bar will become gray when set to `true`.
     *
     * @platform darwin
     */
    setDocumentEdited(edited: boolean): void;
    /**
     * Disable or enable the window.
     */
    setEnabled(enable: boolean): void;
    /**
     * Changes whether the window can be focused.
     *
     * On macOS it does not remove the focus from the window.
     *
     * @platform darwin,win32
     */
    setFocusable(focusable: boolean): void;
    /**
     * Sets whether the window should be in fullscreen mode.
     */
    setFullScreen(flag: boolean): void;
    /**
     * Sets whether the maximize/zoom window button toggles fullscreen mode or
     * maximizes the window.
     */
    setFullScreenable(fullscreenable: boolean): void;
    /**
     * Sets whether the window should have a shadow.
     */
    setHasShadow(hasShadow: boolean): void;
    /**
     * Sets whether the window will be hidden when the user toggles into mission
     * control.
     *
     * @platform darwin
     */
    setHiddenInMissionControl(hidden: boolean): void;
    /**
     * Changes window icon.
     *
     * @platform win32,linux
     */
    setIcon(icon: (NativeImage) | (string)): void;
    /**
     * Makes the window ignore all mouse events.
     *
     * All mouse events happened in this window will be passed to the window below this
     * window, but if this window has focus, it will still receive keyboard events.
     */
    setIgnoreMouseEvents(ignore: boolean, options?: IgnoreMouseEventsOptions): void;
    /**
     * Enters or leaves kiosk mode.
     */
    setKiosk(flag: boolean): void;
    /**
     * Sets whether the window can be manually maximized by user. On Linux does
     * nothing.
     *
     * @platform darwin,win32
     */
    setMaximizable(maximizable: boolean): void;
    /**
     * Sets the maximum size of window to `width` and `height`.
     */
    setMaximumSize(width: number, height: number): void;
    /**
     * Sets the `menu` as the window's menu bar.
     *
     * @platform linux,win32
     */
    setMenu(menu: (Menu) | (null)): void;
    /**
     * Sets whether the menu bar should be visible. If the menu bar is auto-hide, users
     * can still bring up the menu bar by pressing the single `Alt` key.
     *
     * @platform win32,linux
     */
    setMenuBarVisibility(visible: boolean): void;
    /**
     * Sets whether the window can be manually minimized by user. On Linux does
     * nothing.
     *
     * @platform darwin,win32
     */
    setMinimizable(minimizable: boolean): void;
    /**
     * Sets the minimum size of window to `width` and `height`.
     */
    setMinimumSize(width: number, height: number): void;
    /**
     * Sets whether the window can be moved by user. On Linux does nothing.
     *
     * @platform darwin,win32
     */
    setMovable(movable: boolean): void;
    /**
     * Sets the opacity of the window. On Linux, does nothing. Out of bound number
     * values are clamped to the [0, 1] range.
     *
     * @platform win32,darwin
     */
    setOpacity(opacity: number): void;
    /**
     * Sets a 16 x 16 pixel overlay onto the current taskbar icon, usually used to
     * convey some sort of application status or to passively notify the user.
     *
     * @platform win32
     */
    setOverlayIcon(overlay: (NativeImage) | (null), description: string): void;
    /**
     * Sets `parent` as current window's parent window, passing `null` will turn
     * current window into a top-level window.
     */
    setParentWindow(parent: (BrowserWindow) | (null)): void;
    /**
     * Moves window to `x` and `y`.
     */
    setPosition(x: number, y: number, animate?: boolean): void;
    /**
     * Sets progress value in progress bar. Valid range is [0, 1.0].
     *
     * Remove progress bar when progress < 0; Change to indeterminate mode when
     * progress > 1.
     *
     * On Linux platform, only supports Unity desktop environment, you need to specify
     * the `*.desktop` file name to `desktopName` field in `package.json`. By default,
     * it will assume `{app.name}.desktop`.
     *
     * On Windows, a mode can be passed. Accepted values are `none`, `normal`,
     * `indeterminate`, `error`, and `paused`. If you call `setProgressBar` without a
     * mode set (but with a value within the valid range), `normal` will be assumed.
     */
    setProgressBar(progress: number, options?: ProgressBarOptions): void;
    /**
     * Sets the pathname of the file the window represents, and the icon of the file
     * will show in window's title bar.
     *
     * @platform darwin
     */
    setRepresentedFilename(filename: string): void;
    /**
     * Sets whether the window can be manually resized by the user.
     */
    setResizable(resizable: boolean): void;
    /**
     * Setting a window shape determines the area within the window where the system
     * permits drawing and user interaction. Outside of the given region, no pixels
     * will be drawn and no mouse events will be registered. Mouse events outside of
     * the region will not be received by that window, but will fall through to
     * whatever is behind the window.
     *
     * @experimental
     * @platform win32,linux
     */
    setShape(rects: Rectangle[]): void;
    /**
     * Changes the attachment point for sheets on macOS. By default, sheets are
     * attached just below the window frame, but you may want to display them beneath a
     * HTML-rendered toolbar. For example:
     *
     * @platform darwin
     */
    setSheetOffset(offsetY: number, offsetX?: number): void;
    /**
     * Enters or leaves simple fullscreen mode.
     *
     * Simple fullscreen mode emulates the native fullscreen behavior found in versions
     * of macOS prior to Lion (10.7).
     *
     * @platform darwin
     */
    setSimpleFullScreen(flag: boolean): void;
    /**
     * Resizes the window to `width` and `height`. If `width` or `height` are below any
     * set minimum size constraints the window will snap to its minimum size.
     */
    setSize(width: number, height: number, animate?: boolean): void;
    /**
     * Makes the window not show in the taskbar.
     *
     * @platform darwin,win32
     */
    setSkipTaskbar(skip: boolean): void;
    /**
     * Whether the buttons were added successfully
     *
     * Add a thumbnail toolbar with a specified set of buttons to the thumbnail image
     * of a window in a taskbar button layout. Returns a `boolean` object indicates
     * whether the thumbnail has been added successfully.
     *
     * The number of buttons in thumbnail toolbar should be no greater than 7 due to
     * the limited room. Once you setup the thumbnail toolbar, the toolbar cannot be
     * removed due to the platform's limitation. But you can call the API with an empty
     * array to clean the buttons.
     *
     * The `buttons` is an array of `Button` objects:
     *
     * * `Button` Object
     *   * `icon` NativeImage - The icon showing in thumbnail toolbar.
     *   * `click` Function
     *   * `tooltip` string (optional) - The text of the button's tooltip.
     *   * `flags` string[] (optional) - Control specific states and behaviors of the
     * button. By default, it is `['enabled']`.
     *
     * The `flags` is an array that can include following `string`s:
     *
     * * `enabled` - The button is active and available to the user.
     * * `disabled` - The button is disabled. It is present, but has a visual state
     * indicating it will not respond to user action.
     * * `dismissonclick` - When the button is clicked, the thumbnail window closes
     * immediately.
     * * `nobackground` - Do not draw a button border, use only the image.
     * * `hidden` - The button is not shown to the user.
     * * `noninteractive` - The button is enabled but not interactive; no pressed
     * button state is drawn. This value is intended for instances where the button is
     * used in a notification.
     *
     * @platform win32
     */
    setThumbarButtons(buttons: ThumbarButton[]): boolean;
    /**
     * Sets the region of the window to show as the thumbnail image displayed when
     * hovering over the window in the taskbar. You can reset the thumbnail to be the
     * entire window by specifying an empty region: `{ x: 0, y: 0, width: 0, height: 0
     * }`.
     *
     * @platform win32
     */
    setThumbnailClip(region: Rectangle): void;
    /**
     * Sets the toolTip that is displayed when hovering over the window thumbnail in
     * the taskbar.
     *
     * @platform win32
     */
    setThumbnailToolTip(toolTip: string): void;
    /**
     * Changes the title of native window to `title`.
     */
    setTitle(title: string): void;
    /**
     * On a Window with Window Controls Overlay already enabled, this method updates
     * the style of the title bar overlay.
     *
     * @platform win32
     */
    setTitleBarOverlay(options: TitleBarOverlayOptions): void;
    /**
     * Raises `browserView` above other `BrowserView`s attached to `win`. Throws an
     * error if `browserView` is not attached to `win`.
     *
     * @experimental
     */
    setTopBrowserView(browserView: BrowserView): void;
    /**
     * Sets the touchBar layout for the current window. Specifying `null` or
     * `undefined` clears the touch bar. This method only has an effect if the machine
     * has a touch bar and is running on macOS 10.12.1+.
     *
     * **Note:** The TouchBar API is currently experimental and may change or be
     * removed in future Electron releases.
     *
     * @platform darwin
     */
    setTouchBar(touchBar: (TouchBar) | (null)): void;
    /**
     * Set a custom position for the traffic light buttons in frameless window.
     *
     * @platform darwin
     */
    setTrafficLightPosition(position: Point): void;
    /**
     * Adds a vibrancy effect to the browser window. Passing `null` or an empty string
     * will remove the vibrancy effect on the window.
     *
     * Note that `appearance-based`, `light`, `dark`, `medium-light`, and `ultra-dark`
     * have been deprecated and will be removed in an upcoming version of macOS.
     *
     * @platform darwin
     */
    setVibrancy(type: (('appearance-based' | 'light' | 'dark' | 'titlebar' | 'selection' | 'menu' | 'popover' | 'sidebar' | 'medium-light' | 'ultra-dark' | 'header' | 'sheet' | 'window' | 'hud' | 'fullscreen-ui' | 'tooltip' | 'content' | 'under-window' | 'under-page')) | (null)): void;
    /**
     * Sets whether the window should be visible on all workspaces.
     *
     * **Note:** This API does nothing on Windows.
     *
     * @platform darwin,linux
     */
    setVisibleOnAllWorkspaces(visible: boolean, options?: VisibleOnAllWorkspacesOptions): void;
    /**
     * Sets whether the window traffic light buttons should be visible.
     *
     * @platform darwin
     */
    setWindowButtonVisibility(visible: boolean): void;
    /**
     * Shows and gives focus to the window.
     */
    show(): void;
    /**
     * Same as `webContents.showDefinitionForSelection()`.
     *
     * @platform darwin
     */
    showDefinitionForSelection(): void;
    /**
     * Shows the window but doesn't focus on it.
     */
    showInactive(): void;
    /**
     * Toggles the visibility of the tab bar if native tabs are enabled and there is
     * only one tab in the current window.
     *
     * @platform darwin
     */
    toggleTabBar(): void;
    /**
     * Unhooks all of the window messages.
     *
     * @platform win32
     */
    unhookAllWindowMessages(): void;
    /**
     * Unhook the window message.
     *
     * @platform win32
     */
    unhookWindowMessage(message: number): void;
    /**
     * Unmaximizes the window.
     */
    unmaximize(): void;
    /**
     * A `string` property that defines an alternative title provided only to
     * accessibility tools such as screen readers. This string is not directly visible
     * to users.
     */
    accessibleTitle: string;
    /**
     * A `boolean` property that determines whether the window menu bar should hide
     * itself automatically. Once set, the menu bar will only show when users press the
     * single `Alt` key.
     *
     * If the menu bar is already visible, setting this property to `true` won't hide
     * it immediately.
     */
    autoHideMenuBar: boolean;
    /**
     * A `boolean` property that determines whether the window can be manually closed
     * by user.
     *
     * On Linux the setter is a no-op, although the getter returns `true`.
     *
     * @platform darwin,win32
     */
    closable: boolean;
    /**
     * A `boolean` property that specifies whether the window’s document has been
     * edited.
     *
     * The icon in title bar will become gray when set to `true`.
     *
     * @platform darwin
     */
    documentEdited: boolean;
    /**
     * A `boolean` property that determines whether the window is excluded from the
     * application’s Windows menu. `false` by default.
     *
     * @platform darwin
     */
    excludedFromShownWindowsMenu: boolean;
    /**
     * A `boolean` property that determines whether the window is focusable.
     *
     * @platform win32,darwin
     */
    focusable: boolean;
    /**
     * A `boolean` property that determines whether the window is in fullscreen mode.
     */
    fullScreen: boolean;
    /**
     * A `boolean` property that determines whether the maximize/zoom window button
     * toggles fullscreen mode or maximizes the window.
     */
    fullScreenable: boolean;
    /**
     * A `Integer` property representing the unique ID of the window. Each ID is unique
     * among all `BrowserWindow` instances of the entire Electron application.
     *
     */
    readonly id: number;
    /**
     * A `boolean` property that determines whether the window is in kiosk mode.
     */
    kiosk: boolean;
    /**
     * A `boolean` property that determines whether the window can be manually
     * maximized by user.
     *
     * On Linux the setter is a no-op, although the getter returns `true`.
     *
     * @platform darwin,win32
     */
    maximizable: boolean;
    /**
     * A `boolean` property that determines whether the menu bar should be visible.
     *
     * **Note:** If the menu bar is auto-hide, users can still bring up the menu bar by
     * pressing the single `Alt` key.
     *
     * @platform win32,linux
     */
    menuBarVisible: boolean;
    /**
     * A `boolean` property that determines whether the window can be manually
     * minimized by user.
     *
     * On Linux the setter is a no-op, although the getter returns `true`.
     *
     * @platform darwin,win32
     */
    minimizable: boolean;
    /**
     * A `boolean` property that determines Whether the window can be moved by user.
     *
     * On Linux the setter is a no-op, although the getter returns `true`.
     *
     * @platform darwin,win32
     */
    movable: boolean;
    /**
     * A `string` property that determines the pathname of the file the window
     * represents, and the icon of the file will show in window's title bar.
     *
     * @platform darwin
     */
    representedFilename: string;
    /**
     * A `boolean` property that determines whether the window can be manually resized
     * by user.
     */
    resizable: boolean;
    /**
     * A `boolean` property that determines whether the window has a shadow.
     */
    shadow: boolean;
    /**
     * A `boolean` property that determines whether the window is in simple (pre-Lion)
     * fullscreen mode.
     */
    simpleFullScreen: boolean;
    /**
     * A `string` property that determines the title of the native window.
     *
     * **Note:** The title of the web page can be different from the title of the
     * native window.
     */
    title: string;
    /**
     * A `boolean` property that determines whether the window is visible on all
     * workspaces.
     *
     * **Note:** Always returns false on Windows.
     *
     * @platform darwin,linux
     */
    visibleOnAllWorkspaces: boolean;
    /**
     * A `WebContents` object this window owns. All web page related events and
     * operations will be done via it.
     *
     * See the `webContents` documentation for its methods and events.
     *
     */
    readonly webContents: WebContents;

  }

