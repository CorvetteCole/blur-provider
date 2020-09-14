const Meta = imports.gi.Meta;
const GLib = imports.gi.GLib;
const Shell = imports.gi.Shell;
const Clutter = imports.gi.Clutter;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Blur = Extension.imports.blur;
const Tracking = Extension.imports.tracking;

let _on_window_created, _on_focus_changed, _on_workspace_changed;

function workspace_changed() {
    //log("workspace_changed");
    // TODO somehow fix weird bug when returning from a workspace
}

Promise.timeout = function (priority = GLib.PRIORITY_DEFAULT, interval = 1000) {
    return new Promise(resolve => GLib.timeout_add(priority, interval, resolve));
};

function window_created(meta_display, meta_window) {
    //log("window_created");
    let window_actor = meta_window.get_compositor_private();
    if (!meta_window) {
        //log("no meta window");
        return;
    }
    Tracking.track_new(window_actor, meta_window);
}

function enable() {
    Tracking.settings = ExtensionUtils.getSettings();
    _on_focus_changed = global.display.connect('notify::focus-window', Tracking.focus_changed);
    _on_window_created = global.display.connect('window-created', window_created);
    _on_workspace_changed = global.workspace_manager.connect('workspace-switched', workspace_changed)
    log("blur provider enabled");
}

function disable() {
    global.display.disconnect(_on_focus_changed);
    global.display.disconnect(_on_window_created);
    global.workspace_manager.disconnect(_on_workspace_changed);

    Tracking.cleanup_actors();
    Tracking.cleanup_windows();
    Tracking.settings.run_dispose();
    Tracking.print_map_info();
    log("blur provider disabled");
}

function init() {
    ExtensionUtils.initTranslations();
}
