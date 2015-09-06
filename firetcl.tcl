#!/usr/local/bin/tclsh8.6

######################## CONFIGURATION #############################
set USER_FIREBUG_LITE false

####################################################################


set dir [file dirname [file normalize [info script]]]

source [file join $dir tcl_library firetcl firefox_location.tcl]

set firefox [::firefox_location::get_path]

exec $firefox -app [file join firefox_extension application.ini] -foreground -no-remote -os $::tcl_platform(os) -base_path [pwd][file separator] [expr $USER_FIREBUG_LITE?"-firebug_lite":""]


