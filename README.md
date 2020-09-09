# blur-provider
A Gnome extension that allows you to manually apply blur to applications, and provides an easy way for applications to request blur themselves

While Gnome supports blur since 3.36, it isn't as easy as applying that blur to any old window. The problem is, the blur also applies to the shadow around windows and looks terrible. This extension works by adding an extra actor that excludes the shadows and tracking that actor behind a target window. Then blur is applied to that, working around the issue of blur being applied to shadows. This is not an easy implementation for applications to just include, so this extension exists as a convenient way for applications to simply request blur with a property.

# Integrate blur in to your application
To request your application to be blurred, you simply need to add a property to your window.

add below keypair to property _MUTTER_HINTS

keypair template: blur-provider=${sigma-value} apply blur with given sigma value
(note, ${sigma-value} is a value between 0 and 111)

info about _MUTTER_HINTS property:
The purpose of the hints is to allow fine-tuning of the Window Manager and
Compositor behaviour on per-window basis, and is intended primarily for
hints that are plugin-specific.

The property is a list of colon-separated key=value pairs. The key names for
any plugin-specific hints must be suitably namespaced to allow for shared
use; 'mutter-' key prefix is reserved for internal use, and must not be used
by plugins.
