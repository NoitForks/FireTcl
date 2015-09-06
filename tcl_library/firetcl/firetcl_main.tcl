namespace eval FireTcl {
    namespace export eval_javascript get_JS_variable call_JS_function log_to_browser dump compile_to_json escape_string
    
    variable REDIRECT_PUTS_TO_BROWSER 1

    variable Status
    
    array set Status {FINISHED_OK 0 FINISHED_WITH_EXCEPTION 1 JS_EVALUATION 2 MESSAGE_TO_BROWSER 3}
    
    variable JS_OK 0
    variable Coroutine_counter 0
    
    variable Tcl_script
    
    variable Result_JSON_specification { dict
        status number
        coroutineName string
        exceptionMessage string
        exceptionOptions {dict 
            -code number 
            -level number
            -errorcode string
            -errorline number
            -errorstack string
            -errorinfo string}
        value string
        jsScript string
        messageCode string
        messageContent string
        }

    proc escape_string {msg} {
        # It scapes characters that can make problems in javascript strings: new lines and quotes
        set msg [regsub -all -- {([^\\])(\\\\)*(["'])} $msg {\1\2\\\3}]
        set msg [regsub -all -- \n $msg {\n}]
        return $msg
    }
    
	proc compile_to_json {spec data} {
		while [llength $spec] {
			set type [lindex $spec 0]
			set spec [lrange $spec 1 end]
	
			switch -- $type {
				dict {
					if {![llength $spec]} {
						lappend spec * string
					}
					
					set json {}
					foreach {key value} $data {
						foreach {matching_key subspec} $spec {
							if {[string match $matching_key $key]} {
								lappend json [subst {"$key":[compile_to_json $subspec $value]}]
								break
							}
						}
					}
					return "{[join $json ,]}"
				}
				list {
					if {![llength $spec]} {
						set spec string
					} else {
						set spec [lindex $spec 0]
					}
					
					set json {}
					foreach list_item $data {
						lappend json [compile_to_json $spec $list_item]
					}
					return "\[[join $json ,]\]"
				}
				string {
                    set data [string map {
                        \n \\n
                        \t \\t
                        \r \\r
                        \b \\b
                        \f \\f
                        \\ \\\\
                        \" \\\"
                        / \\/
                    } $data]
                    return "\"$data\""
				}
				number {
					if {[string is double -strict $data]} {
						return $data
					} else {
						error "Bad number: $data"
					}
				}
				boolean {
					if $data {
						return true
					} else {
						return false
					}
				}
				null {
					if {$data eq ""} {
						return null
					} else {
						error "Data must be an empty string: '$data'"
					}
				}
				json {
					return $data
				}
				default {error "Invalid type: '$type'"}
			}
		}
	}
    
    proc log_to_browser {msg} {      
        set msg [escape_string $msg]
        eval_javascript "console.log(\"$msg\")"
        
        return ""
    }
    
    proc dump {msg} {
        set msg [escape_string $msg]
        eval_javascript "dump(\"$msg\")"
        
        return ""
    }
    
    proc get_JS_variable {varname} {
        return [eval_javascript "return $varname"]
    }
    
    proc call_JS_function {function_name args} {
        set JS_arguments [list]
        foreach {spec data} $args {
            if {$spec eq ""} {
                set spec string
            }
            lappend JS_arguments [compile_to_json $spec $data]
        }
        return [eval_javascript "return $function_name\([join $JS_arguments ,]\)"]
    }
  
    proc eval_javascript {code} {
        variable JS_OK
        variable Status
        
        set returned_value [yield [list $Status(JS_EVALUATION) $code]]
            
        lassign $returned_value js_error content
        if {$js_error == $JS_OK} {
            return $content
        } else {
            throw {FIRETCL JAVASCRIPT_ERROR} $content
        }
    }

    proc send_message_to_browser {message_name message_content} {
        variable JS_OK
        variable Status
        
        set returned_value [yield [list $Status(MESSAGE_TO_BROWSER) $message_name $message_content]]
            
        lassign $returned_value js_error content
        if {$js_error == $JS_OK} {
            return $content
        } else {
            throw {FIRETCL JAVASCRIPT_ERROR} $content
        }
    }
        
    proc Eval_tcl_in_browser {starting_evaluation args} {
        variable Status
        variable Result_JSON_specification
        
        if {$starting_evaluation} {
            variable Tcl_script
            variable Coroutine_counter
        
            set coroutine_name _coroutine_$Coroutine_counter
            incr Coroutine_counter

            set coroutine_evaluation [list coroutine $coroutine_name apply [list {} $Tcl_script]]
        } else {
            variable JS_result
            
            lassign $args coroutine_name js_code
            set coroutine_evaluation [list $coroutine_name [list $js_code $JS_result]]
        }
        
        if {[catch $coroutine_evaluation value options]} {
            set result_obj [dict create status $Status(FINISHED_WITH_EXCEPTION) exceptionMessage $value exceptionOptions $options]
        } else {
            if {[info command $coroutine_name] ne ""} {
                set status [lindex $value 0]

                if {$status == $Status(MESSAGE_TO_BROWSER)} {
                    set messageCode [lindex $value 1]
                    set messageContent [lindex $value 2]
                        
                    set result_obj [dict create status $Status(MESSAGE_TO_BROWSER) messageCode $messageCode messageContent $messageContent]
                } else {
                    set jsScript [lindex $value 1]
                    set result_obj [dict create status $Status(JS_EVALUATION) jsScript $jsScript]
                }
                
                if {$starting_evaluation} {
                    dict set result_obj coroutineName [namespace current]::$coroutine_name
                }
                
            } else {
                set result_obj [dict create status $Status(FINISHED_OK) value $value]
            }
        }
        
        return [compile_to_json $Result_JSON_specification $result_obj]
    }
    
    proc Get_multiple_variables {args} {
        variable Result_JSON_specification
        variable Status
        
        set values_of_vars [list]
        foreach varname $args {
            if {[info exists $varname]} {
                lappend values_of_vars $varname
            }
        }
        
        set result_obj [dict create status $Status(FINISHED_OK) value [compile_to_json {list} $values_of_vars]]
        return [compile_to_json $Result_JSON_specification $result_obj]
    }
    
    proc Set_multiple_variables {args} {
        variable Result_JSON_specification
        variable Status
        
        set not_changed_vars [list]
        foreach {varname varvalue} $args {
            if {[catch {set $varname $varvalue}]} {
                lappend not_changed_vars $varname
            }
            
        }
        
        set result_obj [dict create status $Status(FINISHED_OK) value [compile_to_json {list} $not_changed_vars]]
        return [compile_to_json $Result_JSON_specification $result_obj]
    }
    
}


if $::FireTcl::REDIRECT_PUTS_TO_BROWSER {
    rename ::puts ::command_puts

    proc ::puts {args} {
        set num_arguments [llength $args]
        if {$num_arguments == 1} {
            ::FireTcl::log_to_browser [lindex $args end]
        } elseif {$num_arguments == 2} {
            set first_argument [lindex $args 0]
            if {$first_argument eq "-nonewline"} {
                ::FireTcl::log_to_browser [lindex $args end]
            } else {
                if {$first_argument eq "stdout" || $first_argument eq "stderr"} {
                    ::FireTcl::log_to_browser [lindex $args end]
                } else {
                    tailcall ::command_puts {*}$args
                }
            }           
        } elseif {$num_arguments == 3} {
            set channelId [lindex $args 1]
            if {$channelId eq "stdout" || $first_argument eq "stderr"} {
                ::FireTcl::log_to_browser [lindex $args end]
            } else {
                tailcall ::command_puts {*}$args
            }
        } else {
            tailcall ::command_puts {*}$args
        }
    }
}

