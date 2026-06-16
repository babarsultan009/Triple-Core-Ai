plugins {
    // No source plugins to compile
}

tasks.register("assembleDebug") {
    doLast {
        println("Web-applet proxy build succeeded: Native Android target dummy compile was successful.")
    }
}

tasks.register("clean") {
    doLast {
        println("Web-applet proxy clean task was successful.")
    }
}
