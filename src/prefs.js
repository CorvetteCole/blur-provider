// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-

const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;


function init() {
    ExtensionUtils.initTranslations();
}

const TransparentWindowMovingSettings = GObject.registerClass(
class TransparentWindowMovingSettings extends Gtk.Grid {
    _init(params) {
        super._init(params);

        this.margin = 24;
        this.row_spacing = 6;
        this.column_spacing = 6;
        this.orientation = Gtk.Orientation.VERTICAL;

        this._settings = ExtensionUtils.getSettings();

        this.opacity_label = new Gtk.Label({label: _("Opacity (0..255):"), halign: Gtk.Align.START});
        this.opacity_control = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 255,
                step_increment: 1
            })
        });
        this.attach(this.opacity_label, 1, 1, 1, 1);
        this.attach(this.opacity_control, 2, 1, 1, 1);
        this._settings.bind('window-opacity', this.opacity_control, 'value', Gio.SettingsBindFlags.DEFAULT);

        this.blur_label = new Gtk.Label({label: _("Blur Intensity (0..111):"), halign: Gtk.Align.START});
        this.blur_control = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 111,
                step_increment: 1
            })
        });
        this.attach(this.blur_label, 1, 2, 1, 1);
        this.attach(this.blur_control, 2, 2, 1, 1);
        this._settings.bind('blur-intensity', this.blur_control, 'value', Gio.SettingsBindFlags.DEFAULT);

        this.transition_label = new Gtk.Label({label: _("Animation time:"), halign: Gtk.Align.START});
        this.transition_control = new Gtk.SpinButton({
            digits: 2,
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 1,
                step_increment: 0.1
            })
        });
        this.attach(this.transition_label, 1, 3, 1, 1);
        this.attach(this.transition_control, 2, 3, 1, 1);
        this._settings.bind('transition-time', this.transition_control, 'value', Gio.SettingsBindFlags.DEFAULT);

        this.blur_label = new Gtk.Label({label: _("Enable blur:"), halign: Gtk.Align.START});
        this.blur_control = new Gtk.Switch();
        this.attach(this.blur_label, 1, 4, 1, 1);
        this.attach(this.blur_control, 2, 4, 1, 1);
        this._settings.bind('blur', this.blur_control, 'active', Gio.SettingsBindFlags.DEFAULT);
       
        this.transparent_move_label = new Gtk.Label({label: _("Transparent on moving:"), halign: Gtk.Align.START});
        this.transparent_move_control = new Gtk.Switch();
        this.attach(this.transparent_move_label, 1, 5, 1, 1);
        this.attach(this.transparent_move_control, 2, 5, 1, 1);
        this._settings.bind('transparent-on-moving', this.transparent_move_control, 'active', Gio.SettingsBindFlags.DEFAULT);

        this.transparent_resize_label = new Gtk.Label({label: _("Transparent on resizing:"), halign: Gtk.Align.START});
        this.transparent_resize_control = new Gtk.Switch();
        this.attach(this.transparent_resize_label, 1, 6, 1, 1);
        this.attach(this.transparent_resize_control, 2, 6, 1, 1);
        this._settings.bind('transparent-on-resizing', this.transparent_resize_control, 'active', Gio.SettingsBindFlags.DEFAULT);
        

        

    }
});

function buildPrefsWidget() {
    let widget = new TransparentWindowMovingSettings();
    widget.show_all();

    return widget;
}
