const Meta = imports.gi.Meta;
const GLib = imports.gi.GLib;
const Shell = imports.gi.Shell;
const Clutter = imports.gi.Clutter;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Blur = Extension.imports.blur;

var settings = null;

let _blurActorMap = new Map();
let _actorMap = new Map();
let _windowMap = new Map();

let _on_mutter_hint_changedMap = new Map();
let _on_window_unmanagedMap = new Map();

let _on_actor_destroyedMap = new Map();
let _on_actor_visibleMap = new Map();

function get_window(pid) {
    return _windowMap.get(pid);
}

function get_actor(pid) {
    return _actorMap.get(pid);
}

function set_blur_actor(pid, blurActor) {
    _blurActorMap.set(pid, blurActor);
}

function get_blur_actor(pid) {
    return _blurActorMap.get(pid);
}

function has_window(pid) {
    return _windowMap.has(pid);
}

function has_actor(pid) {
    return _actorMap.has(pid);
}

function has_blur_actor(pid) {
    return _blurActorMap.has(pid);
}

function track_new(actor, window) {
    let pid = new Date().valueOf();
    if (!_actorMap.has(pid)) {
        actor['blur_provider_pid'] = pid;
        window['blur_provider_pid'] = pid;
        _actorMap.set(pid, actor);
        _windowMap.set(pid, window);
        _on_actor_destroyedMap.set(pid, actor.connect('destroy', _actor_destroyed));
        _on_mutter_hint_changedMap.set(pid, window.connect('notify::mutter-hints', _mutter_hint_changed));
        _on_window_unmanagedMap.set(pid, window.connect('unmanaged', _window_unmanaged));
    }
    Blur.update_blur(window, pid);
}

function connect_actor_visible(pid) {
    if (!_on_actor_visibleMap.has(pid)) {
        _on_actor_visibleMap.set(pid, _actorMap.get(pid).connect('notify::visible', _actor_visibility_changed))
    }
}

function remove_blur_tracking(pid) {
    _blurActorMap.delete(pid);
    _actorMap.get(pid).disconnect(_on_actor_visibleMap.get(pid));
    _on_actor_visibleMap.delete(pid);
}

function cleanup_windows() {
    _windowMap.forEach(((value, key) => {
        _cleanup_window(key);
    }));
}

function cleanup_actors() {
    _actorMap.forEach(((value, key) => {
        _cleanup_actor(key);
    }));
}

function print_map_info() {
    log("map sizes, _actorMap: " + _actorMap.size + " _blurActorMap: " + _blurActorMap.size + " _windowMap: " + _windowMap.size + "_on_mutter_hint_changedMap: " + _on_mutter_hint_changedMap.size + "_on_window_unmanagedMap: " + _on_window_unmanagedMap.size + " _on_actor_destroyedMap: " + _on_actor_destroyedMap.size + " _on_actor_visibleMap: " + _on_actor_visibleMap.size);
}

function focus_changed() {
    //log("focus_changed");
    if (_blurActorMap.size > 0) {

        let callbackId = Meta.later_add(Meta.LaterType.BEFORE_REDRAW, _fix_blur);
        //log("callback id: " + callbackId);


    }
}

function _cleanup_window(pid) {
    //log("cleanup_window");
    _windowMap.get(pid).disconnect(_on_mutter_hint_changedMap.get(pid));
    _windowMap.get(pid).disconnect(_on_window_unmanagedMap.get(pid));
    _on_mutter_hint_changedMap.delete(pid);
    _windowMap.delete(pid);
}

function _cleanup_actor(pid) {
    //log("cleanup_actor, disconnecting listeners");

    if (_blurActorMap.has(pid)) {
        Blur.remove_blur(pid);
    }
    _actorMap.get(pid).disconnect(_on_actor_destroyedMap.get(pid));
    if (_on_actor_visibleMap.has(pid)) {
        _actorMap.get(pid).disconnect(_on_actor_visibleMap.get(pid));
        _on_actor_visibleMap.delete(pid);
    }

    _on_actor_destroyedMap.delete(pid);
    _actorMap.delete(pid);
}

function _actor_visibility_changed(window_actor) {
    //log("visibility change");
    let pid = window_actor.blur_provider_pid;
    if (window_actor.visible) {
        //log("actor visible");
        _blurActorMap.get(pid).show();
    } else {
        //log("actor not visible");
        _blurActorMap.get(pid).hide();
    }
}


function _fix_blur() {
    _blurActorMap.forEach((blurActor, pid) => {
        //log("fix_blur")
        let actor = _actorMap.get(pid);
        Blur.set_blur_behind(blurActor, actor);
    });
}

function _mutter_hint_changed(meta_window) {
    Blur.update_blur(meta_window, meta_window.blur_provider_pid);
}

function _window_unmanaged(meta_window) {
    //log("window_unmanaged");
    let pid = meta_window.blur_provider_pid;
    _cleanup_window(pid);
}

function _actor_destroyed(window_actor) {
    //log("actor_destroyed");
    let pid = window_actor.blur_provider_pid;
    _cleanup_actor(pid);
}




