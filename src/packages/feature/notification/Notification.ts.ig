class Notification{
    /**
     * Notification
     */
    constructor(options?: NotificationConstructorOptions);
    /**
     * Whether or not desktop notifications are supported on the current system
     */
    static isSupported(): boolean;
    /**
     * Dismisses the notification.
     */
    close(): void;
    /**
     * Immediately shows the notification to the user, please note this means unlike
     * the HTML5 Notification implementation, instantiating a `new Notification` does
     * not immediately show it to the user, you need to call this method before the OS
     * will display it.
     *
     * If the notification has been shown before, this method will dismiss the
     * previously shown notification and create a new one with identical properties.
     */
    show(): void;
    /**
     * A `NotificationAction[]` property representing the actions of the notification.
     */
    actions: NotificationAction[];
    /**
     * A `string` property representing the body of the notification.
     */
    body: string;
    /**
     * A `string` property representing the close button text of the notification.
     */
    closeButtonText: string;
    /**
     * A `boolean` property representing whether the notification has a reply action.
     */
    hasReply: boolean;
    /**
     * A `string` property representing the reply placeholder of the notification.
     */
    replyPlaceholder: string;
    /**
     * A `boolean` property representing whether the notification is silent.
     */
    silent: boolean;
    /**
     * A `string` property representing the sound of the notification.
     */
    sound: string;
    /**
     * A `string` property representing the subtitle of the notification.
     */
    subtitle: string;
    /**
     * A `string` property representing the type of timeout duration for the
     * notification. Can be 'default' or 'never'.
     *
     * If `timeoutType` is set to 'never', the notification never expires. It stays
     * open until closed by the calling API or the user.
     *
     * @platform linux,win32
     */
    timeoutType: ('default' | 'never');
    /**
     * A `string` property representing the title of the notification.
     */
    title: string;
    /**
     * A `string` property representing the custom Toast XML of the notification.
     *
     * @platform win32
     */
    toastXml: string;
    /**
     * A `string` property representing the urgency level of the notification. Can be
     * 'normal', 'critical', or 'low'.
     *
     * Default is 'low' - see NotifyUrgency for more information.
     *
     * @platform linux
     */
    urgency: ('normal' | 'critical' | 'low');


}