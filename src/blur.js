const Meta = imports.gi.Meta;
const GLib = imports.gi.GLib;
const Shell = imports.gi.Shell;
const Clutter = imports.gi.Clutter;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Tracking = Extension.imports.tracking;

function update_blur(window, pid) {
    let mutter_hint = window.get_mutter_hints();
    if (mutter_hint != null && mutter_hint.includes("blur-provider")) {
        let sigma = _parse_sigma_value(mutter_hint);
        if (sigma < 0 && sigma > 111) {
            log("sigma value is null or outside of range (0-111), defaulting to extension setting")
            sigma = Tracking.settings.get_int('blur-intensity');
        }
        if (Tracking.has_blur_actor(pid)) {
            if (sigma === 0) {
                remove_blur(pid);
            } else {
                _update_blur(Tracking.get_blur_actor(pid));
            }
        } else if (sigma !== 0) { // don't set blur if it is 0
            _set_blur(pid, Tracking.get_actor(pid), Tracking.get_window(pid), sigma)
        }
    } else if (Tracking.has_blur_actor(pid)) {
        remove_blur(pid); // remove blur if the mutter_hint no longer contains our blur-provider value
    }
}

function set_blur_behind(blurActor, actor){
    if (actor.get_parent() === blurActor.get_parent()){
        global.window_group.set_child_below_sibling(blurActor, actor);
    }
}

function remove_blur(pid){
    global.window_group.remove_actor(Tracking.get_blur_actor(pid));
    Tracking.remove_blur_tracking(pid);
}

function _update_blur(blur_actor){
    let blurEffect = new Shell.BlurEffect({sigma: sigma, mode: Shell.BlurMode.BACKGROUND});
    blur_actor.remove_effect_by_name('blur-effect');
    blur_actor.add_effect_with_name('blur-effect', blurEffect);
}

function _set_blur(pid, actor, window, sigma){
    let blurActor = _create_blur_actor(window, actor, sigma);
    global.window_group.insert_child_below(blurActor, actor);
    blurActor['blur_provider_pid'] = pid;
    Tracking.set_blur_actor(pid, blurActor);

    Tracking.connect_actor_visible(pid);
}

function _create_blur_actor(meta_window, window_actor, sigma_value) {
    let blurEffect = new Shell.BlurEffect({sigma: sigma_value, mode: Shell.BlurMode.BACKGROUND});

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
    // blurActor.paint = function() {
    //     global.window_group.set_child_below_sibling(_blurActorMap.get(pid), _actorMap.get(pid));
    //     log("vfunc_paint");
    //     this.paint();
    // }
    blurActor.add_constraint(constraintPosX);
    blurActor.add_constraint(constraintPosY);
    blurActor.add_constraint(constraintSizeX);
    blurActor.add_constraint(constraintSizeY);

    blurActor.add_effect_with_name('blur-effect', blurEffect);
    return blurActor;
}

function _parse_sigma_value(property) {
    let result = property.match("(blur-provider=)(\\d{1,3})")
    //log(result);
    if (result == null) { // return -1 if result is null
        return -1;
    } else {
        return result[2];
    }
}