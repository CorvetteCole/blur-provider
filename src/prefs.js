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
    }
});

function buildPrefsWidget() {
    let widget = new TransparentWindowMovingSettings();
    widget.show_all();

    return widget;
}
