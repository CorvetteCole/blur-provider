const Meta = imports.gi.Meta;
const GLib = imports.gi.GLib;
const Shell = imports.gi.Shell;
const Clutter = imports.gi.Clutter;

const ExtensionUtils = imports.misc.extensionUtils;

let _settings = null;

let _blurActorMap = new Map();
let _actorMap = new Map();
let _windowMap = new Map();
let _on_mutter_hint_changedMap = new Map();
let _on_actor_destroyedMap = new Map();
let _on_actor_visibleMap = new Map();


let _on_window_created, _on_focus_changed;

function update_blur(mutter_hint, pid) {
    if (mutter_hint != null && mutter_hint.includes("blur-provider")) {
        let sigma = parse_sigma_value(mutter_hint);
        if (sigma < 0 && sigma > 111) {
            log("sigma value is null or outside of range (0-111), defaulting to extension setting")
            sigma = _settings.get_int('blur-intensity');
        }
        if (_blurActorMap.has(pid)) {
            if (sigma === 0) {
                remove_blur(pid);
            } else {
                // modify blur effect, but keep actor.
                let blurActor = _blurActorMap.get(pid);
                let blurEffect = new Shell.BlurEffect({sigma: sigma, mode: Shell.BlurMode.BACKGROUND});
                blurActor.remove_effect_by_name('blur-effect');
                blurActor.add_effect_with_name('blur-effect', blurEffect);
            }
        } else if (sigma !== 0) { // don't set blur if it is 0
            set_blur(pid, sigma);
        }
    } else if (_blurActorMap.has(pid)) {
        remove_blur(pid); // remove blur if the mutter_hint no longer contains our blur-provider value
    }
}

function set_blur(pid, sigma_value) {
    let blurEffect = new Shell.BlurEffect({sigma: sigma_value, mode: Shell.BlurMode.BACKGROUND});
    let window_actor = _actorMap.get(pid);
    let meta_window = _windowMap.get(pid);

    let frame = meta_window.get_frame_rect();
    let buffer = meta_window.get_buffer_rect();

    const offsetX = frame.x - buffer.x;
    const offsetY = frame.y - buffer.y;
    const offsetWidth = buffer.width - frame.width;
    const offsetHeight = buffer.height - frame.height;

    let constraintPosX = new Clutter.BindConstraint({
        source: window_actor,
        coordinate: Clutter.BindCoordinate.X,
        offset: offsetX
    });
    let constraintPosY = new Clutter.BindConstraint({
        source: window_actor,
        coordinate: Clutter.BindCoordinate.Y,
        offset: offsetY
    });

    let constraintSizeX = new Clutter.BindConstraint({
        source: window_actor,
        coordinate: Clutter.BindCoordinate.WIDTH,
        offset: -offsetWidth
    });
    let constraintSizeY = new Clutter.BindConstraint({
        source: window_actor,
        coordinate: Clutter.BindCoordinate.HEIGHT,
        offset: -offsetHeight
    });

    let blurActor = new Clutter.Actor();
    blurActor.add_constraint(constraintPosX);
    blurActor.add_constraint(constraintPosY);
    blurActor.add_constraint(constraintSizeX);
    blurActor.add_constraint(constraintSizeY);

    blurActor.add_effect_with_name('blur-effect', blurEffect);

    blurActor['blur_provider_pid'] = pid;

    global.window_group.insert_child_below(blurActor, window_actor);
    _blurActorMap.set(pid, blurActor);

    if (!_on_actor_visibleMap.has(pid)) {
        _on_actor_visibleMap.set(pid, _actorMap.get(pid).connect('notify::visible', actor_visibility_changed))
    }
    // if (_on_actor_hiddenMap.has(pid)) {
    //     _on_actor_hiddenMap.set(pid, _actorMap.get(pid).connect('hide', actor_hidden));
    // }
}

function remove_blur(pid) {
    global.window_group.remove_actor(_blurActorMap.get(pid));
    _blurActorMap.delete(pid);
    _actorMap.get(pid).disconnect(_on_actor_visibleMap.get(pid));
    _on_actor_visibleMap.delete(pid);
}

function parse_sigma_value(property) {
    let result = property.match("(blur-provider=)(\\d{1,3})")
    log(result);
    if (result == null) { // return -1 if result is null
        return -1;
    } else {
        return result[2];
    }

}

function focus_changed(meta_display, gpointer) {
    log("focus_changed");
    _blurActorMap.forEach((blurActor, pid) => {
        global.window_group.set_child_below_sibling(blurActor, _actorMap.get(pid));
    });
}

function window_created(meta_display, meta_window, gpointer) {
    log("window_created");
    //log(meta_display);
    let window_actor = meta_window.get_compositor_private();
    log(window_actor);
    if (!meta_window) {
        log("no meta window");
        return;
    }

    let pid = meta_window.get_pid();
    if (!_actorMap.has(pid)) {
        window_actor['blur_provider_pid'] = pid;
        meta_window['blur_provider_pid'] = pid;
        _actorMap.set(pid, window_actor);
        _windowMap.set(pid, meta_window);
        _on_actor_destroyedMap.set(pid, window_actor.connect('destroy', actor_destroyed));
        _on_mutter_hint_changedMap.set(pid, meta_window.connect('notify::mutter-hints', mutter_hint_changed));
    }

    update_blur(meta_window.get_mutter_hints(), pid);
}

function mutter_hint_changed(meta_window) {
    log("mutter_hint_changed");
    log(meta_window.get_mutter_hints());
    // meta_window.get_compositor_private() get actor

    update_blur(meta_window.get_mutter_hints(), meta_window.get_pid());


}

function actor_visibility_changed(window_actor) {
    log("visibility change");
    let pid = window_actor.blur_provider_pid;
    if (window_actor.visible) {
        log("actor visible");
        _blurActorMap.get(pid).show();
    } else {
        log("actor not visible");
        _blurActorMap.get(pid).hide();
    }
}

function actor_destroyed(window_actor) {
    log("actor_destroyed, disconnecting listeners");
    //log(window_actor.meta_window.get_title());
    let pid = window_actor.blur_provider_pid;

    log(pid);

    if (_blurActorMap.has(pid)) {
        remove_blur(pid);
    }

    _actorMap.get(pid).disconnect(_on_actor_destroyedMap.get(pid));
    _windowMap.get(pid).disconnect(_on_mutter_hint_changedMap.get(pid));
    if (_on_actor_visibleMap.has(pid)) {
        _actorMap.get(pid).disconnect(_on_actor_visibleMap.get(pid));
        _on_actor_visibleMap.delete(pid);
    }


    _on_actor_destroyedMap.delete(pid);
    _on_mutter_hint_changedMap.delete(pid);
    _actorMap.delete(pid);
    _windowMap.delete(pid);

}

function cleanup_actor(pid) {
    log("cleanup_actor, disconnecting listeners");


    if (_blurActorMap.has(pid)) {
        remove_blur(pid);
    }

    _actorMap.get(pid).disconnect(_on_actor_destroyedMap.get(pid));
    _windowMap.get(pid).disconnect(_on_mutter_hint_changedMap.get(pid));
    if (_on_actor_visibleMap.has(pid)) {
        _actorMap.get(pid).disconnect(_on_actor_visibleMap.get(pid));
        _on_actor_visibleMap.delete(pid);
    }


    _on_actor_destroyedMap.delete(pid);
    _on_mutter_hint_changedMap.delete(pid);
    _actorMap.delete(pid);
    _windowMap.delete(pid);

}


function enable() {
    _settings = ExtensionUtils.getSettings();
    _on_focus_changed = global.display.connect('notify::focus-window', focus_changed);
    _on_window_created = global.display.connect('window-created', window_created);
    log("blur provider enabled");
}

function disable() {
    global.display.disconnect(_on_focus_changed);
    global.display.disconnect(_on_window_created);
    _actorMap.forEach(((value, key) => {
        cleanup_actor(key);
    }));
    _settings.run_dispose();
    log("map sizes, _actorMap: " + _actorMap.size + " _blurActorMap: " + _blurActorMap.size + " _windowMap: " + _windowMap.size + "_on_mutter_hint_changedMap: " + _on_mutter_hint_changedMap.size + " _on_actor_destroyedMap: " + _on_actor_destroyedMap.size + " _on_actor_visibleMap: " + _on_actor_visibleMap.size);
    log("blur provider disabled");
}

function init() {
    ExtensionUtils.initTranslations();
}
