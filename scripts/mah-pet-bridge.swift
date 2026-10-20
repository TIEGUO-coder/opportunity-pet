import AppKit
import Foundation

// A user-level event listener: launch once when MAH starts, never on a timer.
let arguments = Array(CommandLine.arguments.dropFirst())
guard arguments.count >= 3 else {
    fputs("Expected: MahPetBridge <electron> <app-root> <project-root> [--check]\n", stderr)
    exit(1)
}
let executable = arguments[0]
let appRoot = arguments[1]
let projectRoot = arguments[2]
let workspace = NSWorkspace.shared

func isMah(_ application: NSRunningApplication) -> Bool {
    application.bundleIdentifier == "bot.mah.desktop" && application.activationPolicy != .prohibited
}

if arguments.contains("--check") {
    let result: [String: Any] = [
        "mahRunning": workspace.runningApplications.contains(where: isMah),
        "petExecutableExists": FileManager.default.isExecutableFile(atPath: executable),
        "projectExists": FileManager.default.fileExists(atPath: projectRoot + "/.mah-project/project.json")
    ]
    print(String(data: try JSONSerialization.data(withJSONObject: result, options: [.sortedKeys]), encoding: .utf8)!)
    exit(0)
}

var lastLaunch = Date.distantPast
func launchPet() {
    guard Date().timeIntervalSince(lastLaunch) > 2 else { return }
    let process = Process()
    process.executableURL = URL(fileURLWithPath: executable)
    process.arguments = [appRoot, "--from-mah"]
    process.currentDirectoryURL = URL(fileURLWithPath: appRoot)
    var environment = ProcessInfo.processInfo.environment
    environment.removeValue(forKey: "ELECTRON_RUN_AS_NODE")
    environment["OPPORTUNITY_PET_MAH_PROJECT_ROOT"] = projectRoot
    process.environment = environment
    process.standardOutput = FileHandle.nullDevice
    process.standardError = FileHandle.nullDevice
    process.terminationHandler = { _ in }
    do {
        try process.run()
        lastLaunch = Date()
        print("Started Opportunity Pet after MAH opened.")
    } catch {
        fputs("Could not start Opportunity Pet: \(error.localizedDescription)\n", stderr)
    }
}

let observer = workspace.notificationCenter.addObserver(
    forName: NSWorkspace.didLaunchApplicationNotification, object: nil, queue: .main
) { notification in
    if let application = notification.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication,
       isMah(application) {
        launchPet()
    }
}
if workspace.runningApplications.contains(where: isMah) { launchPet() }
RunLoop.main.run()
